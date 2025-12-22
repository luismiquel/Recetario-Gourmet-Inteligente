
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Recipe } from '../types';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { VoiceFeedback } from './VoiceFeedback';

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onAddIngredients: (ingredients: string[]) => void;
  onUpdateTime: (recipeId: number, newTime: string) => void;
  currentCustomTime?: string;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose, onAddIngredients, onUpdateTime, currentCustomTime }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [portionScale, setPortionScale] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  
  // Temporizador visual
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimerTime, setTotalTimerTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState('');

  const timerRef = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const kitchenRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  // Focus Trapping and Keyboard Nav
  useEffect(() => {
    if (isOpen) {
      lastActiveElement.current = document.activeElement as HTMLElement;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isKitchenMode) setIsKitchenMode(false);
          else onClose();
        }
        
        const currentRef = isKitchenMode ? kitchenRef.current : modalRef.current;
        if (e.key === 'Tab' && currentRef) {
          const focusableElements = currentRef.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Auto-focus al primer elemento después de un breve delay
      setTimeout(() => {
        const firstFocusable = (isKitchenMode ? kitchenRef.current : modalRef.current)?.querySelector('button');
        firstFocusable?.focus();
      }, 100);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        lastActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose, isKitchenMode]);

  // Lógica del temporizador
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      if (voiceEnabled) assistantSpeak("¡Chef! El tiempo ha terminado.");
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timeLeft, voiceEnabled]);

  const startTimer = (mins: number) => {
    const seconds = mins * 60;
    setTotalTimerTime(seconds);
    setTimeLeft(seconds);
    setIsTimerActive(true);
  };

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    const isClose = /cerrar|salir|menú|inicio|atrás/.test(cmd);
    const isNext = /siguiente|avanza|próximo|listo|hecho/.test(cmd);
    const isPrev = /anterior|vuelve/.test(cmd);
    const isRepeat = /repite|lee|qué toca/.test(cmd);
    const timerMatch = cmd.match(/temporizador de (\d+) minutos/);

    if (isClose) { if (isKitchenMode) setIsKitchenMode(false); else onClose(); }
    else if (isNext) nextStep();
    else if (isPrev) prevStep();
    else if (isRepeat) readCurrentStep();
    else if (timerMatch) startTimer(parseInt(timerMatch[1]));
  };

  const { status, speak: assistantSpeak, stop: assistantStop } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  const nextStep = useCallback(() => {
    if (!recipe || activeStep >= recipe.steps.length - 1) return;
    const next = activeStep + 1;
    setActiveStep(next);
    assistantSpeak(`Paso ${next + 1}. ${recipe.steps[next]}`);
  }, [recipe, activeStep, assistantSpeak]);

  const prevStep = useCallback(() => {
    if (activeStep <= 0) return;
    const prev = activeStep - 1;
    setActiveStep(prev);
    assistantSpeak(`Paso ${prev + 1}. ${recipe.steps[prev]}`);
  }, [activeStep, assistantSpeak]);

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    assistantSpeak(`Paso ${activeStep + 1}. ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep, assistantSpeak]);

  const handlePrint = () => window.print();

  const handleSaveTime = () => {
    if (recipe) { onUpdateTime(recipe.id, tempTime); setIsEditingTime(false); }
  };

  if (!isOpen || !recipe) return null;

  // Modo Cocina Accesible
  if (isKitchenMode) {
    return (
      <div 
        ref={kitchenRef}
        className="fixed inset-0 z-[70] flex flex-col bg-stone-950 text-white overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitchen-title"
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-stone-900 z-20">
          <div 
            className="h-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all duration-700" 
            style={{ width: `${((activeStep + 1) / recipe.steps.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={activeStep + 1}
            aria-valuemin={1}
            aria-valuemax={recipe.steps.length}
            aria-label="Progreso de la receta"
          ></div>
        </div>

        <header className="p-8 md:p-12 flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-amber-500 text-[10px] font-black tracking-[0.5em] uppercase block mb-2" aria-hidden="true">MANOS LIBRES</span>
            <h2 id="kitchen-title" className="text-2xl md:text-3xl font-serif text-white/40 italic">{recipe.title}</h2>
          </div>
          <button 
            onClick={() => setIsKitchenMode(false)} 
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 focus:ring-2 focus:ring-amber-500 outline-none"
            aria-label="Cerrar modo cocina"
          >
            Salir Modo
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-24 text-center">
          <div className="relative">
            <span className="absolute -top-36 left-1/2 -translate-x-1/2 text-[240px] font-black text-amber-500/[0.03] select-none pointer-events-none" aria-hidden="true">
              {activeStep + 1}
            </span>
            <p className="text-4xl md:text-6xl lg:text-8xl font-light leading-[1.1] tracking-tight animate-fade-in-up" aria-live="polite">
              <span className="sr-only">Paso {activeStep + 1}: </span>
              {recipe.steps[activeStep]}
            </p>
          </div>
        </main>

        <footer className="p-12 md:p-20 flex justify-center items-center gap-8 md:gap-16">
          <button 
            onClick={prevStep} 
            disabled={activeStep === 0} 
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 focus:ring-2 focus:ring-amber-500 outline-none ${activeStep === 0 ? 'border-white/5 text-white/5 opacity-20' : 'border-white/20 hover:border-amber-500 text-white/60'}`} 
            aria-label="Paso anterior"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
            className={`w-28 h-28 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center transition-all transform shadow-2xl focus:ring-4 focus:ring-amber-500 outline-none ${voiceEnabled ? 'bg-amber-500 text-stone-900 animate-pulse' : 'bg-white text-stone-900'}`} 
            aria-label={voiceEnabled ? "Desactivar control por voz" : "Activar control por voz"}
            aria-pressed={voiceEnabled}
          >
            <svg className="w-12 h-12 md:w-16 md:h-16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span className="text-[10px] font-black uppercase mt-2 tracking-widest">{voiceEnabled ? 'Escuchando' : 'Voz Off'}</span>
          </button>
          <button 
            onClick={nextStep} 
            disabled={activeStep === recipe.steps.length - 1} 
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 focus:ring-2 focus:ring-amber-500 outline-none ${activeStep === recipe.steps.length - 1 ? 'border-white/5 text-white/5 opacity-20' : 'border-white/20 hover:border-amber-500 text-white/60'}`} 
            aria-label="Siguiente paso"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </footer>
        <VoiceFeedback status={status} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl" onClick={onClose} aria-hidden="true"></div>
      
      <div ref={modalRef} className="relative w-full max-w-5xl max-h-[92vh] bg-stone-900 text-stone-100 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-stone-800">
        
        {/* Cabecera Gourmet */}
        <div className="h-60 sm:h-72 w-full relative shrink-0">
          <img src={recipe.image} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent flex items-end p-10">
            <div className="max-w-3xl">
              <span className="px-4 py-1 text-[9px] font-black tracking-widest text-white uppercase bg-amber-600 rounded-full mb-3 inline-block">{recipe.category}</span>
              <h2 id="modal-title" className="text-4xl sm:text-5xl font-serif text-white font-bold tracking-tight">{recipe.title}</h2>
            </div>
          </div>
          <div className="absolute top-8 right-8 flex gap-3">
            <button 
              onClick={handlePrint} 
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80 focus:ring-2 focus:ring-amber-500 outline-none" 
              aria-label="Imprimir Receta"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            </button>
            <button 
              onClick={onClose} 
              className="p-3 bg-black/30 hover:bg-black/50 rounded-full transition-all border border-white/5 focus:ring-2 focus:ring-amber-500 outline-none"
              aria-label="Cerrar receta"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* Temporizador Visual */}
        {isTimerActive && (
          <div className="absolute top-10 left-10 z-50 flex items-center gap-4 bg-amber-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce" role="status" aria-live="polite">
            <div className="relative w-8 h-8" aria-hidden="true">
               <svg className="w-full h-full" viewBox="0 0 36 36">
                 <path className="stroke-white/20" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 <path className="stroke-white" strokeWidth="3" strokeDasharray={`${(timeLeft/totalTimerTime)*100}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
               </svg>
            </div>
            <span className="font-black text-sm tabular-nums">
              <span className="sr-only">Temporizador: </span>
              {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}
            </span>
            <button 
              onClick={() => setIsTimerActive(false)} 
              className="text-white/80 hover:text-white focus:ring-2 focus:ring-white rounded-full outline-none"
              aria-label="Cancelar temporizador"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-stone-900/50 scrollbar-hide">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Ingredientes con Escala */}
            <section className="lg:col-span-4 space-y-8" aria-labelledby="ingredients-title">
              <div className="flex justify-between items-center">
                <h3 id="ingredients-title" className="text-2xl font-serif font-bold text-amber-500">Ingredientes</h3>
                <div className="flex bg-stone-800 rounded-lg p-1 border border-stone-700" role="group" aria-label="Escalar porciones">
                  {[1, 2, 4].map(v => (
                    <button 
                      key={v} 
                      onClick={() => setPortionScale(v)} 
                      aria-pressed={portionScale === v}
                      className={`px-3 py-1 rounded text-[10px] font-black focus:ring-2 focus:ring-amber-500 outline-none ${portionScale === v ? 'bg-amber-600 text-white' : 'text-stone-500'}`}
                    >
                      {v}x
                    </button>
                  ))}
                </div>
              </div>
              <ul className="space-y-4">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>
                    <button 
                      onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} 
                      className={`flex items-start gap-4 cursor-pointer transition-all text-left w-full focus:ring-2 focus:ring-amber-500/30 rounded-lg p-1 ${checkedIngredients.has(i) ? 'opacity-30 line-through' : 'text-stone-300'}`}
                      aria-pressed={checkedIngredients.has(i)}
                    >
                      <div className={`w-5 h-5 rounded border-2 mt-0.5 shrink-0 transition-colors ${checkedIngredients.has(i) ? 'bg-amber-600 border-amber-600' : 'border-stone-600'}`} aria-hidden="true"></div>
                      <span className="text-base">{ing.replace(/(\d+)/g, m => (parseFloat(m)*portionScale).toString())}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => onAddIngredients(recipe.ingredients)} 
                className="w-full py-4 bg-stone-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-stone-700 hover:bg-stone-700 focus:ring-2 focus:ring-amber-500 outline-none"
              >
                Llevar a Despensa
              </button>
            </section>

            {/* Pasos y Control */}
            <section className="lg:col-span-8 space-y-8" aria-labelledby="steps-title">
              <div className="flex justify-between items-center">
                <h3 id="steps-title" className="text-2xl font-serif font-bold text-amber-500">Preparación</h3>
                <div className="flex gap-3">
                   <button 
                    onClick={() => setIsEditingTime(true)} 
                    className="bg-stone-800/80 px-5 py-2 rounded-2xl border border-stone-700 cursor-pointer text-left focus:ring-2 focus:ring-amber-500 outline-none group"
                    aria-label="Editar tiempo de preparación"
                   >
                      <span className="text-[8px] font-black text-stone-500 uppercase block mb-1">Tiempo</span>
                      {isEditingTime ? (
                        <div className="flex items-center gap-2">
                          <input 
                            autoFocus 
                            value={tempTime} 
                            onChange={e => setTempTime(e.target.value)} 
                            onBlur={handleSaveTime} 
                            onKeyDown={e => e.key === 'Enter' && handleSaveTime()} 
                            className="bg-transparent text-white font-bold w-16 outline-none border-b border-amber-500" 
                            aria-label="Nuevo tiempo"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-bold flex items-center gap-2">
                          {currentCustomTime || recipe.time}
                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                        </span>
                      )}
                   </button>
                   <div className="bg-stone-800/80 px-5 py-2 rounded-2xl border border-stone-700">
                      <span className="text-[8px] font-black text-stone-500 uppercase block mb-1">Dificultad</span>
                      <span className="text-sm font-bold">{recipe.difficulty}</span>
                   </div>
                </div>
              </div>
              
              <div className="space-y-6" role="list">
                {recipe.steps.map((step, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveStep(i)} 
                    className={`p-8 rounded-[2rem] border-2 transition-all text-left w-full focus:ring-4 focus:ring-amber-500/20 outline-none ${i === activeStep ? 'bg-amber-600/10 border-amber-600' : 'bg-stone-800/30 border-stone-800 text-stone-500 hover:border-stone-700'}`}
                    aria-current={i === activeStep ? 'step' : undefined}
                    role="listitem"
                  >
                    <div className="flex gap-6">
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${i === activeStep ? 'bg-amber-600 text-stone-950' : 'bg-stone-700 text-stone-500'}`} aria-hidden="true">{i + 1}</span>
                      <p className={`text-lg leading-relaxed ${i === activeStep ? 'text-white' : 'font-light'}`}>{step}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Panel de Ayuda de Voz */}
        {voiceEnabled && (
           <div className="absolute bottom-32 right-12 z-50 animate-fade-in pointer-events-none" aria-live="polite">
              <div className="bg-stone-900/90 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                 <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-4">Dí comandos como:</h4>
                 <ul className="text-[10px] space-y-2 text-stone-400 font-bold">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full" aria-hidden="true"></div> "Siguiente paso"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full" aria-hidden="true"></div> "Repite el paso"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full" aria-hidden="true"></div> "Vuelve atrás"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full" aria-hidden="true"></div> "Temporizador de 5 minutos"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full" aria-hidden="true"></div> "Cerrar receta"</li>
                 </ul>
              </div>
           </div>
        )}

        <footer className="p-10 bg-stone-900 border-t border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
            className={`flex items-center justify-center gap-4 py-6 rounded-full font-black text-[11px] tracking-widest transition-all focus:ring-4 focus:ring-amber-500 outline-none ${voiceEnabled ? 'bg-amber-500 text-stone-950 animate-pulse' : 'bg-white text-stone-900'}`}
            aria-label={voiceEnabled ? "Desactivar asistente de voz" : "Activar asistente de voz"}
            aria-pressed={voiceEnabled}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            {voiceEnabled ? 'DESACTIVAR VOZ' : 'CONTROL POR VOZ'}
          </button>
          <button 
            onClick={() => setIsKitchenMode(true)} 
            className="flex items-center justify-center gap-4 py-6 rounded-full font-black text-[11px] tracking-widest bg-amber-600 text-white hover:bg-amber-500 transition-colors focus:ring-4 focus:ring-amber-400 outline-none"
            aria-label="Abrir modo cocina a pantalla completa"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            MODO COCINA (XXL)
          </button>
        </footer>
        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
