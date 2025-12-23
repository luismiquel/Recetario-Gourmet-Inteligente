
import { useState, useEffect, useRef, useCallback } from 'react';
import { IWindow, VoiceStatus } from '../types.ts';

interface UseVoiceAssistantProps {
  onCommand: (command: string) => void;
  enabled: boolean;
}

export const useVoiceAssistant = ({ onCommand, enabled }: UseVoiceAssistantProps) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      isListeningRef.current = false;
      isStartingRef.current = false;
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (isSpeakingRef.current || isListeningRef.current || isStartingRef.current || !enabled) return;

    try {
      isStartingRef.current = true;
      recognitionRef.current.start();
    } catch (e) {
      isStartingRef.current = false;
      if (e instanceof Error && (e.message.includes('already started') || e.name === 'InvalidStateError')) {
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
        isStartingRef.current = false;
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setStatus('processing');
        onCommandRef.current(transcript);
      };

      recognition.onerror = (event: any) => {
        isListeningRef.current = false;
        isStartingRef.current = false;
        if (event.error === 'no-speech') {
          setStatus('idle');
        } else if (event.error === 'not-allowed') {
          setStatus('error');
        } else {
          console.warn("Recognition error:", event.error);
          setStatus('idle');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        isStartingRef.current = false;
        if (enabled && !isSpeakingRef.current) {
          if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
          restartTimerRef.current = window.setTimeout(startRecognition, 600);
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
  }, [enabled, startRecognition, stopRecognition]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

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
        setTimeout(startRecognition, 1200);
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
