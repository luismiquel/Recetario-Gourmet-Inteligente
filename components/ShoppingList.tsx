
import React from 'react';

interface ShoppingListProps {
  isOpen: boolean;
  onClose: () => void;
  items: string[];
  onRemove: (item: string) => void;
  onClear: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ isOpen, onClose, items, onRemove, onClear }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end animate-in fade-in duration-300 font-['Lato']">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md h-full bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-500">
        <header className="p-8 border-b border-stone-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mi Lista</h2>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">Ingredientes para tu compra</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center hover:bg-stone-700 transition-colors">✕</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group flex items-center justify-between p-4 bg-stone-950 rounded-2xl border border-stone-800 hover:border-amber-600/50 transition-all"
                >
                  <span className="font-bold text-stone-200 text-lg leading-snug">{item}</span>
                  <button 
                    onClick={() => onRemove(item)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-stone-500 hover:text-red-500 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center grayscale">
              <span className="text-6xl mb-4">🛒</span>
              <p className="font-black text-xs uppercase tracking-[0.2em]">Tu lista está vacía</p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="p-8 border-t border-stone-800 bg-stone-900">
            <button 
              onClick={onClear}
              className="w-full py-4 rounded-xl border-2 border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              Vaciar Lista
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
