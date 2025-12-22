
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
  const isSpeaking = useRef(false);
  const restartTimeout = useRef<number | null>(null);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !enabled || isSpeaking.current) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Reconocimiento ya iniciado
    }
  }, [enabled]);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setStatus('listening');
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setStatus('processing');
      onCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn("Voz error:", event.error);
      setStatus('error');
    };

    recognition.onend = () => {
      if (enabled && !isSpeaking.current) {
        if (restartTimeout.current) window.clearTimeout(restartTimeout.current);
        restartTimeout.current = window.setTimeout(startListening, 300);
      } else {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;
    if (enabled) startListening();

    return () => {
      if (restartTimeout.current) window.clearTimeout(restartTimeout.current);
      recognition.abort();
    };
  }, [enabled, onCommand, startListening]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Silenciamos micro para no escucharnos
    if (recognitionRef.current) recognitionRef.current.abort();
    
    isSpeaking.current = true;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05; // Un poco más rápido para fluidez
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setStatus('speaking');
    
    utterance.onend = () => {
      isSpeaking.current = false;
      if (enabled) {
        setTimeout(startListening, 600);
      } else {
        setStatus('idle');
      }
    };

    synthRef.current.speak(utterance);
  }, [enabled, startListening]);

  return { status, speak };
};
