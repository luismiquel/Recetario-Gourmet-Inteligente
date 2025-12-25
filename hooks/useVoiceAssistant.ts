
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

  const startRecognition = useCallback(() => {
    if (!enabled || isSpeakingRef.current || manuallyStopped.current) return;
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setStatus('listening');
      }
    } catch (e) {
      // Ignorar si ya está corriendo
    }
  }, [enabled]);

  const stopRecognition = useCallback(() => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setStatus('idle');
      }
    } catch (e) {}
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // Desbloquear sistema
    
    isSpeakingRef.current = true;
    stopRecognition();
    setStatus('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      // Delay preventivo para evitar bucles de eco
      restartTimeoutRef.current = window.setTimeout(() => {
        if (!manuallyStopped.current) startRecognition();
      }, 800);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      startRecognition();
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
        }
      };

      recognition.onend = () => {
        if (enabled && !isSpeakingRef.current && !manuallyStopped.current) {
          restartTimeoutRef.current = window.setTimeout(startRecognition, 200);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'aborted' || event.error === 'no-speech') {
          return;
        }
        console.warn('Voz Error:', event.error);
        if (enabled && !manuallyStopped.current) {
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
      manuallyStopped.current = true;
      stopRecognition();
    };
  }, [enabled, onCommand, startRecognition, stopRecognition]);

  return { status, speak };
};
