
import { useState, useEffect, useRef, useCallback } from 'react';
import { IWindow, VoiceStatus } from '../types';

interface UseVoiceAssistantProps {
  onCommand: (command: string) => void;
  enabled: boolean;
}

export const useVoiceAssistant = ({ onCommand, enabled }: UseVoiceAssistantProps) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // Usamos abort() en lugar de stop() para liberar el micro inmediatamente
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('Silent recognition abort error');
      }
      isListeningRef.current = false;
    }
  }, []);

  const startRecognition = useCallback(() => {
    // Si el asistente está hablando, ya escuchando o deshabilitado, abortamos
    if (isSpeakingRef.current || isListeningRef.current || !enabled) return;

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Si el navegador dice que ya está activo, actualizamos nuestra referencia
      if (e instanceof Error && (e.name === 'InvalidStateError' || e.message.includes('already started'))) {
        isListeningRef.current = true;
      }
    }
  }, [enabled]);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('error');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setStatus('listening');
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setStatus('processing');
        onCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        isListeningRef.current = false;
        // El error 'no-speech' es normal, simplemente reiniciamos
        if (event.error === 'no-speech') {
          setStatus('idle');
        } else if (event.error === 'not-allowed') {
          setStatus('error');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // Solo reiniciamos si sigue habilitado y NO estamos hablando
        if (enabled && !isSpeakingRef.current) {
          if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
          restartTimerRef.current = window.setTimeout(startRecognition, 400);
        } else if (!enabled) {
          setStatus('idle');
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

    return () => {
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      stopRecognition();
    };
  }, [enabled, onCommand, startRecognition, stopRecognition]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Detener escucha inmediatamente antes de hablar
    stopRecognition();
    isSpeakingRef.current = true;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 1.0;
    utterance.rate = 1.1;

    utterance.onstart = () => setStatus('speaking');
    
    const handleEnd = () => {
      isSpeakingRef.current = false;
      if (enabled) {
        // Damos un respiro al hardware de audio antes de volver a escuchar
        setTimeout(startRecognition, 800);
      } else {
        setStatus('idle');
      }
    };

    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;
    synthRef.current.speak(utterance);
  }, [enabled, startRecognition, stopRecognition]);

  return { status, speak };
};
