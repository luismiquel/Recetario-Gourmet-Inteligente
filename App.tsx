
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data';
import { Recipe } from './types';
import { RecipeModal } from './components/RecipeModal';
import { LandingPage } from './components/LandingPage';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { VoiceFeedback } from './components/VoiceFeedback';

interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
}

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalVoiceEnabled, setGlobalVoiceEnabled] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => localStorage.getItem('gourmet_high_contrast') === 'true');

  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem('gourmet_favorites') || '[]'));
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => JSON.parse(localStorage.getItem('gourmet_shopping_list') || '[]'));
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  // Manejador de comandos globales (Búsqueda y Navegación)
  const handleGlobalCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    // Categorías
    if (/mostrar|poner|enseñar/.test(c)) {
      if (c.includes('aperitivo')) setActiveCategory('aperitivo');
      else if (c.includes('primero')) setActiveCategory('primero');
      else if (c.includes('segundo')) setActiveCategory('segundo');
      else if (c.includes('postre')) setActiveCategory('postre');
      else if (c.includes('todo')) setActiveCategory('todos');
    }

    // Búsqueda
    const searchMatch = c.match(/busca\s+(.*)/);
    if (searchMatch) {
      setSearchQuery(searchMatch[1]);
      speak(`Buscando recetas de ${searchMatch[1]}`);
    }

    // Utilidades
    if (c.includes('limpia') || c.includes('quita filtros')) {
      setActiveCategory('todos');
      setSearchQuery('');
    }
    
    if (c.includes('aleatorio') || c.includes('sorpréndeme')) {
      handleRandom();
    }
  }, []);

  const { status, speak } = useVoiceAssistant({
    enabled: globalVoiceEnabled && !isModalOpen,
    onCommand: handleGlobalCommand
  });

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
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className={`min-h-screen bg-stone-50 pb-20 transition-all duration-700 animate-fade-in ${isHighContrast ? 'high-contrast' : ''}`}>
      
      {/* Voice Feedback Global */}
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      {/* Drawer Lista Compra */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsShoppingListOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-left p-8">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-serif font-bold tracking-tight">Cesta de Compra</h2>
              <button onClick={() => setIsShoppingListOpen(false)} className="text-stone-300 hover:text-stone-900 p-2">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {shoppingList.map(item => (
                <div key={item.id} className="group flex items-center gap-4 p-5 bg-stone-50 rounded-[1.5rem] border border-stone-100 hover:border-amber-200 transition-all">
                  <button onClick={() => setShoppingList(prev => prev.map(i => i.id === item.id ? {...i, completed: !i.completed} : i))} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-amber-600 border-amber-600' : 'border-stone-200'}`}>
                    {item.completed && <span className="text-white text-[10px]">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm font-medium transition-all ${item.completed ? 'line-through text-stone-300' : 'text-stone-700'}`}>{item.name}</span>
                  <button onClick={() => setShoppingList(prev => prev.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all">🗑</button>
                </div>
              ))}
              {shoppingList.length === 0 && (
                <div className="text-center pt-20">
                  <p className="text-stone-400 italic font-serif">Añade ingredientes para no olvidar nada.</p>
                </div>
              )}
            </div>
            <button onClick={() => setShoppingList([])} className="mt-8 py-4 bg-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all">Vaciar lista</button>
          </div>
        </div>
      )}

      {/* Header Premium */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-stone-100">
        <nav className="max-w-7xl mx-auto px-8 h-24 flex justify-between items-center gap-8">
          <div className="flex items-center gap-4 shrink-0">
             <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-amber-600/30">🥘</div>
             <h1 className="text-2xl font-serif font-bold tracking-tight hidden sm:block">Gourmet<span className="text-amber-600">Voice</span></h1>
          </div>
          
          <div className="flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Encuentra tu plato..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-14 pr-6 py-4 bg-stone-100 border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all outline-none text-sm font-bold placeholder:text-stone-400"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${globalVoiceEnabled ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'}`}
              title="Búsqueda por voz"
            >
              🎤
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={handleRandom} className="p-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all shadow-sm" title="Sorpréndeme">🎲</button>
            <button onClick={() => setIsShoppingListOpen(true)} className="p-4 bg-stone-900 text-white rounded-2xl relative group hover:bg-black transition-all shadow-xl">
              🛒 {shoppingList.length > 0 && <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-900 font-black">{shoppingList.length}</span>}
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-8 py-5 flex gap-4 overflow-x-auto no-print scrollbar-hide border-t border-stone-50">
          {['todos', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap shadow-sm ${activeCategory === cat ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-white border-stone-100 text-stone-400 hover:border-amber-400 hover:text-amber-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Grid de Recetas */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {filteredRecipes.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
              className="group bg-white rounded-[3rem] border border-stone-100 overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700 cursor-pointer transform hover:-translate-y-3"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                <button onClick={(e) => toggleFavorite(e, recipe.id)} className={`absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-md transition-all shadow-lg ${favorites.includes(recipe.id) ? 'bg-amber-600 text-white' : 'bg-white/30 text-white hover:bg-white hover:text-amber-600'}`}>
                   {favorites.includes(recipe.id) ? '★' : '☆'}
                </button>
              </div>
              <div className="p-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-3 py-1 bg-amber-50 rounded-lg">{recipe.category}</span>
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{recipe.difficulty}</span>
                </div>
                <h3 className="font-serif font-bold text-2xl leading-tight mb-6 group-hover:text-amber-600 transition-colors">{recipe.title}</h3>
                <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest pt-6 border-t border-stone-50">
                  <span className="flex items-center gap-2">⏱ {recipe.time}</span>
                  <span className="flex items-center gap-2">👨‍🍳 VER PASOS</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        
        {filteredRecipes.length === 0 && (
          <div className="text-center py-40">
            <p className="text-stone-300 font-serif italic text-3xl">No hemos encontrado esa receta en el archivo.</p>
            <button onClick={() => {setActiveCategory('todos'); setSearchQuery('');}} className="mt-8 text-amber-600 font-black text-xs uppercase tracking-[0.3em]">Reiniciar búsqueda</button>
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
