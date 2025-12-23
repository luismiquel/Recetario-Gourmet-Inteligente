
import { Recipe } from './types';

const TECNICAS = {
  arroz: {
    ing: ['250g de Arroz Bomba', '750ml de Caldo de ave', '2 hebras de Azafrán', '1 Pimiento rojo', '100g de Judía verde', '1 Tomate rallado', 'Aceite de Oliva Virgen Extra'],
    pasos: [
      "Sofreír el pimiento y las verduras en aceite de oliva hasta que doren.",
      "Añadir el tomate rallado y cocinar hasta que el agua se evapore.",
      "Incorporar el arroz y nacarar durante 2 minutos para sellar el grano.",
      "Verter el caldo caliente con el azafrán y cocer 18 minutos sin remover.",
      "Dejar reposar 5 minutos con un paño antes de servir."
    ],
    tips: ["El sofrito lento es la base de todo buen arroz.", "Usa un recipiente de base ancha para que el arroz no se apile."]
  },
  guiso: {
    ing: ['500g de Carne de ternera o ave', '2 Patatas medianas', '2 Zanahorias', '1 Cebolla blanca', '200ml de Vino tinto o blanco', '1 Hoja de laurel', 'Pimentón de la Vera'],
    pasos: [
      "Sellar la proteína a fuego fuerte en una olla con un chorro de aceite.",
      "Añadir la cebolla y zanahoria picadas y pochar a fuego lento con el laurel.",
      "Verter el vino y dejar reducir a la mitad para evaporar el alcohol.",
      "Cubrir con agua o caldo y cocinar a fuego suave.",
      "Añadir las patatas chascadas al final para espesar la salsa con su almidón."
    ],
    tips: ["Cocinar a fuego muy lento asegura una textura melosa.", "Si el guiso queda líquido, tritura una patata y añádela de nuevo."]
  },
  ensalada: {
    ing: ['200g de Brotes tiernos o vegetales base', 'Fruta fresca de temporada', '100ml de Aceite de oliva virgen', '30ml de Vinagre balsámico', '50g de Frutos secos tostados'],
    pasos: [
      "Lavar y secar meticulosamente las hojas para que el aliño se adhiera bien.",
      "Trocear los vegetales en tamaños de bocado elegantes.",
      "Preparar la vinagreta emulsionando el aceite, el vinagre y una pizca de sal.",
      "Añadir los elementos crujientes y la fruta al final.",
      "Aliñar en el último segundo antes de llevar a la mesa."
    ],
    tips: ["La temperatura de los ingredientes es clave: todo bien frío.", "No abuses del vinagre para no enmascarar el sabor del vegetal."]
  },
  asado: {
    ing: ['1 Pieza principal (Carne, Pescado o Verdura)', '3 Patatas para asar', '4 Dientes de ajo', '1 Manojo de Hierbas frescas', '150ml de Vino blanco seco'],
    pasos: [
      "Precalentar el horno a 190 grados con calor arriba y abajo.",
      "Colocar una base de verduras de raíz cortadas finamente.",
      "Marinar la pieza principal con aceite, hierbas y ajos machacados.",
      "Hornear regando con el vino cada 15-20 minutos para hidratar.",
      "Utilizar el grill los últimos minutos para una piel o corteza crujiente."
    ],
    tips: ["Saca la pieza de la nevera una hora antes para que se atempere.", "Deja reposar la carne asada 10 minutos antes de cortarla."]
  },
  reposteria: {
    ing: ['250g de Harina tamizada', '150g de Azúcar de caña', '3 Huevos camperos', '100g de Mantequilla pomada', '1 Sobre de Impulsor', 'Esencia de vainilla o ralladura de cítricos'],
    pasos: [
      "Tamizar los ingredientes secos para evitar grumos y airear la masa.",
      "Batir los huevos con el azúcar hasta que doblen su volumen.",
      "Incorporar la materia grasa y los aromas con delicadeza.",
      "Mezclar con movimientos envolventes para no perder el aire.",
      "Hornear a temperatura constante hasta que al insertar un palillo salga limpio."
    ],
    tips: ["La paciencia es el ingrediente secreto: no abras el horno antes de tiempo.", "Usa moldes de calidad para una distribución de calor uniforme."]
  },
  huevos: {
    ing: ['4 Huevos de corral', 'Aceite de oliva virgen extra', 'Sal en escamas', 'Pimienta de molinillo', 'Guarnición de temporada (aguacate, setas o ibérico)', 'Tostada de pan artesano'],
    pasos: [
      "Calentar el aceite o agua según la técnica elegida (frito, poché o revuelto).",
      "Cocinar el huevo respetando el tiempo para mantener la yema líquida.",
      "Preparar la base de pan tostado con un poco de grasa saludable.",
      "Montar el plato con los complementos calientes o frescos.",
      "Sazonar justo en el momento de servir."
    ],
    tips: ["Para un revuelto perfecto, cocina a fuego muy bajo y retira antes de que cuaje del todo.", "Usa huevos a temperatura ambiente para que no se rompa la cadena de calor."]
  },
  saludable: {
    ing: ['250g de Base láctea o vegetal (yogur, kéfir)', 'Granola casera sin azúcar', 'Mix de semillas (chía, sésamo, lino)', 'Frutos rojos frescos', 'Miel de apicultor o sirope de arce'],
    pasos: [
      "Servir la base fría en un bol de cerámica o cristal.",
      "Disponer la fruta cortada creando un abanico de colores.",
      "Añadir la granola en una zona lateral para que mantenga el crujiente.",
      "Espolvorear las semillas por toda la superficie.",
      "Finalizar con el endulzante natural en forma de hilo fino."
    ],
    tips: ["Tuesta las semillas un poco antes para que liberen sus aceites esenciales.", "Cambia la fruta según la estación para variar los nutrientes."]
  }
};

