
import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, VoiceStatus } from '../types';
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

const CAT_THEMES: Record<string, { accent: string, text: string, bg: string, ring: string }> = {
  desayuno: { accent: 'bg-amber-600', text: 'text-amber-700', bg: 'bg-amber-50/50', ring: 'ring-amber-200' },
  aperitivo: { accent: 'bg-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50/50', ring: 'ring-emerald-200' },
  primero: { accent: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50/50', ring: 'ring-indigo-200' },
  segundo: { accent: 'bg-rose-600', text: 'text-rose-700', bg: 'bg-rose-50/50', ring: 'ring-rose-200' },
  postre: { accent: 'bg-violet-600', text: 'text-violet-700', bg: 'bg-violet-50/50', ring: 'ring-violet-200' }
};

const VoiceStatusOrb: React.FC<{ status: VoiceStatus; accentColor: string }> = ({ status, accentColor }) => {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-2">
      {status === 'listening' && (
        <>
          <div className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-red-600">Escuchando</span>
        </>
      )}
      {status === 'speaking' && (
        <>
          <div className="flex items-center gap-1.5 h-5 text-amber-500">
            <div className="wave-bar w-[2.5px] h-3"></div>
            <div className="wave-bar wave-delay-1 w-[2.5px] h-3"></div>
            <div className="wave-bar wave-delay-2 w-[2.5px] h-3"></div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600">Hablando</span>
        </>
      )}
      {status === 'processing' && (
        <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin"></div>
      )}
    </div>
  );
};

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose, onAddIngredients }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [addedToList, setAddedToList] = useState(false);
  
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const theme = recipe ? (CAT_THEMES[recipe.category] || { accent: 'bg-stone-900', text: 'text-stone-900', bg: 'bg-stone-50', ring: 'ring-stone-200' }) : null;

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    const c = cmd.toLowerCase();
    
    // Alias expandidos para mejorar la experiencia de usuario
    if (/(siguiente|próximo|adelante|hecho|listo|vale|ok|venga|sigue|dale|tira)/.test(c)) nextStep();
    else if (/(anterior|atrás|vuelve|antes)/.test(c)) prevStep();
    else if (/(repite|qué|no oigo|otra vez|dime)/.test(c)) readCurrentStep();
    else if (/(cerrar|salir|terminar)/.test(c)) onClose();
    else if (/(ingredientes|lista)/.test(c)) { readIngredients(); setViewMode('ingredients'); }
    else if (/(pasos|preparación)/.test(c)) setViewMode('full');
    
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
      const t = setTimeout(() => speak(`${recipe.title} lista. ¿Repasamos ingredientes?`), 600);
      return () => clearTimeout(t);
    }
  }, [isOpen, recipe]);

  const nextStep = useCallback(() => {
    if (!recipe) return;
    if (activeStep >= recipe.steps.length - 1) {
      speak("¡Excelente trabajo Chef! El plato está listo.");
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
    speak(`Volvemos al paso ${prev + 1}: ${recipe.steps[prev]}`);
  }, [activeStep, speak]);

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    speak(`Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep, speak]);

  const readIngredients = useCallback(() => {
    if (!recipe) return;
    speak(`Necesitamos: ${recipe.ingredients.join(', ')}.`);
  }, [recipe, speak]);

  const handleAddToShoppingList = () => {
    if (!recipe) return;
    onAddIngredients(recipe.ingredients);
    setAddedToList(true);
    speak("Ingredientes añadidos a tu lista.");
    setTimeout(() => setAddedToList(false), 3000);
  };

  const handleShare = async () => {
    if (!recipe) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: `GourmetVoice: ${recipe.title}`, text: `Mira esta receta: ${recipe.title}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        speak("Enlace copiado.");
      }
    } catch (err) {}
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    speak(`Reloj a ${minutes} minutos.`);
  };

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timerSeconds && timerSeconds > 0) {
      interval = window.setInterval(() => setTimerSeconds(s => (s ? s - 1 : 0)), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      setTimerSeconds(null);
      speak("¡Tiempo finalizado Chef!");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, speak]);

  if (!isOpen || !recipe || !theme) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- MODO COCINA XXL ---
  if (isKitchenMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-stone-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-700">
        <header className="p-12 flex justify-between items-center bg-stone-900/80 backdrop-blur-xl border-b border-white/5">
          <h2 className="text-4xl font-serif font-bold tracking-tight">{recipe.title}</h2>
          <div className="flex items-center gap-8">
            <VoiceStatusOrb status={status} accentColor={theme.accent} />
            <button onClick={() => setIsKitchenMode(false)} className="px-10 py-4 bg-white/10 rounded-full text-xs font-black tracking-widest uppercase border border-white/10 hover:bg-white/20 transition-all">Salir del Modo Cocina</button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-32 text-center relative">
          {timerSeconds !== null && (
            <div className="absolute top-20 bg-amber-600/20 px-16 py-6 rounded-full border border-amber-600/40 backdrop-blur-md">
              <span className="text-8xl font-black tabular-nums text-amber-500">{formatTime(timerSeconds)}</span>
            </div>
          )}
          <div className="max-w-[1400px] space-y-16">
            <span className="inline-block px-12 py-3 bg-white/10 rounded-full text-white/50 font-black text-sm uppercase tracking-[0.6em]">Paso {activeStep + 1} de {recipe.steps.length}</span>
            {/* Texto XXL Sans-serif de máxima visibilidad (Font-weight 900) */}
            <p className="text-7xl md:text-9xl lg:text-[10rem] font-sans font-black leading-[1.0] tracking-tighter text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              {recipe.steps[activeStep]}
            </p>
          </div>
          <div className="absolute left-0 right-0 bottom-40 flex justify-between px-20">
            <button onClick={prevStep} disabled={activeStep === 0} className="w-24 h-24 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all text-4xl disabled:opacity-0 disabled:pointer-events-none">←</button>
            <button onClick={nextStep} disabled={activeStep === recipe.steps.length - 1} className={`w-32 h-32 ${theme.accent} rounded-full flex items-center justify-center shadow-2xl text-4xl transform hover:scale-110 active:scale-90 transition-all disabled:opacity-0 disabled:pointer-events-none`}>→</button>
          </div>
        </main>

        <footer className="p-16 flex flex-col items-center gap-10">
          <div className="h-3 w-full max-w-4xl bg-white/10 rounded-full overflow-hidden">
             <div className={`h-full ${theme.accent} transition-all duration-1000 shadow-[0_0_20px_rgba(255,255,255,0.2)]`} style={{ width: `${((activeStep + 1) / recipe.steps.length) * 100}%` }}></div>
          </div>
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-32 h-32 rounded-full flex items-center justify-center transition-all border-4 ${voiceEnabled ? `${theme.accent} border-white shadow-2xl animate-pulse` : 'bg-stone-800 border-white/10'}`}>
            <span className="text-5xl">{voiceEnabled ? '🎤' : '🎙️'}</span>
          </button>
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Diga "Siguiente" o "Atrás" para navegar</div>
        </footer>
      </div>
    );
  }

  // --- VISTA DETALLE EDITORIAL ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-14 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-stone-950/96 backdrop-blur-3xl" onClick={onClose}></div>
      <div className="relative w-full max-w-[1600px] h-full bg-white rounded-[4rem] lg:rounded-[6rem] shadow-[0_60px_150px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
        
        <header className={`shrink-0 pt-20 pb-16 px-16 relative flex flex-col items-center border-b border-stone-100 ${theme.bg}`}>
           <div className="absolute top-12 right-12 flex gap-4 z-50">
             <button onClick={handleShare} className="w-16 h-16 bg-white rounded-full flex items-center justify-center transition-all hover:bg-stone-50 border border-stone-100 shadow-sm text-2xl group">
               <span className="group-hover:scale-125 transition-transform">↗️</span>
             </button>
             <button onClick={onClose} className="w-16 h-16 bg-white rounded-full flex items-center justify-center transition-all hover:bg-stone-50 border border-stone-100 shadow-sm text-2xl group">
               <span className="group-hover:rotate-90 transition-transform">✕</span>
             </button>
           </div>
          
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-center tracking-tight leading-[1.0] text-stone-900 mb-14 max-w-5xl">
            {recipe.title}
          </h2>

          <div className="flex bg-white/95 p-2 rounded-full border border-stone-200/50 backdrop-blur-2xl shadow-lg">
            <button onClick={() => setViewMode('full')} className={`px-14 py-4 rounded-full text-[12px] font-black uppercase tracking-[0.3em] transition-all ${viewMode === 'full' ? 'bg-stone-900 text-white shadow-xl scale-105' : 'text-stone-400 hover:text-stone-900'}`}>Guía de Cocinado</button>
            <button onClick={() => setViewMode('ingredients')} className={`px-14 py-4 rounded-full text-[12px] font-black uppercase tracking-[0.3em] transition-all ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-xl scale-105` : 'text-stone-400 hover:text-stone-900'}`}>Ingredientes</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 md:p-24 lg:p-32 scrollbar-hide bg-white">
          <div className={`transition-all duration-700 ease-in-out ${viewMode === 'ingredients' ? 'max-w-6xl mx-auto' : 'grid lg:grid-cols-12 gap-24 lg:gap-40'}`}>
            
            <aside className={`${viewMode === 'ingredients' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-16`}>
              <div className="border-b-4 border-stone-100 pb-10 mb-12 flex justify-between items-center">
                <h3 className="text-4xl font-serif font-bold text-stone-900">Mise en Place</h3>
                <div className="flex items-center gap-4">
                  <VoiceStatusOrb status={status} accentColor={theme.accent} />
                  <button onClick={handleAddToShoppingList} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-md active:scale-95 ${addedToList ? 'bg-emerald-500' : theme.accent}`}>
                    {addedToList ? '✓ AÑADIDO' : '+ LISTA COMPRA'}
                  </button>
                </div>
              </div>
              
              <ul className={`grid gap-10 ${viewMode === 'ingredients' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className="flex items-center gap-8 cursor-pointer group p-5 rounded-[2.5rem] hover:bg-stone-50 transition-all border-2 border-transparent hover:border-stone-100">
                    <div className={`w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center shrink-0 ${checkedIngredients.has(i) ? `${theme.accent} border-transparent shadow-xl` : 'border-stone-200 group-hover:border-stone-400'}`}>
                      {checkedIngredients.has(i) && <span className="text-white text-2xl font-bold">✓</span>}
                    </div>
                    {/* Sans-serif moderno XXL para ingredientes */}
                    <span className={`font-sans font-bold text-3xl md:text-4xl tracking-tight leading-tight ${checkedIngredients.has(i) ? 'text-stone-300 line-through opacity-40 italic' : 'text-stone-800'}`}>
                      {ing}
                    </span>
                  </li>
                ))}
              </ul>
              
              {viewMode === 'ingredients' && (
                <div className="mt-24 pt-16 border-t-2 border-stone-100 flex flex-col items-center">
                  <p className="text-stone-400 text-2xl font-serif italic mb-12 opacity-60">Prepare todos los elementos antes de iniciar el fuego.</p>
                  <button onClick={() => setIsKitchenMode(true)} className={`px-32 py-12 ${theme.accent} text-white rounded-full font-black text-2xl uppercase tracking-[0.5em] shadow-2xl hover:scale-105 active:scale-95 transition-all`}>ENCENDER FOGONES</button>
                </div>
              )}
            </aside>

            {viewMode === 'full' && (
              <main className="lg:col-span-7 space-y-20 animate-in slide-in-from-right-10 duration-1000">
                <div className="flex justify-between items-center border-b-4 border-stone-100 pb-10 mb-12">
                   <h3 className="text-4xl font-serif font-bold text-stone-900">Preparación</h3>
                </div>
                <div className="space-y-12">
                  {recipe.steps.map((step, i) => (
                    <div key={i} onClick={() => setActiveStep(i)} className={`p-12 rounded-[4rem] border-4 transition-all cursor-pointer relative group ${activeStep === i ? `border-stone-900 bg-stone-50/50 translate-x-6 shadow-2xl scale-[1.02]` : 'border-transparent opacity-30 hover:opacity-100'}`}>
                      <div className="flex gap-12">
                        <span className={`text-7xl font-black opacity-20 transition-all ${activeStep === i ? theme.text : 'text-stone-300'}`}>{String(i + 1).padStart(2, '0')}</span>
                        {/* Sans-serif moderno XXL para los pasos */}
                        <p className={`text-4xl md:text-5xl font-sans font-black leading-[1.3] tracking-tight ${activeStep === i ? 'text-stone-900' : 'text-stone-600'}`}>
                          {step}
                        </p>
                      </div>
                      {activeStep === i && <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-24 ${theme.accent} rounded-full animate-pulse`}></div>}
                    </div>
                  ))}
                </div>
              </main>
            )}
          </div>
        </div>

        <footer className="shrink-0 p-16 bg-white border-t border-stone-100 flex gap-12 items-center justify-between">
          <div className="flex gap-8 flex-1">
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`flex-1 py-10 rounded-full font-black text-sm tracking-[0.4em] transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95 ${voiceEnabled ? `${theme.accent} text-white` : 'bg-stone-900 text-white'}`}>
              <span className="text-4xl">{voiceEnabled ? '🎤' : '🎙️'}</span>
              {voiceEnabled ? 'ASISTENTE ACTIVO' : 'ACTIVAR VOZ'}
            </button>
            <button onClick={() => setIsKitchenMode(true)} className="px-20 py-10 bg-stone-100 rounded-full font-black text-sm uppercase tracking-[0.4em] hover:bg-stone-200 transition-all flex items-center gap-6 active:scale-95 group">
              MODO COCINA <span className="text-4xl group-hover:scale-125 transition-transform duration-500">🍳</span>
            </button>
          </div>
          <button onClick={onClose} className="px-12 py-6 text-stone-400 font-bold hover:text-stone-950 transition-colors uppercase tracking-[0.5em] text-[12px]">Finalizar Sesión</button>
        </footer>

        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
