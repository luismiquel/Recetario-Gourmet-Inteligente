
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
      {/* Lista Compra */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsShoppingListOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left p-8">
            <h2 className="text-2xl font-serif font-bold mb-6">Lista de la Compra</h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              {shoppingList.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                  <button onClick={() => setShoppingList(prev => prev.map(i => i.id === item.id ? {...i, completed: !i.completed} : i))} className={`w-5 h-5 rounded border-2 ${item.completed ? 'bg-amber-600 border-amber-600' : 'border-stone-300'}`}></button>
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-stone-400' : ''}`}>{item.name}</span>
                </div>
              ))}
              {shoppingList.length === 0 && <p className="text-stone-400 italic">Vacio...</p>}
            </div>
            <button onClick={() => setIsShoppingListOpen(false)} className="mt-4 py-3 bg-stone-900 text-white rounded-xl font-bold">Cerrar</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <nav className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold">Gourmet<span className="text-amber-600">Voice</span></h1>
          <div className="flex-1 max-w-md mx-8">
            <input 
              type="text" 
              placeholder="Busca plato o ingrediente..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-6 pr-4 py-2.5 bg-stone-100 rounded-full outline-none text-sm focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsHighContrast(!isHighContrast)} className="p-3 bg-stone-100 rounded-full">🌓</button>
            <button onClick={() => setIsShoppingListOpen(true)} className="p-3 bg-stone-100 rounded-full relative">🛒 {shoppingList.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{shoppingList.length}</span>}</button>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-4 overflow-x-auto no-print scrollbar-hide">
          {['todos', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-500'}`}
            >
              {cat} {cat !== 'todos' && <span className="ml-2 opacity-50">100</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredRecipes.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
              className="group bg-white rounded-[2rem] border border-stone-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="relative h-48">
                <img src={recipe.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <button onClick={(e) => toggleFavorite(e, recipe.id)} className="absolute top-4 right-4 p-2 bg-white/80 rounded-full">{favorites.includes(recipe.id) ? '★' : '☆'}</button>
              </div>
              <div className="p-6">
                <span className="text-[8px] font-black text-amber-600 uppercase mb-1 block">{recipe.category}</span>
                <h3 className="font-serif font-bold text-lg leading-tight mb-2">{recipe.title}</h3>
                <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase">
                  <span>⏱ {recipe.time}</span>
                  <span>{recipe.difficulty}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onAddIngredients={(ings) => setShoppingList(prev => [...prev, ...ings.map(n => ({id: crypto.randomUUID(), name: n, completed: false}))])}
          onUpdateTime={() => {}} 
        />
      )}
    </div>
  );
}

export default App;
