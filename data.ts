
import { Recipe } from './types.ts';

const TECNICAS = {
  arroz: {
    ing: ['250g de Arroz Bomba o Carnaroli', '750ml de Caldo de ave o verduras casero', '2 hebras de Azafrán puro', '1 Pimiento rojo', '100g de Judía verde plana', '1 Tomate maduro rallado', 'Queso Parmesano (para risottos)', 'Mantequilla fría (para risottos)', 'Aceite de Oliva Virgen Extra'],
    pasos: [
      "Sofreír los vegetales base en aceite de oliva o mantequilla hasta que doren ligeramente.",
      "Añadir el arroz y nacarar durante 2 minutos para sellar bien el grano y que suelte el almidón gradualmente.",
      "Si es risotto, añadir el caldo cazo a cazo removiendo constantemente para crear la cremosidad.",
      "Si es arroz seco, verter todo el caldo caliente de una vez y cocer 18 minutos sin remover.",
      "Mantecar al final con mantequilla y parmesano si es técnica de risotto o dejar reposar 5 minutos si es paella."
    ],
    tips: ["El secreto es el movimiento constante para el risotto y el reposo absoluto para el arroz seco.", "Utiliza un caldo de alta calidad, es el alma del plato."]
  },
  guiso: {
    ing: ['500g de Carne de ternera o ave', '2 Patatas medianas', '2 Zanahorias', '1 Cebolla blanca picada', '200ml de Vino tinto o blanco', '1 Hoja de laurel', 'Pimentón de la Vera'],
    pasos: [
      "Sellar la proteína a fuego fuerte en una olla con un chorro de aceite.",
      "Añadir la cebolla y zanahoria picadas y pochar a fuego lento con el laurel.",
      "Verter el vino y dejar reducir a la mitad para que evapore el alcohol.",
      "Cubrir con agua o caldo y cocinar a fuego suave hasta que esté tierno.",
      "Añadir las patatas chascadas al final para espesar la salsa naturalmente."
    ],
    tips: ["Cocinar a fuego muy lento asegura una textura melosa y tierna.", "Si el guiso queda líquido, tritura una patata y añádela de nuevo."]
  },
  ensalada: {
    ing: ['200g de Brotes tiernos de temporada', 'Fruta fresca cortada', '100ml de Aceite de oliva virgen', '30ml de Vinagre balsámico', '50g de Frutos secos tostados'],
    pasos: [
      "Lavar y secar muy bien las hojas para que el aliño no resbale.",
      "Trocear los vegetales en tamaños uniformes de bocado.",
      "Preparar la vinagreta emulsionando bien el aceite y el vinagre.",
      "Añadir los elementos crujientes y la fruta justo al final.",
      "Aliñar en el último segundo antes de llevar a la mesa."
    ],
    tips: ["La temperatura es clave: mantén todos los ingredientes bien fríos.", "No abuses del vinagre para no tapar el sabor del vegetal."]
  },
  asado: {
    ing: ['1 Pieza principal (Carne, Pescado o Verdura)', '3 Patatas para asar', '4 Dientes de ajo machacados', '1 Manojo de Hierbas frescas', '150ml de Vino blanco seco'],
    pasos: [
      "Precalentar el horno a 190 grados con calor arriba y abajo.",
      "Colocar una base de verduras de raíz cortadas en láminas finas.",
      "Marinar la pieza principal con aceite, hierbas y los ajos.",
      "Hornear regando con el vino cada 15 minutos para que no se seque.",
      "Usar el grill los últimos minutos para conseguir una costra crujiente."
    ],
    tips: ["Saca la pieza de la nevera una hora antes para que se atempere.", "Deja reposar la carne asada 10 minutos antes de cortarla."]
  },
  reposteria: {
    ing: ['250g de Harina tamizada', '150g de Azúcar de caña', '3 Huevos camperos', '100g de Mantequilla en pomada', '1 Sobre de Levadura', 'Esencia de vainilla o ralladura de limón'],
    pasos: [
      "Tamizar los ingredientes secos para evitar grumos y airear la masa.",
      "Batir los huevos con el azúcar hasta que doblen su volumen inicial.",
      "Incorporar la materia grasa y los aromas con mucha delicadeza.",
      "Mezclar con movimientos envolventes para no perder el aire del batido.",
      "Hornear a temperatura constante hasta que al insertar un palillo salga limpio."
    ],
    tips: ["No abras el horno antes de tiempo para que la masa no baje.", "Usa moldes de calidad para que el calor se distribuya uniforme."]
  },
  huevos: {
    ing: ['4 Huevos de corral frescos', 'Aceite de oliva vires extra', 'Sal en escamas', 'Pimienta negra de molinillo', 'Guarnición (aguacate o setas)', 'Pan artesano tostado'],
    pasos: [
      "Calentar el aceite o agua según la técnica elegida (frito o poché).",
      "Cocinar el huevo respetando el tiempo para que la yema quede líquida.",
      "Preparar la base de pan tostado con un poco de aceite.",
      "Montar el plato con los complementos calientes.",
      "Sazonar con la sal en escamas justo antes de servir."
    ],
    tips: ["Para un revuelto perfecto, cocina a fuego muy bajo y retira antes de que cuaje.", "Usa huevos a temperatura ambiente para un mejor resultado."]
  },
  saludable: {
    ing: ['250g de Base láctea (yogur natural o kéfir)', 'Granola casera crujiente', 'Mix de semillas (chía y sésamo)', 'Frutos rojos frescos', 'Miel pura o sirope'],
    pasos: [
      "Servir la base bien fría en un bol de cerámica.",
      "Disponer la fruta cortada creando un diseño atractivo.",
      "Añadir la granola en un lateral para que no se ablande.",
      "Espolvorear las semillas por toda la superficie.",
      "Finalizar con el endulzante natural cayendo en hilo fino."
    ],
    tips: ["Tuesta las semillas un poco antes para potenciar su aroma.", "Cambia la fruta según la estación del año para variar nutrientes."]
  }
};

