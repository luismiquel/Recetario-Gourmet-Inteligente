
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data.ts';
import { Recipe } from './types.ts';
import { RecipeModal } from './components/RecipeModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { useVoiceAssistant } from './hooks/useVoiceAssistant.ts';
import { VoiceFeedback } from './components/VoiceFeedback.tsx';

// Temas cromáticos "Llamativos" por categoría (Colores saturados y vibrantes)
export const CATEGORY_THEMES: Record<string, { bg: string, text: string, accent: string, light: string, border: string, header: string }> = {
  desayuno: { 
    header: 'bg-amber-400', 
    bg: 'bg-amber-50', 
    text: 'text-amber-900', 
    accent: 'bg-amber-600', 
    light: 'bg-amber-200', 
    border: 'border-amber-400' 
  },
  aperitivo: { 
    header: 'bg-orange-500', 
    bg: 'bg-orange-50', 
    text: 'text-orange-900', 
    accent: 'bg-orange-600', 
    light: 'bg-orange-200', 
    border: 'border-orange-400' 
  },
  primero: { 
    header: 'bg-emerald-500', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-900', 
    accent: 'bg-emerald-600', 
    light: 'bg-emerald-200', 
    border: 'border-emerald-400' 
  },
  segundo: { 
    header: 'bg-rose-600', 
    bg: 'bg-rose-50', 
    text: 'text-rose-900', 
    accent: 'bg-rose-700', 
    light: 'bg-rose-200', 
    border: 'border-rose-400' 
  },
  postre: { 
    header: 'bg-fuchsia-600', 
    bg: 'bg-fuchsia-50', 
    text: 'text-fuchsia-900', 
    accent: 'bg-fuchsia-700', 
    light: 'bg-fuchsia-200', 
    border: 'border-fuchsia-400' 
  },
  todos: { 
    header: 'bg-stone-900', 
    bg: 'bg-stone-50', 
    text: 'text-stone-900', 
    accent: 'bg-stone-900', 
    light: 'bg-stone-200', 
    border: 'border-stone-900' 
  }
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalVoiceEnabled, setGlobalVoiceEnabled] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gourmet_favorites') || '[]');
    } catch { return []; }
  });

  const counts = useMemo(() => {
    const countsMap: Record<string, number> = { todos: RECIPES.length, desayuno: 0, aperitivo: 0, primero: 0, segundo: 0, postre: 0 };
    RECIPES.forEach(r => { if (countsMap[r.category] !== undefined) countsMap[r.category]++; });
    return countsMap;
  }, []);

  const handleGlobalCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    if (/(mostrar|pon|ver|quiero)/.test(c)) {
      if (c.includes('desayuno')) setActiveCategory('desayuno');
      else if (c.includes('aperitivo')) setActiveCategory('aperitivo');
      else if (c.includes('primero')) setActiveCategory('primero');
      else if (c.includes('segundo')) setActiveCategory('segundo');
      else if (c.includes('postre')) setActiveCategory('postre');
      else if (c.includes('todo')) setActiveCategory('todos');
    }
  }, []);

  const { status, speak } = useVoiceAssistant({
    enabled: globalVoiceEnabled && !isModalOpen,
    onCommand: handleGlobalCommand
  });

  useEffect(() => {
    if (globalVoiceEnabled && !isModalOpen) speak("Escuchando categoría.");
  }, [globalVoiceEnabled, isModalOpen, speak]);

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(r => {
      const matchCat = activeCategory === 'todos' || r.category === activeCategory;
      const q = searchQuery.toLowerCase();
      return matchCat && (r.title.toLowerCase().includes(q) || r.ingredients.some(i => i.toLowerCase().includes(q)));
    });
  }, [activeCategory, searchQuery]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className="min-h-screen bg-stone-100 pb-20 font-['Lato']">
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-white border-b-2 border-stone-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-3 h-14 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
             <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white font-serif font-black text-sm">G</div>
             <h1 className="text-[10px] font-serif font-black tracking-tight hidden xs:block uppercase">GourmetVoice</h1>
          </div>
          
          <div className="flex-1 max-w-md relative">
            <input 
              type="text" 
              placeholder="Buscar receta..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-3 pr-9 py-2 bg-stone-100 rounded-xl border-none outline-none text-[12px] font-black focus:ring-2 focus:ring-stone-300" 
            />
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${globalVoiceEnabled ? 'bg-amber-500 text-white animate-pulse' : 'bg-stone-200 text-stone-500'}`}
            >
              <span className="text-[10px]">🎤</span>
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-2 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {['todos', 'desayuno', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => {
            const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.todos;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2 border-2 ${
                  activeCategory === cat ? `${theme.header} border-transparent text-stone-950 shadow-md scale-105` : 'bg-white text-stone-400 border-stone-100'
                }`}
              >
                {cat} <span className="opacity-40 text-[8px]">{counts[cat]}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredRecipes.map((recipe) => {
            const theme = CATEGORY_THEMES[recipe.category] || CATEGORY_THEMES.todos;
            return (
              <article 
                key={recipe.id} 
                onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                className={`group relative bg-white rounded-3xl border-2 ${theme.border} overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full active:scale-95`}
              >
                <div className={`relative h-28 sm:h-40 flex items-center justify-center px-4 transition-all ${theme.header}`}>
                  <h3 className="font-sans font-black text-[12px] sm:text-[18px] leading-tight tracking-tighter text-stone-950 text-center line-clamp-3 uppercase">
                    {recipe.title}
                  </h3>
                  <div className="absolute top-2 right-2 w-7 h-7 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-stone-900 border border-white/20">
                    {favorites.includes(recipe.id) ? '★' : '☆'}
                  </div>
                </div>

                <div className="p-3 sm:p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${theme.light} ${theme.text}`}>
                      {recipe.category}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-black text-stone-400">{recipe.time}</span>
                  </div>
                  
                  <p className="text-stone-600 text-[10px] sm:text-[14px] line-clamp-2 italic opacity-80 leading-snug mb-4 font-medium">
                    {recipe.description}
                  </p>

                  <div className="mt-auto pt-3 border-t border-stone-100 flex justify-between items-center">
                     <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i <= (recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3) ? theme.accent : 'bg-stone-200'}`}></div>
                        ))}
                     </div>
                     <span className={`px-4 py-2 rounded-xl text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] ${theme.accent} text-white shadow-lg group-hover:scale-105 transition-transform`}>
                       COCINAR
                     </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onAddIngredients={() => {}}
          onUpdateTime={() => {}} 
        />
      )}
    </div>
  );
}

export default App;
