
import React from 'react';
import { VoiceStatus } from '../types';

interface VoiceFeedbackProps {
  status: VoiceStatus;
}

export const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({ status }) => {
  if (status === 'idle') return null;

  const config = {
    listening: {
      bg: 'bg-red-600',
      label: 'Escuchando...',
      subtext: 'Di: "Siguiente", "Atrás", "Repite"...',
      icon: (
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      ),
      animate: 'animate-bounce'
    },
    speaking: {
      bg: 'bg-amber-500',
      label: 'GourmetVoice hablando',
      subtext: 'Escucha las instrucciones',
      icon: (
        <svg className="w-4 h-4 text-stone-950 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
      animate: ''
    },
    processing: {
      bg: 'bg-stone-200',
      label: 'Entendiendo...',
      subtext: 'Procesando comando de voz',
      icon: (
        <svg className="w-4 h-4 text-stone-900 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
      animate: ''
    },
    error: {
      bg: 'bg-black',
      label: 'Micrófono Bloqueado',
      subtext: 'Revisa los permisos del navegador',
      icon: (
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      animate: 'animate-pulse'
    }
  }[status];

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none w-full max-w-xs sm:max-w-md px-4" aria-live="assertive">
      <div className={`${config.bg} ${config.animate} flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all duration-500 transform border border-white/10 backdrop-blur-md`}>
        <div className="flex-shrink-0 bg-black/5 p-2.5 rounded-2xl">
          {config.icon}
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${status === 'processing' ? 'text-stone-900' : status === 'speaking' ? 'text-stone-950' : 'text-white'}`}>
            {config.label}
          </span>
          <span className={`text-[9px] font-bold mt-1 opacity-70 ${status === 'processing' ? 'text-stone-700' : status === 'speaking' ? 'text-stone-800' : 'text-white'}`}>
            {config.subtext}
          </span>
        </div>
      </div>
    </div>
  );
};
