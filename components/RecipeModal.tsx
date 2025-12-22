
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
  
  // Estado del temporizador
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = window.setInterval(() => setTimerSeconds(s => (s !== null ? s - 1 : 0)), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.play().catch(() => {});
      alert("¡El temporizador ha terminado!");
      setTimerSeconds(null);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

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
    
    // Comandos de navegación
    if (/siguiente|próximo|adelante|hecho|ya está/.test(c)) nextStep();
    else if (/anterior|atrás|vuelve/.test(c)) prevStep();
    else if (/repite|qué dice|no he oído/.test(c)) readCurrentStep();
    else if (/imprimir|papel/.test(c)) window.print();
    
    // Comando de temporizador: "pon un temporizador de X minutos"
    const timerMatch = c.match(/temporizador de (\d+) minutos/);
    if (timerMatch) {
      const mins = parseInt(timerMatch[1]);
      setTimerSeconds(mins * 60);
      setIsTimerRunning(true);
      speak(`Vale, pongo un temporizador de ${mins} minutos.`);
    }

    if (/cerrar|salir|adiós/.test(c)) onClose();
  };

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled,
    onCommand: handleCommand
  });

  const nextStep = useCallback(() => {
    if (!recipe || activeStep >= recipe.steps.length - 1) {
      speak("Has terminado todos los pasos. ¡A disfrutar del plato!");
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

  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-8 overflow-hidden" role="dialog">
      <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-sm no-print" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-6xl h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden recipe-content ${isKitchenMode ? 'bg-stone-900 text-white' : ''}`}>
        
        {/* Cabecera para Impresión */}
        <div className="hidden print-only recipe-header">
           <h1 className="recipe-title font-serif font-bold text-4xl">{recipe.title}</h1>
           <p className="text-stone-500 mt-2">Categoría: {recipe.category.toUpperCase()} | Tiempo: {recipe.time} | Dificultad: {recipe.difficulty}</p>
        </div>

        {/* Cabecera UI */}
        {!isKitchenMode && (
          <div className="h-56 relative shrink-0 no-print">
            <img src={recipe.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
            <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-white/50 backdrop-blur-md rounded-full hover:bg-white text-stone-900 transition-all z-10">✕</button>
            <div className="absolute bottom-6 left-10">
              <h2 className="text-4xl font-serif font-bold text-stone-900">{recipe.title}</h2>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-12 scrollbar-hide">
          
          {/* Fila superior: Timer y Porciones */}
          <div className="flex flex-wrap items-center justify-between gap-6 no-print">
            <div className="flex items-center gap-4 bg-stone-100 p-2 rounded-2xl">
              <span className="text-xs font-black uppercase tracking-widest px-4 text-stone-400">Porciones</span>
              <div className="flex gap-1">
                {[1, 2, 4, 6].map(v => (
                  <button key={v} onClick={() => setPortionScale(v)} className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${portionScale === v ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-white text-stone-400 hover:text-stone-900'}`}>{v}x</button>
                ))}
              </div>
            </div>

            {timerSeconds !== null && (
              <div className="flex items-center gap-4 bg-amber-600 text-white px-6 py-3 rounded-2xl animate-pulse shadow-xl">
                <span className="text-xl font-black">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="bg-white/20 p-2 rounded-lg hover:bg-white/40">{isTimerRunning ? '⏸' : '▶'}</button>
                <button onClick={() => setTimerSeconds(null)} className="text-white/60 hover:text-white">✕</button>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Ingredientes */}
            <aside className="lg:col-span-4 space-y-8 ingredients-grid">
              <h3 className="text-2xl font-serif font-bold text-amber-600 flex items-center gap-3">
                <span>🥕</span> Ingredientes
              </h3>
              <ul className="space-y-4 ingredients-list">
                {scaledIngredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-4 group cursor-pointer no-print" onClick={() => {
                    const n = new Set(checkedIngredients);
                    n.has(i) ? n.delete(i) : n.add(i);
                    setCheckedIngredients(n);
                  }}>
                    <div className={`w-6 h-6 rounded-lg border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${checkedIngredients.has(i) ? 'bg-amber-600 border-amber-600' : 'border-stone-200'}`}>
                      {checkedIngredients.has(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-base leading-tight ${checkedIngredients.has(i) ? 'line-through text-stone-300' : 'text-stone-600'}`}>{ing}</span>
                  </li>
                ))}
                {/* Lista limpia para impresión */}
                {scaledIngredients.map((ing, i) => (
                  <li key={`p-${i}`} className="hidden print-only mb-2">• {ing}</li>
                ))}
              </ul>

              {/* Tips del Chef */}
              <div className="chef-tips p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4">Secretos del Chef</h4>
                <ul className="space-y-4">
                  {recipe.tips.map((tip, i) => (
                    <li key={i} className="text-sm italic text-amber-900/70 leading-relaxed">"{tip}"</li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Pasos */}
            <main className="lg:col-span-8 space-y-8 steps-container">
              <h3 className="text-2xl font-serif font-bold text-amber-600 flex items-center gap-3">
                <span>🍳</span> Preparación
              </h3>
              <div className="space-y-6">
                {recipe.steps.map((step, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveStep(i)}
                    className={`step-card p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${i === activeStep ? 'border-amber-500 bg-amber-50/20 shadow-xl' : 'border-stone-100 hover:border-stone-200'}`}
                  >
                    <div className="flex gap-6 items-start">
                      <span className={`step-num w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 text-xl ${i === activeStep ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-300'}`}>{i + 1}</span>
                      <p className={`text-xl leading-relaxed ${i === activeStep ? (isKitchenMode ? 'text-white' : 'text-stone-800') : 'text-stone-300'}`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>

        {/* Footer Controles */}
        <footer className="p-8 border-t border-stone-100 bg-stone-50/50 flex flex-wrap gap-4 no-print">
          <button 
            onClick={() => {
              if(!voiceEnabled) speak("Hola cocinero. Puedes decir: Siguiente, Atrás o Pon un temporizador.");
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`flex-1 min-w-[200px] py-6 rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-3 ${voiceEnabled ? 'bg-amber-600 text-white animate-pulse' : 'bg-white text-stone-900 border border-stone-200 shadow-sm hover:shadow-md'}`}
          >
            {voiceEnabled ? '🎤 ESCUCHANDO COMANDOS' : '🎙️ ACTIVAR ASISTENTE VOZ'}
          </button>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={() => window.print()} className="flex-1 sm:flex-none px-8 py-6 rounded-2xl font-black text-xs tracking-widest bg-white border border-stone-200 text-stone-900 hover:bg-stone-100 transition-all">🖨️ IMPRIMIR</button>
            <button onClick={() => setIsKitchenMode(!isKitchenMode)} className="flex-1 sm:flex-none px-8 py-6 rounded-2xl font-black text-xs tracking-widest bg-stone-900 text-white hover:bg-black transition-all">{isKitchenMode ? 'SALIR MODO XXL' : '🍳 MODO COCINA'}</button>
          </div>
        </footer>
        
        <div className="voice-feedback-ui no-print">
           <VoiceFeedback status={status} />
        </div>
      </div>
    </div>
  );
};
