
import { Recipe } from './types.ts';

const TECNICAS = {
  arroz: {
    ing: ['250g de Arroz Bomba o Carnaroli', '750ml de Caldo de ave o verduras casero', '2 hebras de Azafrán puro', '1 Pimiento rojo', '100g de Judía verde plana', '1 Tomate maduro rallado', 'Queso Parmesano para mantecar', 'Mantequilla fría de calidad', 'Aceite de Oliva Virgen Extra'],
    pasos: [
      "Sofreír los vegetales base en aceite de oliva o mantequilla hasta que doren ligeramente.",
      "Añadir el arroz y nacarar durante 2 minutos para sellar bien el grano.",
      "Si es risotto, añadir el caldo cazo a cazo removiendo constantemente.",
      "Cocer a fuego medio durante 18 minutos exactos.",
      "Mantecar al final con mantequilla y parmesano para la cremosidad definitiva."
    ],
    tips: ["Remover el risotto libera el almidón, clave para la textura melosa.", "El caldo siempre debe estar hirviendo al añadirlo."]
  },
  guiso: {
    ing: ['500g de Proteína seleccionada', '2 Patatas medianas de calidad', '2 Zanahorias frescas', '1 Cebolla blanca picada', '200ml de Vino de cocina', '1 Hoja de laurel seco', 'Sal fina y Pimentón de la Vera'],
    pasos: [
      "Sellar la proteína a fuego fuerte en una olla.",
      "Pochar las verduras con el laurel a fuego lento.",
      "Reducir el vino para concentrar los sabores.",
      "Cubrir con caldo y cocinar a fuego suave.",
      "Añadir las patatas al final para trabar la salsa."
    ],
    tips: ["La paciencia es el ingrediente principal de un buen guiso.", "Prepáralo el día anterior para que los sabores asienten."]
  },
  ensalada: {
    ing: ['200g de Hojas verdes frescas', 'Fruta de temporada madura', 'Aceite de oliva virgen extra', 'Vinagre de Jerez o Módena', 'Frutos secos tostados'],
    pasos: [
      "Lavar y secar muy bien las hojas verdes.",
      "Cortar los complementos en tamaños de bocado.",
      "Preparar la emulsión de la vinagreta en un tarro aparte.",
      "Mezclar con delicadeza para no castigar el vegetal.",
      "Aliñar justo antes de servir para mantener el crujiente."
    ],
    tips: ["Usa sal en escamas para un toque profesional.", "Añade hierbas frescas como albahaca o menta para refrescar."]
  },
  asado: {
    ing: ['Pieza principal (Carne o Pescado)', 'Patatas de guarnición panadera', 'Dientes de ajo machacados', 'Hierbas aromáticas frescas', 'Vino blanco seco de mesa'],
    pasos: [
      "Precalentar el horno a 180 grados.",
      "Hacer una cama con las patatas y cebolla.",
      "Sazonar la pieza con aceite y hierbas.",
      "Hornear regando con sus propios jugos cada 15 min.",
      "Dar un golpe de grill final para el dorado perfecto."
    ],
    tips: ["No pinches la carne para que no pierda sus jugos.", "Usa una sonda térmica si quieres el punto exacto."]
  },
  reposteria: {
    ing: ['250g de Harina de repostería', '150g de Azúcar blanco', '3 Huevos camperos', '100g de Mantequilla sin sal', 'Levadura química en polvo', 'Extracto de vainilla natural'],
    pasos: [
      "Tamizar los ingredientes secos para airear la masa.",
      "Blanquear los huevos con el azúcar hasta que espumen.",
      "Añadir los líquidos y grasas con suavidad.",
      "Incorporar la harina con movimientos envolventes.",
      "Hornear sin abrir la puerta hasta el final del proceso."
    ],
    tips: ["Todos los ingredientes deben estar a temperatura ambiente.", "Engrasa bien el molde con mantequilla y harina."]
  },
  huevos: {
    ing: ['4 Huevos frescos de granja', 'Aceite de oliva virgen', 'Sal fina marina', 'Pimienta negra molida', 'Guarnición vegetal variada', 'Tostadas de pan de masa madre'],
    pasos: [
      "Preparar la base o guarnición elegida.",
      "Cocinar los huevos según la técnica deseada (poché, frito o revuelto).",
      "Controlar el tiempo para mantener la yema melosa.",
      "Montar sobre el pan tostado.",
      "Añadir el toque final de pimienta recién molida."
    ],
    tips: ["Usa huevos muy frescos para que la clara no se disperse.", "Para el revuelto, retira del fuego un poco antes de que parezca listo."]
  },
  saludable: {
    ing: ['250g de Base láctea o yogur griego', 'Semillas y cereales integrales', 'Frutos del bosque frescos', 'Miel o edulcorante natural'],
    pasos: [
      "Disponer la base en un bol amplio.",
      "Decorar con la fruta cortada con estética.",
      "Añadir el toque crujiente de las semillas.",
      "Finalizar con un hilo de miel o sirope.",
      "Servir inmediatamente para disfrutar las texturas."
    ],
    tips: ["Tuesta la granola tú mismo para controlar el azúcar.", "Usa frutas de colores variados para más antioxidantes."]
  }
};

