
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

  const handleRandom = () => {
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
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsShoppingListOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left p-8">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-serif font-bold">Despensa</h2>
              <button onClick={() => setIsShoppingListOpen(false)} className="text-stone-400">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {shoppingList.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100">
                  <button onClick={() => setShoppingList(prev => prev.map(i => i.id === item.id ? {...i, completed: !i.completed} : i))} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-amber-600 border-amber-600 shadow-md' : 'border-stone-300'}`}>
                    {item.completed && <span className="text-white text-[10px]">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm font-medium ${item.completed ? 'line-through text-stone-300' : 'text-stone-700'}`}>{item.name}</span>
                  <button onClick={() => setShoppingList(prev => prev.filter(i => i.id !== item.id))} className="text-stone-300 hover:text-red-500 transition-colors">🗑</button>
                </div>
              ))}
              {shoppingList.length === 0 && (
                <div className="text-center pt-20">
                  <span className="text-5xl block mb-4 opacity-20">🛒</span>
                  <p className="text-stone-400 italic">Tu lista está vacía. Añade ingredientes desde las recetas.</p>
                </div>
              )}
            </div>
            <button onClick={() => setShoppingList([])} className="mt-6 py-4 text-stone-400 text-xs font-black uppercase tracking-widest hover:text-red-500 transition-colors">Vaciar Lista</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-stone-200">
        <nav className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <span className="text-4xl">🥘</span>
             <h1 className="text-2xl font-serif font-bold tracking-tight">Gourmet<span className="text-amber-600">Voice</span></h1>
          </div>
          
          <div className="flex-1 max-w-lg mx-12 hidden md:block">
            <div className="relative">
              <input 
                type="text" 
                placeholder="¿Qué te apetece cocinar hoy?..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-12 pr-6 py-3.5 bg-stone-100 border-transparent rounded-full focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all outline-none text-sm font-medium"
              />
              <span className="absolute left-5 top-4 text-stone-400">🔍</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleRandom} className="p-3.5 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-100 transition-all" title="Plato aleatorio">🎲</button>
            <button onClick={() => setIsHighContrast(!isHighContrast)} className={`p-3.5 rounded-full transition-all ${isHighContrast ? 'bg-stone-900 text-white border-2 border-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>🌓</button>
            <button onClick={() => setIsShoppingListOpen(true)} className="p-3.5 bg-stone-100 rounded-full relative group">
              🛒 {shoppingList.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-bold">{shoppingList.length}</span>}
            </button>
          </div>
        </nav>

        {/* Categorías */}
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-4 overflow-x-auto no-print scrollbar-hide">
          {['todos', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-white text-stone-500 hover:bg-stone-100 border border-stone-100'}`}
            >
              {cat === 'todos' ? 'TODOS' : cat} {cat !== 'todos' && <span className="ml-2 opacity-50">100</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {filteredRecipes.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
              className="group bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
            >
              <div className="relative h-56 overflow-hidden">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <button onClick={(e) => toggleFavorite(e, recipe.id)} className={`absolute top-5 right-5 p-3 rounded-full backdrop-blur-md transition-all ${favorites.includes(recipe.id) ? 'bg-amber-600 text-white' : 'bg-white/20 text-white hover:bg-white hover:text-amber-600'}`}>
                   {favorites.includes(recipe.id) ? '★' : '☆'}
                </button>
                <div className="absolute bottom-5 left-5">
                  <span className="px-3 py-1 bg-amber-600 text-white text-[8px] font-black uppercase rounded-full shadow-lg">{recipe.difficulty}</span>
                </div>
              </div>
              <div className="p-8">
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 block">{recipe.category}</span>
                <h3 className="font-serif font-bold text-xl leading-tight mb-4 group-hover:text-amber-600 transition-colors">{recipe.title}</h3>
                <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-wider border-t border-stone-100 pt-4">
                  <span className="flex items-center gap-1.5">⏱ {recipe.time}</span>
                  <span className="flex items-center gap-1.5">🍽 {recipe.ingredients.length} ING.</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        
        {filteredRecipes.length === 0 && (
          <div className="text-center py-40">
            <span className="text-7xl block mb-6">🏜️</span>
            <p className="text-stone-400 font-serif italic text-2xl">Vaya... no hay recetas con esos criterios.</p>
            <button onClick={() => {setActiveCategory('todos'); setSearchQuery('');}} className="mt-8 text-amber-600 font-black text-xs uppercase tracking-widest">Ver todo de nuevo</button>
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
            ings.forEach(ing => {
               if(!newList.some(item => item.name === ing)) {
                  newList.push({ id: crypto.randomUUID(), name: ing, completed: false });
               }
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