const TITULOS_POOL = {
  desayuno: [
    'Huevos Benedictinos', 'Shakshuka con Queso Feta', 'Bowl de Açaí y Granola', 'Tostada de Aguacate y Poché',
    'Tortitas de Avena y Plátano', 'Gofres de Lieja con Frutas', 'Croissant de Almendras', 'Bagel de Salmón y Crema',
    'Omelette de Trufa y Espárragos', 'Porridge de Chía y Mango', 'Tostada Francesa Brioche', 'Bowl de Kéfir y Chía',
    'Huevos Rotos con Jamón', 'Muesli Bircher Suizo', 'Smoothie Bowl de Espirulina', 'Revuelto de Setas Silvestres',
    'Quiche de Espinacas de Mañana', 'Burrito de Desayuno Tex-Mex', 'Crepes de Ricotta y Miel', 'Pancakes de Arándanos',
    'Arepa con Perico Gourmet', 'Tostada de Mantequilla de Almendra', 'Chilaquiles Verdes con Huevo', 'Sándwich Croque Madame',
    'Yogur con Granola de Lavanda', 'Tostada de Higo y Requesón', 'Smoothie de Frutos del Bosque', 'Tarta de Tomate y Albahaca',
    'Huevos al Plato con Chorizo', 'Wrap de Pavo y Huevo', 'Bowl de Quinoa Dulce', 'Tortilla de Patatas Matinal',
    'Rollitos de Canela Caseros', 'Pudin de Semillas y Coco', 'Gofres de Espelta y Cacao', 'Muffins de Calabacín y Huevo',
    'Tostada de Queso de Cabra y Miel', 'Revuelto de Salmón Ahumado', 'Bowl de Fruta Tropical', 'Té Matcha con Tostada Zen'
  ],
  aperitivo: [
    'Croquetas de Jamón Ibérico', 'Gildas de Anchoa y Oliva', 'Patatas Bravas Gourmet', 'Ensaladilla de Ventresca',
    'Boquerones en Vinagre Real', 'Pimientos Rellenos de Bacalao', 'Tortilla de Patata Trufada', 'Salmorejo Cordobés',
    'Gambas al Ajillo con Guindilla', 'Pulpo a la Gallega Tradicional', 'Buñuelos de Queso Mahón', 'Montadito de Pringá',
    'Champiñones Rellenos de Jamón', 'Mejillones en Escabeche', 'Bombones de Queso y Nueces', 'Crujiente de Berenjena',
    'Aceitunas Aliñadas de la Casa', 'Tabla de Quesos Artesanos', 'Hummus de Garbanzo y Tahini', 'Brocheta de Tomatitos y Mozzarella'
  ],
  primero: [
    'Gazpacho de Fresas y Tomate', 'Sopa de Cebolla Gratinada', 'Lentejas con Foie', 'Arroz a Banda del Delta',
    'Pasta al Pesto Genovés', 'Crema de Calabaza y Jengibre', 'Canelones de Asado', 'Ensalada César con Pollo Campero',
    'Risotto de Boletus Edulis', 'Vichyssoise con Puerro Joven', 'Ensalada de Quinoa y Granada', 'Pasta Carbonara Original',
    'Sopa de Pescado de Roca', 'Lasaña de Verduras de la Huerta', 'Minestrone de Estación', 'Crema de Marisco Real'
  ],
  segundo: [
    'Cochinillo Asado a Baja Temperatura', 'Bacalao al Pil-Pil Esmeralda', 'Solomillo de Ternera al Oporto', 'Merluza en Salsa Verde',
    'Carrilleras de Cerdo al Vino Tinto', 'Pollo de Corral en Pepitoria', 'Lubina a la Sal de Manantial', 'Cordero Lechal al Horno',
    'Albóndigas con Salsa de Almendra', 'Rabo de Toro Estofado', 'Entrecot a la Pimienta Verde', 'Atún Rojo con Sésamo',
    'Pato a la Naranja Amarga', 'Estofado de Venado y Setas', 'Lubina con Costra de Hierbas', 'Salmonetes con Escamas de Patata'
  ],
  postre: [
    'Arroz con Leche y Caramelo', 'Tarta de Queso Fluida', 'Natillas de la Abuela', 'Torrijas de Brioche',
    'Flan de Huevo y Vainilla', 'Mousse de Chocolate al 70%', 'Tarta de Santiago Original', 'Crema Catalana Quemada',
    'Brownie de Nueces Macadamia', 'Coulant de Chocolate Negro', 'Sorbete de Limón y Cava', 'Tarta de Manzana Reineta',
    'Milhojas de Crema y Nata', 'Panna Cotta de Frutos Rojos', 'Tocino de Cielo de Jerez', 'Peras al Vino con Canela'
  ]
};

