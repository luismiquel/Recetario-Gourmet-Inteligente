
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => localStorage.getItem('gourmet_high_contrast') === 'true');

  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem('gourmet_favorites') || '[]'));
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => JSON.parse(localStorage.getItem('gourmet_shopping_list') || '[]'));
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('gourmet_high_contrast', String(isHighContrast));
    document.body.classList.toggle('high-contrast', isHighContrast);
  }, [isHighContrast]);

  useEffect(() => {
    localStorage.setItem('gourmet_shopping_list', JSON.stringify(shoppingList));
    localStorage.setItem('gourmet_favorites', JSON.stringify(favorites));
  }, [shoppingList, favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleRandomRecipe = () => {
    const random = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    setSelectedRecipe(random);
    setIsModalOpen(true);
  };

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => {
      const matchesCategory = activeCategory === 'todos' || recipe.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = recipe.title.toLowerCase().includes(q) || 
                            recipe.ingredients.some(i => i.toLowerCase().includes(q));
      const matchesFavorite = !showFavoritesOnly || favorites.includes(recipe.id);
      return matchesCategory && matchesSearch && matchesFavorite;
    });
  }, [activeCategory, searchQuery, showFavoritesOnly, favorites]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className={`min-h-screen bg-stone-50 pb-20 animate-fade-in ${isHighContrast ? 'high-contrast' : ''}`}>
      {/* Drawer Lista Compra */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsShoppingListOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 className="text-2xl font-serif font-bold">Tu Despensa</h2>
              <button onClick={() => setIsShoppingListOpen(false)} className="p-2 hover:bg-stone-200 rounded-full">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {shoppingList.length === 0 ? (
                <p className="text-center text-stone-400 mt-20 italic">Tu lista está vacía...</p>
              ) : (
                shoppingList.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                     <button onClick={() => setShoppingList(prev => prev.map(i => i.id === item.id ? {...i, completed: !i.completed} : i))} className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${item.completed ? 'bg-amber-600 border-amber-600' : 'border-stone-300'}`}>
                        {item.completed && <span className="text-white text-xs">✓</span>}
                     </button>
                     <span className={`flex-1 text-sm ${item.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>{item.name}</span>
                     <button onClick={() => setShoppingList(prev => prev.filter(i => i.id !== item.id))} className="text-stone-300 hover:text-red-500 transition-colors">🗑</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">👨‍🍳</span>
            <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight">Gourmet<span className="text-amber-600">Voice</span></h1>
          </div>
          
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Busca plato o ingrediente..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-stone-100 border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm"
              />
              <span className="absolute left-4 top-3 text-stone-400">🔍</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleRandomRecipe} className="p-2.5 rounded-full hover:bg-amber-50 text-amber-600 transition-colors" title="Sorpréndeme">🎲</button>
            <button onClick={() => setIsHighContrast(!isHighContrast)} className={`p-2.5 rounded-full transition-all ${isHighContrast ? 'bg-stone-900 text-white border-2 border-white' : 'hover:bg-stone-100 text-stone-400'}`} title="Modo Contraste">🌓</button>
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`p-2.5 rounded-full transition-all ${showFavoritesOnly ? 'bg-amber-100 text-amber-600' : 'hover:bg-stone-100 text-stone-400'}`} title="Favoritos">⭐</button>
            <button onClick={() => setIsShoppingListOpen(true)} className="p-2.5 rounded-full hover:bg-stone-100 text-stone-600 relative">
              🛒 {shoppingList.length > 0 && <span className="absolute top-0 right-0 bg-amber-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{shoppingList.length}</span>}
            </button>
          </div>
        </nav>

        {/* Categorías */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-4 overflow-x-auto no-print scrollbar-hide">
          {['todos', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
            >
              {cat} {cat !== 'todos' && <span className="ml-2 opacity-50">100</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredRecipes.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
              className="group bg-white rounded-[2rem] border border-stone-200 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
            >
              <div className="relative h-52">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 right-4">
                  <button onClick={(e) => toggleFavorite(e, recipe.id)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-amber-600 transition-all">
                    {favorites.includes(recipe.id) ? '★' : '☆'}
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-amber-600 text-white text-[8px] font-black uppercase rounded-full">{recipe.difficulty}</span>
                </div>
              </div>
              <div className="p-6">
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block mb-1">{recipe.category}</span>
                <h3 className="text-lg font-serif font-bold text-stone-800 leading-tight mb-4 group-hover:text-amber-600 transition-colors">{recipe.title}</h3>
                <div className="flex items-center justify-between text-[10px] font-bold text-stone-400">
                  <span className="flex items-center gap-1">⏱ {recipe.time}</span>
                  <span className="flex items-center gap-1">🍽 {recipe.ingredients.length} ingredientes</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        {filteredRecipes.length === 0 && (
          <div className="text-center py-40">
            <span className="text-6xl block mb-6" aria-hidden="true">🥘</span>
            <p className="text-stone-400 font-serif italic text-xl">No hemos encontrado ninguna receta...</p>
          </div>
        )}
      </main>

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onAddIngredients={(ings) => setShoppingList(prev => {
            const newList = [...prev];
            ings.forEach(name => {
              if(!newList.some(i => i.name === name)) newList.push({id: crypto.randomUUID(), name, completed: false});
            });
            return newList;
          })}
          onUpdateTime={() => {}} 
        />
      )}
    </div>
  );
}

export default App;
