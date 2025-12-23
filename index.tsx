
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("No se pudo encontrar el elemento root. Verifica el index.html");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Error fatal durante el montaje de GourmetVoice:", error);
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; font-family: sans-serif; color: #444;">
      <h1 style="font-size: 1.5rem; margin-bottom: 10px;">Vaya, algo ha fallado</h1>
      <p>La aplicación no pudo iniciarse correctamente. Por favor, recarga la página.</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; border-radius: 8px; border: none; bg: #000; color: #fff; cursor: pointer;">Recargar ahora</button>
    </div>
  `;
}
