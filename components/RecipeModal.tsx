
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

export const RecipeModal: React.FC<RecipeModalProps> = ({ 
  recipe, 
  isOpen, 
  onClose, 
  onAddIngredients, 
  onUpdateTime,
  currentCustomTime 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showOnlyIngredients, setShowOnlyIngredients] = useState(false);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [portionScale, setPortionScale] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState('');

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);
  const touchStartRef = useRef<number | null>(null);

  // Focus Trapping and Keyboard Nav
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
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
      modalRef.current?.querySelector('button')?.focus();
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // Recuperar progreso y reiniciar estados
  useEffect(() => {
    if (isOpen && recipe) {
      setCheckedIngredients(new Set());
      setPortionScale(1);
      setIsEditingTime(false);
      setTempTime(currentCustomTime || recipe.time);

      const savedStep = localStorage.getItem(`recipe_progress_${recipe.id}`);
      if (savedStep) {
        const step = parseInt(savedStep);
        // confirm() no es lo más accesible, pero es nativo. Lo mantenemos por simplicidad o mejoramos si se pide.
        if (step > 0 && confirm(`¿Quieres continuar desde el paso ${step + 1}?`)) {
          setActiveStep(step);
        } else {
          setActiveStep(0);
          localStorage.removeItem(`recipe_progress_${recipe.id}`);
        }
      } else {
        setActiveStep(0);
      }
    }
  }, [isOpen, recipe, currentCustomTime]);

  useEffect(() => {
    if (recipe && isOpen) {
      localStorage.setItem(`recipe_progress_${recipe.id}`, activeStep.toString());
    }
  }, [activeStep, recipe, isOpen]);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isKitchenMode) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn('Wake Lock no disponible');
        }
      }
    };

    if (isKitchenMode) {
      requestWakeLock();
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [isKitchenMode]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (voiceEnabled) assistantSpeak("¡Chef! El tiempo ha terminado.");
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerSeconds, voiceEnabled]);

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    
    const isClose = /cerrar|salir|finalizar|terminar|vuelve|atrás|atras|menú|inicio/.test(cmd);
    if (isClose) {
      if (isKitchenMode) {
        setIsKitchenMode(false);
        assistantSpeak("Saliendo del modo cocina.");
      } else {
        assistantStop();
        setVoiceEnabled(false);
        onClose();
      }
      return;
    }

    const isNext = /siguiente|avanza|próximo|ya está|listo|hecho/.test(cmd);
    const isPrev = /anterior|atrás|atras|vuelve/.test(cmd);
    const isRepeat = /repite|lee|qué toca|dime/.test(cmd);
    const isKitchen = /cocina|entrar cocina/.test(cmd);

    if (isNext) nextStep();
    else if (isPrev) prevStep();
    else if (isRepeat) readCurrentStep();
    else if (isKitchen) {
        setIsKitchenMode(true);
        assistantSpeak("Modo cocina activo.");
    }
  };

  const { status, speak: assistantSpeak, stop: assistantStop } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    assistantSpeak(`Paso ${activeStep + 1}. ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep, assistantSpeak]);

  const nextStep = useCallback(() => {
    if (!recipe) return;
    if (activeStep < recipe.steps.length - 1) {
      const next = activeStep + 1;
      setActiveStep(next);
      assistantSpeak(`Paso ${next + 1}. ${recipe.steps[next]}`);
    } else {
      assistantSpeak("Has terminado la receta. ¡Excelente trabajo!");
    }
  }, [recipe, activeStep, assistantSpeak]);

  const prevStep = useCallback(() => {
    if (!recipe) return;
    if (activeStep > 0) {
      const prev = activeStep - 1;
      setActiveStep(prev);
      assistantSpeak(`Paso ${prev + 1}. ${recipe.steps[prev]}`);
    } else {
        assistantSpeak("Estamos en el primer paso.");
    }
  }, [recipe, activeStep, assistantSpeak]);

  const toggleVoice = () => {
    if (voiceEnabled) {
      setVoiceEnabled(false);
      assistantStop();
    } else {
      if (!recipe) return;
      setVoiceEnabled(true);
      assistantSpeak(`Asistente iniciado. Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    if (Math.abs(diff) > 70) {
      if (diff > 0) nextStep();
      else prevStep();
    }
    touchStartRef.current = null;
  };

  const scaleIngredient = (ing: string) => {
    if (portionScale === 1) return ing;
    return ing.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
      const num = parseFloat(match.replace(',', '.'));
      return (num * portionScale).toString().replace('.', ',');
    });
  };

  const toggleCheck = (idx: number) => {
    const newSet = new Set(checkedIngredients);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    setCheckedIngredients(newSet);
  };

  const handleSaveTime = () => {
    if (recipe) {
      onUpdateTime(recipe.id, tempTime);
      setIsEditingTime(false);
    }
  };

  if (!isOpen || !recipe) return null;

  if (isKitchenMode) {
    return (
      <div 
        className="fixed inset-0 z-[70] flex flex-col bg-stone-950 text-white overflow-hidden animate-fade-in"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
          ></div>
        </div>

        <header className="p-8 md:p-12 flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-amber-500 text-[10px] font-black tracking-[0.5em] uppercase block mb-2">MANOS LIBRES</span>
            <h2 id="kitchen-title" className="text-2xl md:text-3xl font-serif text-white/40 italic">{recipe.title}</h2>
          </div>
          <button onClick={() => setIsKitchenMode(false)} className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 focus:ring-2 focus:ring-amber-500 outline-none">
            Salir Modo
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-24 text-center">
          <div className="relative">
            <span className="absolute -top-36 left-1/2 -translate-x-1/2 text-[240px] font-black text-amber-500/[0.03] select-none pointer-events-none" aria-hidden="true">
              {activeStep + 1}
            </span>
            <p className="text-4xl md:text-6xl lg:text-8xl font-light leading-[1.1] tracking-tight animate-fade-in-up" aria-live="polite">
              {recipe.steps[activeStep]}
            </p>
          </div>
        </main>

        <footer className="p-12 md:p-20 flex justify-center items-center gap-8 md:gap-16">
          <button onClick={prevStep} disabled={activeStep === 0} className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 focus:ring-2 focus:ring-amber-500 outline-none ${activeStep === 0 ? 'border-white/5 text-white/5 opacity-30' : 'border-white/20 hover:border-amber-500 text-white/60'}`} aria-label="Paso anterior">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={toggleVoice} className={`w-28 h-28 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center transition-all transform shadow-2xl focus:ring-4 focus:ring-amber-500 outline-none ${voiceEnabled ? 'bg-amber-500 text-stone-900 animate-pulse' : 'bg-white text-stone-900'}`} aria-label={voiceEnabled ? "Desactivar control por voz" : "Activar control por voz"} aria-pressed={voiceEnabled}>
            <svg className="w-12 h-12 md:w-16 md:h-16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span className="text-[10px] font-black uppercase mt-2 tracking-widest">{voiceEnabled ? 'Escuchando' : 'Voz Off'}</span>
          </button>
          <button onClick={nextStep} disabled={activeStep === recipe.steps.length - 1} className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 focus:ring-2 focus:ring-amber-500 outline-none ${activeStep === recipe.steps.length - 1 ? 'border-white/5 text-white/5 opacity-30' : 'border-white/20 hover:border-amber-500 text-white/60'}`} aria-label="Siguiente paso">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </footer>
        <VoiceFeedback status={status} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-stone-950/98 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div 
        ref={modalRef}
        className="relative w-full max-w-5xl max-h-[95vh] bg-stone-900 text-stone-100 rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-stone-800"
      >
        
        <div className="h-64 sm:h-80 w-full relative shrink-0">
            <img src={recipe.image} alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent flex items-end p-12">
                <div className="max-w-4xl">
                    <span className="px-4 py-1.5 text-[9px] font-black tracking-[0.2em] text-white uppercase bg-amber-600 rounded-full shadow-lg mb-4 inline-block">
                        {recipe.category}
                    </span>
                    <h2 id="modal-title" className="text-4xl sm:text-6xl font-serif text-white font-bold leading-tight tracking-tight">
                        {recipe.title}
                    </h2>
                </div>
            </div>
            <button 
              onClick={onClose} 
              className="absolute top-10 right-10 text-white/40 hover:text-white transition-all p-4 bg-black/40 rounded-full backdrop-blur-md border border-white/5 focus:ring-2 focus:ring-amber-500 outline-none"
              aria-label="Cerrar modal"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-16 bg-stone-900/50 scrollbar-hide">
            <div className="grid lg:grid-cols-12 gap-16">
                <section className="lg:col-span-4 space-y-10" aria-labelledby="ingredients-heading">
                    <div className="flex items-center justify-between">
                      <h3 id="ingredients-heading" className="text-2xl font-serif font-bold text-amber-500">Ingredientes</h3>
                      <div className="flex bg-stone-800 rounded-xl p-1 border border-stone-700" role="group" aria-label="Escalar porciones">
                        {[1, 2, 4].map(val => (
                          <button 
                            key={val} 
                            onClick={() => setPortionScale(val)}
                            aria-pressed={portionScale === val}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all focus:ring-2 focus:ring-amber-500 outline-none ${portionScale === val ? 'bg-amber-600 text-white' : 'text-stone-500'}`}
                          >
                            {val}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <ul className="space-y-4">
                        {recipe.ingredients.map((ing, i) => (
                            <li 
                              key={i} 
                              className="flex items-start gap-4"
                            >
                                <button 
                                  onClick={() => toggleCheck(i)}
                                  aria-pressed={checkedIngredients.has(i)}
                                  className={`flex items-start gap-4 text-left text-base transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-lg p-1 w-full ${checkedIngredients.has(i) ? 'opacity-30 line-through text-stone-500' : 'text-stone-300'}`}
                                >
                                  <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center shrink-0 ${checkedIngredients.has(i) ? 'bg-amber-600 border-amber-600' : 'border-stone-600'}`}>
                                    {checkedIngredients.has(i) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>}
                                  </div>
                                  <span>{scaleIngredient(ing)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => onAddIngredients(recipe.ingredients)} className="w-full py-5 bg-stone-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-stone-700 hover:bg-amber-600 transition-all shadow-lg focus:ring-2 focus:ring-amber-500 outline-none">
                        Añadir a Despensa
                    </button>
                </section>

                <section className="lg:col-span-8 space-y-12" aria-labelledby="steps-heading">
                    <div className="flex justify-between items-center">
                      <h3 id="steps-heading" className="text-2xl font-serif font-bold text-amber-500">Preparación</h3>
                      <div className="flex gap-4">
                        <div 
                          onClick={() => setIsEditingTime(true)}
                          className={`bg-stone-800/50 px-5 py-2.5 rounded-2xl border transition-all cursor-pointer group focus-within:ring-2 focus-within:ring-amber-500 ${isEditingTime ? 'border-amber-500 bg-stone-800' : 'border-stone-700 hover:border-amber-500'}`}
                          role="button"
                          aria-label="Editar tiempo de cocción"
                        >
                            <span className="text-[9px] font-black text-stone-500 uppercase block mb-0.5 flex justify-between items-center">
                              Tiempo
                              {!isEditingTime && <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>}
                            </span>
                            {isEditingTime ? (
                              <div className="flex items-center gap-2">
                                <label htmlFor="edit-time-input" className="sr-only">Nuevo tiempo</label>
                                <input 
                                  id="edit-time-input"
                                  autoFocus
                                  value={tempTime}
                                  onChange={(e) => setTempTime(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTime()}
                                  className="bg-transparent border-b border-amber-500 text-sm font-black text-white w-20 focus:outline-none"
                                />
                                <button onClick={(e) => { e.stopPropagation(); handleSaveTime(); }} className="text-amber-500 hover:text-white transition-colors" aria-label="Guardar tiempo">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-black text-white">{currentCustomTime || recipe.time}</span>
                            )}
                        </div>
                        <div className="bg-stone-800/50 px-5 py-2.5 rounded-2xl border border-stone-700">
                            <span className="text-[9px] font-black text-stone-500 uppercase block mb-0.5">Dificultad</span>
                            <span className="text-sm font-black text-white">{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-8">
                        {recipe.steps.map((step, i) => (
                            <button 
                                 key={i} 
                                 ref={el => stepRefs.current[i] = el} 
                                 onClick={() => setActiveStep(i)}
                                 className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left w-full focus:ring-4 focus:ring-amber-500/50 outline-none ${i === activeStep ? 'bg-amber-600/10 border-amber-600 shadow-2xl scale-[1.02]' : 'bg-stone-800/30 border-stone-800 text-stone-500 hover:border-stone-700'}`}
                                 aria-pressed={i === activeStep}
                            >
                                <div className="flex gap-8">
                                    <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-serif font-bold shrink-0 ${i === activeStep ? 'bg-amber-600 text-stone-950' : 'bg-stone-700 text-stone-500'}`} aria-hidden="true">
                                        {i + 1}
                                    </span>
                                    <p className={`flex-1 text-xl leading-relaxed ${i === activeStep ? 'text-white' : 'font-light'}`}>{step}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>

        <div className="p-12 bg-stone-900 border-t border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-8">
            <button onClick={toggleVoice} className={`flex items-center justify-center gap-5 py-7 rounded-full font-black text-[11px] tracking-[0.3em] transition-all transform hover:scale-105 active:scale-95 shadow-2xl focus:ring-4 focus:ring-amber-500 outline-none ${voiceEnabled ? 'bg-amber-500 text-stone-950 animate-pulse' : 'bg-white text-stone-900'}`} aria-label={voiceEnabled ? "Desactivar control por voz" : "Activar control por voz"} aria-pressed={voiceEnabled}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                {voiceEnabled ? 'DESACTIVAR ASISTENTE' : 'CONTROL POR VOZ'}
            </button>
            <button onClick={() => setIsKitchenMode(true)} className="flex items-center justify-center gap-5 py-7 rounded-full font-black text-[11px] tracking-[0.3em] transition-all transform hover:scale-105 active:scale-95 bg-amber-600 text-white shadow-2xl shadow-amber-600/20 focus:ring-4 focus:ring-amber-400 outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                MODO COCINA (XXL)
            </button>
        </div>
        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
