
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data.ts';
import { Recipe } from './types.ts';
import { RecipeModal } from './components/RecipeModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { useVoiceAssistant } from './hooks/useVoiceAssistant.ts';
import { VoiceFeedback } from './components/VoiceFeedback.tsx';

// Temas cromáticos ultra-vibrantes por categoría
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
    text: 'text-rose-950', 
    accent: 'bg-rose-700', 
    light: 'bg-rose-200', 
    border: 'border-rose-400' 
  },
  postre: { 
    header: 'bg-fuchsia-600', 
    bg: 'bg-fuchsia-50', 
    text: 'text-fuchsia-950', 
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
    if (/(mostrar|pon|ver|quiero|lista)/.test(c)) {
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
    if (globalVoiceEnabled && !isModalOpen) speak("Escuchando categoría de cocina.");
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
    <div className="min-h-screen bg-stone-200 pb-20 font-['Lato']">
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-white border-b-4 border-stone-300 shadow-md">
        <nav className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
             <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white font-serif font-black text-lg">G</div>
             <h1 className="text-xs font-black tracking-tighter hidden xs:block uppercase text-stone-900">GourmetVoice</h1>
          </div>
          
          <div className="flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="¿Qué vas a cocinar hoy?" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-4 pr-12 py-3 bg-stone-100 rounded-2xl border-none outline-none text-[14px] font-black focus:ring-4 focus:ring-stone-400 transition-all placeholder:text-stone-400" 
            />
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all shadow-sm ${globalVoiceEnabled ? 'bg-amber-500 text-white animate-pulse' : 'bg-stone-300 text-stone-500'}`}
              title="Activar Voz"
            >
              <span className="text-lg">🎤</span>
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {['todos', 'desayuno', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => {
            const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.todos;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 flex items-center gap-3 border-3 ${
                  activeCategory === cat ? `${theme.header} border-stone-900 text-stone-950 shadow-xl scale-105` : 'bg-white text-stone-400 border-stone-100 hover:border-stone-300'
                }`}
              >
                {cat} <span className="opacity-50 text-[9px] font-bold">{counts[cat]}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
          {filteredRecipes.map((recipe) => {
            const theme = CATEGORY_THEMES[recipe.category] || CATEGORY_THEMES.todos;
            return (
              <article 
                key={recipe.id} 
                onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                className={`group relative bg-white rounded-[2rem] border-4 ${theme.border} overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full active:scale-95`}
              >
                <div className={`relative h-32 sm:h-48 flex items-center justify-center px-4 transition-all ${theme.header}`}>
                  <h3 className="font-sans font-black text-[14px] sm:text-[20px] leading-tight tracking-tighter text-stone-950 text-center line-clamp-3 uppercase drop-shadow-sm">
                    {recipe.title}
                  </h3>
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-stone-950 border-2 border-white/30 shadow-sm">
                    {favorites.includes(recipe.id) ? '★' : '☆'}
                  </div>
                </div>

                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-3 py-1 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest ${theme.light} ${theme.text} border border-black/5`}>
                      {recipe.category}
                    </span>
                    <span className="text-[9px] sm:text-[11px] font-black text-stone-500">{recipe.time}</span>
                  </div>
                  
                  <p className="text-stone-600 text-[11px] sm:text-[15px] line-clamp-3 italic opacity-90 leading-tight mb-5 font-bold font-['Lato']">
                    {recipe.description}
                  </p>

                  <div className="mt-auto pt-4 border-t-2 border-stone-100 flex justify-between items-center">
                     <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= (recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3) ? theme.accent : 'bg-stone-200'}`}></div>
                        ))}
                     </div>
                     <span className={`px-5 py-2.5 rounded-2xl text-[10px] sm:text-[13px] font-black uppercase tracking-[0.2em] ${theme.accent} text-white shadow-xl group-hover:scale-110 transition-transform`}>
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
