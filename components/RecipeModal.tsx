
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
    <div className="flex items-center gap-3 bg-stone-900 px-5 py-2.5 rounded-3xl border-2 border-stone-700 shadow-2xl animate-in fade-in zoom-in">
      {status === 'listening' ? (
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
        </span>
      ) : (
        <div className="flex gap-1.5"><div className={`w-2 h-5 ${theme.accent} rounded-full animate-bounce`}></div></div>
      )}
      <span className={`text-[12px] font-black uppercase tracking-widest ${status === 'listening' ? 'text-red-500' : theme.text}`}>
        {status === 'listening' ? 'Escuchando' : 'Gourmet Habla'}
      </span>
    </div>
  );
};

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [showShareToast, setShowShareToast] = useState(false);

  const theme = recipe ? (CATEGORY_THEMES[recipe.category] || CATEGORY_THEMES.todos) : null;

  const handleShare = useCallback(() => {
    if (!recipe) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('recipeId', recipe.id.toString());
    
    navigator.clipboard.writeText(url.toString()).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }).catch(err => {
      console.error("No se pudo copiar el enlace", err);
    });
  }, [recipe]);

  const nextStep = useCallback(() => {
    if (!recipe) return;
    setActiveStep(prev => Math.min(prev + 1, recipe.steps.length - 1));
  }, [recipe]);

  const prevStep = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    if (/(siguiente|próximo|pasa|adelante|ok|listo|ya)/.test(c)) nextStep();
    else if (/(anterior|atrás|atras|vuelve|antes)/.test(c)) prevStep();
    else if (/(cerrar|salir|adiós|adios|terminar)/.test(c)) onClose();
    else if (/(ingredientes|lista|ver lista|qué necesito)/.test(c)) setViewMode('ingredients');
    else if (/(pasos|preparación|instrucciones|cocinar)/.test(c)) setViewMode('full');
    else if (/(compartir|enviar|link|enlace)/.test(c)) handleShare();
  }, [nextStep, prevStep, onClose, handleShare]);

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled && isOpen,
    onCommand: handleCommand
  });

  useEffect(() => {
    if (isOpen && recipe) {
      if (activeStep === 0 && status === 'idle') {
        speak(`${recipe.title}. Dificultad ${recipe.difficulty}. Di "Siguiente" para leer el primer paso.`);
      } else if (activeStep > 0) {
        speak(`Paso ${activeStep + 1}. ${recipe.steps[activeStep]}`);
      }
    }
  }, [activeStep, isOpen, recipe]);

  if (!isOpen || !recipe || !theme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-500 font-['Lato']">
      <div className="absolute inset-0 bg-stone-950/98 backdrop-blur-3xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl h-[95vh] bg-stone-900 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-2 border-stone-800">
        
        <header className={`shrink-0 pt-12 pb-8 px-6 sm:px-16 relative border-b-2 ${theme.border} ${theme.header} shadow-xl`}>
          <div className="absolute top-6 right-6 flex gap-2 z-10">
             <VoiceStatusIndicator status={status} theme={theme} />
             
             <button 
              onClick={handleShare}
              className="w-12 h-12 bg-stone-950 text-white rounded-2xl flex items-center justify-center border-2 border-stone-800 font-black shadow-xl hover:scale-105 transition-all relative overflow-hidden active:scale-95"
              title="Compartir Receta"
             >
                <span className={`transition-all duration-300 ${showShareToast ? 'scale-0' : 'scale-100 text-lg'}`}>🔗</span>
                {showShareToast && (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black uppercase text-amber-500 animate-in zoom-in">Copiado</span>
                )}
             </button>

             <button onClick={onClose} className="w-12 h-12 bg-stone-950 text-white rounded-2xl flex items-center justify-center border-2 border-stone-800 font-black shadow-xl hover:scale-105 transition-all">✕</button>
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-stone-950 leading-tight mb-6 tracking-tighter uppercase drop-shadow-sm">{recipe.title}</h2>
            <div className="inline-flex p-1.5 bg-black/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-lg">
              <button onClick={() => setViewMode('full')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'full' ? 'bg-stone-950 text-white shadow-xl scale-105' : 'text-stone-950 hover:bg-white/20'}`}>INSTRUCCIONES</button>
              <button onClick={() => setViewMode('ingredients')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-xl scale-105` : 'text-stone-950 hover:bg-white/20'}`}>INGREDIENTES</button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 sm:px-16 py-8 scrollbar-hide bg-stone-950">
          <div className="max-w-4xl mx-auto">
            {viewMode === 'ingredients' ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                <h3 className="text-3xl font-black text-white border-b-4 border-stone-800 pb-4 inline-block uppercase tracking-tighter">Lista de Compra</h3>
                <ul className="grid grid-cols-1 gap-y-4">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className="flex items-center gap-6 cursor-pointer group py-3">
                      <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${checkedIngredients.has(i) ? `${theme.accent} border-transparent shadow-lg scale-110` : 'border-stone-700 bg-stone-900 group-hover:border-stone-500'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-xl font-black animate-in zoom-in">✓</span>}
                      </div>
                      <span className={`font-['Lato'] font-bold text-[24px] tracking-tight leading-snug transition-all ${checkedIngredients.has(i) ? 'text-stone-700 line-through italic opacity-50' : 'text-stone-100 group-hover:translate-x-2'}`}>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-12">
                <div className="flex items-end justify-between border-b-4 border-stone-800 pb-4 mb-8">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Paso a Paso</h3>
                  <span className="text-xl font-black text-stone-600 uppercase tracking-widest">{recipe.time}</span>
                </div>
                {recipe.steps.map((step, i) => (
                  <div key={i} onClick={() => setActiveStep(i)} className={`p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer ${activeStep === i ? `border-white ${theme.bg} shadow-2xl scale-[1.02] z-10 relative` : 'border-transparent opacity-20 hover:opacity-40'}`}>
                    <div className="flex gap-6 items-start">
                      <span className={`text-4xl font-black italic select-none ${activeStep === i ? 'text-stone-950' : 'text-stone-500'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <p className={`font-['Lato'] font-bold text-[30px] leading-tight tracking-tight ${activeStep === i ? 'text-stone-950' : 'text-stone-300'}`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t-2 border-stone-800 bg-stone-900">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
            <span className="w-full text-center text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mb-1">Prueba a decir:</span>
            {['"Siguiente"', '"Atrás"', '"Lista"', '"Compartir"'].map((cmd, idx) => (
              <div key={idx} className="px-4 py-1.5 bg-stone-800 rounded-xl border border-stone-700 text-[10px] font-black text-stone-400 uppercase tracking-widest shadow-sm">
                {cmd}
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 p-6 bg-stone-950 border-t-2 border-stone-800">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-full py-5 rounded-[2rem] font-black text-[14px] tracking-[0.4em] transition-all duration-300 flex items-center justify-center gap-4 shadow-xl active:scale-95 ${voiceEnabled ? `${theme.accent} text-white hover:brightness-110` : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
            <span className="text-2xl">{voiceEnabled ? '🎙️' : '🔇'}</span>
            {voiceEnabled ? 'ASISTENTE DE VOZ ACTIVO' : 'ACTIVAR ASISTENTE'}
          </button>
        </footer>
      </div>
    </div>
  );
};
