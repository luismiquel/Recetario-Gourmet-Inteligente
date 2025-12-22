export interface Recipe {
  id: number;
  title: string;
  category: 'aperitivo' | 'primero' | 'segundo' | 'postre' | 'otros';
  image: string;
  description: string;
  ingredients: string[];
  steps: string[];
  time: string;
  difficulty: string;
}

// Polyfill types for SpeechRecognition since it's not fully standard in TS yet
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export type VoiceStatus = 'idle' | 'speaking' | 'listening' | 'processing' | 'error';
