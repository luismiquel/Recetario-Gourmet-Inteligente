
import { Recipe } from './types';

// Motor de generación de contenido técnico para evitar la monotonía
const getTechnicalContent = (title: string, category: string) => {
  const t = title.toLowerCase();
  
  let steps: string[] = [];
  let ingredients: string[] = [];
  let tips: string[] = [];

  // Lógica basada en técnica detectada en el nombre
  if (t.includes('arroz') || t.includes('risotto')) {
    ingredients = ['Arroz variedad Bomba o Carnaroli', 'Caldo de ave o pescado reducido', 'Mantequilla fría', 'Parmesano 24 meses'];
    steps = [
      "Sofreír la base de verduras finamente picada hasta que esté transparente.",
      "Nacarar el arroz durante 2 minutos para sellar el almidón.",
      "Añadir el caldo hirviendo cazo a cazo, removiendo constantemente para liberar el almidón.",
      "Mantener el fuego medio y finalizar con el mantecado fuera del fuego."
    ];
    tips = ["Nunca laves el arroz si buscas una textura cremosa.", "Usa siempre caldo casero para un sabor profundo."];
  } else if (t.includes('crema') || t.includes('sopa')) {
    ingredients = ['Verdura de temporada', 'Nata líquida 35% MG', 'Aceite de oliva virgen extra', 'Picatostes artesanos'];
    steps = [
      "Limpiar y trocear uniformemente los vegetales para una cocción homogénea.",
      "Pochar con una pizca de sal para extraer los jugos naturales.",
      "Cocer en el líquido elegido (caldo o agua) hasta que estén tiernos.",
      "Triturar a máxima potencia y pasar por un chino para una textura de seda."
    ];
    tips = ["Añade una patata pequeña para dar cuerpo natural sin usar harinas.", "Un chorrito de limón al final realza todos los sabores."];
  } else if (t.includes('asado') || t.includes('horno')) {
    ingredients = ['Pieza principal (carne o pescado)', 'Hierbas aromáticas frescas', 'Vino blanco seco', 'Patatas ratte'];
    steps = [
      "Precalentar el horno a la temperatura exacta indicada.",
      "Sellar la pieza en una sartén a fuego vivo para mantener los jugos internos.",
      "Disponer en una fuente con las hierbas y el fondo de vino.",
      "Asar controlando la temperatura corazón para un punto perfecto."
    ];
    tips = ["Deja reposar la carne 5 minutos antes de cortar para que los jugos se redistribuyan.", "Hidrata la pieza cada 15 minutos."];
  } else {
    // Genérico de alta calidad
    ingredients = ['Producto base seleccionado', 'Sal Maldon', 'Aceite de Oliva virgen', 'Especias del mundo'];
    steps = [
      "Mise en place: organizar todos los elementos a temperatura ambiente.",
      "Tratamiento térmico adecuado según la naturaleza del producto.",
      "Control de texturas y puntos de cocción.",
      "Emplatado minimalista resaltando el ingrediente principal."
    ];
    tips = ["La calidad del aceite de oliva define el 50% del éxito del plato.", "Prueba siempre el punto de sal antes de servir."];
  }

  return { steps, ingredients: [...new Set(ingredients)], tips };
};

const createCategoryPool = (category: Recipe['category'], titles: string[], baseId: number): Recipe[] => {
  return Array.from({ length: 100 }, (_, i) => {
    const title = titles[i % titles.length] + (i >= titles.length ? ` Edición ${Math.floor(i/titles.length) + 1}` : '');
    const { steps, ingredients, tips } = getTechnicalContent(title, category);
    
    return {
      id: baseId + i,
      title,
      category,
      image: `https://picsum.photos/600/400?random=${baseId + i}`,
      description: `Una propuesta magistral de la cocina ${category} donde el protagonismo absoluto es la técnica y el producto.`,
      ingredients,
      steps,
      tips,
      time: i % 3 === 0 ? '30 min' : i % 2 === 0 ? '45 min' : '60 min',
      difficulty: i % 3 === 0 ? 'Baja' : i % 2 === 0 ? 'Media' : 'Alta'
    };
  });
};

const APERITIVO_TITLES = [
  'Ostras con granizado de manzana', 'Carpaccio de gamba roja', 'Mini brioche de bogavante', 'Macaron de foie y chocolate',
  'Tartar de ciervo y mostaza', 'Espuma de patata y trufa', 'Croqueta de cecina de León', 'Saquito de filo y morcilla',
  'Sashimi de lubina y lima', 'Piruleta de queso y sésamo', 'Chupito de guisantes y menta', 'Bombón de jamón ibérico',
  'Navajas con aire de limón', 'Mini taco de atún picante', 'Vieiras con espuma de coral', 'Puerros confitados con romesco',
  'Brandada de bacalao y miel', 'Empanadilla de confit de pato', 'Tataki de buey y cebolla', 'Queso Idiazabal y tomate'
];

const PRIMERO_TITLES = [
  'Risotto de plancton marino', 'Crema de alcachofas y poché', 'Sopa Bullabesa de Marsella', 'Tagliatelle con trufa blanca',
  'Ravioli de bogavante azul', 'Arroz cremoso de rabo de toro', 'Gazpacho de cereza y pistacho', 'Ensalada de perdiz escabechada',
  'Sopa de cebolla trufada', 'Crema de coliflor y caviar', 'Pasta con pesto de pistacho', 'Salmorejo trufado',
  'Consomé de buey clarificado', 'Ensalada Waldorf noble', 'Gnocchi de castaña y salvia', 'Ajoblanco de coco y mango'
];

const SEGUNDO_TITLES = [
  'Solomillo Wellington real', 'Rodaballo salvaje al horno', 'Lomo de ciervo al Oporto', 'Cochinillo confitado crujiente',
  'Bacalao al pil-pil gourmet', 'Pato a la naranja y boniato', 'Presa ibérica con higos', 'Rape a la americana',
  'Carrilleras al vino noble', 'Lubina en papillote thai', 'Entrecot con mantequilla trufa', 'Pichón asado en su jugo',
  'Salmonetes con emulsión de hígados', 'Cordero lechal al romero', 'Atún rojo en costra de sésamo', 'Merluza en salsa verde'
];

const POSTRE_TITLES = [
  'Soufflé de Grand Marnier', 'Tarta de queso fluida', 'Pavlova de frutos rojos', 'Babá al ron con chantilly',
  'Milhojas de vainilla Tahití', 'Coulant de pistacho y frambuesa', 'Mousse de chocolate amargo', 'Tarta Tatin con crema',
  'Sorbete de limón y albahaca', 'Flan de queso y miel', 'Semifrío de mango y coco', 'Peras Bella Helena modernas',
  'Brownie de chocolate y remolacha', 'Lemon Pie con merengue', 'Torrijas de brioche', 'Panna cotta de lavanda'
];

export const RECIPES: Recipe[] = [
  ...createCategoryPool('aperitivo', APERITIVO_TITLES, 100),
  ...createCategoryPool('primero', PRIMERO_TITLES, 200),
  ...createCategoryPool('segundo', SEGUNDO_TITLES, 300),
  ...createCategoryPool('postre', POSTRE_TITLES, 400)
];
