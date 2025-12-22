
import { Recipe } from './types';

// Perfiles técnicos para generar contenido coherente en español
const TECNICAS = {
  arroz: {
    ing: ['Arroz variedad Bomba', 'Caldo de ave casero', 'Azafrán en hebra', 'Pimiento rojo', 'Judía verde', 'Garrofó'],
    pasos: [
      "Sofreír la carne y las verduras en aceite de oliva virgen hasta que doren.",
      "Añadir el tomate rallado y cocinar hasta que pierda el agua.",
      "Incorporar el arroz y nacarar durante dos minutos removiendo bien.",
      "Verter el caldo caliente con el azafrán y cocinar 18 minutos sin remover.",
      "Dejar reposar 5 minutos con un paño limpio antes de servir."
    ],
    tips: ["El secreto está en un buen sofrito muy lento.", "No remuevas el arroz una vez añadas el caldo."]
  },
  guiso: {
    ing: ['Carne de ternera para guisar', 'Patatas monalisa', 'Zanahorias', 'Cebolla blanca', 'Vino tinto de calidad', 'Laurel'],
    pasos: [
      "Sellar la carne a fuego fuerte en una olla exprés o tradicional.",
      "Retirar la carne y pochar la cebolla y zanahoria en ese mismo aceite.",
      "Añadir el vino y dejar que el alcohol se evapore por completo.",
      "Reincorporar la carne y cubrir con agua o fondo de carne.",
      "Cocinar a fuego lento hasta que la carne esté tierna y la salsa trabada."
    ],
    tips: ["Chascar las patatas para que suelten el almidón y espesen la salsa.", "Los guisos siempre saben mejor al día siguiente."]
  },
  ensalada: {
    ing: ['Brote de lechuga tierna', 'Tomate de huerta', 'Aceite de oliva virgen extra', 'Sal de escamas', 'Vinagre de Jerez', 'Frutos secos'],
    pasos: [
      "Lavar y secar muy bien las hojas verdes para que el aliño se adhiera.",
      "Cortar los vegetales en tamaños de bocado uniformes.",
      "Preparar una vinagreta emulsionando el aceite con el vinagre y la sal.",
      "Combinar los ingredientes en un bol grande justo antes de servir.",
      "Aliñar y decorar con los frutos secos para aportar un toque crujiente."
    ],
    tips: ["Usa siempre un buen vinagre de Jerez para elevar el plato.", "No aliñes la ensalada hasta el último segundo."]
  },
  asado: {
    ing: ['Pieza para asar (Cordero o Pescado)', 'Patatas panadera', 'Ajo', 'Perejil fresco', 'Vino blanco seco', 'Manteca o Aceite'],
    pasos: [
      "Precalentar el horno a 180 grados con calor arriba y abajo.",
      "Preparar una cama de patatas cortadas finas con cebolla en la bandeja.",
      "Salpimentar la pieza y colocarla sobre las patatas.",
      "Hornear regando con el jugo y un chorrito de vino cada 20 minutos.",
      "Subir la potencia al final para conseguir una piel crujiente o dorado perfecto."
    ],
    tips: ["Precalentar bien el horno es fundamental.", "Usa un termómetro de cocina para no pasarte de cocción."]
  },
  reposteria: {
    ing: ['Harina de repostería', 'Azúcar blanquilla', 'Huevos camperos', 'Mantequilla sin sal', 'Levadura química', 'Esencia de vainilla'],
    pasos: [
      "Tamizar la harina con la levadura para evitar grumos.",
      "Batir los huevos con el azúcar hasta que doblen su volumen (blanquear).",
      "Incorporar la mantequilla en pomada y la esencia de vainilla lentamente.",
      "Añadir los ingredientes secos con movimientos envolventes para no perder aire.",
      "Hornear sin abrir la puerta hasta que al insertar un palillo salga limpio."
    ],
    tips: ["Todos los ingredientes deben estar a temperatura ambiente.", "No batas en exceso una vez añadida la harina."]
  }
};

