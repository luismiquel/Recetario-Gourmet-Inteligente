
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
  const restartTimeout = useRef<number | null>(null);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current && isListening.current) {
      try {
        recognitionRef.current.abort();
        isListening.current = false;
      } catch (e) {
        console.error("Error al detener reconocimiento:", e);
      }
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || isSpeaking.current || isListening.current || !enabled) return;
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Si ya está corriendo, abortamos y reintentamos en el siguiente ciclo
      stopRecognition();
    }
  }, [enabled, stopRecognition]);

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
        isListening.current = true;
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log("🎤 Comando:", transcript);
        setStatus('processing');
        onCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        isListening.current = false;
        if (event.error === 'not-allowed') {
          console.error("Permiso de micrófono denegado");
          setStatus('error');
        } else if (event.error === 'no-speech') {
          setStatus('idle');
        }
      };

      recognition.onend = () => {
        isListening.current = false;
        if (enabled && !isSpeaking.current) {
          if (restartTimeout.current) window.clearTimeout(restartTimeout.current);
          restartTimeout.current = window.setTimeout(startRecognition, 300);
        } else {
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    if (enabled) {
      startRecognition();
    } else {
      stopRecognition();
    }

    return () => {
      if (restartTimeout.current) window.clearTimeout(restartTimeout.current);
      stopRecognition();
    };
  }, [enabled, onCommand, startRecognition, stopRecognition]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Detenemos la escucha para que no se oiga a sí mismo
    stopRecognition();
    isSpeaking.current = true;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    utterance.onstart = () => setStatus('speaking');
    
    utterance.onend = () => {
      isSpeaking.current = false;
      // Esperamos un momento para que el eco del altavoz se disipe antes de escuchar
      if (enabled) {
        setTimeout(startRecognition, 700);
      } else {
        setStatus('idle');
      }
    };

    synthRef.current.speak(utterance);
  }, [enabled, startRecognition, stopRecognition]);

  return { status, speak };
};
