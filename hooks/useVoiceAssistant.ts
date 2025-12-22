
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
  const isListening = useRef(false);
  const restartTimer = useRef<number | null>(null);

  const safeStop = useCallback(() => {
    if (recognitionRef.current && isListening.current) {
      try {
        recognitionRef.current.abort();
        isListening.current = false;
      } catch (e) {}
    }
  }, []);

  const safeStart = useCallback(() => {
    if (!recognitionRef.current || isSpeaking.current || isListening.current || !enabled) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Si falla al arrancar, intentamos limpiar y reiniciar
      safeStop();
    }
  }, [enabled, safeStop]);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Reconocimiento de voz no soportado en este navegador.");
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
        isListening.current = true;
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log("Comando recibido:", transcript);
        setStatus('processing');
        onCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        isListening.current = false;
        if (event.error === 'not-allowed') {
          setStatus('error');
        } else if (event.error === 'no-speech') {
          setStatus('idle');
        }
      };

      recognition.onend = () => {
        isListening.current = false;
        // Reiniciar automáticamente si sigue habilitado
        if (enabled && !isSpeaking.current) {
          if (restartTimer.current) window.clearTimeout(restartTimer.current);
          restartTimer.current = window.setTimeout(safeStart, 400);
        } else {
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    if (enabled) {
      safeStart();
    } else {
      safeStop();
      setStatus('idle');
    }

    return () => {
      if (restartTimer.current) window.clearTimeout(restartTimer.current);
      safeStop();
    };
  }, [enabled, onCommand, safeStart, safeStop]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    safeStop();
    isSpeaking.current = true;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setStatus('speaking');
    
    utterance.onend = () => {
      isSpeaking.current = false;
      // Esperamos 1 segundo para evitar eco antes de volver a escuchar
      if (enabled) {
        setTimeout(safeStart, 1000);
      } else {
        setStatus('idle');
      }
    };

    synthRef.current.speak(utterance);
  }, [enabled, safeStart, safeStop]);

  return { status, speak };
};
