
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RECIPES } from './data';
import { Recipe } from './types';
import { RecipeModal } from './components/RecipeModal';
import { LandingPage } from './components/LandingPage';

interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
}

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado de Alto Contraste
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('gourmet_high_contrast') === 'true';
  });

  const shoppingTriggerRef = useRef<HTMLButtonElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  const [progressData, setProgressData] = useState<Record<number, number>>({});

  const [customTimes, setCustomTimes] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('gourmet_custom_times');
    return saved ? JSON.parse(saved) : {};
  });

  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('gourmet_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('gourmet_shopping_list');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('gourmet_high_contrast', String(isHighContrast));
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  useEffect(() => {
    const progress: Record<number, number> = {};
    RECIPES.forEach(r => {
      const saved = localStorage.getItem(`recipe_progress_${r.id}`);
      if (saved) progress[r.id] = parseInt(saved);
    });
    setProgressData(progress);
  }, [isModalOpen]);

  useEffect(() => {
    localStorage.setItem('gourmet_shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('gourmet_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('gourmet_custom_times', JSON.stringify(customTimes));
  }, [customTimes]);

  useEffect(() => {
    if (isShoppingListOpen) {
      lastActiveElement.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        const firstBtn = document.querySelector('[aria-label="Cerrar despensa"]') as HTMLElement;
        firstBtn?.focus();
      }, 100);
    } else if (lastActiveElement.current) {
      lastActiveElement.current.focus();
    }
  }, [isShoppingListOpen]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const handleUpdateTime = (recipeId: number, newTime: string) => {
    setCustomTimes(prev => ({ ...prev, [recipeId]: newTime }));
  };

  const addToShoppingList = (ingredients: string[]) => {
    setShoppingList(prev => {
      const newList = [...prev];
      ingredients.forEach(item => {
        if (!newList.some(existing => existing.name.toLowerCase() === item.toLowerCase())) {
          newList.push({ id: crypto.randomUUID(), name: item, completed: false });
        }
      });
      return newList;
    });
    setIsShoppingListOpen(true);
  };

  const toggleCartItem = (id: string) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeCartItem = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => {
      const matchesCategory = activeCategory === 'todos' || recipe.category === activeCategory;
      const matchesDifficulty = activeDifficulty === 'todas' || recipe.difficulty === activeDifficulty;
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFavorite = !showFavoritesOnly || favorites.includes(recipe.id);
      return matchesCategory && matchesDifficulty && matchesSearch && matchesFavorite;
    });
  }, [activeCategory, activeDifficulty, searchQuery, showFavoritesOnly, favorites]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className={`min-h-screen bg-stone-50 pb-20 animate-fade-in selection:bg-amber-200 ${isHighContrast ? 'high-contrast' : ''}`}>
      {/* Shopping List Drawer */}
      {isShoppingListOpen && (
        <div 
          className="fixed inset-0 z-[60] overflow-hidden" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="shopping-title"
        >
          <div 
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsShoppingListOpen(false)}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md transform transition-transform animate-slide-left bg-white shadow-2xl flex flex-col border-l border-stone-200">
              <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                <h2 id="shopping-title" className="text-2xl font-serif font-bold text-stone-900">Tu Despensa</h2>
                <button 
                  onClick={() => setIsShoppingListOpen(false)} 
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors focus:ring-2 focus:ring-amber-500 outline-none" 
                  aria-label="Cerrar despensa"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                {shoppingList.length === 0 ? (
                  <div className="text-center py-20 text-stone-400 italic" role="status">Lista vacía.</div>
                ) : (
                  <ul className="space-y-4" aria-label="Lista de ingredientes">
                    {shoppingList.map(item => (
                      <li key={item.id} className="flex items-center justify-between group bg-stone-50 p-5 rounded-2xl border border-transparent hover:border-amber-200 hover:bg-white transition-all shadow-sm">
                        <button 
                          className="flex items-center gap-4 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl p-1" 
                          onClick={() => toggleCartItem(item.id)}
                          aria-pressed={item.completed}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${item.completed ? 'bg-amber-600 border-amber-600' : 'border-stone-300'}`} aria-hidden="true">
                            {item.completed && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>}
                          </div>
                          <span className={`text-sm ${item.completed ? 'text-stone-400 line-through' : 'text-stone-700 font-medium'}`}>{item.name}</span>
                        </button>
                        <button 
                          onClick={() => removeCartItem(item.id)} 
                          className="p-2 opacity-100 md:opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all focus:opacity-100 focus:ring-2 focus:ring-red-500 rounded-lg"
                          aria-label={`Eliminar ${item.name} de la lista`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center" aria-label="Navegación principal">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">👨‍🍳</span>
            <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight">Gourmet<span className="text-amber-600">Voice</span></h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <button 
              onClick={() => setIsHighContrast(!isHighContrast)} 
              className={`p-2.5 rounded-full transition-colors focus:ring-2 focus:ring-amber-500 outline-none ${isHighContrast ? 'bg-stone-900 text-white border-2 border-white' : 'text-stone-400 hover:bg-stone-100'}`}
              aria-pressed={isHighContrast}
              title={isHighContrast ? "Desactivar alto contraste" : "Activar alto contraste"}
            >
              <span className="sr-only">Alto contraste</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            </button>
            <div className="relative hidden lg:block">
              <label htmlFor="search-input" className="sr-only">Buscar recetas</label>
              <input 
                id="search-input"
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10 pr-4 py-2 border border-stone-200 rounded-full bg-stone-50 focus:ring-2 focus:ring-amber-500 w-48 xl:w-64 text-sm focus:outline-none" 
              />
              <svg className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button 
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} 
              className={`p-2.5 rounded-full transition-colors focus:ring-2 focus:ring-amber-500 outline-none ${showFavoritesOnly ? 'bg-amber-100 text-amber-600' : 'text-stone-400 hover:bg-stone-100'}`}
              aria-pressed={showFavoritesOnly}
              title={showFavoritesOnly ? "Ver todas" : "Ver favoritas"}
            >
              <span className="sr-only">Filtrar por favoritos</span>
              <svg className="w-5 h-5" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
            </button>
            <button 
              ref={shoppingTriggerRef}
              onClick={() => setIsShoppingListOpen(true)} 
              className="relative p-2.5 rounded-full text-stone-600 hover:bg-stone-100 transition-all focus:ring-2 focus:ring-amber-500 outline-none"
              aria-expanded={isShoppingListOpen}
              aria-haspopup="dialog"
            >
              <span className="sr-only">Ver lista de la compra</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {shoppingList.length > 0 && <span className="absolute top-0 right-0 bg-amber-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">{shoppingList.length}</span>}
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="main-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredRecipes.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }} 
              className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border border-stone-200 flex flex-col transform hover:-translate-y-2 focus-within:ring-4 focus-within:ring-amber-500/20"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={recipe.image} alt="" className="w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700" />
                {progressData[recipe.id] !== undefined && (
                   <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white text-stone-900 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Continuar Paso {progressData[recipe.id] + 1}</span>
                   </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase rounded-full">
                    {recipe.difficulty}
                  </span>
                </div>
                <button 
                  onClick={(e) => toggleFavorite(e, recipe.id)} 
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110 focus:ring-2 focus:ring-amber-500 outline-none"
                  aria-label={favorites.includes(recipe.id) ? `Quitar ${recipe.title} de favoritos` : `Añadir ${recipe.title} a favoritos`}
                  aria-pressed={favorites.includes(recipe.id)}
                >
                  <span className="text-xl" aria-hidden="true">{favorites.includes(recipe.id) ? '⭐' : '☆'}</span>
                </button>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-2 block">{recipe.category}</span>
                <h3 className="text-lg font-serif font-bold text-stone-800 mb-2 leading-tight group-hover:text-amber-600 transition-colors">
                  <button className="text-left focus:outline-none">{recipe.title}</button>
                </h3>
                <div className="mt-auto flex items-center justify-between text-[10px] font-black text-stone-500 border-t border-stone-100 pt-4">
                  <div className="flex items-center gap-1.5" aria-label={`Tiempo de preparación: ${customTimes[recipe.id] || recipe.time}`}>
                    <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {customTimes[recipe.id] || recipe.time}
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-300 group-hover:text-amber-600 transition-colors" aria-hidden="true">
                    Cocinar <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <RecipeModal 
        recipe={selectedRecipe} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddIngredients={addToShoppingList} 
        onUpdateTime={handleUpdateTime} 
        currentCustomTime={selectedRecipe ? customTimes[selectedRecipe.id] : undefined} 
      />
    </div>
  );
}

export default App;
