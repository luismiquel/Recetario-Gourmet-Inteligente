
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data';
import { Recipe } from './types';
import { RecipeModal } from './components/RecipeModal';
import { LandingPage } from './components/LandingPage';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { VoiceFeedback } from './components/VoiceFeedback';

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
      if (c.includes('aperitivo')) { setActiveCategory('aperitivo'); speak("Cargando aperitivos."); }
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

  return (
    <div className="min-h-screen bg-stone-50 pb-24 selection:bg-amber-100">
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-stone-100">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => {setActiveCategory('todos'); setSearchQuery('');}}>
             <div className="w-10 h-10 bg-stone-950 rounded-2xl flex items-center justify-center text-xl text-white font-serif shadow-xl">G</div>
             <h1 className="text-xl font-serif font-bold tracking-tight hidden sm:block">GourmetVoice</h1>
          </div>
          
          <div className="flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Busca un plato..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-12 pr-12 py-3.5 bg-stone-100 rounded-3xl focus:bg-white focus:ring-2 focus:ring-stone-200 transition-all outline-none text-sm font-bold placeholder:text-stone-400" 
            />
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl transition-all ${globalVoiceEnabled ? 'bg-amber-600 text-white animate-pulse shadow-lg' : 'bg-stone-200 text-stone-400 hover:text-stone-600'}`}
            >
              🎤
            </button>
          </div>

          <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg font-black text-[10px] hidden sm:block">
            {shoppingList.length} LISTA
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-3 overflow-x-auto scrollbar-hide">
          {['todos', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${activeCategory === cat ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white text-stone-400 border-stone-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {filteredRecipes.map(recipe => (
            <article 
              key={recipe.id} 
              onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
              className="group relative bg-white rounded-[3rem] border border-stone-100 overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer flex flex-col h-[420px]"
            >
              <div className="relative h-56 flex items-center justify-center p-10 overflow-hidden bg-stone-50 transition-colors group-hover:bg-amber-50">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none select-none">
                  <span className="text-[300px] font-black absolute -top-16 -left-16 leading-none">{recipe.title.charAt(0)}</span>
                </div>
                <h3 className="relative z-10 font-serif font-bold text-3xl text-center leading-tight group-hover:scale-110 transition-transform duration-700">
                  {recipe.title}
                </h3>
                <button onClick={(e) => toggleFavorite(e, recipe.id)} className={`absolute bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${favorites.includes(recipe.id) ? 'bg-amber-600 text-white' : 'bg-white/50 text-stone-400 hover:bg-white'}`}>
                  {favorites.includes(recipe.id) ? '★' : '☆'}
                </button>
              </div>

              <div className="p-10 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{recipe.category}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-30">⏱ {recipe.time}</span>
                </div>
                <p className="text-stone-400 text-xs line-clamp-3 leading-relaxed mb-8 italic font-serif">
                  {recipe.description}
                </p>
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-stone-50">
                   <div className="flex gap-1.5 opacity-20">
                      {[...Array(recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-900"></div>
                      ))}
                   </div>
                   <span className="text-[10px] font-black tracking-widest uppercase text-stone-950 group-hover:translate-x-2 transition-transform underline underline-offset-4 decoration-stone-200">ABRIR →</span>
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
          onAddIngredients={() => {}}
          onUpdateTime={() => {}} 
        />
      )}
    </div>
  );
}

export default App;
