
# GourmetVoice 👨‍🍳

GourmetVoice es un recetario interactivo premium diseñado para ofrecer una experiencia de cocina completamente manos libres. Utilizando tecnologías nativas de reconocimiento y síntesis de voz, permite a los usuarios navegar por cientos de recetas, gestionar tiempos y listas de compra sin necesidad de tocar la pantalla mientras cocinan.

## ✨ Características Principales

- **Control por Voz Inteligente**: Navega entre pasos, solicita repeticiones y gestiona temporizadores mediante comandos de voz naturales.
- **Modo Cocina XXL**: Interfaz optimizada con tipografía de gran tamaño para máxima visibilidad a distancia.
- **Gestión de Despensa**: Añade ingredientes a tu lista de la compra de forma automática.
- **Escalabilidad de Porciones**: Ajusta las cantidades de los ingredientes (x1, x2, x4) dinámicamente.
- **Temporizadores Integrados**: Cuenta atrás visual y sonora vinculada al asistente de voz.
- **Fichas de Impresión Gourmet**: Estilos CSS específicos para imprimir tus recetas favoritas en un formato profesional.
- **Privacidad Total**: El procesamiento de voz se realiza localmente en el navegador utilizando las APIs estándares del sistema.

## 🚀 Instalación y Uso Local

Sigue estos pasos para ejecutar la aplicación en tu entorno local:

### Requisitos Previos

- **Node.js** (Versión 18 o superior recomendada)
- Un navegador moderno compatible con **Web Speech API** (Chrome, Edge o Safari).

### Pasos de Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Acceder a la aplicación**:
   Abre tu navegador en la dirección local indicada en la consola (usualmente `http://localhost:3000`).

## 🗣️ Comandos de Voz Disponibles

Una vez activado el asistente dentro de una receta, puedes utilizar los siguientes comandos:

- **"Siguiente paso" / "Listo"**: Avanza a la siguiente instrucción.
- **"Anterior" / "Vuelve atrás"**: Regresa al paso previo.
- **"Repite el paso" / "Dime qué toca"**: El asistente volverá a leer la instrucción actual.
- **"Temporizador de X minutos"**: Configura una cuenta atrás (ej. "Temporizador de 10 minutos").
- **"Cerrar receta" / "Salir"**: Vuelve al menú principal.

## 🛠️ Tecnologías Utilizadas

- **React**: Biblioteca principal para la interfaz de usuario.
- **Tailwind CSS**: Estilizado moderno y responsivo.
- **Web Speech API**: Para el reconocimiento de voz (`SpeechRecognition`) y síntesis de voz (`SpeechSynthesis`).
- **LocalStorage**: Persistencia de favoritos, progreso de recetas y lista de la compra.

---

Desarrollado con enfoque en la accesibilidad y la experiencia de usuario en entornos de cocina reales.
