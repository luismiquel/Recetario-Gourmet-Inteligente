
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

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, isOpen, onClose, onAddIngredients, onUpdateTime, currentCustomTime }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [portionScale, setPortionScale] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    if (/cerrar|salir|atrás/.test(cmd)) { if (isKitchenMode) setIsKitchenMode(false); else onClose(); }
    else if (/siguiente|avanza|hecho/.test(cmd)) nextStep();
    else if (/anterior|vuelve/.test(cmd)) prevStep();
    else if (/repite|lee/.test(cmd)) readCurrentStep();
  };

  const { status, speak: assistantSpeak } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  const nextStep = useCallback(() => {
    if (!recipe || activeStep >= recipe.steps.length - 1) return;
    const next = activeStep + 1;
    setActiveStep(next);
    assistantSpeak(`Paso ${next + 1}. ${recipe.steps[next]}`);
  }, [recipe, activeStep, assistantSpeak]);

  const prevStep = useCallback(() => {
    if (activeStep <= 0) return;
    const prev = activeStep - 1;
    setActiveStep(prev);
    assistantSpeak(`Paso ${prev + 1}. ${recipe.steps[prev]}`);
  }, [activeStep, assistantSpeak]);

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    assistantSpeak(`Paso ${activeStep + 1}. ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep, assistantSpeak]);

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div ref={modalRef} className={`relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up ${isKitchenMode ? 'bg-stone-950 text-white' : ''}`}>
        
        {/* Cabecera */}
        {!isKitchenMode && (
          <div className="h-64 relative shrink-0">
            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
            <div className="absolute bottom-8 left-10">
              <span className="px-4 py-1 bg-amber-600 text-white text-[10px] font-black uppercase rounded-full mb-3 inline-block">{recipe.category}</span>
              <h2 className="text-4xl font-serif font-bold text-stone-900">{recipe.title}</h2>
            </div>
            <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-white/30 backdrop-blur-md rounded-full hover:bg-white transition-all text-stone-900">✕</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Lateral: Ingredientes y Tips */}
            <aside className="lg:col-span-4 space-y-10">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif font-bold text-amber-600">Ingredientes</h3>
                  <div className="flex bg-stone-100 rounded-lg p-1">
                    {[1, 2, 4].map(v => (
                      <button key={v} onClick={() => setPortionScale(v)} className={`px-3 py-1 rounded text-[10px] font-bold ${portionScale === v ? 'bg-amber-600 text-white' : 'text-stone-400'}`}>{v}x</button>
                    ))}
                  </div>
                </div>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-3 group">
                      <button 
                        onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }}
                        className={`w-5 h-5 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${checkedIngredients.has(i) ? 'bg-amber-600 border-amber-600' : 'border-stone-200 hover:border-amber-400'}`}
                      >
                        {checkedIngredients.has(i) && <span className="text-white text-[10px]">✓</span>}
                      </button>
                      <span className={`text-sm ${checkedIngredients.has(i) ? 'line-through text-stone-400' : 'text-stone-600'}`}>{ing}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => onAddIngredients(recipe.ingredients)} className="w-full mt-6 py-4 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-colors">Añadir a la Compra</button>
              </section>

              {/* Secretos del Chef */}
              <section className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>💡</span> Secretos del Chef
                </h4>
                <ul className="space-y-4">
                  {recipe.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-amber-900/70 font-medium italic">"{tip}"</li>
                  ))}
                </ul>
              </section>
            </aside>

            {/* Principal: Pasos de Preparación */}
            <main className="lg:col-span-8 space-y-8">
              <h3 className="text-xl font-serif font-bold text-amber-600">Pasos a Seguir</h3>
              <div className="space-y-6">
                {recipe.steps.map((step, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveStep(i)}
                    className={`p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${i === activeStep ? 'border-amber-500 bg-amber-50/30' : 'border-stone-100 hover:border-stone-200'}`}
                  >
                    <div className="flex gap-6">
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${i === activeStep ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-400'}`}>{i + 1}</span>
                      <p className={`text-lg leading-relaxed ${i === activeStep ? 'text-stone-800' : 'text-stone-400 font-light'}`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>

        {/* Footer Controles */}
        <footer className="p-10 border-t border-stone-100 bg-stone-50 grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center justify-center gap-4 py-6 rounded-full font-black text-[11px] tracking-[0.2em] transition-all ${voiceEnabled ? 'bg-amber-600 text-white animate-pulse' : 'bg-white text-stone-900 border border-stone-200'}`}
          >
            {voiceEnabled ? '🎤 ASISTENTE ACTIVO' : '🎙️ ACTIVAR VOZ'}
          </button>
          <button 
            onClick={() => setIsKitchenMode(!isKitchenMode)}
            className="flex items-center justify-center gap-4 py-6 rounded-full font-black text-[11px] tracking-[0.2em] bg-stone-950 text-white hover:bg-stone-800 transition-colors"
          >
            🍳 MODO COCINA XXL
          </button>
        </footer>
        
        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
