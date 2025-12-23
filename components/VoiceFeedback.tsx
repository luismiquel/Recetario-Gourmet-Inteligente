
import React from 'react';
import { VoiceStatus } from '../types.ts';

interface VoiceFeedbackProps {
  status: VoiceStatus;
}

export const VoiceFeedback: React.FC<VoiceFeedbackProps> = ({ status }) => {
  if (status === 'idle') return null;

  const config = {
    listening: {
      bg: 'bg-red-600',
      label: 'TE ESCUCHO',
      subtext: 'Pide: "Aperitivos", "Siguiente"...',
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
      label: 'GOURMET HABLANDO',
      subtext: 'Escuchando tu petición...',
      icon: (
        <svg className="w-4 h-4 text-stone-900 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
      animate: ''
    },
    processing: {
      bg: 'bg-stone-200',
      label: 'ENTENDIENDO',
      subtext: 'Analizando comando...',
      icon: <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></div>,
      animate: ''
    },
    error: {
      bg: 'bg-black',
      label: 'MICRÓFONO BLOQUEADO',
      subtext: 'Pulsa el candado arriba y permite el micro',
      icon: <span className="text-red-500 font-bold">!</span>,
      animate: 'animate-pulse'
    }
  }[status];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none w-full px-4">
      <div className={`${config.bg} ${config.animate} flex items-center gap-5 px-8 py-5 rounded-[2.5rem] shadow-2xl border border-white/20 backdrop-blur-md`}>
        <div className="bg-black/10 p-3 rounded-2xl">
          {config.icon}
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${status === 'processing' || status === 'speaking' ? 'text-stone-900' : 'text-white'}`}>
            {config.label}
          </span>
          <span className={`text-[9px] font-bold mt-1.5 opacity-60 ${status === 'processing' || status === 'speaking' ? 'text-stone-800' : 'text-white'}`}>
            {config.subtext}
          </span>
        </div>
      </div>
    </div>
  );
};