const TITULOS_POOL = {
  aperitivo: [
    'Gildas clásicas del norte', 'Croquetas de jamón ibérico', 'Brava de patata confitada', 'Ensaladilla rusa gourmet',
    'Boquerones en vinagre de sidra', 'Pimientos del padrón rellenos', 'Tortilla de patatas trufada', 'Salmorejo cordobés denso',
    'Gambas al ajillo tradicional', 'Pulpo a la gallega con cachelos', 'Buñuelos de bacalao crujientes', 'Montadito de pringá',
    'Champiñones al ajillo y guindilla', 'Mejillones al vapor con cítricos', 'Queso manchego en aceite', 'Aceitunas aliñadas de la abuela',
    'Canapé de salmón y eneldo', 'Tosta de foie con cebolla caramelizada', 'Empanadilla de bonito del norte', 'Calamares a la romana'
  ],
  primero: [
    'Gazpacho andaluz tradicional', 'Sopa de picadillo con huevo', 'Lentejas estofadas con chorizo', 'Arroz a banda con alioli',
    'Pasta fresca con pesto de albahaca', 'Crema de calabacín y quesito', 'Canelones de la abuela', 'Garbanzos con espinacas',
    'Risotto de setas silvestres', 'Ensalada César con pollo crujiente', 'Vichyssoise fría de puerros', 'Judías verdes con jamón',
    'Espaguetis a la carbonara auténtica', 'Minestrone de verduras de temporada', 'Sopa de ajo castellana', 'Marmitaco de bonito',
    'Lasaña de verduras asadas', 'Crema de calabaza y jengibre', 'Arroz negro con chopitos', 'Menestra de verduras navarras'
  ],
  segundo: [
    'Cochinillo asado al estilo Segovia', 'Bacalao al pil-pil tradicional', 'Solomillo de ternera al cabrales', 'Merluza en salsa verde',
    'Carrilleras de cerdo al vino tinto', 'Pollo en pepitoria clásica', 'Lubina a la espalda con ajos', 'Cordero lechal al horno',
    'Albóndigas en salsa de almendras', 'Entrecot a la pimienta verde', 'Rabo de toro estofado', 'Salmón a la naranja y miel',
    'Costillas de cerdo a la barbacoa', 'Cachopo asturiano XXL', 'Fideuá de marisco valenciana', 'Pato con reducción de higos',
    'Caldereta de cordero extremeña', 'Trucha a la navarra con jamón', 'Hamburguesa gourmet de buey', 'Zarzuela de pescado y marisco'
  ],
  postre: [
    'Arroz con leche cremoso', 'Tarta de queso tipo La Viña', 'Natillas caseras con galleta', 'Torrijas de leche y canela',
    'Flan de huevo tradicional', 'Mousse de chocolate al 70%', 'Tarta de Santiago auténtica', 'Crema catalana quemada',
    'Brownie de nueces y helado', 'Panna cotta de frutos rojos', 'Tiramisú con café expreso', 'Fruta de temporada preparada',
    'Leche frita con azúcar y canela', 'Bizcocho de yogur esponjoso', 'Coulant de chocolate fluido', 'Milhojas de nata y crema',
    'Quesada pasiega tradicional', 'Sorbete de limón al cava', 'Tocino de cielo de Jerez', 'Profiteroles rellenos de nata'
  ]
};

const generarRecetas = () => {
  const todas: Recipe[] = [];
  const categorias: Recipe['category'][] = ['aperitivo', 'primero', 'segundo', 'postre'];
  
  categorias.forEach((cat, catIdx) => {
    for (let i = 0; i < 100; i++) {
      const pool = TITULOS_POOL[cat];
      const baseTitle = pool[i % pool.length];
      const title = i < pool.length ? baseTitle : `${baseTitle} Especial Variante ${Math.floor(i / pool.length)}`;
      
      // Asignar técnica basada en palabras clave o categoría
      let tecnica = TECNICAS.ensalada;
      if (title.toLowerCase().includes('arroz') || title.toLowerCase().includes('risotto') || title.toLowerCase().includes('fideuá')) tecnica = TECNICAS.arroz;
      else if (cat === 'postre') tecnica = TECNICAS.reposteria;
      else if (title.toLowerCase().includes('asado') || title.toLowerCase().includes('horno') || title.toLowerCase().includes('pieza')) tecnica = TECNICAS.asado;
      else if (cat === 'segundo' || title.toLowerCase().includes('estofado') || title.toLowerCase().includes('salsa')) tecnica = TECNICAS.guiso;

      todas.push({
        id: (catIdx + 1) * 1000 + i,
        title,
        category: cat,
        image: `https://picsum.photos/600/400?random=${(catIdx + 1) * 1000 + i}`,
        description: `Disfruta de este increíble ${cat} preparado con ingredientes frescos y la mejor técnica tradicional española. Una receta equilibrada y llena de sabor.`,
        ingredients: tecnica.ing,
        steps: tecnica.pasos,
        tips: tecnica.tips,
        time: i % 2 === 0 ? '30 min' : '45 min',
        difficulty: i % 3 === 0 ? 'Baja' : i % 2 === 0 ? 'Media' : 'Alta'
      });
    }
  });

  return todas;
};

export const RECIPES: Recipe[] = generarRecetas();
