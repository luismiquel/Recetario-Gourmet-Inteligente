
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
      case 'processing': return 'Analizando';
      case 'speaking': return 'Gourmet habla';
      case 'error': return 'Micro bloqueado';
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
      speak("Has llegado al final de la receta. ¡Buen provecho!");
    }
  }, [recipe, activeStep]);

  const prevStep = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  const repeatStep = useCallback(() => {
    if (!recipe) return;
    speak(`Repito el paso ${activeStep + 1}: ${recipe.steps[activeStep]}`);
  }, [recipe, activeStep]);

  const handleCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    // COMANDOS DE NAVEGACIÓN
    if (/(siguiente|próximo|pasa|adelante|ok|listo|ya|continuar)/.test(c)) {
      nextStep();
    } else if (/(anterior|atrás|atras|vuelve|antes)/.test(c)) {
      prevStep();
    } else if (/(repite|repetir|otra vez|no he oído|dime)/.test(c)) {
      repeatStep();
    } 
    // COMANDOS DE VISTA
    else if (/(ingredientes|lista|ver ingredientes|necesito)/.test(c)) {
      setViewMode('ingredients');
      speak("Cambiando a lista de ingredientes.");
    } else if (/(pasos|preparación|instrucciones|cocinar|volver)/.test(c)) {
      setViewMode('full');
      speak("Volviendo a los pasos de preparación.");
    } 
    // COMANDOS DE SISTEMA
    else if (/(cerrar|salir|adiós|adios|terminar|finalizar)/.test(c)) {
      speak("Cerrando receta. ¡Disfruta de tu comida!");
      setTimeout(onClose, 1200);
    } else if (/(desactivar voz|silencio|callar|apagar asistente)/.test(c)) {
      speak("Entendido, desactivando asistente de voz. Pulsa el botón inferior para volver a activarme.");
      setTimeout(() => setVoiceEnabled(false), 1500);
    } else if (/(compartir|copiar|enviar|link)/.test(c)) {
      handleShare();
      speak("Enlace de receta copiado.");
    }
  }, [nextStep, prevStep, repeatStep, onClose, handleShare]);

  const { status, speak } = useVoiceAssistant({
    enabled: voiceEnabled && isOpen,
    onCommand: handleCommand
  });

  // Lectura automática de pasos al cambiar o abrir
  useEffect(() => {
    if (isOpen && recipe && voiceEnabled && viewMode === 'full') {
      const stepText = recipe.steps[activeStep];
      if (activeStep === 0) {
        speak(`Vamos a preparar ${recipe.title}. Paso 1: ${stepText}`);
      } else {
        speak(`Paso ${activeStep + 1}: ${stepText}`);
      }
    }
  }, [activeStep, isOpen, viewMode, voiceEnabled]);

  if (!isOpen || !recipe || !theme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-500 font-['Lato']">
      <div className="absolute inset-0 bg-stone-950/98 backdrop-blur-3xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl h-[95vh] bg-stone-900 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border border-stone-800">
        
        {/* Header Dinámico */}
        <header className={`shrink-0 pt-12 pb-8 px-6 sm:px-16 relative border-b-2 ${theme.border} ${theme.header} shadow-xl`}>
          <div className="absolute top-6 right-6 flex gap-3 z-10">
             <VoiceStatusIndicator status={status} theme={theme} />
             
             <button 
              onClick={handleShare}
              className="w-12 h-12 bg-stone-950 text-white rounded-2xl flex items-center justify-center border-2 border-stone-800 shadow-xl hover:scale-110 transition-all relative overflow-hidden active:scale-95"
             >
                <span className={`transition-all duration-300 ${showShareToast ? 'scale-0' : 'scale-100 text-xl'}`}>🔗</span>
                {showShareToast && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase text-amber-500 animate-in zoom-in">Listo</span>
                )}
             </button>

             <button onClick={onClose} className="w-12 h-12 bg-stone-950 text-white rounded-2xl flex items-center justify-center border-2 border-stone-800 shadow-xl hover:scale-110 transition-all">✕</button>
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-stone-950 leading-tight mb-6 tracking-tighter uppercase drop-shadow-sm line-clamp-2">{recipe.title}</h2>
            
            <div className="inline-flex p-1.5 bg-black/10 backdrop-blur-3xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-inner">
              <button 
                onClick={() => setViewMode('full')} 
                className={`px-8 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'full' ? 'bg-stone-950 text-white shadow-2xl scale-105' : 'text-stone-950 hover:bg-white/20'}`}
              >
                PREPARACIÓN
              </button>
              <button 
                onClick={() => setViewMode('ingredients')} 
                className={`px-8 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${viewMode === 'ingredients' ? `${theme.accent} text-white shadow-2xl scale-105` : 'text-stone-950 hover:bg-white/20'}`}
              >
                INGREDIENTES
              </button>
            </div>
          </div>
        </header>

        {/* Cuerpo de la Receta */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-16 py-8 sm:py-12 scrollbar-hide bg-stone-950">
          <div className="max-w-4xl mx-auto">
            {viewMode === 'ingredients' ? (
              <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-700">
                <h3 className="text-3xl sm:text-4xl font-black text-white border-b-4 border-stone-800 pb-4 inline-block uppercase tracking-tighter">Qué necesitas</h3>
                <ul className="grid grid-cols-1 gap-y-4 sm:gap-y-8">
                  {recipe.ingredients.map((ing, i) => (
                    <li 
                      key={i} 
                      onClick={() => { 
                        const n = new Set(checkedIngredients); 
                        n.has(i) ? n.delete(i) : n.add(i); 
                        setCheckedIngredients(n); 
                      }} 
                      className="flex items-center gap-6 sm:gap-10 cursor-pointer group py-3 sm:py-5 border-b border-stone-900 hover:border-stone-700 transition-colors"
                    >
                      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${checkedIngredients.has(i) ? `${theme.accent} border-transparent shadow-xl scale-110` : 'border-stone-800 bg-stone-900 group-hover:border-stone-600'}`}>
                        {checkedIngredients.has(i) && <span className="text-white text-xl sm:text-3xl font-black animate-in zoom-in">✓</span>}
                      </div>
                      <span className={`font-bold text-xl sm:text-3xl tracking-tight leading-snug transition-all ${checkedIngredients.has(i) ? 'text-stone-700 line-through italic opacity-50' : 'text-stone-100 group-hover:translate-x-3'}`}>
                        {ing}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-700 pb-20">
                <div className="flex items-end justify-between border-b-4 border-stone-800 pb-5 mb-8">
                  <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">Cómo se hace</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-stone-600 uppercase tracking-widest">TIEMPO ESTIMADO:</span>
                    <span className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest">{recipe.time}</span>
                  </div>
                </div>
                {recipe.steps.map((step, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveStep(i)} 
                    className={`p-8 sm:p-14 rounded-[2rem] sm:rounded-[3.5rem] border-2 transition-all duration-500 cursor-pointer ${activeStep === i ? `border-white ${theme.bg} shadow-2xl scale-[1.02] z-10 relative ring-8 ring-white/5` : 'border-transparent opacity-20 hover:opacity-40'}`}
                  >
                    <div className="flex gap-6 sm:gap-12 items-start">
                      <span className={`text-4xl sm:text-7xl font-black italic select-none ${activeStep === i ? 'text-stone-950' : 'text-stone-500'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className={`font-black text-2xl sm:text-4xl leading-[1.1] tracking-tight ${activeStep === i ? 'text-stone-950' : 'text-stone-300'}`}>
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer con Switch Maestro de Voz */}
        <footer className="shrink-0 p-6 sm:p-10 bg-stone-950 border-t-2 border-stone-800 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => {
              const newState = !voiceEnabled;
              setVoiceEnabled(newState);
              if (newState) speak("Asistente reactivado. ¿En qué puedo ayudarte?");
            }} 
            className={`w-full py-6 sm:py-8 rounded-[2rem] sm:rounded-[3rem] font-black text-[12px] sm:text-[16px] tracking-[0.4em] sm:tracking-[0.6em] transition-all duration-500 flex items-center justify-center gap-6 shadow-2xl active:scale-95 ${voiceEnabled ? `${theme.accent} text-white hover:brightness-110` : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
          >
            <span className="text-2xl sm:text-4xl">{voiceEnabled ? '🎙️' : '🔇'}</span>
            {voiceEnabled ? 'MODO MANOS LIBRES: ON' : 'ACTIVAR MANOS LIBRES'}
          </button>
        </footer>
      </div>
    </div>
  );
};
