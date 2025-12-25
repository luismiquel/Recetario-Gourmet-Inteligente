
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-stone-950" role="main">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2070" 
          alt="" 
          className="w-full h-full object-cover opacity-40 scale-105 animate-slow-zoom"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 via-stone-950/60 to-stone-950"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="space-y-8 animate-fade-in-up">
          <div className="inline-block">
            <span className="block text-amber-500 text-xs font-black tracking-[0.5em] uppercase mb-4 opacity-0 animate-slide-down delay-100">
              Alta Cocina Independiente
            </span>
            <div className="h-px w-12 bg-amber-600 mx-auto opacity-50" aria-hidden="true"></div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-white tracking-tighter leading-none">
            Gourmet<span className="text-amber-600">Voice</span>
          </h1>
          
          <p className="text-stone-300 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in delay-300">
            Domina el arte culinario con libertad absoluta. Un asistente nativo, privado y veloz diseñado para cocinar sin tocar la pantalla.
          </p>

          <div className="pt-8 opacity-0 animate-slide-up delay-500">
            <button 
              onClick={onEnter}
              className="group relative inline-flex items-center gap-4 px-12 py-5 bg-white text-stone-950 rounded-full font-black text-xs tracking-[0.3em] uppercase transition-all hover:bg-amber-600 hover:text-white active:scale-95 shadow-2xl focus:ring-4 focus:ring-amber-500 outline-none"
              aria-label="Entrar a la aplicación GourmetVoice"
            >
              <span>Encender Fogones</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Info */}
      <footer className="absolute bottom-12 left-12 right-12 flex justify-between items-center text-[10px] font-bold text-stone-500 tracking-[0.2em] uppercase hidden md:flex opacity-0 animate-fade-in delay-700">
        <div className="flex gap-8">
          <span>1.000 RECETAS DE AUTOR</span>
          <span>PRIVACIDAD TOTAL</span>
        </div>
        <div>
          <span>© 2024 Desarrollado por GourmetVoice - Sin dependencias externas</span>
        </div>
      </footer>
      
      <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slow-zoom { animation: slow-zoom 20s infinite alternate ease-in-out; }
        .animate-fade-in-up { animation: fade-in-up 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-slide-down { animation: slide-down 0.8s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
      `}</style>
    </div>
  );
};
