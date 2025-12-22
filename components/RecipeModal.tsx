
import React, { useState, useCallback, useMemo, useEffect } from 'react';
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

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose, onAddIngredients }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [portionScale, setPortionScale] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [maxTimerSeconds, setMaxTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTimerStep, setActiveTimerStep] = useState<number | null>(null);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = window.setInterval(() => setTimerSeconds(s => (s !== null ? s - 1 : 0)), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.play().catch(() => {});
      setTimerSeconds(null);
      setActiveTimerStep(null);
      alert("¡Tiempo cumplido en la cocina!");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    const c = cmd.toLowerCase();
    
    // Navegación
    if (/siguiente|próximo|adelante|hecho/.test(c)) nextStep();
    else if (/anterior|atrás|vuelve/.test(c)) prevStep();
    else if (/repite|qué dice|no oigo/.test(c)) readCurrentStep();
    else if (/cerrar|salir/.test(c)) onClose();
    
    // Temporizador
    if (/pausa|detén el tiempo|para/.test(c)) {
      setIsTimerRunning(false);
      speak("Temporizador pausado.");
    }
    else if (/reanuda|continúa/.test(c)) {
      setIsTimerRunning(true);
      speak("Continuamos con el tiempo.");
    }
    else if (/cancela|quita el reloj/.test(c)) {
      setTimerSeconds(null);
      setActiveTimerStep(null);
      speak("Reloj quitado.");
    }

    // Lista de compra
    if (/añade todo|lista de compra|comprar/.test(c)) {
      onAddIngredients(recipe.ingredients);
      speak("Añadido a la cesta.");
    }
  };

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  const startTimer = (minutes: number, stepIndex: number | null = null) => {
    const seconds = minutes * 60;
    setTimerSeconds(seconds);
    setMaxTimerSeconds(seconds);
    setIsTimerRunning(true);
    setActiveTimerStep(stepIndex);
    speak(`Iniciando cuenta atrás de ${minutes} minutos.`);
  };

  const nextStep = useCallback(() => {
    if (!recipe) return;
    if (activeStep >= recipe.steps.length - 1) {
      speak("¡Excelente! Receta finalizada con éxito.");
      return;
    }
    const next = activeStep + 1;
    setActiveStep(next);
    speak(`Paso ${next + 1}: ${recipe.steps[next]}`);
  }, [recipe, activeStep, speak]);

  const prevStep = useCallback(() => {
    if (activeStep <= 0) return;
    const prev = activeStep - 1;
    setActiveStep(prev);
    speak(`Volviendo al paso ${prev + 1}: ${recipe.steps[prev]}`);
  }, [activeStep, speak]);

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    speak(recipe.steps[activeStep]);
  }, [recipe, activeStep, speak]);

  const detectTime = (text: string) => {
    const match = text.match(/(\d+)\s*(min|minutos)/i);
    return match ? parseInt(match[1]) : null;
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryTheme = (category: string) => {
    const themes: Record<string, string> = {
      aperitivo: 'bg-stone-50 text-stone-900',
      primero: 'bg-emerald-50 text-emerald-950',
      segundo: 'bg-rose-50 text-rose-950',
      postre: 'bg-amber-50 text-amber-950'
    };
    return themes[category] || 'bg-stone-900 text-white';
  };

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl no-print" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-7xl h-full sm:h-[95vh] bg-white sm:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden transition-all duration-700 ${isKitchenMode ? 'bg-stone-900 text-white' : ''}`}>
        
        {/* CABECERA EDITORIAL MONUMENTAL */}
        {!isKitchenMode && (
          <div className={`shrink-0 py-24 px-12 relative overflow-hidden flex flex-col items-center justify-center no-print ${getCategoryTheme(recipe.category)}`}>
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none select-none overflow-hidden">
              <span className="text-[40vw] font-black absolute -top-32 -left-16 leading-none rotate-6">{recipe.title.charAt(0)}</span>
              <span className="text-[30vw] font-black absolute -bottom-32 -right-16 leading-none -rotate-6">{recipe.title.charAt(0)}</span>
            </div>
            <button onClick={onClose} className="absolute top-10 right-10 w-12 h-12 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center text-xl transition-all">✕</button>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-40">{recipe.category}</span>
            <h2 className="text-5xl md:text-8xl font-serif font-bold text-center tracking-tighter leading-[0.85] max-w-4xl relative z-10">
              {recipe.title}
            </h2>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 sm:p-16 space-y-16 scrollbar-hide">
          <div className="grid lg:grid-cols-12 gap-16">
            <aside className="lg:col-span-4 space-y-12">
              <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-stone-100 pb-8">
                  <h3 className="text-2xl font-serif font-bold text-stone-900">Ingredientes</h3>
                  <div className="flex bg-stone-100 p-1.5 rounded-2xl">
                    {[1, 2, 4].map(v => (
                      <button key={v} onClick={() => setPortionScale(v)} className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${portionScale === v ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>{v}x</button>
                    ))}
                  </div>
                </div>
                <ul className="space-y-5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-4 cursor-pointer group" onClick={() => {
                      const n = new Set(checkedIngredients);
                      n.has(i) ? n.delete(i) : n.add(i);
                      setCheckedIngredients(n);
                    }}>
                      <div className={`w-6 h-6 rounded-xl border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${checkedIngredients.has(i) ? 'bg-stone-900 border-stone-900' : 'border-stone-200 group-hover:border-stone-400'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className={`text-base leading-relaxed transition-all ${checkedIngredients.has(i) ? 'line-through text-stone-300 italic' : 'text-stone-700'}`}>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-30">Nota del Chef</h4>
                <ul className="space-y-5">
                  {recipe.tips.map((tip, i) => (
                    <li key={i} className="text-sm italic text-stone-500 leading-relaxed font-serif">"{tip}"</li>
                  ))}
                </ul>
              </div>
            </aside>

            <main className="lg:col-span-8 space-y-12">
              <div className="flex justify-between items-center border-b border-stone-100 pb-8">
                <h3 className="text-2xl font-serif font-bold text-stone-900">Elaboración</h3>
                {timerSeconds !== null && (
                  <div className="flex items-center gap-4 bg-amber-600 text-white px-6 py-3 rounded-[2rem] text-[12px] font-black tabular-nums animate-pulse shadow-xl">
                    <span>⏱ {formatTime(timerSeconds)}</span>
                  </div>
                )}
              </div>
              <div className="space-y-10">
                {recipe.steps.map((step, i) => {
                  const stepTime = detectTime(step);
                  const isCurrentTimer = activeTimerStep === i;
                  const isActive = i === activeStep;

                  return (
                    <div 
                      key={i} 
                      onClick={() => setActiveStep(i)} 
                      className={`p-10 rounded-[3.5rem] border-2 transition-all cursor-pointer group ${isActive ? 'border-stone-900 bg-stone-50 shadow-2xl scale-[1.02]' : 'border-transparent hover:bg-stone-50/50'}`}
                    >
                      <div className="flex gap-10 items-start">
                        <span className={`w-12 h-12 flex items-center justify-center font-black shrink-0 text-xs transition-all ${isActive ? 'bg-stone-900 text-white rounded-2xl' : 'text-stone-200'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-8">
                          <p className={`text-2xl leading-relaxed transition-colors ${isActive ? 'text-stone-900 font-medium' : 'text-stone-300'}`}>
                            {step}
                          </p>
                          {stepTime && (
                            <div className="pt-4 no-print">
                              {!isCurrentTimer ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); startTimer(stepTime, i); }} 
                                  className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl active:scale-95"
                                >
                                  <span>⏲️</span> {stepTime} minutos
                                </button>
                              ) : (
                                <div className="flex items-center gap-5 bg-white p-3 rounded-[2.5rem] shadow-2xl border border-stone-100 animate-in fade-in zoom-in">
                                  <span className="px-6 py-3 bg-stone-50 rounded-2xl font-black text-stone-900 tabular-nums text-lg">{formatTime(timerSeconds || 0)}</span>
                                  <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setIsTimerRunning(!isTimerRunning); }} className="p-4 bg-amber-100 text-amber-600 rounded-2xl hover:bg-amber-200">{isTimerRunning ? '⏸' : '▶'}</button>
                                    <button onClick={(e) => { e.stopPropagation(); setTimerSeconds(null); }} className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100">⏹</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </div>
        </div>

        <footer className="p-10 border-t border-stone-100 bg-white flex flex-wrap gap-6 no-print items-center justify-between">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
            className={`flex-1 min-w-[300px] py-7 rounded-full font-black text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-5 ${voiceEnabled ? 'bg-amber-600 text-white animate-pulse shadow-2xl' : 'bg-stone-950 text-white hover:bg-black'}`}
          >
            {voiceEnabled ? '🎤 ASISTENTE ACTIVO' : '🎙️ ACTIVAR ASISTENTE'}
          </button>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-12 py-7 rounded-full font-black text-[9px] tracking-widest border border-stone-200 hover:bg-stone-50 transition-all">IMPRIMIR</button>
            <button onClick={() => setIsKitchenMode(!isKitchenMode)} className={`px-12 py-7 rounded-full font-black text-[9px] tracking-widest transition-all ${isKitchenMode ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>MODO COCINA</button>
          </div>
        </footer>
        
        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
