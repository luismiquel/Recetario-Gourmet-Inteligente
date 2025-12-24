
// Import React to provide the React namespace for types like React.MouseEvent
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data.ts';
import { Recipe } from './types.ts';
import { RecipeModal } from './components/RecipeModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { useVoiceAssistant } from './hooks/useVoiceAssistant.ts';
import { VoiceFeedback } from './components/VoiceFeedback.tsx';

const CATEGORY_COLORS: Record<string, { bg: string, text: string, border: string, accent: string, shadow: string, light: string, ring: string }> = {
  desayuno: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-100', accent: 'bg-amber-600', shadow: 'shadow-amber-900/10', light: 'bg-amber-100/40', ring: 'group-hover:ring-amber-200' },
  aperitivo: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-100', accent: 'bg-emerald-600', shadow: 'shadow-emerald-900/10', light: 'bg-emerald-100/40', ring: 'group-hover:ring-emerald-200' },
  primero: { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-100', accent: 'bg-indigo-600', shadow: 'shadow-indigo-900/10', light: 'bg-indigo-100/40', ring: 'group-hover:ring-indigo-200' },
  segundo: { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-100', accent: 'bg-rose-600', shadow: 'shadow-rose-900/10', light: 'bg-rose-100/40', ring: 'group-hover:ring-rose-200' },
  postre: { bg: 'bg-violet-50', text: 'text-violet-900', border: 'border-violet-100', accent: 'bg-violet-600', shadow: 'shadow-violet-900/10', light: 'bg-violet-100/40', ring: 'group-hover:ring-violet-200' },
  todos: { bg: 'bg-stone-50', text: 'text-stone-900', border: 'border-stone-100', accent: 'bg-stone-900', shadow: 'shadow-stone-900/10', light: 'bg-stone-100/40', ring: 'group-hover:ring-stone-200' }
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('todos');
  const [onlyQuick, setOnlyQuick] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalVoiceEnabled, setGlobalVoiceEnabled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gourmet_favorites') || '[]');
    } catch { return []; }
  });
  const [shoppingList, setShoppingList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gourmet_shopping_list') || '[]');
    } catch { return []; }
  });

  const handleGlobalCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    if (/(mostrar|pon|enseñar|ver)/.test(c)) {
      if (c.includes('desayuno')) setActiveCategory('desayuno');
      else if (c.includes('aperitivo')) setActiveCategory('aperitivo');
      else if (c.includes('primero')) setActiveCategory('primero');
      else if (c.includes('segundo')) setActiveCategory('segundo');
      else if (c.includes('postre')) setActiveCategory('postre');
      else if (c.includes('todo')) setActiveCategory('todos');
    }

    if (c.includes('ayuda') || c.includes('comandos')) setShowHelp(true);
    if (c.includes('cerrar') && showHelp) setShowHelp(false);

    if (c.includes('fácil') || c.includes('baja')) setActiveDifficulty('Baja');
    else if (c.includes('difícil') || c.includes('alta')) setActiveDifficulty('Alta');
    if (c.includes('rápido') || c.includes('corto') || c.includes('30 minutos')) setOnlyQuick(true);

    if (c.includes('limpia') || c.includes('borra') || c.includes('restablece')) {
      setSearchQuery('');
      setActiveCategory('todos');
      setActiveDifficulty('todos');
      setOnlyQuick(false);
    }
  }, [showHelp]);

  const { status, speak } = useVoiceAssistant({
    enabled: globalVoiceEnabled && !isModalOpen,
    onCommand: handleGlobalCommand
  });

  useEffect(() => {
    if (globalVoiceEnabled && !isModalOpen) {
      speak("Asistente activado.");
    }
  }, [globalVoiceEnabled, isModalOpen, speak]);

  useEffect(() => { localStorage.setItem('gourmet_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('gourmet_shopping_list', JSON.stringify(shoppingList)); }, [shoppingList]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleAddIngredients = (ingredients: string[]) => {
    setShoppingList(prev => {
      const newList = [...prev];
      ingredients.forEach(ing => { if (!newList.includes(ing)) newList.push(ing); });
      return newList;
    });
  };

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => {
      const matchesCategory = activeCategory === 'todos' || recipe.category === activeCategory;
      const matchesDifficulty = activeDifficulty === 'todos' || recipe.difficulty === activeDifficulty;
      const timeVal = parseInt(recipe.time.split(' ')[0]);
      const matchesQuick = !onlyQuick || timeVal <= 30;
      const q = searchQuery.toLowerCase();
      const matchesSearch = recipe.title.toLowerCase().includes(q) || recipe.ingredients.some(i => i.toLowerCase().includes(q));
      return matchesCategory && matchesDifficulty && matchesQuick && matchesSearch;
    });
  }, [activeCategory, activeDifficulty, onlyQuick, searchQuery]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  const theme = CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.todos;

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-1000 pb-24`}>
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
             <div className="w-7 h-7 sm:w-8 sm:h-8 bg-stone-900 rounded-lg flex items-center justify-center text-[10px] sm:text-sm text-white font-serif font-black">G</div>
             <h1 className="text-xs sm:text-sm font-serif font-black tracking-tight hidden xs:block">Gourmet</h1>
          </div>
          
          <div className="flex-1 max-w-lg relative">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-8 pr-8 py-1.5 bg-stone-100 rounded-xl border-none focus:bg-white focus:ring-1 focus:ring-stone-200 transition-all outline-none text-[13px] font-bold" 
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-30 text-[9px]">🔍</div>
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${globalVoiceEnabled ? 'bg-amber-600 text-white animate-pulse' : 'bg-stone-200 text-stone-500'}`}
            >
              <span className="text-[10px]">🎤</span>
            </button>
          </div>

          <button onClick={() => setShowHelp(true)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 text-stone-500 font-black text-[9px]">?</button>
        </nav>

        <div className="max-w-7xl mx-auto px-3 py-1.5 flex gap-1 overflow-x-auto scrollbar-hide">
          {['todos', 'desayuno', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-2.5 py-1 rounded-md text-[7px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                  isActive ? `bg-stone-900 border-transparent text-white` : `bg-white text-stone-400 border-stone-100`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 py-3">
        {/* Diseño: 2 columnas en móviles, 3 en tablets (md:), 4 en desktops grandes */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {filteredRecipes.map(recipe => {
            const catColor = CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS.todos;
            return (
              <article 
                key={recipe.id} 
                onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                className={`group relative bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm transition-all duration-300 cursor-pointer flex flex-col h-full min-h-[190px] sm:min-h-[260px]`}
              >
                <div className={`relative h-20 sm:h-36 flex items-center justify-center px-2 sm:px-3 overflow-hidden transition-colors ${catColor.bg}`}>
                  <div className="relative z-10 w-full text-center">
                    {/* Fuente: Máximo 14px para asegurar legibilidad en tarjetas compactas */}
                    <h3 className={`font-serif font-black text-[11px] xs:text-[12px] sm:text-[14px] leading-tight tracking-tight text-stone-900 px-1 line-clamp-2`}>
                      {recipe.title}
                    </h3>
                  </div>
                  
                  <button 
                    onClick={(e) => toggleFavorite(e, recipe.id)} 
                    className={`absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center backdrop-blur-md border shadow-sm z-20 ${favorites.includes(recipe.id) ? `${catColor.accent} text-white border-transparent` : 'bg-white/60 text-stone-300 border-white/50'}`}
                  >
                    <span className="text-[8px] sm:text-[9px]">{favorites.includes(recipe.id) ? '★' : '☆'}</span>
                  </button>
                </div>

                <div className="p-2 sm:p-3 flex-1 flex flex-col bg-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`px-1 py-0.5 rounded-md text-[6px] sm:text-[7px] font-black uppercase tracking-tighter ${catColor.light} ${catColor.text}`}>
                      {recipe.category}
                    </span>
                    <span className="text-[6px] sm:text-[7px] font-bold text-stone-400 uppercase">
                      ⏱ {recipe.time}
                    </span>
                  </div>
                  
                  <p className="text-stone-500 text-[8px] sm:text-[9.5px] line-clamp-2 leading-tight mb-2 font-serif italic opacity-60">
                    {recipe.description}
                  </p>
                  
                  <div className="mt-auto pt-1.5 border-t border-stone-50 flex justify-between items-center">
                     <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${i < (recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3) ? catColor.accent : 'bg-stone-100'}`}></div>
                        ))}
                     </div>
                     <div className={`px-1.5 py-0.5 rounded-md text-[6px] font-black tracking-widest uppercase ${catColor.accent} text-white`}>
                       VER <span className="hidden xs:inline">→</span>
                     </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={() => setShowHelp(false)}></div>
          <div className="relative w-full max-w-xs bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 border border-stone-100">
            <h2 className="text-lg font-serif font-black text-stone-900 mb-4">Comandos</h2>
            <div className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-lg">
                <p className="text-[7px] font-black text-stone-400 mb-1">GLOBAL</p>
                <p className="text-[11px] font-bold italic text-stone-700 leading-tight">"Muestra desayunos", "Pon postres", "Ver todos"</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg">
                <p className="text-[7px] font-black text-stone-400 mb-1">COCINA</p>
                <p className="text-[11px] font-bold italic text-stone-700 leading-tight">"Siguiente", "Atrás", "Ingredientes"</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="mt-5 w-full py-3 bg-stone-900 text-white rounded-lg font-black text-[8px] uppercase tracking-widest">OK</button>
          </div>
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onAddIngredients={handleAddIngredients}
          onUpdateTime={() => {}} 
        />
      )}
    </div>
  );
}

export default App;
