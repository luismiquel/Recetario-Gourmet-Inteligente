
import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceStatus, IWindow } from '../types.ts';

declare const window: IWindow;

interface UseVoiceAssistantProps {
  enabled: boolean;
  onCommand: (command: string) => void;
}

export const useVoiceAssistant = ({ enabled, onCommand }: UseVoiceAssistantProps) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const manuallyStopped = useRef<boolean>(false);
  const restartTimeoutRef = useRef<number | null>(null);

  const stopRecognition = useCallback(() => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        setStatus('idle');
      }
    } catch (e) {}
  }, []);

  const startRecognition = useCallback(() => {
    if (!enabled || isSpeakingRef.current || manuallyStopped.current) return;
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setStatus('listening');
      }
    } catch (e) {
      if (status !== 'speaking') setStatus('listening');
    }
  }, [enabled, status]);

  const speak = useCallback((text: string) => {
    if (!enabled) return;

    const synth = window.speechSynthesis;
    synth.cancel(); 
    
    isSpeakingRef.current = true;
    stopRecognition();
    setStatus('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05; // Ligeramente más rápido para fluidez
    utterance.pitch = 1.0;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      // Delay de 600ms para asegurar que el eco de los altavoces no active el micro
      restartTimeoutRef.current = window.setTimeout(() => {
        if (!manuallyStopped.current && enabled) {
          startRecognition();
        } else {
          setStatus('idle');
        }
      }, 600);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (enabled) startRecognition();
    };

    synth.speak(utterance);
  }, [enabled, stopRecognition, startRecognition]);

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
        const lastResultIndex = event.results.length - 1;
        const command = event.results[lastResultIndex][0].transcript;
        if (command) {
          setStatus('processing');
          onCommand(command.trim());
          
          // Si no hay habla inmediata después del comando, volvemos a escuchar
          setTimeout(() => {
            if (!isSpeakingRef.current && enabled) setStatus('listening');
          }, 800);
        }
      };

      recognition.onend = () => {
        if (enabled && !isSpeakingRef.current && !manuallyStopped.current) {
          startRecognition();
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return;
        if (event.error === 'not-allowed') {
          setStatus('error');
          manuallyStopped.current = true;
        } else if (enabled && !manuallyStopped.current) {
          setTimeout(startRecognition, 1000);
        }
      };

      recognitionRef.current = recognition;
    }

    if (enabled) {
      manuallyStopped.current = false;
      startRecognition();
    } else {
      manuallyStopped.current = true;
      stopRecognition();
    }

    return () => {
      stopRecognition();
    };
  }, [enabled, onCommand, startRecognition, stopRecognition]);

  return { status, speak };
};
