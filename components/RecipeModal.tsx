
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

  const renderIcon = () => {
    switch (status) {
      case 'listening':
        return (
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
          </span>
        );
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></div>
        );
      case 'speaking':
        return (
          <div className="flex items-end gap-1 h-4 pb-0.5">
            <div className={`w-1 bg-amber-500 rounded-full animate-[bounce_0.8s_infinite] h-2`}></div>
            <div className={`w-1 bg-amber-500 rounded-full animate-[bounce_1s_infinite_200ms] h-4`}></div>
            <div className={`w-1 bg-amber-500 rounded-full animate-[bounce_0.9s_infinite_400ms] h-3`}></div>
          </div>
        );
      case 'error':
        return <span className="text-red-500 font-bold text-lg">!</span>;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'listening': return 'Te escucho';
      case 'processing': return 'Procesando';
      case 'speaking': return 'Gourmet habla';
      case 'error': return 'Error micro';
      default: return '';
    }
  };

  const labelColor = status === 'listening' ? 'text-red-500' : (status === 'error' ? 'text-red-400' : theme.text);

  return (
    <div className="flex items-center gap-3 bg-stone-900 px-5 py-2.5 rounded-3xl border-2 border-stone-700 shadow-2xl animate-in fade-in zoom-in">
      {renderIcon()}
      <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${labelColor}`}>
        {getLabel()}
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
    });
  }, [recipe]);

  const nextStep = useCallback(() => {
    if (!recipe) return;
    if (activeStep < recipe.steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      speak("Has terminado todos los pasos. ¡Buen provecho!");
    }
  }, [recipe, activeStep]);

  const prevStep = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  const repeatStep = useCallback(() => {
    if (!recipe) return;
    speak(`Repitiendo paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep]);

  const handleCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    // Navegación de pasos
    if (/(siguiente|próximo|pasa|adelante|ok|listo|ya|continuar)/.test(c)) {
      nextStep();
    } else if (/(anterior|atrás|atras|vuelve|antes)/.test(c)) {
      prevStep();
    } else if (/(repite|repetir|otra vez|no he oído|no he oido|dime)/.test(c)) {
      repeatStep();
    } 
    // Control de Vistas
    else if (/(ingredientes|lista|ver lista|qué necesito|que necesito|necesito)/.test(c)) {
      setViewMode('ingredients');
      speak("Mostrando lista de ingredientes.");
    } else if (/(pasos|preparación|instrucciones|cocinar|volver)/.test(c)) {
      setViewMode('full');
      speak("Volviendo a las instrucciones de preparación.");
    } 
    // Control de Sistema
    else if (/(cerrar|salir|adiós|adios|terminar|finalizar)/.test(c)) {
      speak("Cerrando receta. ¡Hasta pronto!");
      setTimeout(onClose, 1500);
    } else if (/(desactivar voz|silencio|apagar asistente|parar asistente)/.test(c)) {
      speak("Desactivando asistente de voz. Pulsa el botón inferior para reactivarlo.");
      setTimeout(() => setVoiceEnabled(false), 2000);
    } else if (/(compartir|copiar|enviar|link|enlace)/.test(c)) {
      handleShare();
      speak("Enlace de receta copiado al portapapeles.");
    }
  }, [nextStep, prevStep, repeatStep, onClose, handleShare]);

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled && isOpen,
    onCommand: handleCommand
  });

  // Lectura automática al cambiar de paso o abrir
  useEffect(() => {
    if (isOpen && recipe && voiceEnabled) {
      if (activeStep === 0 && viewMode === 'full') {
        speak(`Iniciando ${recipe.title}. Paso 1: ${recipe.steps[0]}`);
      } else if (activeStep > 0 && viewMode === 'full') {
        speak(`Paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
      }
    }
  }, [activeStep, isOpen, viewMode, voiceEnabled]);

  if (!isOpen || !recipe || !theme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-500 font-['Lato']">
      <div className="absolute inset-0 bg-stone-950/98 backdrop-blur-3xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl h-[95vh] bg-stone-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border-2 border-stone-800">
        
        {/* Header Section */}
        <header className={`shrink-0 pt-10 pb-6 px-6 sm:px-16 relative border-b-2 ${theme.border} ${theme.header} shadow-xl`}>
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-10">
             <VoiceStatusIndicator status={status} theme={theme} />
             
             <button 
              onClick={handleShare}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-stone-950 text-white rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-stone-800 font-black shadow-xl hover:scale-105 transition-all relative overflow-hidden active:scale-95"
             >
                <span className={`transition-all duration-300 ${showShareToast ? 'scale-0' : 'scale-100 text-lg sm:text-xl'}`}>🔗</span>
                {showShareToast && (
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-black uppercase text-amber-500 animate-in zoom-in">Copiado</span>
                )}
             </button>

             <button onClick={onClose} className="w-10 h-10 sm:w-12 sm:h-12 bg-stone-950 text-white rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-stone-800 font-black shadow-xl hover:scale-105 transition-all">✕</button>
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-5xl font-black text-stone-950 leading-tight mb-4 sm:mb-6 tracking-tighter uppercase drop-shadow-sm line-clamp-2">{recipe.title}</h2>
            <div className="inline-flex p-1 bg-black/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-white/20 shadow-lg">
              <button onClick={() => setViewMode('full')} className={`px-5 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all ${viewMode === 'full' ? 'bg-stone-950 text-white shadow-xl scale-105' : 'text-stone-950 hover:bg-white/20'}`}>PASOS</button>
              <button onClick={() => setViewMode('ingredients')} className={`px-5 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-xl scale-105` : 'text-stone-950 hover:bg-white/20'}`}>LISTA</button>
            </div>
          </div>
        </header>

        {/* Recipe Content Section */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-16 py-6 sm:py-10 scrollbar-hide bg-stone-950">
          <div className="max-w-4xl mx-auto">
            {viewMode === 'ingredients' ? (
              <div className="space-y-6 sm:space-y-10 animate-in slide-in-from-bottom-8 duration-500">
                <h3 className="text-2xl sm:text-3xl font-black text-white border-b-4 border-stone-800 pb-3 inline-block uppercase tracking-tighter">Ingredientes</h3>
                <ul className="grid grid-cols-1 gap-y-3 sm:gap-y-6">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} onClick={() => { const n = new Set(checkedIngredients); n.has(i) ? n.delete(i) : n.add(i); setCheckedIngredients(n); }} className="flex items-center gap-4 sm:gap-8 cursor-pointer group py-2 sm:py-4">
                      <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${checkedIngredients.has(i) ? `${theme.accent} border-transparent shadow-lg scale-110` : 'border-stone-700 bg-stone-900 group-hover:border-stone-500'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-lg sm:text-2xl font-black animate-in zoom-in">✓</span>}
                      </div>
                      <span className={`font-['Lato'] font-bold text-[18px] sm:text-[24px] tracking-tight leading-snug transition-all ${checkedIngredients.has(i) ? 'text-stone-700 line-through italic opacity-50' : 'text-stone-100 group-hover:translate-x-2'}`}>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-12">
                <div className="flex items-end justify-between border-b-4 border-stone-800 pb-3 mb-6 sm:mb-10">
                  <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">Preparación</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-lg sm:text-2xl font-black text-stone-600 uppercase tracking-widest">{recipe.time}</span>
                  </div>
                </div>
                {recipe.steps.map((step, i) => (
                  <div key={i} onClick={() => setActiveStep(i)} className={`p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 transition-all duration-300 cursor-pointer ${activeStep === i ? `border-white ${theme.bg} shadow-2xl scale-[1.01] z-10 relative ring-4 ring-white/10` : 'border-transparent opacity-20 hover:opacity-40'}`}>
                    <div className="flex gap-4 sm:gap-8 items-start">
                      <span className={`text-3xl sm:text-5xl font-black italic select-none ${activeStep === i ? 'text-stone-950' : 'text-stone-500'}`}>{String(i + 1).padStart(2, '0')}</span>
                      <p className={`font-['Lato'] font-bold text-[22px] sm:text-[30px] leading-tight tracking-tight ${activeStep === i ? 'text-stone-950' : 'text-stone-300'}`}>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Master Voice Switcher */}
        <footer className="shrink-0 p-4 sm:p-6 bg-stone-950 border-t-2 border-stone-800">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`w-full py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-[11px] sm:text-[14px] tracking-[0.3em] sm:tracking-[0.5em] transition-all duration-300 flex items-center justify-center gap-4 shadow-xl active:scale-95 ${voiceEnabled ? `${theme.accent} text-white hover:brightness-110` : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
            <span className="text-xl sm:text-3xl">{voiceEnabled ? '🎙️' : '🔇'}</span>
            {voiceEnabled ? 'GOURMETVOICE ACTIVO' : 'ACTIVAR ASISTENTE'}
          </button>
        </footer>
      </div>
    </div>
  );
};