const TITULOS_POOL = {
  desayuno: [
    'Huevos Benedictinos', 'Shakshuka con Queso Feta', 'Bol de Açaí Real', 'Tostada de Aguacate y Huevo Poché',
    'Tortitas de Avena y Plátano', 'Gofres Belgas con Frutas', 'Bollo Suizo de Almendras', 'Panecillo de Salmón Ahumado',
    'Tortilla de Trufa Negra', 'Gachas de Chía y Mango', 'Tostada Francesa Gourmet', 'Bol de Kéfir y Semillas',
    'Huevos Rotos con Jamón Ibérico', 'Muesli Suizo Original', 'Batido Energético en Bol', 'Revuelto de Setas',
    'Crepes de Requesón y Miel', 'Arepa Reina Pepiada', 'Sándwich Mixto con Huevo', 'Huevos Rancheros Tradicionales'
  ],
  aperitivo: [
    'Croquetas de Jamón Caseras', 'Gildas de Anchoa y Oliva', 'Patatas Bravas Crujientes', 'Ensaladilla de Ventresca',
    'Boquerones al Vinagre', 'Pimientos de Padrón', 'Tortilla de Patata Melosa', 'Salmorejo Cordobés',
    'Gambas al Ajillo con Guindilla', 'Pulpo a la Gallega', 'Buñuelos de Queso Manchego', 'Montadito de Carne en Salsa',
    'Mejillones en Escabeche', 'Bombones de Hígado de Pato', 'Crema de Garbanzos con Verduras', 'Tempura de Verduras Finas'
  ],
  primero: [
    'Risotto de Setas y Trufa', 'Risotto de Gamba Roja', 'Risotto de Calabaza y Parmesano',
    'Risotto al Pesto de Albahaca', 'Risotto de Espárragos Trigueros', 'Risotto de Pera y Queso Azul',
    'Risotto Negro con Sepia Fresca', 'Risotto de Setas del Bosque', 'Risotto de Azafrán de la Mancha',
    'Risotto de Verduras de la Huerta', 'Gazpacho de Fresas Maduras', 'Sopa de Cebolla al Estilo Francés', 
    'Lentejas Pardinas con Hígado', 'Arroz a Banda Mediterráneo', 'Pasta al Pesto de Piñones', 
    'Crema de Calabaza y Jengibre', 'Canelones de Carne Gratinados', 'Sopa de Verduras Italiana'
  ],
  segundo: [
    'Cochinillo Asado Crujiente', 'Bacalao al Pil-Pil Tradicional', 'Solomillo al Vino de Oporto', 'Merluza en Salsa Verde',
    'Carrilleras de Cerdo al Vino Tinto', 'Pollo en Salsa de Almendras', 'Lubina a la Sal del Mediterráneo', 'Cordero Lechal al Horno de Leña',
    'Albóndigas en Salsa Española', 'Rabo de Toro Estofado', 'Entrecot a la Pimienta Verde', 'Atún Rojo con Salsa de Soja'
  ],
  postre: [
    'Arroz con Leche Cremoso', 'Tarta de Queso de la Viña', 'Natillas con Galleta María', 'Torrijas de Pan de Brioche',
    'Flan de Huevo de la Abuela', 'Mousse de Chocolate Negro Puro', 'Tarta de Santiago Tradicional', 'Crema Catalana Tostada',
    'Bizcocho con Corazón de Chocolate', 'Tarta de Manzana Casera', 'Postre de Café y Mascarpone', 'Crema de Nata y Vainilla'
  ]
};

export const RECIPES: Recipe[] = ((): Recipe[] => {
  const todas: Recipe[] = [];
  const cats: Recipe['category'][] = ['desayuno', 'aperitivo', 'primero', 'segundo', 'postre'];
  const ITEMS_PER_CAT = 200;

  cats.forEach((cat, cIdx) => {
    const pool = TITULOS_POOL[cat];

    for (let i = 0; i < ITEMS_PER_CAT; i++) {
      const baseTitle = pool[i % pool.length];
      const suffix = i >= pool.length ? `Nº${i + 1}` : '';
      const title = `${baseTitle} ${suffix}`.trim();
      
      let tecnica = TECNICAS.ensalada;
      const tLow = title.toLowerCase();
      
      if (cat === 'desayuno') {
        if (tLow.includes('huevo') || tLow.includes('revuelto') || tLow.includes('shakshuka')) {
          tecnica = TECNICAS.huevos;
        } else if (tLow.includes('bol') || tLow.includes('yogur') || tLow.includes('chía')) {
          tecnica = TECNICAS.saludable;
        } else if (tLow.includes('tortitas') || tLow.includes('gofres') || tLow.includes('crepes')) {
          tecnica = TECNICAS.reposteria;
        } else {
          tecnica = TECNICAS.huevos;
        }
      } else if (cat === 'postre') {
        tecnica = TECNICAS.reposteria;
      } else {
        if (tLow.includes('arroz') || tLow.includes('risotto')) {
          tecnica = TECNICAS.arroz;
        } else if (tLow.includes('asado') || tLow.includes('horno')) {
          tecnica = TECNICAS.asado;
        } else if (cat === 'segundo' || tLow.includes('guiso') || tLow.includes('carrilleras')) {
          tecnica = TECNICAS.guiso;
        } else {
          tecnica = TECNICAS.ensalada;
        }
      }

      todas.push({
        id: (cIdx + 1) * 1000 + i,
        title,
        category: cat,
        image: `https://picsum.photos/600/400?random=${(cIdx + 1) * 1000 + i}`,
        description: `Disfruta de la mejor versión de ${title}. Un plato equilibrado que destaca por su frescura y respeto a la tradición culinaria española.`,
        ingredients: [...tecnica.ing],
        steps: [...tecnica.pasos],
        tips: [...tecnica.tips],
        time: i % 3 === 0 ? '20 min' : i % 2 === 0 ? '50 min' : '35 min',
        difficulty: i % 5 === 0 ? 'Alta' : i % 3 === 0 ? 'Media' : 'Baja'
      });
    }
  });
  
  return todas;
})();
