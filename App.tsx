
import React, { useState, useMemo, useEffect } from 'react';
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
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  
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
    localStorage.setItem('gourmet_shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('gourmet_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
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

  const handleClearList = () => {
    setShoppingList([]);
    setIsConfirmingClear(false);
  };

  const categories = ['todos', 'aperitivo', 'primero', 'segundo', 'postre'];
  const difficulties = ['todas', 'Baja', 'Media', 'Alta'];

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => {
      const matchesCategory = activeCategory === 'todos' || recipe.category === activeCategory;
      const matchesDifficulty = activeDifficulty === 'todas' || recipe.difficulty === activeDifficulty;
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFavorite = !showFavoritesOnly || favorites.includes(recipe.id);
      return matchesCategory && matchesDifficulty && matchesSearch && matchesFavorite;
    });
  }, [activeCategory, activeDifficulty, searchQuery, showFavoritesOnly, favorites]);

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20 animate-fade-in">
      {/* Shopping List Drawer */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={() => { setIsShoppingListOpen(false); setIsConfirmingClear(false); }}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md transform transition-transform animate-slide-left bg-white shadow-2xl flex flex-col">
              <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-stone-900">Tu Despensa</h2>
                <button onClick={() => { setIsShoppingListOpen(false); setIsConfirmingClear(false); }} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                {shoppingList.length === 0 ? (
                  <div className="text-center py-20">
                    <span className="text-4xl block mb-4">🛒</span>
                    <p className="text-stone-400 font-light italic">Tu lista está vacía.</p>
                  </div>
                ) : (
                  shoppingList.map(item => (
                    <div key={item.id} className="flex items-center justify-between group bg-stone-50 p-5 rounded-2xl border border-transparent hover:border-amber-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleCartItem(item.id)}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${item.completed ? 'bg-amber-600 border-amber-600 scale-90' : 'border-stone-300'}`}>
                          {item.completed && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path></svg>}
                        </div>
                        <span className={`text-sm transition-all ${item.completed ? 'text-stone-400 line-through' : 'text-stone-700 font-medium'}`}>{item.name}</span>
                      </div>
                      <button onClick={() => removeCartItem(item.id)} className="p-2 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-8 bg-stone-50 border-t border-stone-200">
                {!isConfirmingClear ? (
                  <button 
                    disabled={shoppingList.length === 0}
                    onClick={() => setIsConfirmingClear(true)} 
                    className="w-full py-5 text-xs font-black uppercase tracking-[0.2em] text-stone-500 hover:text-red-600 disabled:opacity-30 transition-all flex items-center justify-center gap-3 bg-white rounded-2xl border border-stone-200 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Limpiar Despensa
                  </button>
                ) : (
                  <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4 animate-fade-in-up">
                    <p className="text-center text-[10px] font-black text-red-800 uppercase tracking-widest leading-relaxed">¿Deseas vaciar todos los ingredientes guardados?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={handleClearList} 
                        className="py-4 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                      >
                        Confirmar
                      </button>
                      <button 
                        onClick={() => setIsConfirmingClear(false)} 
                        className="py-4 bg-white border border-red-200 text-red-800 text-[9px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all"
                      >
                        Atrás
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👨‍🍳</span>
              <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight">
                Gourmet<span className="text-amber-600">Voice</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 md:space-x-8">
              <div className="hidden lg:flex relative">
                <input 
                  type="text" 
                  placeholder="Buscar receta..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-stone-200 rounded-full bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-500 w-64 text-sm"
                />
                <svg className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} 
                  className={`p-2.5 rounded-full transition-all ${showFavoritesOnly ? 'bg-amber-100 text-amber-600 shadow-inner' : 'text-stone-400 hover:bg-stone-100'}`}
                  title="Favoritos"
                >
                  <svg className="w-5 h-5" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                </button>

                <button onClick={() => setIsShoppingListOpen(true)} className="relative p-2.5 rounded-full text-stone-600 hover:bg-stone-100 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  {shoppingList.length > 0 && (
                    <span className="absolute top-0 right-0 bg-amber-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                      {shoppingList.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 overflow-x-auto pb-4 pt-1 scrollbar-hide">
             <div className="flex gap-2">
               {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={`
                      px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
                      ${activeCategory === cat 
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                        : 'bg-white text-stone-400 border-stone-200 hover:border-amber-500 hover:text-amber-600'}
                   `}
                 >
                   {cat}
                 </button>
               ))}
             </div>
             <div className="h-6 w-px bg-stone-200 hidden md:block"></div>
             <div className="flex gap-2">
               {difficulties.map(diff => (
                 <button
                   key={diff}
                   onClick={() => setActiveDifficulty(diff)}
                   className={`
                      px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
                      ${activeDifficulty === diff 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                        : 'bg-stone-100 text-stone-400 border-transparent hover:border-amber-500 hover:text-amber-600'}
                   `}
                 >
                   {diff}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-40 animate-fade-in">
            <h3 className="text-3xl font-serif text-stone-300 mb-4 italic">No se encontraron delicias</h3>
            <p className="text-stone-400 font-light">Prueba ajustando los filtros de dificultad o categoría.</p>
            <button onClick={() => {setSearchQuery(''); setActiveCategory('todos'); setActiveDifficulty('todas'); setShowFavoritesOnly(false);}} className="mt-8 px-8 py-3 bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all">Restablecer todo</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRecipes.map(recipe => (
              <article 
                key={recipe.id} 
                onClick={() => openRecipe(recipe)}
                className="group bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border border-stone-200 flex flex-col h-full transform hover:-translate-y-2"
              >
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.title} 
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full border border-white/10">
                      {recipe.difficulty}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => toggleFavorite(e, recipe.id)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-all transform hover:scale-110 active:scale-90"
                  >
                    <span className="text-xl leading-none">{favorites.includes(recipe.id) ? '⭐' : '☆'}</span>
                  </button>
                </div>

                <div className="p-7 flex-1 flex flex-col">
                  <span className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3 block">{recipe.category}</span>
                  <h3 className="text-xl font-serif font-bold text-stone-800 mb-2 leading-tight group-hover:text-amber-600 transition-colors">
                      {recipe.title}
                  </h3>
                  <p className="text-stone-400 text-xs italic line-clamp-2 mb-6 font-light leading-relaxed">
                      {recipe.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-[10px] font-black text-stone-500 border-t border-stone-100 pt-5 tracking-tight">
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {recipe.time}
                      </div>
                      <div className="flex items-center gap-2 text-stone-300 group-hover:text-amber-600 transition-colors">
                        Cocinar <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                      </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <RecipeModal 
        recipe={selectedRecipe} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onAddIngredients={addToShoppingList}
      />
    </div>
  );
}

export default App;
