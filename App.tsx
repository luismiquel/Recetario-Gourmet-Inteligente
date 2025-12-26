
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES, CATEGORY_THEMES } from './data.ts';
import { Recipe } from './types.ts';
import { RecipeModal } from './components/RecipeModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { useVoiceAssistant } from './hooks/useVoiceAssistant.ts';
import { VoiceFeedback } from './components/VoiceFeedback.tsx';
import { ShoppingList } from './components/ShoppingList.tsx';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalVoiceEnabled, setGlobalVoiceEnabled] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  // Persistence: Favorites
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gourmet_favorites') || '[]');
    } catch { return []; }
  });

  // Persistence: Shopping List
  const [shoppingList, setShoppingList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gourmet_shopping_list') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('gourmet_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('gourmet_shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  const toggleFavorite = useCallback((recipeId: number) => {
    setFavorites(prev => 
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  }, []);

  const addToShoppingList = useCallback((items: string[]) => {
    setShoppingList(prev => [...new Set([...prev, ...items])]);
  }, []);

  const removeFromShoppingList = useCallback((item: string) => {
    setShoppingList(prev => prev.filter(i => i !== item));
  }, []);

  const clearShoppingList = useCallback(() => {
    setShoppingList([]);
  }, []);

  const handleGlobalCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    if (/(mostrar|pon|ver|quiero|lista|busca|buscame|ponme)/.test(c)) {
      if (c.includes('desayuno')) setActiveCategory('desayuno');
      else if (c.includes('aperitivo')) setActiveCategory('aperitivo');
      else if (c.includes('primero')) setActiveCategory('primero');
      else if (c.includes('segundo')) setActiveCategory('segundo');
      else if (c.includes('postre')) setActiveCategory('postre');
      else if (c.includes('todo')) setActiveCategory('todos');
      else if (c.includes('favorito')) setActiveCategory('favoritos');
      
      if (c.includes('queso')) setSearchQuery('queso');
      if (c.includes('risotto')) { setActiveCategory('primero'); setSearchQuery('risotto'); }
      if (c.includes('arroz')) setSearchQuery('arroz');
    }

    if (/(abrir lista|ver compra|mi lista|carrito|compra)/.test(c)) {
      setIsShoppingListOpen(true);
      speak("Abriendo tu lista de la compra.");
    }

    if (/(quitar|borrar|limpiar|reset)/.test(c)) {
      setSearchQuery('');
      setActiveCategory('todos');
    }
  }, []);

  const { status, speak } = useVoiceAssistant({
    enabled: globalVoiceEnabled && !isModalOpen && !isShoppingListOpen,
    onCommand: handleGlobalCommand
  });

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(r => {
      const matchCat = activeCategory === 'todos' 
        ? true 
        : (activeCategory === 'favoritos' ? favorites.includes(r.id) : r.category === activeCategory);
      
      const q = searchQuery.toLowerCase();
      const matchSearch = (r.title.toLowerCase().includes(q) || r.ingredients.some(i => i.toLowerCase().includes(q)));
      
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery, favorites]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20 font-['Lato']">
      <VoiceFeedback status={(isModalOpen || isShoppingListOpen) ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 shadow-2xl">
        <nav className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => {
            setActiveCategory('todos');
            setSearchQuery('');
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
            >
              <span className="text-sm sm:text-lg">🎤</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsShoppingListOpen(true)}
              className="relative p-2 sm:p-3 bg-stone-800 rounded-xl sm:rounded-2xl border border-stone-700 hover:bg-stone-700 transition-all group"
              title="Lista de la compra"
            >
              <span className="text-lg">🛒</span>
              {shoppingList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 text-[10px] font-black flex items-center justify-center rounded-full border-2 border-stone-900">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3 overflow-hidden">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
            {['todos', 'favoritos', 'desayuno', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => {
              const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES.todos;
              return (
                <button 
                  key={cat} 
                  onClick={() => { setActiveCategory(cat); setSearchQuery(''); }} 
                  className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all shrink-0 flex items-center gap-2 sm:gap-3 border-2 ${
                    activeCategory === cat ? `${theme.header} border-white text-stone-950 shadow-lg scale-105` : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-500'
                  }`}
                >
                  {cat === 'favoritos' ? '❤️' : ''} {cat}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {filteredRecipes.map((recipe) => {
              const theme = CATEGORY_THEMES[recipe.category] || CATEGORY_THEMES.todos;
              const isFav = favorites.includes(recipe.id);
              return (
                <article 
                  key={recipe.id} 
                  className="group relative bg-stone-900 rounded-[1.2rem] sm:rounded-[2rem] border border-stone-800 overflow-hidden shadow-xl hover:shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col h-full"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                    className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isFav ? 'bg-amber-500 text-white' : 'bg-black/30 text-white/60 hover:bg-black/50'}`}
                  >
                    {isFav ? '❤️' : '♡'}
                  </button>

                  <div 
                    onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                    className={`relative h-28 sm:h-40 flex items-center justify-center px-4 transition-all duration-500 group-hover:brightness-110 cursor-pointer ${theme.header}`}
                  >
                    <h3 className="font-sans font-black text-[12px] sm:text-[14px] leading-tight tracking-tight text-stone-950 text-center line-clamp-3 uppercase drop-shadow-md">
                      {recipe.title}
                    </h3>
                  </div>

                  <div className="p-3 sm:p-5 flex-1 flex flex-col bg-gradient-to-b from-stone-900 to-stone-950">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black uppercase tracking-[0.1em] ${theme.light} ${theme.text} border ${theme.border}`}>
                        {recipe.category}
                      </span>
                      <span className="text-[7px] sm:text-[9px] font-black text-stone-300 uppercase">{recipe.time}</span>
                    </div>
                    
                    <p className="text-stone-400 text-[10px] sm:text-[13px] line-clamp-2 italic leading-snug mb-3 font-medium opacity-80">
                      {recipe.description}
                    </p>

                    <div className="mt-auto pt-3 border-t border-stone-800/50 flex justify-between items-center">
                       <button 
                         onClick={() => addToShoppingList(recipe.ingredients)}
                         className="text-[10px] font-black text-amber-500 uppercase tracking-tighter hover:text-amber-400 transition-colors"
                       >
                         + Lista
                       </button>
                       <button 
                         onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                         className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${theme.accent} text-white shadow-lg group-hover:scale-105 transition-transform`}
                       >
                         COCINAR
                       </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-6 animate-bounce">🍳</div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
              {activeCategory === 'favoritos' ? 'Aún no tienes favoritos' : 'No encontramos esa receta'}
            </h2>
            <button 
              onClick={() => { setActiveCategory('todos'); setSearchQuery(''); }}
              className="px-8 py-3 bg-white text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-colors"
            >
              Reiniciar
            </button>
          </div>
        )}
      </main>

      <ShoppingList 
        isOpen={isShoppingListOpen} 
        onClose={() => setIsShoppingListOpen(false)}
        items={shoppingList}
        onRemove={removeFromShoppingList}
        onClear={clearShoppingList}
      />

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          isFavorite={favorites.includes(selectedRecipe.id)}
          onToggleFavorite={() => toggleFavorite(selectedRecipe.id)}
          onAddIngredients={addToShoppingList}
        />
      )}
    </div>
  );
}

export default App;
