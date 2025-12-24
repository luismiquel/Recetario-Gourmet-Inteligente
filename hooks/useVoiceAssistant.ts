
import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceStatus, IWindow } from '../types.ts';

declare const window: IWindow;

interface UseVoiceAssistantProps {
  enabled: boolean;
  onCommand: (command: string) => void;
}

/**
 * Motor de voz GourmetVoice optimizado para estabilidad.
 * Implementa un sistema de autorecuperación y prevención de colisiones.
 */
export const useVoiceAssistant = ({ enabled, onCommand }: UseVoiceAssistantProps) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const restartTimerRef = useRef<number | null>(null);

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar si ya está detenido
      }
    }
  };

  const startRecognition = () => {
    if (enabled && recognitionRef.current && !isSpeakingRef.current) {
      try {
        recognitionRef.current.start();
        setStatus('listening');
      } catch (e) {
        // Ignorar si ya está iniciado
      }
    }
  };

  const speak = useCallback((text: string) => {
    if (!enabled) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // Detener cualquier habla previa
    
    isSpeakingRef.current = true;
    stopRecognition();
    setStatus('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setTimeout(() => startRecognition(), 200); // Pequeño margen para evitar que escuche su eco
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      startRecognition();
    };

    synth.speak(utterance);
  }, [enabled]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setStatus('error');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript;
        if (command) onCommand(command.trim());
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') setStatus('error');
        // El error 'no-speech' es común y lo manejamos con el reinicio automático
      };

      recognition.onend = () => {
        if (enabled && !isSpeakingRef.current) {
          startRecognition();
        }
      };

      recognitionRef.current = recognition;
    }

    if (enabled) {
      startRecognition();
    } else {
      stopRecognition();
      setStatus('idle');
    }

    // Sistema de autorecuperación: si debería estar escuchando pero no lo está, forzar reinicio
    const interval = window.setInterval(() => {
      if (enabled && !isSpeakingRef.current && status === 'idle') {
        startRecognition();
      }
    }, 2000);

    return () => {
      window.clearInterval(interval);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [enabled, onCommand]);

  return { status, speak };
};
