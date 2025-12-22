
import React, { useState, useCallback, useMemo } from 'react';
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

  // Lógica para escalar ingredientes (detecta números y los multiplica)
  const scaledIngredients = useMemo(() => {
    if (!recipe) return [];
    if (portionScale === 1) return recipe.ingredients;
    return recipe.ingredients.map(ing => {
      return ing.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
        const num = parseFloat(match.replace(',', '.'));
        return (num * portionScale).toString().replace('.', ',');
      });
    });
  }, [recipe, portionScale]);

  const handleCommand = (cmd: string) => {
    if (!recipe) return;
    const c = cmd.toLowerCase();
    
    if (/siguiente|próximo|adelante|listo|hecho/.test(c)) nextStep();
    else if (/anterior|atrás|vuelve/.test(c)) prevStep();
    else if (/repite|lee|dime|que dice/.test(c)) readCurrentStep();
    else if (/cerrar|salir|finalizar/.test(c)) onClose();
    else if (/cocina|grande|xxl/.test(c)) setIsKitchenMode(!isKitchenMode);
  };

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  const nextStep = useCallback(() => {
    if (!recipe || activeStep >= recipe.steps.length - 1) {
      speak("Has terminado la receta. ¡Buen provecho!");
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
    speak(`Paso ${prev + 1}: ${recipe.steps[prev]}`);
  }, [activeStep, speak]);

  const readCurrentStep = useCallback(() => {
    if (!recipe) return;
    speak(`Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep, speak]);

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden transition-colors duration-500 ${isKitchenMode ? 'bg-stone-900 text-white' : ''}`}>
        
        {/* Cabecera */}
        {!isKitchenMode && (
          <div className="h-48 relative shrink-0">
            <img src={recipe.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white text-stone-900 transition-all">✕</button>
            <div className="absolute bottom-6 left-10">
              <h2 className="text-3xl font-serif font-bold text-stone-900">{recipe.title}</h2>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
          <div className="grid lg:grid-cols-12 gap-10">
            
            {/* Ingredientes */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif font-bold text-amber-600">Ingredientes</h3>
                <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
                  {[1, 2, 4].map(v => (
                    <button key={v} onClick={() => setPortionScale(v)} className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${portionScale === v ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-600'}`}>{v}x</button>
                  ))}
                </div>
              </div>
              <ul className="space-y-4">
                {scaledIngredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3 group cursor-pointer" onClick={() => {
                    const next = new Set(checkedIngredients);
                    next.has(i) ? next.delete(i) : next.add(i);
                    setCheckedIngredients(next);
                  }}>
                    <div className={`w-6 h-6 rounded-lg border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${checkedIngredients.has(i) ? 'bg-amber-600 border-amber-600 shadow-lg shadow-amber-600/30' : 'border-stone-200'}`}>
                      {checkedIngredients.has(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm font-medium ${checkedIngredients.has(i) ? 'line-through text-stone-400' : 'text-stone-600'}`}>{ing}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => onAddIngredients(scaledIngredients)} className="w-full py-4 bg-stone-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-all">Guardar en Despensa</button>
            </aside>

            {/* Pasos */}
            <main className="lg:col-span-8 space-y-6">
              <h3 className="text-xl font-serif font-bold text-amber-600">Preparación</h3>
              <div className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveStep(i)}
                    className={`p-6 rounded-3xl border-2 transition-all ${i === activeStep ? 'border-amber-500 bg-amber-50/20' : 'border-stone-100'}`}
                  >
                    <div className="flex gap-6 items-start">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${i === activeStep ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-400'}`}>{i + 1}</span>
                      <p className={`text-lg leading-relaxed ${i === activeStep ? (isKitchenMode ? 'text-white' : 'text-stone-800') : 'text-stone-400'}`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>

        {/* Controles de Voz */}
        <footer className="p-8 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => {
              if(!voiceEnabled) speak("Hola. Soy tu asistente. Dime: Siguiente, Anterior o Repite.");
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`flex-1 py-5 rounded-2xl font-black text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 ${voiceEnabled ? 'bg-amber-600 text-white animate-pulse' : 'bg-white text-stone-900 border border-stone-200 shadow-sm'}`}
          >
            {voiceEnabled ? '🎤 ESCUCHANDO...' : '🎙️ ACTIVAR ASISTENTE'}
          </button>
          <button 
            onClick={() => setIsKitchenMode(!isKitchenMode)}
            className="px-8 py-5 rounded-2xl font-black text-[11px] tracking-widest bg-stone-900 text-white hover:bg-black transition-all"
          >
            {isKitchenMode ? 'CERRAR MODO XXL' : '🍳 MODO COCINA XXL'}
          </button>
        </footer>
        
        <VoiceFeedback status={status} />
      </div>
    </div>
  );
};
