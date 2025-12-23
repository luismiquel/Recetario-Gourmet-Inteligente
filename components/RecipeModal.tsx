
import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, VoiceStatus } from '../types';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

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
            <div className="w-[3px] h-3 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-[3px] h-3 bg-amber-500 rounded-full animate-bounce delay-75"></div>
            <div className="w-[3px] h-3 bg-amber-500 rounded-full animate-bounce delay-150"></div>
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

  const startTimer = useCallback((minutes: number) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  }, []);

  const nextStep = useCallback(() => {
    if (!recipe) return;
    setActiveStep(prev => {
      const next = Math.min(prev + 1, recipe.steps.length - 1);
      return next;
    });
  }, [recipe]);

  const prevStep = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  // CRÍTICO: Memoizamos handleCommand para no reiniciar el asistente de voz constantemente
  const handleCommand = useCallback((cmd: string) => {
    if (!recipe) return;
    const c = cmd.toLowerCase();
    
    if (/(siguiente|próximo|adelante|hecho|listo|vale|ok|sigue|dale|tira)/.test(c)) nextStep();
    else if (/(anterior|atrás|vuelve|antes)/.test(c)) prevStep();
    else if (/(cerrar|salir|terminar)/.test(c)) onClose();
    else if (/(ingredientes|lista)/.test(c)) setViewMode('ingredients');
    else if (/(pasos|preparación)/.test(c)) setViewMode('full');
    
    if (/(temporizador|pon|cuenta|minutos)/.test(c)) {
      const match = c.match(/(\d+)/);
      if (match) startTimer(parseInt(match[1]));
    }
  }, [recipe, nextStep, prevStep, onClose, startTimer]);

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled && isOpen,
    onCommand: handleCommand
  });

  // Al abrir el modal o cambiar de paso, narramos si es necesario
  useEffect(() => {
    if (isOpen && recipe) {
      if (activeStep === 0 && status === 'idle') {
        speak(`${recipe.title} lista. ¿Repasamos ingredientes?`);
      } else {
        speak(`Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
      }
    }
  }, [activeStep, isOpen, recipe, speak]);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timerSeconds && timerSeconds > 0) {
      interval = window.setInterval(() => setTimerSeconds(s => (s ? s - 1 : 0)), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      setTimerSeconds(null);
      speak("¡Tiempo finalizado chef!");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, speak]);

  if (!isOpen || !recipe || !theme) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddToShoppingList = () => {
    onAddIngredients(recipe.ingredients);
    setAddedToList(true);
    speak("Ingredientes añadidos.");
    setTimeout(() => setAddedToList(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[1400px] h-[90vh] bg-white rounded-[3rem] lg:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden">
        
        <header className={`shrink-0 pt-12 pb-8 px-10 relative flex flex-col items-center border-b border-stone-100 ${theme.bg}`}>
           <div className="absolute top-8 right-8 flex gap-3 z-50">
             <button onClick={onClose} className="w-12 h-12 bg-white rounded-full flex items-center justify-center transition-all hover:bg-stone-50 border border-stone-100 shadow-sm text-xl group">
               <span className="group-hover:rotate-90 transition-transform">✕</span>
             </button>
           </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-center tracking-tight leading-tight text-stone-900 mb-8 max-w-4xl">
            {recipe.title}
          </h2>

          <div className="flex bg-white/80 p-1.5 rounded-full border border-stone-200/50 backdrop-blur-xl shadow-sm">
            <button onClick={() => setViewMode('full')} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'full' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-900'}`}>Guía de Cocinado</button>
            <button onClick={() => setViewMode('ingredients')} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-lg` : 'text-stone-400 hover:text-stone-900'}`}>Ingredientes</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 md:p-16 lg:p-20 scrollbar-hide bg-white">
          <div className={`transition-all duration-700 ease-in-out ${viewMode === 'ingredients' ? 'max-w-4xl mx-auto' : 'grid lg:grid-cols-12 gap-16 lg:gap-24'}`}>
            
            <aside className={`${viewMode === 'ingredients' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-10`}>
              <div className="border-b-2 border-stone-100 pb-6 mb-8 flex justify-between items-center">
                <h3 className="text-2xl font-serif font-bold text-stone-900">Mise en Place</h3>
                <div className="flex items-center gap-3">
                  <VoiceStatusOrb status={status} accentColor={theme.accent} />
                  <button onClick={handleAddToShoppingList} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white transition-all shadow-md active:scale-95 ${addedToList ? 'bg-emerald-500' : theme.accent}`}>
                    {addedToList ? '✓ AÑADIDO' : '+ LISTA COMPRA'}
                  </button>
                </div>
              </div>
              
              <ul className={`grid gap-4 ${viewMode === 'ingredients' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl hover:bg-stone-50 transition-all">
                    <div className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 ${checkedIngredients.has(i) ? `${theme.accent} border-transparent` : 'border-stone-200 group-hover:border-stone-400'}`}>
                      {checkedIngredients.has(i) && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className={`font-sans font-bold text-lg md:text-xl tracking-tight leading-tight ${checkedIngredients.has(i) ? 'text-stone-300 line-through opacity-40 italic' : 'text-stone-800'}`}>
                      {ing}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>

            {viewMode === 'full' && (
              <main className="lg:col-span-7 space-y-8">
                <div className="flex justify-between items-center border-b-2 border-stone-100 pb-6 mb-8">
                   <h3 className="text-2xl font-serif font-bold text-stone-900">Preparación</h3>
                   {timerSeconds !== null && (
                     <div className="bg-amber-100 px-4 py-1.5 rounded-full border border-amber-200">
                       <span className="text-amber-700 font-black tabular-nums tracking-wider text-sm">{formatTime(timerSeconds)}</span>
                     </div>
                   )}
                </div>
                <div className="space-y-6">
                  {recipe.steps.map((step, i) => (
                    <div key={i} onClick={() => setActiveStep(i)} className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer relative group ${activeStep === i ? `border-stone-900 bg-stone-50 shadow-xl scale-[1.01]` : 'border-transparent opacity-30 hover:opacity-100'}`}>
                      <div className="flex gap-6">
                        <span className={`text-4xl font-black opacity-10 ${activeStep === i ? theme.text : 'text-stone-300'}`}>{String(i + 1).padStart(2, '0')}</span>
                        <p className={`text-xl md:text-2xl font-sans font-black leading-tight tracking-tight ${activeStep === i ? 'text-stone-900' : 'text-stone-600'}`}>
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </main>
            )}
          </div>
        </div>

        <footer className="shrink-0 p-8 bg-white border-t border-stone-100 flex gap-4 items-center justify-between">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`flex-1 py-6 rounded-full font-black text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 ${voiceEnabled ? `${theme.accent} text-white` : 'bg-stone-900 text-white'}`}>
            <span className="text-2xl">{voiceEnabled ? '🎤' : '🎙️'}</span>
            {voiceEnabled ? 'ASISTENTE ACTIVO' : 'ACTIVAR VOZ'}
          </button>
          <button onClick={() => setIsKitchenMode(true)} className="px-10 py-6 bg-stone-100 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-stone-200 transition-all active:scale-95">ENFOCAR 🍳</button>
        </footer>
      </div>
    </div>
  );
};
