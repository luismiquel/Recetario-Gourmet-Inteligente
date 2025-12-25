
import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, VoiceStatus } from '../types.ts';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant.ts';
import { CATEGORY_THEMES } from '../App.tsx';

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onAddIngredients: (ingredients: string[]) => void;
  onUpdateTime: (recipeId: number, newTime: string) => void;
}

type ViewMode = 'full' | 'ingredients';

const VoiceStatusIndicator: React.FC<{ status: VoiceStatus, theme: any }> = ({ status, theme }) => {
  if (status === 'idle') return null;
  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-stone-200 shadow-xl animate-in fade-in zoom-in">
      {status === 'listening' ? (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </span>
      ) : (
        <div className="flex gap-1"><div className={`w-1.5 h-4 ${theme.accent} rounded-full animate-bounce`}></div></div>
      )}
      <span className={`text-[10px] font-black uppercase tracking-widest ${status === 'listening' ? 'text-red-600' : theme.text}`}>
        {status === 'listening' ? 'Escuchando' : 'Hablando'}
      </span>
    </div>
  );
};

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  const theme = recipe ? (CATEGORY_THEMES[recipe.category] || CATEGORY_THEMES.todos) : null;

  const nextStep = useCallback(() => {
    if (!recipe) return;
    setActiveStep(prev => Math.min(prev + 1, recipe.steps.length - 1));
  }, [recipe]);

  const prevStep = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    if (/(siguiente|próximo|adelante|ok|listo|ya)/.test(c)) nextStep();
    else if (/(anterior|atrás|vuelve)/.test(c)) prevStep();
    else if (/(cerrar|salir|fin|fuera)/.test(c)) onClose();
    else if (/(ingredientes|lista)/.test(c)) setViewMode('ingredients');
    else if (/(pasos|preparación)/.test(c)) setViewMode('full');
  }, [nextStep, prevStep, onClose]);

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled && isOpen,
    onCommand: handleCommand
  });

  useEffect(() => {
    if (isOpen && recipe) {
      if (activeStep === 0 && status === 'idle') {
        speak(`${recipe.title}. Categoría ${recipe.category}. Di "Siguiente" para los pasos.`);
      } else if (activeStep > 0) {
        speak(`Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
      }
    }
  }, [activeStep, isOpen, recipe]);

  if (!isOpen || !recipe || !theme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300 font-['Lato']">
      <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl h-[92vh] bg-white rounded-[3rem] sm:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border-4 border-white/10">
        
        <header className={`shrink-0 pt-12 pb-8 px-8 sm:px-16 relative border-b-8 ${theme.border} ${theme.header} shadow-inner`}>
          <div className="absolute top-6 right-8 flex gap-3 z-10">
             <VoiceStatusIndicator status={status} theme={theme} />
             <button onClick={onClose} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border-3 border-stone-900 font-black shadow-xl hover:rotate-90 transition-all active:scale-90">✕</button>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-6xl font-black text-stone-950 leading-none mb-6 tracking-tighter uppercase drop-shadow-sm">{recipe.title}</h2>
            <div className="inline-flex p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-white/50 shadow-lg">
              <button onClick={() => setViewMode('full')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'full' ? 'bg-stone-950 text-white shadow-2xl scale-105' : 'text-stone-800 hover:bg-white/30'}`}>PASOS</button>
              <button onClick={() => setViewMode('ingredients')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-2xl scale-105` : 'text-stone-800 hover:bg-white/30'}`}>LISTA</button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 sm:px-20 py-10 scrollbar-hide bg-stone-50/50">
          <div className="max-w-3xl mx-auto">
            {viewMode === 'ingredients' ? (
              <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                <h3 className="text-4xl font-black text-stone-900 border-b-4 border-stone-200 pb-4 inline-block uppercase tracking-tighter">Ingredientes</h3>
                <ul className="grid grid-cols-1 gap-y-5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className="flex items-center gap-6 cursor-pointer group py-3">
                      <div className={`w-12 h-12 rounded-[1.25rem] border-4 flex items-center justify-center shrink-0 transition-all duration-300 ${checkedIngredients.has(i) ? `${theme.accent} border-transparent shadow-2xl scale-110` : 'border-stone-300 bg-white group-hover:border-stone-400'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-2xl font-black animate-in zoom-in">✓</span>}
                      </div>
                      <span className={`font-black text-[24px] sm:text-[32px] tracking-tight leading-tight transition-all ${checkedIngredients.has(i) ? 'text-stone-300 line-through italic' : 'text-stone-800 group-hover:translate-x-2'}`}>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                <h3 className="text-4xl font-black text-stone-900 border-b-4 border-stone-200 pb-4 inline-block uppercase tracking-tighter mb-6">Preparación</h3>
                {recipe.steps.map((step, i) => (
                  <div key={i} onClick={() => setActiveStep(i)} className={`p-10 rounded-[3.5rem] border-4 transition-all duration-300 cursor-pointer ${activeStep === i ? `border-stone-950 ${theme.bg} shadow-2xl scale-[1.03] ring-4 ring-stone-950/5` : 'border-transparent opacity-20 hover:opacity-40 translate-x-4'}`}>
                    <div className="flex gap-8 items-start">
                      <span className={`text-5xl font-black italic ${activeStep === i ? theme.text : 'text-stone-200'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <p className={`text-[30px] sm:text-[40px] font-black leading-[1.05] tracking-tighter ${activeStep === i ? 'text-stone-950' : 'text-stone-600'}`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`shrink-0 px-8 py-5 border-t-4 ${theme.border} ${theme.bg} shadow-inner`}>
          <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-3">
            <span className="w-full text-center text-[10px] font-black uppercase tracking-[0.4em] text-stone-600 mb-2">Comandos Rápidos de Cocina</span>
            {['"Siguiente"', '"Atrás"', '"Lista"', '"Cerrar"'].map((cmd, idx) => (
              <div key={idx} className={`px-5 py-2 bg-white rounded-2xl border-3 ${theme.border} text-[11px] font-black text-stone-950 shadow-md uppercase tracking-widest`}>
                {cmd}
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 p-8 bg-white border-t-4 border-stone-100">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-full py-6 rounded-[2.5rem] font-black text-[14px] tracking-[0.5em] transition-all duration-300 flex items-center justify-center gap-5 shadow-2xl active:scale-95 ${voiceEnabled ? `${theme.accent} text-white hover:brightness-110` : 'bg-stone-950 text-white'}`}>
            <span className="text-3xl">{voiceEnabled ? '🎤' : '🔇'}</span>
            {voiceEnabled ? 'VOZ ACTIVA: HÁBLAME' : 'ACTIVAR MICRÓFONO'}
          </button>
        </footer>
      </div>
    </div>
  );
};
