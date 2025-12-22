
import { useState, useEffect, useRef, useCallback } from 'react';
import { IWindow, VoiceStatus } from '../types';

interface UseVoiceAssistantProps {
  onCommand: (command: string) => void;
  enabled: boolean;
}

export const useVoiceAssistant = ({ onCommand, enabled }: UseVoiceAssistantProps) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const isMounted = useRef(true);
  const isSpeakingRef = useRef(false);
  const retryTimeoutRef = useRef<number | null>(null);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !enabled || !isMounted.current) return;
    if (isSpeakingRef.current) return;

    try {
      recognitionRef.current.start();
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
         console.warn("Reconocimiento ya en curso o error:", e.message);
      }
    }
  }, [enabled]);

  useEffect(() => {
    isMounted.current = true;
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false; 
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (isMounted.current) {
          setStatus('listening');
          setErrorMessage(null);
        }
      };

      recognition.onend = () => {
        if (!isMounted.current || !enabled) {
          setStatus('idle');
          return;
        }

        // Sistema de reenganche robusto
        if (!isSpeakingRef.current) {
           if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
           retryTimeoutRef.current = window.setTimeout(() => {
              if (enabled && isMounted.current && !isSpeakingRef.current) {
                startListening();
              }
           }, 150); 
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'aborted') return;
        if (event.error === 'no-speech') return; // Silence handling is done in onend

        if (event.error === 'not-allowed') {
             setErrorMessage('Micrófono bloqueado.');
             setStatus('error');
        }
      };

      recognition.onresult = (event: any) => {
        if (!isMounted.current) return;
        const transcript = event.results[0][0].transcript.toLowerCase();
        setStatus('processing');
        onCommand(transcript);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      isMounted.current = false;
      if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e){}
      }
    };
  }, [enabled, onCommand, startListening]);

  const stop = useCallback(() => {
    if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e){}
    }
    if (synthRef.current) synthRef.current.cancel();
    isSpeakingRef.current = false;
    setStatus('idle');
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current || !isMounted.current) return;

    // Critical: Stop recognition before speaking to avoid feedback loop
    if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e){}
    }
    
    isSpeakingRef.current = true;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    setStatus('speaking');

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (isMounted.current && enabled) {
        // Pause to ensure audio hardware is free
        setTimeout(() => {
            if (isMounted.current && enabled) startListening();
        }, 350);
      } else {
        setStatus('idle');
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setStatus('idle');
    };

    synthRef.current.speak(utterance);
  }, [enabled, startListening]);

  return { status, errorMessage, speak, startListening, stop };
};
