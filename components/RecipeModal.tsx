
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
  
  // Temporizador
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
      alert("¡Tiempo cumplido!");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    const c = cmd.toLowerCase();
    
    if (/siguiente|próximo|adelante|hecho/.test(c)) nextStep();
    else if (/anterior|atrás|vuelve/.test(c)) prevStep();
    else if (/repite|qué dice/.test(c)) readCurrentStep();
    else if (/imprimir|papel/.test(c)) window.print();
    else if (/cerrar|salir/.test(c)) onClose();
    else if (/añade todo|lista de compra/.test(c)) {
      onAddIngredients(recipe.ingredients);
      speak("He añadido todos los ingredientes a tu lista de compra.");
    }
    
    // Salto directo a paso
    const stepMatch = c.match(/paso (\d+)/);
    if (stepMatch) {
      const stepIdx = parseInt(stepMatch[1]) - 1;
      if (stepIdx >= 0 && stepIdx < recipe.steps.length) {
        setActiveStep(stepIdx);
        speak(`Vale, paso ${stepIdx + 1}. ${recipe.steps[stepIdx]}`);
      }
    }

    // Temporizador manual por voz
    const timerMatch = c.match(/temporizador de (\d+) minutos/);
    if (timerMatch) {
      const mins = parseInt(timerMatch[1]);
      startTimer(mins);
      speak(`Entendido, cronómetro de ${mins} minutos en marcha.`);
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
  };

  const nextStep = useCallback(() => {
    if (!recipe) return;
    if (activeStep >= recipe.steps.length - 1) {
      speak("Buen trabajo, has terminado la receta. ¡A disfrutar!");
      return;
    }
    const next = activeStep + 1;
    setActiveStep(next);
    speak(`Paso ${next + 1}. ${recipe.steps[next]}`);
  }, [recipe, activeStep, speak]);

  const prevStep = useCallback(() => {
    if (activeStep <= 0) return;
    const prev = activeStep - 1;
    setActiveStep(prev);
    speak(`Paso ${prev + 1}. ${recipe.steps[prev]}`);
  }, [activeStep, speak]);

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    speak(`Paso ${activeStep + 1}. ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep, speak]);

  const detectTime = (text: string) => {
    const match = text.match(/(\d+)\s*(min|minutos)/i);
    return match ? parseInt(match[1]) : null;
  };

  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map(ing => {
      return ing.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
        const num = parseFloat(match.replace(',', '.'));
        return (num * portionScale).toString().replace('.', ',');
      });
    });
  }, [recipe, portionScale]);

  if (!isOpen || !recipe) return null;

  // Cálculo del progreso para el temporizador visual circular
  const progressOffset = timerSeconds !== null 
    ? (timerSeconds / maxTimerSeconds) * 283 // 283 es el perímetro de un círculo con r=45
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-hidden" role="dialog">
      <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md no-print" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-7xl h-full sm:h-[95vh] bg-white sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden recipe-content transition-colors duration-500 ${isKitchenMode ? 'bg-stone-900 text-white' : ''}`}>
        
        {/* Temporizador Circular Flotante (UI de alta gama) */}
        {timerSeconds !== null && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 no-print pointer-events-none">
            <div className="bg-stone-900/80 backdrop-blur-xl p-4 rounded-full shadow-2xl flex items-center gap-4 border border-white/10 scale-110">
              <div className="relative w-16 h-16 pointer-events-auto cursor-pointer" onClick={() => setIsTimerRunning(!isTimerRunning)}>
                <svg className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                    className={`${timerSeconds < 60 ? 'text-red-500' : 'text-amber-500'} transition-all duration-1000`}
                    strokeDasharray="175.9" strokeDashoffset={175.9 - (timerSeconds / maxTimerSeconds) * 175.9} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-white tabular-nums">
                  {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="pr-4 pointer-events-auto">
                 <button onClick={() => {setTimerSeconds(null); setActiveTimerStep(null);}} className="text-white/40 hover:text-white transition-colors">✕</button>
              </div>
            </div>
          </div>
        )}

        {/* Cabecera */}
        {!isKitchenMode && (
          <div className="h-64 relative shrink-0 no-print group">
            <img src={recipe.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
            <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-white/50 backdrop-blur-md rounded-full hover:bg-white text-stone-900 transition-all z-10 shadow-lg">✕</button>
            <div className="absolute bottom-6 left-10">
              <h2 className="text-5xl font-serif font-bold text-stone-900 tracking-tight">{recipe.title}</h2>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-12 scrollbar-hide">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Columna Lateral: Ingredientes */}
            <aside className="lg:col-span-4 space-y-10 ingredients-grid">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-serif font-bold text-amber-600 flex items-center gap-3">
                    <span>🥕</span> Ingredientes
                  </h3>
                  <div className="flex bg-stone-100 p-1 rounded-xl no-print">
                    {[1, 2, 4].map(v => (
                      <button key={v} onClick={() => setPortionScale(v)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${portionScale === v ? 'bg-amber-600 text-white' : 'text-stone-400'}`}>{v}x</button>
                    ))}
                  </div>
                </div>
                <ul className="space-y-4 ingredients-list">
                  {scaledIngredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-4 cursor-pointer group no-print" onClick={() => {
                      const n = new Set(checkedIngredients);
                      n.has(i) ? n.delete(i) : n.add(i);
                      setCheckedIngredients(n);
                    }}>
                      <div className={`w-6 h-6 rounded-lg border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${checkedIngredients.has(i) ? 'bg-amber-600 border-amber-600 scale-90' : 'border-stone-200 group-hover:border-amber-400'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className={`text-base leading-snug transition-all ${checkedIngredients.has(i) ? 'line-through text-stone-300' : 'text-stone-600'}`}>{ing}</span>
                    </li>
                  ))}
                  {/* Vista Impresión */}
                  {scaledIngredients.map((ing, i) => (
                    <li key={`p-${i}`} className="hidden print-only">• {ing}</li>
                  ))}
                </ul>
              </div>

              <div className="chef-tips p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                </div>
                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4">Consejos Maestro</h4>
                <ul className="space-y-4">
                  {recipe.tips.map((tip, i) => (
                    <li key={i} className="text-sm italic text-amber-900/70 leading-relaxed font-serif">"{tip}"</li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Columna Principal: Pasos */}
            <main className="lg:col-span-8 space-y-10 steps-container">
              <h3 className="text-2xl font-serif font-bold text-amber-600 flex items-center gap-3">
                <span>👨‍🍳</span> Elaboración
              </h3>
              <div className="space-y-6">
                {recipe.steps.map((step, i) => {
                  const stepTime = detectTime(step);
                  const isCurrentTimer = activeTimerStep === i;
                  const isActive = i === activeStep;

                  return (
                    <div 
                      key={i} 
                      onClick={() => setActiveStep(i)}
                      className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative group ${isActive ? 'border-amber-500 bg-amber-50/20 shadow-xl' : 'border-stone-100 hover:border-stone-200 hover:translate-x-1'}`}
                    >
                      <div className="flex gap-8 items-start">
                        <span className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shrink-0 text-xl transition-all ${isActive ? 'bg-amber-600 text-white shadow-lg rotate-3' : 'bg-stone-100 text-stone-300'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-6">
                          <p className={`text-xl leading-relaxed font-medium transition-colors ${isActive ? (isKitchenMode ? 'text-white' : 'text-stone-800') : 'text-stone-300'}`}>
                            {step}
                          </p>
                          
                          {stepTime && (
                            <div className="flex items-center gap-4 pt-2 no-print">
                              {!isCurrentTimer ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); startTimer(stepTime, i); }}
                                  className="flex items-center gap-3 px-6 py-3 bg-amber-100 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                >
                                  <span>⏲️</span> Iniciar {stepTime} min
                                </button>
                              ) : (
                                <div className="flex items-center gap-3 bg-stone-900 text-white px-4 py-2 rounded-2xl animate-pulse">
                                  <span className="text-xs font-black tabular-nums">Paso en tiempo: {Math.floor(timerSeconds! / 60)}:{String(timerSeconds! % 60).padStart(2, '0')}</span>
                                  <button onClick={(e) => { e.stopPropagation(); setTimerSeconds(null); setActiveTimerStep(null); }} className="text-red-400 text-xs">Parar</button>
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

        {/* Footer Dinámico */}
        <footer className="p-10 border-t border-stone-100 bg-stone-50/80 backdrop-blur-md flex flex-wrap gap-6 no-print items-center">
          <button 
            onClick={() => {
              if(!voiceEnabled) speak("Voz activada. Controla la receta con tu voz.");
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`flex-1 min-w-[280px] py-6 rounded-[2rem] font-black text-xs tracking-widest transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 ${voiceEnabled ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-900 text-white hover:bg-black'}`}
          >
            {voiceEnabled ? (
              <>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-white/50 rounded-full animate-voice-bar-1"></div>
                  <div className="w-1 h-5 bg-white rounded-full animate-voice-bar-2"></div>
                  <div className="w-1 h-3 bg-white/50 rounded-full animate-voice-bar-3"></div>
                </div>
                <span>ESCUCHANDO RECETA...</span>
              </>
            ) : (
              <>
                <span>🎤 ACTIVAR ASISTENTE</span>
              </>
            )}
          </button>
          
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-10 py-6 rounded-[2rem] font-black text-[10px] tracking-widest bg-white border border-stone-200 text-stone-900 hover:shadow-lg transition-all flex items-center gap-3">
              <span>🖨️</span> IMPRIMIR
            </button>
            <button onClick={() => setIsKitchenMode(!isKitchenMode)} className={`px-10 py-6 rounded-[2rem] font-black text-[10px] tracking-widest transition-all flex items-center gap-3 ${isKitchenMode ? 'bg-amber-600 text-white shadow-lg' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>
              <span>🍳</span> {isKitchenMode ? 'MODO NORMAL' : 'MODO COCINA'}
            </button>
          </div>
        </footer>
        
        <VoiceFeedback status={status} />
      </div>

      <style>{`
        @keyframes voice-bar-1 { 0%, 100% { height: 8px; } 50% { height: 16px; } }
        @keyframes voice-bar-2 { 0%, 100% { height: 16px; } 50% { height: 24px; } }
        @keyframes voice-bar-3 { 0%, 100% { height: 8px; } 50% { height: 16px; } }
        .animate-voice-bar-1 { animation: voice-bar-1 0.6s ease-in-out infinite; }
        .animate-voice-bar-2 { animation: voice-bar-2 0.6s ease-in-out infinite 0.1s; }
        .animate-voice-bar-3 { animation: voice-bar-3 0.6s ease-in-out infinite 0.2s; }
      `}</style>
    </div>
  );
};
