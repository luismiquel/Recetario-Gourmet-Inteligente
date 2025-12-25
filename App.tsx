
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data.ts';
import { Recipe } from './types.ts';
import { RecipeModal } from './components/RecipeModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { useVoiceAssistant } from './hooks/useVoiceAssistant.ts';
import { VoiceFeedback } from './components/VoiceFeedback.tsx';

export const CATEGORY_THEMES: Record<string, { bg: string, text: string, accent: string, light: string, border: string, header: string }> = {
  desayuno: { 
    header: 'bg-amber-400', 
    bg: 'bg-stone-900', 
    text: 'text-amber-400', 
    accent: 'bg-amber-500', 
    light: 'bg-amber-950', 
    border: 'border-amber-500/30' 
  },
  aperitivo: { 
    header: 'bg-orange-500', 
    bg: 'bg-stone-900', 
    text: 'text-orange-400', 
    accent: 'bg-orange-600', 
    light: 'bg-orange-950', 
    border: 'border-orange-500/30' 
  },
  primero: { 
    header: 'bg-emerald-500', 
    bg: 'bg-stone-900', 
    text: 'text-emerald-400', 
    accent: 'bg-emerald-600', 
    light: 'bg-emerald-950', 
    border: 'border-emerald-500/30' 
  },
  segundo: { 
    header: 'bg-rose-600', 
    bg: 'bg-stone-900', 
    text: 'text-rose-400', 
    accent: 'bg-rose-700', 
    light: 'bg-rose-950', 
    border: 'border-rose-500/30' 
  },
  postre: { 
    header: 'bg-fuchsia-600', 
    bg: 'bg-stone-900', 
    text: 'text-fuchsia-400', 
    accent: 'bg-fuchsia-700', 
    light: 'bg-fuchsia-950', 
    border: 'border-fuchsia-500/30' 
  },
  todos: { 
    header: 'bg-stone-700', 
    bg: 'bg-stone-900', 
    text: 'text-stone-300', 
    accent: 'bg-stone-100', 
    light: 'bg-stone-800', 
    border: 'border-stone-700' 
  }
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalVoiceEnabled, setGlobalVoiceEnabled] = useState(false);
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gourmet_favorites') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('recipeId');
    if (recipeId) {
      const recipe = RECIPES.find(r => r.id === parseInt(recipeId));
      if (recipe) {
        setSelectedRecipe(recipe);
        setIsModalOpen(true);
        setShowLanding(false);
      }
    }
  }, []);

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
    if (globalVoiceEnabled && !isModalOpen) {
      speak("Asistente activado. Di una categoría para filtrar tus recetas.");
    }
  }, [globalVoiceEnabled, isModalOpen, speak]);

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(r => {
      const matchCat = activeCategory === 'todos' || r.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = matchCat && (r.title.toLowerCase().includes(q) || r.ingredients.some(i => i.toLowerCase().includes(q)));
      const recipeTimeVal = parseInt(r.time.split(' ')[0]) || 0;
      const matchTime = maxTime === null || recipeTimeVal <= maxTime;
      const matchDiff = activeDifficulty === null || r.difficulty === activeDifficulty;
      return matchSearch && matchTime && matchDiff;
    });
  }, [activeCategory, searchQuery, maxTime, activeDifficulty]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20 font-['Lato']">
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 shadow-2xl">
        <nav className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => {
            window.scrollTo({top: 0, behavior: 'smooth'});
            window.history.replaceState({}, '', window.location.pathname);
          }}>
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-serif font-black text-sm sm:text-lg">G</div>
             <h1 className="text-[10px] font-black tracking-tighter hidden xs:block uppercase text-white">GourmetVoice</h1>
          </div>
          
          <div className="flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="¿Qué vas a cocinar?" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-3 pr-10 py-2 sm:py-3 bg-stone-800 rounded-xl sm:rounded-2xl border-none outline-none text-[12px] sm:text-[14px] font-black focus:ring-4 focus:ring-amber-600/30 transition-all placeholder:text-stone-500 text-white" 
            />
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shadow-sm ${globalVoiceEnabled ? 'bg-amber-500 text-white animate-pulse' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}
              title="Voz"
            >
              <span className="text-sm sm:text-lg">🎤</span>
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3 overflow-hidden">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
            {['todos', 'desayuno', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => {
              const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.todos;
              return (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all shrink-0 flex items-center gap-2 sm:gap-3 border-2 ${
                    activeCategory === cat ? `${theme.header} border-white text-stone-950 shadow-lg scale-105` : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500'
                  }`}
                >
                  {cat} <span className="opacity-40 text-[8px] sm:text-[9px] font-bold">{counts[cat]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            <div className="flex gap-1.5 items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-stone-500 px-1 sm:px-2 tracking-widest">⏳</span>
              {[
                { label: 'T', val: null },
                { label: '15', val: 15 },
                { label: '30', val: 30 },
                { label: '60', val: 60 }
              ].map(t => (
                <button
                  key={t.label}
                  onClick={() => setMaxTime(t.val)}
                  className={`w-7 h-7 sm:w-auto sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase transition-all flex items-center justify-center ${
                    maxTime === t.val ? 'bg-stone-100 text-stone-950' : 'text-stone-500 hover:bg-stone-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
              <span className="text-[8px] sm:text-[9px] font-black uppercase text-stone-500 px-1 sm:px-2 tracking-widest">🔥</span>
              {[
                { label: 'T', val: null },
                { label: 'F', val: 'Baja' },
                { label: 'M', val: 'Media' },
                { label: 'A', val: 'Alta' }
              ].map(d => (
                <button
                  key={d.label}
                  onClick={() => setActiveDifficulty(d.val)}
                  className={`w-7 h-7 sm:w-auto sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase transition-all flex items-center justify-center ${
                    activeDifficulty === d.val ? 'bg-stone-100 text-stone-950' : 'text-stone-500 hover:bg-stone-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {filteredRecipes.map((recipe) => {
              const theme = CATEGORY_THEMES[recipe.category] || CATEGORY_THEMES.todos;
              return (
                <article 
                  key={recipe.id} 
                  onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                  className="group relative bg-stone-900 rounded-[1rem] sm:rounded-[1.5rem] border border-stone-800 overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 cursor-pointer flex flex-col h-full active:scale-95"
                >
                  <div className={`relative h-24 sm:h-36 flex items-center justify-center px-2.5 sm:px-4 transition-all ${theme.header}`}>
                    <h3 className="font-sans font-black text-[11px] sm:text-[12px] md:text-[14px] leading-tight tracking-tight text-stone-950 text-center line-clamp-2 uppercase drop-shadow-sm">
                      {recipe.title}
                    </h3>
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 sm:w-8 sm:h-8 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-stone-950 border border-white/10 text-[9px] sm:text-sm">
                      {favorites.includes(recipe.id) ? '★' : '☆'}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`px-1.5 py-0.5 rounded-md sm:rounded-lg text-[7px] sm:text-[10px] font-black uppercase tracking-wider ${theme.light} ${theme.text}`}>
                        {recipe.category}
                      </span>
                      <span className="text-[7px] sm:text-[10px] font-black text-stone-500">{recipe.time}</span>
                    </div>
                    
                    <p className="text-stone-400 text-[9px] sm:text-[12px] line-clamp-2 italic leading-tight mb-2 font-bold">
                      {recipe.description}
                    </p>

                    <div className="mt-auto pt-1.5 border-t border-stone-800 flex justify-between items-center">
                       <div className="flex gap-0.5 sm:gap-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${i <= (recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3) ? theme.accent : 'bg-stone-800'}`}></div>
                          ))}
                       </div>
                       <span className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${theme.accent} text-white shadow-md`}>
                         VER
                       </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4 text-stone-700">🥘</div>
            <h2 className="text-lg font-black text-white uppercase tracking-tighter mb-1">Sin recetas</h2>
            <button 
              onClick={() => { setMaxTime(null); setActiveDifficulty(null); setActiveCategory('todos'); setSearchQuery(''); }}
              className="mt-4 px-6 py-2 bg-stone-100 text-stone-950 rounded-xl font-black text-[9px] uppercase tracking-widest"
            >
              Borrar filtros
            </button>
          </div>
        )}
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
