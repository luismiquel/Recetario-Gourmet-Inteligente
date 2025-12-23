
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

  // Sonido de feedback táctil/auditivo nativo
  const playFeedback = (type: 'success' | 'start') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'success' ? 880 : 440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(type === 'success' ? 440 : 880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      isListeningRef.current = false;
    }
  }, []);

  const startRecognition = useCallback(() => {
    // Si estamos hablando o ya escuchando o deshabilitado, no hacemos nada
    if (isSpeakingRef.current || isListeningRef.current || !enabled) return;

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Manejar el caso donde el navegador cree que sigue activo
      if (e instanceof Error && e.name === 'InvalidStateError') {
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
        playFeedback('success');
        setStatus('processing');
        onCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        isListeningRef.current = false;
        if (event.error === 'not-allowed') setStatus('error');
        // Si hay error de silencio, el onend lo reiniciará si es necesario
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // Reinicio automático con delay para no saturar el micro
        if (enabled && !isSpeakingRef.current) {
          if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
          restartTimerRef.current = window.setTimeout(startRecognition, 300);
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

    // Detener escucha antes de hablar para evitar que el micro se escuche a sí mismo
    stopRecognition();
    isSpeakingRef.current = true;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = 1.0;
    utterance.rate = 1.0;

    utterance.onstart = () => setStatus('speaking');
    
    const handleEnd = () => {
      isSpeakingRef.current = false;
      if (enabled) {
        // Delay para asegurar que el sintetizador liberó el audio
        setTimeout(startRecognition, 500);
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