export const RECIPES: Recipe[] = ((): Recipe[] => {
  const todas: Recipe[] = [];
  const cats: Recipe['category'][] = ['desayuno', 'aperitivo', 'primero', 'segundo', 'postre'];
  
  // Generamos exactamente 200 recetas por cada categoría para un total de 1,000
  cats.forEach((cat, cIdx) => {
    const pool = TITULOS_POOL[cat];
    const totalPorCat = 200;

    for (let i = 0; i < totalPorCat; i++) {
      const baseTitle = pool[i % pool.length];
      // Para evitar nombres idénticos, añadimos una variante o detalle si el pool se repite
      const suffix = i >= pool.length ? `(Edición ${Math.floor(i / pool.length) + 1})` : '';
      const title = `${baseTitle} ${suffix}`.trim();
      
      let tecnica = TECNICAS.ensalada;
      const tLow = title.toLowerCase();
      
      // Lógica de mapeo de técnica según nombre y categoría
      if (cat === 'desayuno') {
        if (tLow.includes('huevo') || tLow.includes('omelette') || tLow.includes('revuelto') || tLow.includes('shakshuka') || tLow.includes('madame')) {
          tecnica = TECNICAS.huevos;
        } else if (tLow.includes('bowl') || tLow.includes('pudding') || tLow.includes('yogur') || tLow.includes('muesli') || tLow.includes('chía')) {
          tecnica = TECNICAS.saludable;
        } else if (tLow.includes('tortitas') || tLow.includes('pancakes') || tLow.includes('gofres') || tLow.includes('crepes') || tLow.includes('croissant') || tLow.includes('rollitos') || tLow.includes('tarta')) {
          tecnica = TECNICAS.reposteria;
        } else {
          tecnica = TECNICAS.huevos; // Por defecto para desayunos, la técnica de huevo/tostada es común
        }
      } else if (cat === 'postre') {
        tecnica = TECNICAS.reposteria;
      } else {
        if (tLow.includes('arroz') || tLow.includes('risotto') || tLow.includes('paella')) {
          tecnica = TECNICAS.arroz;
        } else if (tLow.includes('horno') || tLow.includes('asado') || tLow.includes('asada') || tLow.includes('lubina') || tLow.includes('solomillo')) {
          tecnica = TECNICAS.asado;
        } else if (cat === 'segundo' || tLow.includes('salsa') || tLow.includes('guiso') || tLow.includes('estofado') || tLow.includes('carrilleras')) {
          tecnica = TECNICAS.guiso;
        } else {
          tecnica = TECNICAS.ensalada;
        }
      }

      todas.push({
        id: (cIdx + 1) * 1000 + i, // IDs únicos y estructurados
        title,
        category: cat,
        image: `https://picsum.photos/600/400?random=${(cIdx + 1) * 1000 + i}`,
        description: `Disfruta de la sofisticación de ${title}. Una receta diseñada para resaltar los sabores naturales con técnicas de alta cocina adaptadas al hogar.`,
        ingredients: [...tecnica.ing],
        steps: [...tecnica.pasos],
        tips: [...tecnica.tips],
        time: i % 3 === 0 ? '15 min' : i % 2 === 0 ? '45 min' : '30 min',
        difficulty: i % 4 === 0 ? 'Alta' : i % 2 === 0 ? 'Media' : 'Baja'
      });
    }
  });
  
  return todas;
})();