const TITULOS_POOL = {
  desayuno: [
    'Huevos Benedictinos', 'Shakshuka con Queso Feta', 'Bol de Açaí y Granola', 'Tostada de Aguacate y Poché',
    'Tortitas de Avena y Plátano', 'Gofres de Lieja con Frutas', 'Suizo de Almendras', 'Panecillo de Salmón y Crema',
    'Tortilla de Trufa y Espárragos', 'Gachas de Chía y Mango', 'Tostada Francesa de Brioche', 'Bol de Kéfir y Semillas',
    'Huevos Rotos con Jamón', 'Muesli Suizo Original', 'Batido en Bol de Espirulina', 'Revuelto de Setas Silvestres',
    'Pastel de Espinacas Matinal', 'Burrito de Desayuno Mexicano', 'Crepes de Ricota y Miel', 'Tortitas de Arándanos',
    'Arepa con Perico Gourmet', 'Tostada de Mantequilla de Almendra', 'Chilaquiles Verdes con Huevo', 'Sándwich Croque Madame',
    'Huevos Rancheros Tradicionales', 'Tostada de Hummus y Huevo', 'Gofres de Avena y Arándanos'
  ],
  aperitivo: [
    'Croquetas de Jamón Ibérico', 'Gildas de Anchoa y Oliva', 'Patatas Bravas Gourmet', 'Ensaladilla de Ventresca',
    'Boquerones en Vinagre Real', 'Pimientos Rellenos de Bacalao', 'Tortilla de Patata Trufada', 'Salmorejo Cordobés',
    'Gambas al Ajillo con Guindilla', 'Pulpo a la Gallega Tradicional', 'Buñuelos de Queso Mahón', 'Montadito de Pringá',
    'Champiñones Rellenos de Jamón', 'Mejillones en Escabeche', 'Bombones de Queso y Nueces', 'Crujiente de Berenjena'
  ],
  primero: [
    'Risotto de Setas Silvestres y Trufa', 'Risotto de Gambas y Espárragos', 'Risotto de Calabaza y Salvia',
    'Risotto al Funghi Porcini', 'Risotto de Espinacas y Gorgonzola', 'Risotto de Pera y Nueces',
    'Risotto Negro con Chipirones', 'Gazpacho de Fresas y Tomate', 'Sopa de Cebolla Gratinada', 
    'Lentejas con Foie', 'Arroz a Banda del Delta', 'Pasta al Pesto Genovés', 'Crema de Calabaza y Jengibre', 
    'Canelones de Asado', 'Arroz Meloso de Marisco', 'Sopa Minestrone Gourmet'
  ],
  segundo: [
    'Cochinillo Asado a Fuego Lento', 'Bacalao al Pil-Pil Esmeralda', 'Solomillo de Ternera al Oporto', 'Merluza en Salsa Verde',
    'Carrilleras de Cerdo al Vino Tinto', 'Pollo de Corral en Pepitoria', 'Lubina a la Sal de Manantial', 'Cordero Lechal al Horno',
    'Albóndigas con Salsa de Almendra', 'Rabo de Toro Estofado', 'Entrecot a la Pimienta Verde', 'Atún Rojo con Sésamo'
  ],
  postre: [
    'Arroz con Leche y Caramelo', 'Tarta de Queso Fluida', 'Natillas de la Abuela', 'Torrijas de Brioche',
    'Flan de Huevo y Vainilla', 'Mousse de Chocolate al 70%', 'Tarta de Santiago Original', 'Crema Catalana Quemada',
    'Coulant de Chocolate Belga', 'Tarta de Manzana Casera', 'Tiramisú Tradicional'
  ]
};

export const RECIPES: Recipe[] = ((): Recipe[] => {
  const todas: Recipe[] = [];
  const cats: Recipe['category'][] = ['desayuno', 'aperitivo', 'primero', 'segundo', 'postre'];
  
  cats.forEach((cat, cIdx) => {
    const pool = TITULOS_POOL[cat];
    const totalPorCat = 200; // Total por categoría

    for (let i = 0; i < totalPorCat; i++) {
      const baseTitle = pool[i % pool.length];
      const suffix = i >= pool.length ? `(Edición ${Math.floor(i / pool.length) + 1})` : '';
      const title = `${baseTitle} ${suffix}`.trim();
      
      let tecnica = TECNICAS.ensalada;
      const tLow = title.toLowerCase();
      
      if (cat === 'desayuno') {
        if (tLow.includes('huevo') || tLow.includes('revuelto') || tLow.includes('shakshuka')) {
          tecnica = TECNICAS.huevos;
        } else if (tLow.includes('bol') || tLow.includes('pudin') || tLow.includes('yogur') || tLow.includes('chía')) {
          tecnica = TECNICAS.saludable;
        } else if (tLow.includes('tortitas') || tLow.includes('gofres') || tLow.includes('tarta') || tLow.includes('suizo')) {
          tecnica = TECNICAS.reposteria;
        } else {
          tecnica = TECNICAS.huevos;
        }
      } else if (cat === 'postre') {
        tecnica = TECNICAS.reposteria;
      } else {
        // Lógica mejorada para detectar Risottos y arroces
        if (tLow.includes('arroz') || tLow.includes('paella') || tLow.includes('risotto')) {
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
        description: `Saborea la excelencia de ${title}. Una preparación artesanal que utiliza ingredientes de proximidad y técnicas refinadas de cocina local.`,
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
