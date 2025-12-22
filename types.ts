
export interface Recipe {
  id: number;
  title: string;
  category: 'aperitivo' | 'primero' | 'segundo' | 'postre' | 'otros';
  image: string;
  description: string;
  ingredients: string[];
  steps: string[];
  tips: string[]; // Consejos adicionales del chef
  time: string;
  difficulty: 'Baja' | 'Media' | 'Alta';
}

export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export type VoiceStatus = 'idle' | 'speaking' | 'listening' | 'processing' | 'error';
