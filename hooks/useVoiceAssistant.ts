
import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceStatus, IWindow } from '../types.ts';

declare const window: IWindow;

interface UseVoiceAssistantProps {
  enabled: boolean;
  onCommand: (command: string) => void;
}

/**
 * Hook personalizado para manejar el asistente de voz utilizando exclusivamente 
 * las APIs nativas del navegador. Mejorado para evitar solapamientos y mejorar la reconexión.
 */
export const useVoiceAssistant = ({ enabled, onCommand }: UseVoiceAssistantProps) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const isSpeakingRef = useRef<boolean>(false);
  
  const statusRef = useRef<VoiceStatus>('idle');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const speak = useCallback((text: string) => {
    if (!enabled || !synthRef.current) return;

    synthRef.current.cancel();
    isSpeakingRef.current = true;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setStatus('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setStatus('listening');
      if (enabled && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setStatus('idle');
      if (enabled && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    synthRef.current.speak(utterance);
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
        onCommand(command);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        if (event.error === 'not-allowed') setStatus('error');
      };

      recognition.onend = () => {
        if (enabled && !isSpeakingRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    }

    if (enabled) {
      try {
        if (!isSpeakingRef.current) {
          recognitionRef.current.start();
          setStatus('listening');
        }
      } catch (e) {}
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setStatus('idle');
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [enabled, onCommand]);

  return { status, speak };
};
