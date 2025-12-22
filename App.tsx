
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
  
  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem('gourmet_favorites') || '[]'));
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => JSON.parse(localStorage.getItem('gourmet_shopping_list') || '[]'));

  const handleGlobalCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    // Navegación de categorías
    if (/mostrar|pon|enseñar|ver/.test(c)) {
      if (c.includes('aperitivo')) { setActiveCategory('aperitivo'); speak("Cargando los mejores aperitivos."); }
      else if (c.includes('primero')) { setActiveCategory('primero'); speak("Mostrando primeros platos."); }
      else if (c.includes('segundo')) { setActiveCategory('segundo'); speak("Aquí tienes los platos principales."); }
      else if (c.includes('postre')) { setActiveCategory('postre'); speak("Hora de algo dulce."); }
      else if (c.includes('todo')) { setActiveCategory('todos'); speak("Mostrando todo el recetario."); }
    }

    // Búsqueda específica
    const searchMatch = c.match(/busca\s+(.*)/);
    if (searchMatch) {
      setSearchQuery(searchMatch[1]);
      speak(`He buscado ${searchMatch[1]} para ti.`);
    }

    // Sorpresa
    if (c.includes('aleatorio') || c.includes('sorpréndeme')) {
      const random = RECIPES[Math.floor(Math.random() * RECIPES.length)];
      setSelectedRecipe(random);
      setIsModalOpen(true);
      speak(`Hoy te sugiero preparar ${random.title}. ¿Qué te parece?`);
    }

    // Limpieza
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

  // Al activar la voz, dar un feedback de bienvenida
  useEffect(() => {
    if (globalVoiceEnabled && !isModalOpen) {
      speak("Asistente de voz activado. ¿Qué te apetece cocinar hoy?");
    }
  }, [globalVoiceEnabled]);

  useEffect(() => {
    localStorage.setItem('gourmet_shopping_list', JSON.stringify(shoppingList));
    localStorage.setItem('gourmet_favorites', JSON.stringify(favorites));
  }, [shoppingList, favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const getCategoryStyles = (category: string) => {
    const styles: Record<string, string> = {
      aperitivo: 'bg-orange-50 text-orange-950 border-orange-100',
      primero: 'bg-emerald-50 text-emerald-950 border-emerald-100',
      segundo: 'bg-rose-50 text-rose-950 border-rose-100',
      postre: 'bg-amber-50 text-amber-950 border-amber-100',
      todos: 'bg-stone-900 text-white border-stone-800'
    };
    return styles[category] || styles.todos;
  };

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => {
      const matchesCategory = activeCategory === 'todos' || recipe.category === activeCategory;
      const q = searchQuery.toLowerCase();
      return matchesCategory && (recipe.title.toLowerCase().includes(q) || recipe.ingredients.some(i => i.toLowerCase().includes(q)));
    });
  }, [activeCategory, searchQuery]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 transition-colors duration-700">
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => {setActiveCategory('todos'); setSearchQuery('');}}>
             <div className="w-10 h-10 bg-stone-950 rounded-2xl flex items-center justify-center text-xl text-white font-serif shadow-xl">G</div>
             <h1 className="text-lg font-serif font-bold tracking-tight hidden sm:block">GourmetVoice</h1>
          </div>
          
          <div className="flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Busca platos o ingredientes..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-12 pr-12 py-3 bg-stone-100 rounded-3xl focus:bg-white focus:ring-2 focus:ring-stone-200 transition-all outline-none text-sm font-bold placeholder:text-stone-400" 
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-2xl transition-all ${globalVoiceEnabled ? 'bg-amber-600 text-white animate-pulse shadow-lg' : 'bg-stone-200 text-stone-400 hover:text-stone-600'}`}
              title={globalVoiceEnabled ? "Asistente Activo" : "Activar Voz"}
            >
              🎤
            </button>
          </div>

          <button className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all">
            🛒 {shoppingList.length > 0 && <span className="ml-2 bg-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black">{shoppingList.length}</span>}
          </button>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide border-t border-stone-50">
          {['todos', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${activeCategory === cat ? 'bg-stone-900 border-stone-900 text-white shadow-md' : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredRecipes.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
              className="group relative bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer flex flex-col h-[400px]"
            >
              <div className={`relative h-52 flex items-center justify-center p-10 overflow-hidden transition-colors duration-700 ${getCategoryStyles(recipe.category)}`}>
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none select-none">
                  <span className="text-[280px] font-black absolute -top-10 -left-10 leading-none">{recipe.title.charAt(0)}</span>
                </div>
                <h3 className="relative z-10 font-serif font-bold text-3xl text-center leading-tight group-hover:scale-110 transition-transform duration-700">
                  {recipe.title}
                </h3>
                <button onClick={(e) => toggleFavorite(e, recipe.id)} className={`absolute bottom-6 right-6 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${favorites.includes(recipe.id) ? 'bg-amber-600 text-white shadow-lg' : 'bg-white/40 text-stone-600 hover:bg-white'}`}>
                  {favorites.includes(recipe.id) ? '★' : '☆'}
                </button>
              </div>

              <div className="p-10 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{recipe.category}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30">⏱ {recipe.time}</span>
                </div>
                <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed mb-8 italic font-serif opacity-80">
                  {recipe.description}
                </p>
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-stone-50">
                   <div className="flex gap-1.5 opacity-20">
                      {[...Array(recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-900"></div>
                      ))}
                   </div>
                   <span className="text-[9px] font-black tracking-[0.2em] uppercase text-stone-950 group-hover:translate-x-2 transition-transform">VER RECETA →</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-40 animate-pulse">
            <p className="text-stone-300 font-serif italic text-3xl">Sin hallazgos en el archivo gastronómico.</p>
            <button onClick={() => {setActiveCategory('todos'); setSearchQuery('');}} className="mt-8 text-amber-600 font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-8">Volver al inicio</button>
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
