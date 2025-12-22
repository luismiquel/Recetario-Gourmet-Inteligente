
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
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);
  
  // Temporizador visual
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimerTime, setTotalTimerTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState('');

  const timerRef = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    setActiveStep(prev => prev + 1);
    assistantSpeak(`Paso ${activeStep + 2}. ${recipe.steps[activeStep + 1]}`);
  }, [recipe, activeStep, assistantSpeak]);

  const prevStep = useCallback(() => {
    if (activeStep <= 0) return;
    setActiveStep(prev => prev - 1);
    assistantSpeak(`Paso ${activeStep}. ${recipe.steps[activeStep - 1]}`);
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div ref={modalRef} className="relative w-full max-w-5xl max-h-[92vh] bg-stone-900 text-stone-100 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-stone-800">
        
        {/* Cabecera Gourmet */}
        <div className="h-60 sm:h-72 w-full relative shrink-0">
          <img src={recipe.image} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent flex items-end p-10">
            <div className="max-w-3xl">
              <span className="px-4 py-1 text-[9px] font-black tracking-widest text-white uppercase bg-amber-600 rounded-full mb-3 inline-block">{recipe.category}</span>
              <h2 className="text-4xl sm:text-5xl font-serif text-white font-bold tracking-tight">{recipe.title}</h2>
            </div>
          </div>
          <div className="absolute top-8 right-8 flex gap-3">
            <button onClick={handlePrint} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80" title="Imprimir Receta"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg></button>
            <button onClick={onClose} className="p-3 bg-black/30 hover:bg-black/50 rounded-full transition-all border border-white/5"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
        </div>

        {/* Temporizador Visual */}
        {isTimerActive && (
          <div className="absolute top-10 left-10 z-50 flex items-center gap-4 bg-amber-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
            <div className="relative w-8 h-8">
               <svg className="w-full h-full" viewBox="0 0 36 36">
                 <path className="stroke-white/20" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 <path className="stroke-white" strokeWidth="3" strokeDasharray={`${(timeLeft/totalTimerTime)*100}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
               </svg>
            </div>
            <span className="font-black text-sm tabular-nums">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
            <button onClick={() => setIsTimerActive(false)} className="text-white/80 hover:text-white"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-stone-900/50 scrollbar-hide">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Ingredientes con Escala */}
            <section className="lg:col-span-4 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif font-bold text-amber-500">Ingredientes</h3>
                <div className="flex bg-stone-800 rounded-lg p-1 border border-stone-700">
                  {[1, 2, 4].map(v => <button key={v} onClick={() => setPortionScale(v)} className={`px-3 py-1 rounded text-[10px] font-black ${portionScale === v ? 'bg-amber-600 text-white' : 'text-stone-500'}`}>{v}x</button>)}
                </div>
              </div>
              <ul className="space-y-4">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className={`flex items-start gap-4 cursor-pointer transition-all ${checkedIngredients.has(i) ? 'opacity-30 line-through' : 'text-stone-300'}`}>
                    <div className={`w-5 h-5 rounded border-2 mt-0.5 shrink-0 ${checkedIngredients.has(i) ? 'bg-amber-600 border-amber-600' : 'border-stone-600'}`}></div>
                    <span className="text-base">{ing.replace(/(\d+)/g, m => (parseFloat(m)*portionScale).toString())}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => onAddIngredients(recipe.ingredients)} className="w-full py-4 bg-stone-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-stone-700 hover:bg-stone-700">Llevar a Despensa</button>
            </section>

            {/* Pasos y Control */}
            <section className="lg:col-span-8 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif font-bold text-amber-500">Preparación</h3>
                <div className="flex gap-3">
                   <div onClick={() => setIsEditingTime(true)} className="bg-stone-800/80 px-5 py-2 rounded-2xl border border-stone-700 cursor-pointer">
                      <span className="text-[8px] font-black text-stone-500 uppercase block mb-1">Tiempo</span>
                      {isEditingTime ? <input autoFocus value={tempTime} onChange={e => setTempTime(e.target.value)} onBlur={handleSaveTime} onKeyDown={e => e.key === 'Enter' && handleSaveTime()} className="bg-transparent text-white font-bold w-16 outline-none" /> : <span className="text-sm font-bold">{currentCustomTime || recipe.time}</span>}
                   </div>
                   <div className="bg-stone-800/80 px-5 py-2 rounded-2xl border border-stone-700">
                      <span className="text-[8px] font-black text-stone-500 uppercase block mb-1">Dificultad</span>
                      <span className="text-sm font-bold">{recipe.difficulty}</span>
                   </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {recipe.steps.map((step, i) => (
                  <button key={i} onClick={() => setActiveStep(i)} className={`p-8 rounded-[2rem] border-2 transition-all text-left w-full ${i === activeStep ? 'bg-amber-600/10 border-amber-600' : 'bg-stone-800/30 border-stone-800 text-stone-500 hover:border-stone-700'}`}>
                    <div className="flex gap-6">
                      <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${i === activeStep ? 'bg-amber-600 text-stone-950' : 'bg-stone-700 text-stone-500'}`}>{i + 1}</span>
                      <p className={`text-lg leading-relaxed ${i === activeStep ? 'text-white' : 'font-light'}`}>{step}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Panel de Ayuda de Voz (Nuevo) */}
        {voiceEnabled && (
           <div className="absolute bottom-32 right-12 z-50 animate-fade-in pointer-events-none">
              <div className="bg-stone-900/90 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                 <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-4">Dí comandos como:</h4>
                 <ul className="text-[10px] space-y-2 text-stone-400 font-bold">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div> "Siguiente paso"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div> "Repite el paso"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div> "Vuelve atrás"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div> "Temporizador de 5 minutos"</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div> "Cerrar receta"</li>
                 </ul>
              </div>
           </div>
        )}

        <footer className="p-10 bg-stone-900 border-t border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => { if(!voiceEnabled) setShowCommandsHelp(true); setVoiceEnabled(!voiceEnabled); }} className={`flex items-center justify-center gap-4 py-6 rounded-full font-black text-[11px] tracking-widest transition-all ${voiceEnabled ? 'bg-amber-500 text-stone-950 animate-pulse' : 'bg-white text-stone-900'}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            {voiceEnabled ? 'DESACTIVAR VOZ' : 'CONTROL POR VOZ'}
          </button>
          <button onClick={() => setIsKitchenMode(true)} className="flex items-center justify-center gap-4 py-6 rounded-full font-black text-[11px] tracking-widest bg-amber-600 text-white hover:bg-amber-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            MODO COCINA (XXL)
          </button>
        </footer>
        <VoiceFeedback status={status} />
      </div>

      {/* Contenedor Oculto para Impresión Gourmet */}
      <div className="hidden print-container">
         <img src={recipe.image} className="recipe-image" alt="" />
         <h1>{recipe.title}</h1>
         <div className="flex gap-4 mb-4">
           <span>{recipe.category}</span> • <span>{recipe.difficulty}</span> • <span>{currentCustomTime || recipe.time}</span>
         </div>
         <h3 className="text-xl font-serif font-bold mt-8">Ingredientes</h3>
         <ul className="ingredients-list">
           {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
         </ul>
         <h3 className="text-xl font-serif font-bold mt-8">Preparación</h3>
         <div>
           {recipe.steps.map((step, i) => (
             <div key={i} className="step-item">
               <strong>Paso {i+1}:</strong> {step}
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};
