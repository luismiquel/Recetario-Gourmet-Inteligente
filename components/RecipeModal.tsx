
import React, { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { VoiceFeedback } from './VoiceFeedback';

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onAddIngredients: (ingredients: string[]) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose, onAddIngredients }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showOnlyIngredients, setShowOnlyIngredients] = useState(false);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(5);
  const timerIntervalRef = useRef<number | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wakeLockRef = useRef<any>(null);

  // Persistencia de progreso
  useEffect(() => {
    if (isOpen && recipe) {
      const savedStep = localStorage.getItem(`recipe_progress_${recipe.id}`);
      if (savedStep) {
        const step = parseInt(savedStep);
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
  }, [isOpen, recipe]);

  useEffect(() => {
    if (recipe && isOpen) {
      localStorage.setItem(`recipe_progress_${recipe.id}`, activeStep.toString());
    }
  }, [activeStep, recipe, isOpen]);

  // Mantener la pantalla encendida en Modo Cocina
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

  useEffect(() => {
    if (isOpen && stepRefs.current[activeStep] && !showOnlyIngredients && !isKitchenMode) {
      stepRefs.current[activeStep]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeStep, isOpen, showOnlyIngredients, isKitchenMode]);

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    
    const timerMatch = cmd.match(/temporizador de (\d+) minutos/);
    if (timerMatch) {
        const mins = parseInt(timerMatch[1]);
        setInputMinutes(mins);
        setTimerSeconds(mins * 60);
        setIsTimerRunning(true);
        assistantSpeak(`Oído cocina. Temporizador de ${mins} minutos.`);
        return;
    }

    const isNext = /siguiente|avanza|próximo|ya está|listo|hecho/.test(cmd);
    const isPrev = /anterior|atrás|atras|vuelve/.test(cmd);
    const isRepeat = /repite|lee|qué toca|dime/.test(cmd);
    const isClose = /cerrar|salir|finalizar/.test(cmd);
    const isKitchen = /cocina|entrar cocina/.test(cmd);

    if (isNext) {
        nextStep();
    } else if (isPrev) {
        prevStep();
    } else if (isRepeat) {
        readCurrentStep();
    } else if (isKitchen) {
        setIsKitchenMode(true);
        assistantSpeak("Modo cocina activo.");
    } else if (isClose) {
        if (isKitchenMode) {
          setIsKitchenMode(false);
        } else {
          assistantStop();
          setVoiceEnabled(false);
          onClose();
        }
    }
  };

  const { status, speak: assistantSpeak, stop: assistantStop } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  const readCurrentStep = () => {
    if (!recipe) return;
    assistantSpeak(`Paso ${activeStep + 1}. ${recipe.steps[activeStep]}`);
  };

  const nextStep = () => {
    if (!recipe) return;
    if (activeStep < recipe.steps.length - 1) {
      const next = activeStep + 1;
      setActiveStep(next);
      assistantSpeak(`Paso ${next + 1}. ${recipe.steps[next]}`);
    } else {
      assistantSpeak("Has terminado la receta. ¡Excelente trabajo!");
    }
  };

  const prevStep = () => {
    if (!recipe) return;
    if (activeStep > 0) {
      const prev = activeStep - 1;
      setActiveStep(prev);
      assistantSpeak(`Paso ${prev + 1}. ${recipe.steps[prev]}`);
    } else {
        assistantSpeak("Estamos en el primer paso.");
    }
  };

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

  const handleShare = async () => {
    if (!recipe) return;
    const shareData = {
      title: `GourmetVoice - ${recipe.title}`,
      text: `Mira esta receta deliciosa: ${recipe.title}. Categoría: ${recipe.category}.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.log('Error al compartir', err);
    }
  };

  if (!isOpen || !recipe) return null;

  // RENDER MODO COCINA (VISTA SIMPLIFICADA XXL)
  if (isKitchenMode) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col bg-stone-950 text-white overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-2 bg-stone-900 z-20">
          <div 
            className="h-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all duration-700" 
            style={{ width: `${((activeStep + 1) / recipe.steps.length) * 100}%` }}
          ></div>
        </div>

        <header className="p-8 md:p-12 flex justify-between items-start">
          <div>
            <span className="text-amber-500 text-[10px] font-black tracking-[0.5em] uppercase block mb-2">Manos Libres</span>
            <h2 className="text-2xl md:text-3xl font-serif text-white/40 italic">{recipe.title}</h2>
          </div>
          <button 
            onClick={() => setIsKitchenMode(false)}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
          >
            Salir Modo
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-24 text-center">
          <div className="relative">
            <span className="absolute -top-36 left-1/2 -translate-x-1/2 text-[240px] font-black text-amber-500/[0.03] select-none pointer-events-none">
              {activeStep + 1}
            </span>
            <p className="text-4xl md:text-6xl lg:text-8xl font-light leading-[1.1] tracking-tight animate-fade-in-up drop-shadow-xl">
              {recipe.steps[activeStep]}
            </p>
          </div>
        </main>

        <footer className="p-12 md:p-20 flex justify-center items-center gap-8 md:gap-16">
          <button 
            onClick={prevStep}
            disabled={activeStep === 0}
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${activeStep === 0 ? 'border-white/5 text-white/5' : 'border-white/20 hover:border-amber-500 text-white/60'}`}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>

          <button 
            onClick={toggleVoice}
            className={`w-28 h-28 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center transition-all transform shadow-2xl ${voiceEnabled ? 'bg-amber-500 text-stone-900 animate-pulse' : 'bg-white text-stone-900'}`}
          >
            <svg className="w-12 h-12 md:w-16 md:h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span className="text-[10px] font-black uppercase mt-2 tracking-widest">{voiceEnabled ? 'Escuchando' : 'Voz Off'}</span>
          </button>

          <button 
            onClick={nextStep}
            disabled={activeStep === recipe.steps.length - 1}
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${activeStep === recipe.steps.length - 1 ? 'border-white/5 text-white/5' : 'border-white/20 hover:border-amber-500 text-white/60'}`}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </footer>

        <VoiceFeedback status={status} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-stone-950/98 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-stone-900 text-stone-100 rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-stone-800">
        
        <div className="h-72 sm:h-96 w-full relative shrink-0">
            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent flex items-end p-12">
                <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="px-4 py-1.5 text-[9px] font-black tracking-[0.2em] text-white uppercase bg-amber-600 rounded-full shadow-lg">
                          {recipe.category}
                      </span>
                      <button onClick={handleShare} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80" title="Compartir Receta">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684zm0 12.684a3 3 0 100-2.684 3 3 0 000 2.684z" /></svg>
                      </button>
                    </div>
                    <h2 className="text-5xl sm:text-7xl font-serif text-white font-bold leading-tight tracking-tight">
                        {recipe.title}
                    </h2>
                </div>
            </div>
            <button onClick={onClose} className="absolute top-10 right-10 text-white/40 hover:text-white transition-all p-4 bg-black/40 rounded-full backdrop-blur-md border border-white/5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-16 bg-stone-900/50 scrollbar-hide">
            <div className="grid lg:grid-cols-12 gap-16">
                <div className={`${showOnlyIngredients ? 'lg:col-span-12' : 'lg:col-span-4'} space-y-10`}>
                    <h3 className="text-2xl font-serif font-bold text-amber-500">Ingredientes</h3>
                    <ul className={`space-y-5 ${showOnlyIngredients ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-10' : ''}`}>
                        {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-5 text-lg text-stone-300 font-light group">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-3 shrink-0 group-hover:scale-150 transition-transform"></span>
                                {ing}
                            </li>
                        ))}
                    </ul>
                    
                    <button 
                        onClick={() => onAddIngredients(recipe.ingredients)} 
                        className="w-full py-5 bg-stone-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-stone-700 hover:bg-amber-600 hover:border-amber-600 transition-all active:scale-95 shadow-lg"
                    >
                        Llevar a la Despensa
                    </button>
                </div>

                {!showOnlyIngredients && (
                    <div className="lg:col-span-8 space-y-12">
                        <div className="flex justify-between items-center">
                          <h3 className="text-2xl font-serif font-bold text-amber-500">Preparación</h3>
                          <div className="flex gap-4">
                            <div className="bg-stone-800/50 px-5 py-2.5 rounded-2xl border border-stone-700">
                                <span className="text-[9px] font-black text-stone-500 uppercase block mb-0.5 tracking-tighter">Tiempo</span>
                                <span className="text-sm font-black text-white">{recipe.time}</span>
                            </div>
                            <div className="bg-stone-800/50 px-5 py-2.5 rounded-2xl border border-stone-700">
                                <span className="text-[9px] font-black text-stone-500 uppercase block mb-0.5 tracking-tighter">Dificultad</span>
                                <span className="text-sm font-black text-white">{recipe.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-8">
                            {recipe.steps.map((step, i) => (
                                <div 
                                     key={i} 
                                     ref={el => stepRefs.current[i] = el} 
                                     onClick={() => setActiveStep(i)}
                                     className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer ${i === activeStep ? 'bg-amber-600/10 border-amber-600 shadow-2xl scale-[1.02]' : 'bg-stone-800/30 border-stone-800 text-stone-500 hover:border-stone-700'}`}
                                >
                                    <div className="flex gap-8">
                                        <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-serif font-bold shrink-0 transition-all ${i === activeStep ? 'bg-amber-600 text-stone-950 shadow-lg' : 'bg-stone-700 text-stone-500'}`}>
                                            {i + 1}
                                        </span>
                                        <p className={`flex-1 text-xl leading-relaxed ${i === activeStep ? 'text-white' : 'font-light'}`}>{step}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-12 bg-stone-900 border-t border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={toggleVoice} 
              className={`flex items-center justify-center gap-5 py-7 rounded-full font-black text-[11px] tracking-[0.3em] transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${voiceEnabled ? 'bg-amber-500 text-stone-950 animate-pulse' : 'bg-white text-stone-900'}`}
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                {voiceEnabled ? 'DESACTIVAR ASISTENTE' : 'CONTROL POR VOZ'}
            </button>

            <button 
              onClick={() => setIsKitchenMode(true)} 
              className="flex items-center justify-center gap-5 py-7 rounded-full font-black text-[11px] tracking-[0.3em] transition-all transform hover:scale-105 active:scale-95 bg-amber-600 text-white shadow-2xl shadow-amber-600/20"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                MODO COCINA (XXL)
            </button>
        </div>

        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
