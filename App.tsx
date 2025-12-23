
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RECIPES } from './data';
import { Recipe } from './types';
import { RecipeModal } from './components/RecipeModal';
import { LandingPage } from './components/LandingPage';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { VoiceFeedback } from './components/VoiceFeedback';

const CATEGORY_COLORS: Record<string, { bg: string, text: string, border: string, accent: string, shadow: string }> = {
  desayuno: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: 'bg-amber-600', shadow: 'shadow-amber-900/10' },
  aperitivo: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', accent: 'bg-emerald-600', shadow: 'shadow-emerald-900/10' },
  primero: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: 'bg-indigo-600', shadow: 'shadow-indigo-900/10' },
  segundo: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', accent: 'bg-rose-600', shadow: 'shadow-rose-900/10' },
  postre: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', accent: 'bg-violet-600', shadow: 'shadow-violet-900/10' },
  todos: { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200', accent: 'bg-stone-900', shadow: 'shadow-stone-900/10' }
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('todos');
  const [onlyQuick, setOnlyQuick] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalVoiceEnabled, setGlobalVoiceEnabled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem('gourmet_favorites') || '[]'));
  const [shoppingList, setShoppingList] = useState<string[]>(() => JSON.parse(localStorage.getItem('gourmet_shopping_list') || '[]'));

  const handleGlobalCommand = useCallback((cmd: string) => {
    const c = cmd.toLowerCase();
    
    if (/(mostrar|pon|enseñar|ver)/.test(c)) {
      if (c.includes('desayuno')) setActiveCategory('desayuno');
      else if (c.includes('aperitivo')) setActiveCategory('aperitivo');
      else if (c.includes('primero')) setActiveCategory('primero');
      else if (c.includes('segundo')) setActiveCategory('segundo');
      else if (c.includes('postre')) setActiveCategory('postre');
      else if (c.includes('todo')) setActiveCategory('todos');
    }

    if (c.includes('ayuda') || c.includes('comandos')) setShowHelp(true);
    if (c.includes('cerrar') && showHelp) setShowHelp(false);

    if (c.includes('fácil') || c.includes('baja')) setActiveDifficulty('Baja');
    else if (c.includes('difícil') || c.includes('alta')) setActiveDifficulty('Alta');
    if (c.includes('rápido') || c.includes('corto') || c.includes('30 minutos')) setOnlyQuick(true);

    if (c.includes('limpia') || c.includes('borra') || c.includes('restablece')) {
      setSearchQuery('');
      setActiveCategory('todos');
      setActiveDifficulty('todos');
      setOnlyQuick(false);
    }
  }, [showHelp]);

  const { status, speak } = useVoiceAssistant({
    enabled: globalVoiceEnabled && !isModalOpen,
    onCommand: handleGlobalCommand
  });

  useEffect(() => {
    if (globalVoiceEnabled && !isModalOpen) {
      speak("GourmetVoice listo. Puedes decir: Muestra postres, o Ayuda.");
    }
  }, [globalVoiceEnabled, isModalOpen]);

  useEffect(() => { localStorage.setItem('gourmet_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('gourmet_shopping_list', JSON.stringify(shoppingList)); }, [shoppingList]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleAddIngredients = (ingredients: string[]) => {
    setShoppingList(prev => {
      const newList = [...prev];
      ingredients.forEach(ing => { if (!newList.includes(ing)) newList.push(ing); });
      return newList;
    });
  };

  const filteredRecipes = useMemo(() => {
    return RECIPES.filter(recipe => {
      const matchesCategory = activeCategory === 'todos' || recipe.category === activeCategory;
      const matchesDifficulty = activeDifficulty === 'todos' || recipe.difficulty === activeDifficulty;
      const timeVal = parseInt(recipe.time.split(' ')[0]);
      const matchesQuick = !onlyQuick || timeVal <= 30;
      const q = searchQuery.toLowerCase();
      const matchesSearch = recipe.title.toLowerCase().includes(q) || recipe.ingredients.some(i => i.toLowerCase().includes(q));
      return matchesCategory && matchesDifficulty && matchesQuick && matchesSearch;
    });
  }, [activeCategory, activeDifficulty, onlyQuick, searchQuery]);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  const theme = CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.todos;

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-1000 pb-24 selection:bg-amber-100`}>
      <VoiceFeedback status={isModalOpen ? 'idle' : status} />

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-stone-200/50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 shrink-0 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
             <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-2xl text-white font-serif shadow-xl group-hover:rotate-6 transition-transform">G</div>
             <h1 className="text-2xl font-serif font-bold tracking-tight hidden sm:block">GourmetVoice</h1>
          </div>
          
          <div className="flex-1 max-w-2xl relative">
            <input 
              type="text" 
              placeholder="Busca por plato o ingrediente..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-14 pr-14 py-4 bg-stone-100 rounded-full border-2 border-transparent focus:bg-white focus:border-stone-200 transition-all outline-none text-base font-bold shadow-inner" 
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300">🔍</div>
            <button 
              onClick={() => setGlobalVoiceEnabled(!globalVoiceEnabled)} 
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${globalVoiceEnabled ? 'bg-amber-600 text-white animate-pulse shadow-lg scale-110' : 'bg-stone-200 text-stone-400 hover:text-stone-600'}`}
              title="Activar Asistente de Voz"
            >
              🎤
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowHelp(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all font-black text-xl">?</button>
            <div className="px-5 py-3 bg-stone-900 text-white rounded-2xl shadow-xl font-black text-[11px] hidden lg:block tracking-widest uppercase">
              {shoppingList.length} Ingredientes
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-4 overflow-x-auto scrollbar-hide border-b border-stone-100">
          {['todos', 'desayuno', 'aperitivo', 'primero', 'segundo', 'postre'].map(cat => {
            const catTheme = CATEGORY_COLORS[cat];
            const isActive = activeCategory === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(cat)} 
                className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                  isActive ? `${catTheme.accent} border-transparent text-white scale-105 shadow-md` : `bg-white text-stone-400 border-stone-100 hover:border-stone-300`
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
          {filteredRecipes.map(recipe => {
            const catColor = CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS.todos;
            return (
              <article 
                key={recipe.id} 
                onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                className={`group relative bg-white rounded-[4rem] border-2 ${catColor.border} overflow-hidden hover:shadow-[0_60px_120px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer flex flex-col h-[580px] hover:-translate-y-4`}
              >
                <div className={`relative h-72 flex items-center justify-center p-14 overflow-hidden transition-all duration-700 ${catColor.bg} group-hover:bg-white`}>
                  <div className={`absolute inset-0 opacity-[0.05] pointer-events-none group-hover:opacity-[0.15] transition-opacity ${catColor.text}`}>
                    <span className="text-[400px] font-black absolute -top-32 -left-24 leading-none">{recipe.title.charAt(0)}</span>
                  </div>
                  
                  <div className="absolute inset-0 bg-white/0 glass-card"></div>
                  
                  <h3 className={`relative z-10 font-serif font-bold text-5xl md:text-6xl text-center leading-[1.05] tracking-tight transition-transform duration-700 group-hover:scale-110 ${catColor.text}`}>
                    {recipe.title}
                  </h3>
                  
                  <button onClick={(e) => toggleFavorite(e, recipe.id)} className={`absolute bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md transition-all border shadow-lg ${favorites.includes(recipe.id) ? `${catColor.accent} text-white border-transparent` : 'bg-white/80 text-stone-300 border-white hover:text-stone-600'}`}>
                    {favorites.includes(recipe.id) ? '★' : '☆'}
                  </button>
                </div>

                <div className="p-14 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-10">
                    <span className={`px-5 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-widest ${catColor.bg} ${catColor.text}`}>
                      {recipe.category}
                    </span>
                    <span className="text-[12px] font-black uppercase tracking-widest text-stone-400">⏱ {recipe.time}</span>
                  </div>
                  <p className="text-stone-500 text-lg line-clamp-3 leading-relaxed mb-10 italic font-serif opacity-80 group-hover:opacity-100 transition-opacity">
                    {recipe.description}
                  </p>
                  <div className="mt-auto flex justify-between items-center pt-10 border-t border-stone-50">
                     <div className="flex gap-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i < (recipe.difficulty === 'Baja' ? 1 : recipe.difficulty === 'Media' ? 2 : 3) ? catColor.accent : 'bg-stone-100'}`}></div>
                        ))}
                     </div>
                     <span className={`text-[12px] font-black tracking-[0.4em] uppercase transition-all flex items-center gap-3 group-hover:gap-6 ${catColor.text}`}>
                       PREPARAR <span className="text-2xl transition-transform group-hover:translate-x-2">→</span>
                     </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Modal de Ayuda de Voz */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl" onClick={() => setShowHelp(false)}></div>
          <div className="relative w-full max-w-xl bg-white rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-4xl font-serif font-bold mb-8">Comandos de Voz 🎤</h2>
            <div className="space-y-6">
              <div className="p-6 bg-stone-50 rounded-2xl">
                <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2">Para Navegar</p>
                <p className="text-xl font-bold italic text-stone-700">"Muestra postres", "Pon desayunos", "Ver todos"</p>
              </div>
              <div className="p-6 bg-stone-50 rounded-2xl">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Dentro de una Receta</p>
                <p className="text-xl font-bold italic text-stone-700">"Siguiente", "Anterior", "Repite el paso", "Dime los ingredientes"</p>
              </div>
              <div className="p-6 bg-stone-50 rounded-2xl">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Utilidades</p>
                <p className="text-xl font-bold italic text-stone-700">"Pon un temporizador de 10 minutos", "Cerrar receta"</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="mt-10 w-full py-5 bg-stone-900 text-white rounded-full font-black text-xs uppercase tracking-widest">Entendido</button>
          </div>
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onAddIngredients={handleAddIngredients}
          onUpdateTime={() => {}} 
        />
      )}
    </div>
  );
}

export default App;
