
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
    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-3xl border-3 border-stone-900 shadow-2xl animate-in fade-in zoom-in">
      {status === 'listening' ? (
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
        </span>
      ) : (
        <div className="flex gap-1.5"><div className={`w-2 h-5 ${theme.accent} rounded-full animate-bounce`}></div></div>
      )}
      <span className={`text-[12px] font-black uppercase tracking-widest ${status === 'listening' ? 'text-red-600' : theme.text}`}>
        {status === 'listening' ? 'Te escucho' : 'Hablando'}
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
    if (/(siguiente|próximo|adelante|ok|listo|ya|pasa|paso)/.test(c)) nextStep();
    else if (/(anterior|atrás|vuelve|antes)/.test(c)) prevStep();
    else if (/(cerrar|salir|fin|fuera|adios|adiós)/.test(c)) onClose();
    else if (/(ingredientes|lista|compra)/.test(c)) setViewMode('ingredients');
    else if (/(pasos|preparación|cocinar)/.test(c)) setViewMode('full');
  }, [nextStep, prevStep, onClose]);

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled && isOpen,
    onCommand: handleCommand
  });

  useEffect(() => {
    if (isOpen && recipe) {
      if (activeStep === 0 && status === 'idle') {
        speak(`${recipe.title}. Nivel ${recipe.difficulty}. Tiempo estimado ${recipe.time}. Di "Siguiente" para empezar.`);
      } else if (activeStep > 0) {
        speak(`Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
      }
    }
  }, [activeStep, isOpen, recipe]);

  if (!isOpen || !recipe || !theme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-500 font-['Lato']">
      <div className="absolute inset-0 bg-stone-950/98 backdrop-blur-3xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl h-[95vh] bg-white rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border-8 border-white/20">
        
        {/* Cabecera con colores llamativos */}
        <header className={`shrink-0 pt-16 pb-10 px-8 sm:px-24 relative border-b-8 ${theme.border} ${theme.header} shadow-2xl`}>
          <div className="absolute top-8 right-10 flex gap-4 z-10">
             <VoiceStatusIndicator status={status} theme={theme} />
             <button onClick={onClose} className="w-14 h-14 bg-white rounded-[1.5rem] flex items-center justify-center border-4 border-stone-900 font-black shadow-2xl hover:scale-110 active:rotate-12 transition-all">✕</button>
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-7xl font-black text-stone-950 leading-[0.9] mb-8 tracking-tighter uppercase drop-shadow-md">{recipe.title}</h2>
            <div className="inline-flex p-2 bg-black/10 backdrop-blur-2xl rounded-3xl border-3 border-white/40 shadow-xl">
              <button onClick={() => setViewMode('full')} className={`px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all ${viewMode === 'full' ? 'bg-stone-950 text-white shadow-2xl scale-110' : 'text-stone-950 hover:bg-white/40'}`}>PASOS</button>
              <button onClick={() => setViewMode('ingredients')} className={`px-10 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-2xl scale-110` : 'text-stone-950 hover:bg-white/40'}`}>LISTA</button>
            </div>
          </div>
        </header>

        {/* Contenido con fuentes masivas */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-24 py-12 scrollbar-hide bg-stone-50">
          <div className="max-w-4xl mx-auto">
            {viewMode === 'ingredients' ? (
              <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-700">
                <h3 className="text-5xl font-black text-stone-950 border-b-8 border-stone-200 pb-6 inline-block uppercase tracking-tighter">Qué necesitas</h3>
                <ul className="grid grid-cols-1 gap-y-6">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className="flex items-center gap-8 cursor-pointer group py-4">
                      <div className={`w-14 h-14 rounded-[1.75rem] border-5 flex items-center justify-center shrink-0 transition-all duration-300 ${checkedIngredients.has(i) ? `${theme.accent} border-transparent shadow-2xl scale-125` : 'border-stone-400 bg-white group-hover:border-stone-900 group-hover:scale-105'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-3xl font-black animate-in zoom-in">✓</span>}
                      </div>
                      <span className={`font-black text-[24px] sm:text-[32px] tracking-tight leading-none transition-all ${checkedIngredients.has(i) ? 'text-stone-300 line-through italic' : 'text-stone-900 group-hover:translate-x-4'}`}>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-700">
                <div className="flex items-end justify-between border-b-8 border-stone-200 pb-6 mb-12">
                  <h3 className="text-5xl font-black text-stone-950 uppercase tracking-tighter">Preparación</h3>
                  <span className="text-2xl font-black text-stone-400 uppercase tracking-widest">{recipe.time}</span>
                </div>
                {recipe.steps.map((step, i) => (
                  <div key={i} onClick={() => setActiveStep(i)} className={`p-12 rounded-[4.5rem] border-6 transition-all duration-500 cursor-pointer ${activeStep === i ? `border-stone-950 ${theme.bg} shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] scale-[1.05] z-10 relative` : 'border-transparent opacity-15 hover:opacity-40 translate-x-8'}`}>
                    <div className="flex gap-10 items-start">
                      <span className={`text-6xl font-black italic select-none ${activeStep === i ? theme.text : 'text-stone-300'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <p className={`text-[30px] sm:text-[40px] font-black leading-[1.0] tracking-tighter ${activeStep === i ? 'text-stone-950' : 'text-stone-700'}`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Ayuda Vocal */}
        <div className={`shrink-0 px-8 py-6 border-t-8 ${theme.border} ${theme.bg} shadow-inner`}>
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4">
            <span className="w-full text-center text-[12px] font-black uppercase tracking-[0.5em] text-stone-600 mb-2">Comandos Rápidos de Voz</span>
            {['"Siguiente"', '"Atrás"', '"Lista"', '"Pasos"', '"Cerrar"'].map((cmd, idx) => (
              <div key={idx} className={`px-6 py-2.5 bg-white rounded-2xl border-4 ${theme.border} text-[12px] font-black text-stone-950 shadow-lg uppercase tracking-widest`}>
                {cmd}
              </div>
            ))}
          </div>
        </div>

        {/* Botón Maestro de Voz */}
        <footer className="shrink-0 p-10 bg-white border-t-8 border-stone-100">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-full py-7 rounded-[3rem] font-black text-[16px] tracking-[0.6em] transition-all duration-500 flex items-center justify-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] active:scale-95 ${voiceEnabled ? `${theme.accent} text-white hover:brightness-110` : 'bg-stone-950 text-white hover:bg-stone-800'}`}>
            <span className="text-4xl">{voiceEnabled ? '🎤' : '🔇'}</span>
            {voiceEnabled ? 'ASISTENTE ACTIVO' : 'ACTIVAR MICRÓFONO'}
          </button>
        </footer>
      </div>
    </div>
  );
};
