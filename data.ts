
import { Recipe } from './types';

const TECNICAS = {
  arroz: {
    ing: ['250g de Arroz Bomba', '750ml de Caldo de ave', '2 hebras de Azafrán', '1 Pimiento rojo', '100g de Judía verde', '1 Tomate rallado'],
    pasos: [
      "Sofreír el pimiento y las verduras en aceite de oliva hasta que doren.",
      "Añadir el tomate rallado y cocinar hasta que el agua se evapore.",
      "Incorporar el arroz y nacarar durante 2 minutos para sellar el grano.",
      "Verter el caldo caliente con el azafrán y cocer 18 minutos sin remover.",
      "Dejar reposar 5 minutos con un paño antes de servir."
    ],
    tips: ["El sofrito lento es la base de todo buen arroz.", "No remuevas el grano para que no suelte el almidón."]
  },
  guiso: {
    ing: ['500g de Carne de ternera', '2 Patatas grandes', '2 Zanahorias', '1 Cebolla blanca', '200ml de Vino tinto', '1 Hoja de laurel'],
    pasos: [
      "Sellar la carne a fuego fuerte en una olla con un chorro de aceite.",
      "Añadir la cebolla y zanahoria picadas y pochar a fuego lento.",
      "Verter el vino y dejar reducir a la mitad para evaporar el alcohol.",
      "Cubrir con agua o caldo y añadir el laurel.",
      "Cocinar a fuego suave hasta que la carne esté tierna y la salsa espese."
    ],
    tips: ["Chascar las patatas para que suelten almidón.", "Cocina a fuego muy lento para una textura melosa."]
  },
  ensalada: {
    ing: ['200g de Brotes tiernos', '2 Tomates de huerta', '100ml de Aceite de oliva virgen', '30ml de Vinagre de Jerez', '50g de Frutos secos'],
    pasos: [
      "Lavar y secar muy bien las hojas de lechuga.",
      "Trocear los vegetales en tamaños de bocado cómodos.",
      "Preparar la vinagreta mezclando aceite, vinagre y sal en un tarro.",
      "Emulsionar la salsa agitando con energía.",
      "Aliñar justo antes de servir para mantener el crujiente."
    ],
    tips: ["La lechuga debe estar muy seca antes de añadir el aceite.", "Añade los frutos secos al final."]
  },
  asado: {
    ing: ['1 Pieza principal (Carne o Pescado)', '3 Patatas medianas', '4 Dientes de ajo', '1 Manojo de Perejil', '150ml de Vino blanco'],
    pasos: [
      "Precalentar el horno a 180 grados con ventilación.",
      "Colocar una cama de patatas y cebolla en la base de la bandeja.",
      "Salpimentar la pieza y colocarla encima de las verduras.",
      "Hornear regando con el vino y su propio jugo cada 15 minutos.",
      "Dorar a máxima potencia los últimos 5 minutos."
    ],
    tips: ["Precalentar el horno es vital para un asado uniforme.", "No abras la puerta del horno constantemente."]
  },
  reposteria: {
    ing: ['250g de Harina', '150g de Azúcar', '3 Huevos camperos', '100g de Mantequilla', '1 Sobre de Levadura', '1 Cucharadita de Vainilla'],
    pasos: [
      "Tamizar la harina con la levadura para que no queden grumos.",
      "Batir los huevos con el azúcar hasta que la mezcla blanquee.",
      "Añadir la mantequilla derretida y la vainilla poco a poco.",
      "Incorporar los secos con movimientos suaves y envolventes.",
      "Hornear a 170 grados hasta que al pinchar salga limpio."
    ],
    tips: ["Ten todos los ingredientes a temperatura ambiente.", "No abras el horno antes de los 20 minutos."]
  }
};

const TITULOS_POOL = {
  aperitivo: [
    'Gildas del Norte', 'Croquetas de Jamón', 'Patatas Bravas', 'Ensaladilla Gourmet', 'Boquerones en Vinagre',
    'Pimientos Rellenos', 'Tortilla Trufada', 'Salmorejo Denso', 'Gambas al Ajillo', 'Pulpo a la Gallega',
    'Buñuelos de Bacalao', 'Montadito de Pringá', 'Champiñones al Ajillo', 'Mejillones al Vapor', 'Queso en Aceite'
  ],
  primero: [
    'Gazpacho Andaluz', 'Sopa de Picadillo', 'Lentejas Estofadas', 'Arroz a Banda', 'Pasta al Pesto',
    'Crema de Calabacín', 'Canelones de Carne', 'Garbanzos con Espinacas', 'Risotto de Setas', 'Vichyssoise Fría'
  ],
  segundo: [
    'Cochinillo Asado', 'Bacalao al Pil-Pil', 'Solomillo al Cabrales', 'Merluza en Salsa Verde', 'Carrilleras al Vino',
    'Pollo en Pepitoria', 'Lubina a la Espalda', 'Cordero al Horno', 'Albóndigas con Almendras', 'Rabo de Toro'
  ],
  postre: [
    'Arroz con Leche', 'Tarta de Queso', 'Natillas Caseras', 'Torrijas de Leche', 'Flan de Huevo',
    'Mousse de Chocolate', 'Tarta de Santiago', 'Crema Catalana', 'Brownie de Nueces', 'Coulant de Chocolate'
  ]
};

export const RECIPES: Recipe[] = ((): Recipe[] => {
  const todas: Recipe[] = [];
  const cats: Recipe['category'][] = ['aperitivo', 'primero', 'segundo', 'postre'];
  
  cats.forEach((cat, cIdx) => {
    const pool = TITULOS_POOL[cat];
    for (let i = 0; i < 100; i++) {
      const baseTitle = pool[i % pool.length];
      const title = i < pool.length ? baseTitle : `${baseTitle} (Variante ${Math.floor(i/pool.length)})`;
      
      let tecnica = TECNICAS.ensalada;
      const tLow = title.toLowerCase();
      if (tLow.includes('arroz') || tLow.includes('risotto')) tecnica = TECNICAS.arroz;
      else if (cat === 'postre') tecnica = TECNICAS.reposteria;
      else if (tLow.includes('horno') || tLow.includes('asado')) tecnica = TECNICAS.asado;
      else if (cat === 'segundo' || tLow.includes('salsa') || tLow.includes('guiso')) tecnica = TECNICAS.guiso;

      todas.push({
        id: (cIdx + 1) * 100 + i,
        title,
        category: cat,
        image: `https://picsum.photos/600/400?random=${(cIdx + 1) * 100 + i}`,
        description: `Receta tradicional de ${title} elaborada con ingredientes de proximidad y técnica artesanal española.`,
        ingredients: tecnica.ing,
        steps: tecnica.pasos,
        tips: tecnica.tips,
        time: i % 2 === 0 ? '30 min' : '45 min',
        difficulty: i % 3 === 0 ? 'Baja' : 'Media'
      });
    }
  });
  return todas;
})();
