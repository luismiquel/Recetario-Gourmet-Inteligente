
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

type ViewMode = 'full' | 'ingredients';

const CAT_THEMES: Record<string, { accent: string, text: string, bg: string }> = {
  desayuno: { accent: 'bg-amber-600', text: 'text-amber-600', bg: 'bg-amber-50' },
  aperitivo: { accent: 'bg-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  primero: { accent: 'bg-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50' },
  segundo: { accent: 'bg-rose-600', text: 'text-rose-600', bg: 'bg-rose-50' },
  postre: { accent: 'bg-violet-600', text: 'text-violet-600', bg: 'bg-violet-50' }
};

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose, onAddIngredients }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const theme = recipe ? (CAT_THEMES[recipe.category] || { accent: 'bg-stone-900', text: 'text-stone-900', bg: 'bg-stone-50' }) : null;

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    const c = cmd.toLowerCase();
    
    if (/(siguiente|próximo|adelante|hecho|listo|continua|pasa|vale|ok|venga|sigue|entendido)/.test(c)) {
      nextStep();
    } 
    else if (/(anterior|atrás|vuelve|previo|antes)/.test(c)) {
      prevStep();
    }
    else if (/(repite|qué|no oigo|otra vez|dime)/.test(c)) {
      readCurrentStep();
    }
    else if (/(cerrar|salir|terminar)/.test(c)) {
      onClose();
    }
    else if (/(ingredientes|lista|necesito)/.test(c)) {
      readIngredients();
      setViewMode('ingredients');
    }
    else if (/(pasos|receta|completa)/.test(c)) {
      setViewMode('full');
    }
    
    if (/(temporizador|pon|cuenta|minutos)/.test(c)) {
      const match = c.match(/(\d+)/);
      if (match) startTimer(parseInt(match[1]));
    }
  };

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  useEffect(() => {
    if (isOpen && recipe) {
      setActiveStep(0);
      const timer = setTimeout(() => {
        speak(`Chef, estamos listos para preparar ${recipe.title}. ¿Quieres revisar los ingredientes o empezamos directamente?`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, recipe]);

  const nextStep = useCallback(() => {
    if (!recipe) return;
    if (activeStep >= recipe.steps.length - 1) {
      speak("¡Excelente trabajo Chef! El plato está terminado. ¡Buen provecho!");
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
    speak(`Retrocedemos al paso ${prev + 1}: ${recipe.steps[prev]}`);
  }, [activeStep, speak]);

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    speak(`Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep, speak]);

  const readIngredients = useCallback(() => {
    if (!recipe) return;
    speak(`Los ingredientes son: ${recipe.ingredients.join(', ')}.`);
  }, [recipe, speak]);

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    speak(`Entendido. Temporizador de ${minutes} minutos iniciado.`);
  };

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timerSeconds && timerSeconds > 0) {
      interval = window.setInterval(() => setTimerSeconds(s => (s ? s - 1 : 0)), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      setTimerSeconds(null);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      speak("¡Atención Chef! El tiempo ha terminado.");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, speak]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !recipe || !theme) return null;

  // --- MODO COCINA TOTAL (ULTRA LEGIBILIDAD A DISTANCIA) ---
  if (isKitchenMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden animate-in fade-in duration-500">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 overflow-hidden">
          <div className={`w-[120vw] h-[120vw] rounded-full transition-all duration-1000 ${
            status === 'listening' ? 'bg-red-500 scale-125 animate-pulse' : 
            status === 'speaking' ? 'bg-amber-500 scale-110' : 'bg-zinc-800'
          }`}></div>
        </div>

        <button onClick={prevStep} disabled={activeStep === 0} className="absolute left-0 top-0 bottom-0 z-50 w-40 flex items-center justify-center transition-all opacity-0 hover:opacity-100 hover:bg-white/5 disabled:pointer-events-none">
          <div className="bg-zinc-800 p-12 rounded-full border border-white/10 shadow-2xl"><svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15 19l-7-7 7-7" /></svg></div>
        </button>

        <button onClick={nextStep} disabled={activeStep === recipe.steps.length - 1} className="absolute right-0 top-0 bottom-0 z-50 w-40 flex items-center justify-center transition-all opacity-0 hover:opacity-100 hover:bg-white/5 disabled:pointer-events-none">
          <div className={`${theme.accent} p-12 rounded-full border border-white/10 shadow-2xl`}><svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" /></svg></div>
        </button>

        <header className="relative z-40 p-12 flex flex-col bg-zinc-900/98 backdrop-blur-3xl border-b border-white/10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-8">
              <div className={`${theme.accent} text-white px-6 py-2 rounded-xl text-sm font-black uppercase tracking-[0.2em]`}>Chef Activo</div>
              <h2 className="text-5xl font-bold font-serif tracking-tight">{recipe.title}</h2>
            </div>
            <button onClick={() => setIsKitchenMode(false)} className="px-12 py-5 bg-white/10 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Vista Detalle</button>
          </div>
          <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full ${theme.accent} shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-700 ease-out`} style={{ width: `${((activeStep + 1) / recipe.steps.length) * 100}%` }}></div>
          </div>
        </header>

        <main className="relative z-40 flex-1 flex flex-col items-center justify-center px-12 md:px-32 lg:px-48 text-center">
          {timerSeconds !== null && (
            <div className="mb-16 bg-amber-600 px-24 py-8 rounded-[6rem] shadow-2xl border-8 border-amber-400/30 animate-pulse">
              <span className="text-9xl font-black tabular-nums tracking-tighter">{formatTime(timerSeconds)}</span>
            </div>
          )}
          <div className="max-w-[1800px] space-y-16">
            <div className="inline-block px-16 py-4 bg-zinc-800/90 rounded-full text-white font-black text-2xl uppercase tracking-[0.6em] border border-white/20">ETAPA {activeStep + 1}</div>
            {/* TEXTO MASIVO Y LIMPIO PARA EL MODO COCINA (USA SANS PARA MÁXIMA CLARIDAD) */}
            <p className="text-7xl md:text-[9rem] lg:text-[12rem] font-sans font-black leading-[1.0] tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] selection:bg-amber-500">
              {recipe.steps[activeStep]}
            </p>
          </div>
        </main>

        <footer className="relative z-40 p-16 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-12">
          <div className="flex items-center gap-16">
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-32 h-32 rounded-full flex items-center justify-center transition-all border-4 transform active:scale-90 ${voiceEnabled ? `${theme.accent} border-white shadow-[0_0_60px_rgba(255,255,255,0.25)]` : 'bg-zinc-800 border-zinc-700'}`}>
              <span className="text-5xl">{voiceEnabled ? '🎤' : '🎙️'}</span>
            </button>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black text-white/40 uppercase tracking-[0.4em] mb-2 font-sans">Asistente Vocal</span>
              <span className="text-3xl font-bold text-amber-500 font-sans">"Siguiente" · "Atrás"</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // --- VISTA DETALLE NORMAL ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-8 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-stone-950/98 backdrop-blur-3xl" onClick={onClose}></div>
      <div className="relative w-full max-w-[1700px] h-full bg-white sm:rounded-[5rem] shadow-2xl flex flex-col overflow-hidden">
        
        <header className={`shrink-0 pt-20 pb-16 px-16 relative flex flex-col items-center ${theme.bg} border-b border-stone-100 overflow-hidden`}>
           <div className={`absolute top-0 left-0 w-full h-2 ${theme.accent} opacity-40`}></div>
           <button onClick={onClose} className="absolute top-10 right-10 w-16 h-16 bg-stone-900/5 hover:bg-stone-900/10 rounded-full flex items-center justify-center transition-all group z-50">
            <span className="text-2xl group-hover:rotate-90 transition-transform">✕</span>
          </button>
          
          <div className="flex items-center gap-8 mb-10 relative z-10">
            <div className={`w-16 h-[3px] ${theme.accent} opacity-30`}></div>
            <span className={`text-[14px] font-black uppercase tracking-[0.7em] ${theme.text}`}>ALTA COCINA · RECETA {recipe.id}</span>
            <div className={`w-16 h-[3px] ${theme.accent} opacity-30`}></div>
          </div>
          
          <h2 className="text-6xl md:text-[8rem] font-serif font-bold text-center tracking-tighter leading-[0.85] text-stone-950 mb-14 max-w-6xl relative z-10 drop-shadow-sm">
            {recipe.title}
          </h2>

          <div className="flex bg-white/70 p-2 rounded-full border border-stone-200 backdrop-blur-2xl relative z-10 shadow-lg">
            <button onClick={() => setViewMode('full')} className={`px-12 py-4 rounded-full text-[12px] font-black uppercase tracking-widest transition-all ${viewMode === 'full' ? 'bg-stone-950 text-white shadow-2xl scale-105' : 'text-stone-400 hover:text-stone-900'}`}>Guía de Preparación</button>
            <button onClick={() => setViewMode('ingredients')} className={`px-12 py-4 rounded-full text-[12px] font-black uppercase tracking-widest transition-all ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-2xl scale-105` : 'text-stone-400 hover:text-stone-900'}`}>Mise en place</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 md:p-32 scrollbar-hide bg-white">
          <div className={`transition-all duration-1000 ease-in-out ${viewMode === 'ingredients' ? 'max-w-6xl mx-auto' : 'grid lg:grid-cols-12 gap-32'}`}>
            
            {/* SECCIÓN INGREDIENTES CON TEXTO SANS XXL (MÁS LIMPIO) */}
            <aside className={`${viewMode === 'ingredients' ? 'lg:col-span-12' : 'lg:col-span-4'} space-y-20`}>
              <div className={`bg-stone-50/70 p-20 rounded-[5rem] border-2 border-stone-100 transition-all duration-700 ${viewMode === 'ingredients' ? 'scale-[1.03] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.05)] p-32' : ''}`}>
                <div className="flex justify-between items-center mb-20 border-b-4 border-stone-100 pb-10">
                  <h3 className="text-5xl font-serif font-bold text-stone-950">Ingredientes</h3>
                  <div className={`w-12 h-12 rounded-full ${theme.accent} opacity-15`}></div>
                </div>
                
                <ul className={`grid gap-x-20 gap-y-12 ${viewMode === 'ingredients' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className="flex items-start gap-8 cursor-pointer group">
                      <div className={`w-14 h-14 rounded-[1.5rem] border-4 mt-2 shrink-0 transition-all flex items-center justify-center ${checkedIngredients.has(i) ? `${theme.accent} border-transparent shadow-xl` : 'border-stone-200 group-hover:border-stone-500'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-3xl font-bold">✓</span>}
                      </div>
                      <span className={`font-sans font-bold leading-tight transition-all text-5xl md:text-6xl ${checkedIngredients.has(i) ? 'line-through opacity-15 italic blur-[1px]' : 'text-stone-800'}`}>
                        {ing}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {viewMode === 'ingredients' && (
                  <div className="mt-24 pt-20 border-t-2 border-stone-100 flex flex-col items-center animate-in slide-in-from-bottom-5">
                    <p className="text-stone-400 text-2xl italic font-serif mb-12 text-center max-w-2xl leading-relaxed">Confirma cada elemento de la lista. Una preparación organizada es el cimiento de la excelencia culinaria.</p>
                    <button onClick={() => { setIsKitchenMode(true); speak("Iniciando preparación. ¿Listo para el primer paso?"); }} className={`px-24 py-10 ${theme.accent} text-white rounded-full font-black text-xl uppercase tracking-[0.5em] shadow-[0_25px_50px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-all font-sans`}>EMPEZAR COCINADO</button>
                  </div>
                )}
              </div>
            </aside>

            {/* SECCIÓN PASOS CON TEXTO SANS XXL (MÁS LIMPIO) */}
            {viewMode === 'full' && (
              <main className="lg:col-span-8 space-y-20 animate-in slide-in-from-right-10 duration-1000">
                <div className="flex justify-between items-end border-b-8 border-stone-50 pb-10">
                   <h3 className="text-6xl font-serif font-bold text-stone-950">Elaboración</h3>
                   <span className="text-[18px] font-black text-stone-300 uppercase tracking-[0.4em] font-sans">{recipe.steps.length} HITOS CLAVE</span>
                </div>
                <div className="space-y-16">
                  {recipe.steps.map((step, i) => (
                    <div key={i} onClick={() => setActiveStep(i)} className={`p-20 rounded-[5rem] border-4 transition-all cursor-pointer relative group ${activeStep === i ? `border-stone-950 bg-stone-50 shadow-2xl scale-[1.02] translate-x-6` : 'border-transparent opacity-30 hover:opacity-100 hover:translate-x-3'}`}>
                      <div className="flex gap-16">
                        <span className={`text-9xl font-black transition-colors leading-none pt-2 ${activeStep === i ? theme.text : 'text-stone-100'}`}>{i + 1}</span>
                        <p className="text-5xl md:text-6xl lg:text-7xl font-sans font-bold leading-[1.2] text-stone-900 tracking-tight">
                          {step}
                        </p>
                      </div>
                      {activeStep === i && <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-32 ${theme.accent} rounded-full shadow-2xl animate-pulse`}></div>}
                    </div>
                  ))}
                </div>
              </main>
            )}
          </div>
        </div>

        <footer className="shrink-0 p-16 bg-white border-t border-stone-100 flex flex-wrap gap-12 items-center justify-between shadow-[0_-30px_60px_rgba(0,0,0,0.03)] relative z-50">
          <div className="flex gap-8 flex-1 min-w-[400px]">
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`flex-1 py-10 rounded-[3rem] font-black text-[16px] tracking-[0.6em] transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95 ${voiceEnabled ? `${theme.accent} text-white` : 'bg-stone-950 text-white'}`}>
              <span className="text-5xl">{voiceEnabled ? '🎤' : '🎙️'}</span>
              {voiceEnabled ? 'MODO VOZ ACTIVO' : 'ACTIVAR VOZ'}
            </button>
            <button onClick={() => setIsKitchenMode(true)} className="px-20 py-10 bg-stone-100 rounded-[3rem] font-black text-[16px] uppercase tracking-[0.5em] hover:bg-stone-200 transition-all flex items-center gap-6 shadow-inner active:scale-95 group">
              MODO COCINA <span className="text-5xl group-hover:scale-150 transition-transform duration-700">🍳</span>
            </button>
          </div>
          <button onClick={onClose} className="px-14 py-6 text-stone-400 font-bold hover:text-stone-950 transition-colors uppercase tracking-[0.4em] text-[16px]">Cerrar</button>
        </footer>

        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
