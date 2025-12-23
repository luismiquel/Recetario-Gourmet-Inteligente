
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data';
import { Recipe } from './types';
import { RecipeModal } from './components/RecipeModal';
import { LandingPage } from './components/LandingPage';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { VoiceFeedback } from './components/VoiceFeedback';

const CATEGORY_COLORS: Record<string, { bg: string, text: string, border: string, accent: string }> = {
  desayuno: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', accent: 'bg-amber-500' },
  aperitivo: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', accent: 'bg-emerald-500' },
  primero: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', accent: 'bg-indigo-500' },
  segundo: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', accent: 'bg-rose-600' },
  postre: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', accent: 'bg-violet-500' },
  todos: { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', accent: 'bg-stone-900' }
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalVoiceEnabled, setGlobalVoiceEnabled] = useState(false);
  
  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem('gourmet_favorites') || '[]'));
  const [shoppingList] = useState(() => JSON.parse(localStorage.getItem('gourmet_shopping_list') || '[]'));

  const handleGlobalCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    if (/mostrar|pon|enseñar|ver/.test(c)) {
      if (c.includes('desayuno')) { setActiveCategory('desayuno'); speak("Mostrando desayunos gourmet."); }
      else if (c.includes('aperitivo')) { setActiveCategory('aperitivo'); speak("Cargando aperitivos."); }
      else if (c.includes('primero')) { setActiveCategory('primero'); speak("Mostrando primeros platos."); }
      else if (c.includes('segundo')) { setActiveCategory('segundo'); speak("Aquí están los segundos."); }
      else if (c.includes('postre')) { setActiveCategory('postre'); speak("Directo al postre."); }
      else if (c.includes('todo')) { setActiveCategory('todos'); speak("Mostrando todo el catálogo."); }
    }

    if (c.includes('aleatorio') || c.includes('sorpréndeme')) {
      const random = RECIPES[Math.floor(Math.random() * RECIPES.length)];
      setSelectedRecipe(random);
      setIsModalOpen(true);
      speak(`He seleccionado ${random.title} para ti.`);
    }

    if (c.includes('limpia') || c.includes('borra')) {
      setSearchQuery('');
      setActiveCategory('todos');
      speak("Filtros restablecidos.");
    }
  }, []);

  const { status, speak } = useVoiceAssistant({
    enabled: globalVoiceEnabled && !isModalOpen,
    onCommand: handleGlobalCommand
  });

  useEffect(() => {
    if (globalVoiceEnabled && !isModalOpen) {
      speak("Asistente activado. ¿Qué vamos a cocinar?");
    }
  }, [globalVoiceEnabled]);

  useEffect(() => {
    localStorage.setItem('gourmet_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => {
      const matchesCategory = activeCategory === 'todos' || recipe.category === activeCategory;
      const q = searchQuery.toLowerCase();
      return matchesCategory && (recipe.title.toLowerCase().includes(q) || recipe.ingredients.some(i => i.toLowerCase().includes(q)));
    });
  }, [activeCategory, searchQuery]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  const theme = CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.todos;

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-1000 pb-24 selection:bg-amber-100`}>
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-3xl border-b border-stone-200/50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 shrink-0 cursor-pointer group" onClick={() => {setActiveCategory('todos'); setSearchQuery('');}}>
             <div className="w-12 h-12 bg-stone-950 rounded-[1.25rem] flex items-center justify-center text-2xl text-white font-serif shadow-xl group-hover:rotate-6 transition-transform">G</div>
             <h1 className="text-2xl font-serif font-bold tracking-tight hidden sm:block">GourmetVoice</h1>
          </div>
          
          <div className="flex-1 max-w-2xl relative group">
            <input 
              type="text" 
              placeholder="¿Qué te apetece hoy?" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-14 pr-14 py-4 bg-stone-100/80 rounded-[2rem] border-2 border-transparent focus:bg-white focus:border-stone-200 transition-all outline-none text-base font-bold placeholder:text-stone-400 shadow-inner" 
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300">🔍</div>
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all ${globalVoiceEnabled ? 'bg-amber-600 text-white animate-pulse shadow-lg scale-110' : 'bg-stone-200 text-stone-400 hover:text-stone-600'}`}
            >
              🎤
            </button>
          </div>

          <div className="px-5 py-3 bg-stone-900 text-white rounded-2xl shadow-xl font-black text-[11px] hidden lg:block tracking-widest">
            {shoppingList.length} ITEMS
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-5 flex gap-4 overflow-x-auto scrollbar-hide no-print">
          {['todos', 'desayuno', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => {
            const catTheme = CATEGORY_COLORS[cat];
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.25em] transition-all border-2 shadow-sm ${
                  isActive 
                  ? `${catTheme.accent} border-transparent text-white scale-105 shadow-md` 
                  : `bg-white text-stone-400 border-stone-100 hover:border-stone-300`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredRecipes.map(recipe => {
            const catColor = CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS.todos;
            return (
              <article 
                key={recipe.id} 
                onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                className={`group relative bg-white rounded-[3.5rem] border-2 ${catColor.border} overflow-hidden hover:shadow-[0_50px_100px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer flex flex-col h-[500px] hover:-translate-y-3`}
              >
                <div className={`relative h-64 flex items-center justify-center p-12 overflow-hidden ${catColor.bg} transition-colors group-hover:bg-white`}>
                  <div className={`absolute inset-0 opacity-[0.03] pointer-events-none select-none ${catColor.text}`}>
                    <span className="text-[350px] font-black absolute -top-24 -left-20 leading-none">{recipe.title.charAt(0)}</span>
                  </div>
                  <h3 className={`relative z-10 font-serif font-bold text-4xl text-center leading-tight transition-transform duration-700 group-hover:scale-105 ${catColor.text}`}>
                    {recipe.title}
                  </h3>
                  <button 
                    onClick={(e) => toggleFavorite(e, recipe.id)} 
                    className={`absolute bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all border shadow-lg ${
                      favorites.includes(recipe.id) ? `${catColor.accent} text-white border-transparent` : 'bg-white/80 text-stone-300 border-white hover:text-stone-600'
                    }`}
                  >
                    {favorites.includes(recipe.id) ? '★' : '☆'}
                  </button>
                </div>

                <div className="p-12 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <span className={`px-4 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest ${catColor.bg} ${catColor.text}`}>
                      {recipe.category}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-widest text-stone-400">
                      ⏱ {recipe.time}
                    </span>
                  </div>
                  <p className="text-stone-500 text-sm line-clamp-3 leading-relaxed mb-8 italic font-serif">
                    {recipe.description}
                  </p>
                  <div className="mt-auto flex justify-between items-center pt-8 border-t border-stone-50">
                     <div className="flex gap-2">
                        {[...Array(3)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i < (recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3) 
                              ? catColor.accent 
                              : 'bg-stone-100'
                            }`}
                          ></div>
                        ))}
                     </div>
                     <span className={`text-[11px] font-black tracking-[0.3em] uppercase transition-all flex items-center gap-2 group-hover:gap-4 ${catColor.text}`}>
                       PREPARAR <span className="text-xl">→</span>
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
