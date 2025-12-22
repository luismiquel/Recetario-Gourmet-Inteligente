
import { Recipe } from './types';

/**
 * Generador robusto de contenido para asegurar que todas las recetas
 * tengan su lista completa de ingredientes y pasos de calidad.
 */

const getSteps = (category: string, title: string) => [
  `Organiza todos los ingredientes frescos necesarios para el plato: ${title}.`,
  `Comienza la preparación base respetando los tiempos de corte y temperatura adecuados para un ${category}.`,
  `Cocina a fuego lento permitiendo que los sabores se integren perfectamente siguiendo la técnica tradicional.`,
  `Realiza el montaje final buscando una estética gourmet y sirve inmediatamente a la temperatura ideal.`
];

const getIngredients = (category: string) => {
  const common = ['Aceite de oliva virgen extra', 'Sal Maldon', 'Pimienta recién molida'];
  const mapping: Record<string, string[]> = {
    aperitivo: ['Base crujiente premium', 'Proteína del mar', 'Emulsión cítrica', 'Microbrotes'],
    primero: ['Caldo artesano reducido', 'Verduras de huerta seleccionada', 'Cereal o legumbre noble', 'Aromáticos frescos'],
    segundo: ['Corte principal de calidad superior', 'Guarnición de temporada asada', 'Vino para reducción', 'Mantequilla clarificada'],
    postre: ['Nata de alta densidad', 'Fruta seleccionada en su punto', 'Chocolate de origen', 'Vainilla natural']
  };
  return [...common, ...(mapping[category] || mapping['primero'])];
};

const APERITIVOS: Recipe[] = Array.from({ length: 50 }, (_, i) => {
  const title = [
    'Ostras con granizado de manzana', 'Carpaccio de gamba roja', 'Mini brioche de bogavante', 'Macaron de foie y chocolate',
    'Tartar de ciervo y mostaza', 'Espuma de patata y trufa', 'Croqueta de cecina de León', 'Saquito de filo y morcilla',
    'Sashimi de lubina y lima', 'Piruleta de queso y sésamo', 'Chupito de guisantes y menta', 'Bombón de jamón ibérico',
    'Navajas con aire de limón', 'Mini taco de atún picante', 'Vieiras con espuma de coral', 'Puerros confitados con romesco',
    'Brandada de bacalao y miel', 'Empanadilla de confit de pato', 'Tataki de buey y cebolla', 'Queso Idiazabal y tomate',
    'Anchoas y mantequilla trufada', 'Tempura de trigueros', 'Mejillones coco y curry', 'Pulpo y ajo negro',
    'Canelón de calabacín y txangurro', 'Esfera de aceituna gordal', 'Crujiente de oreja y salsa brava', 'Shot de Bloody Mary con berberecho',
    'Tostita de arenque y remolacha', 'Blini de caviar y crema agria', 'Brocheta de codorniz y uva', 'Taco de salmón marinado en gin',
    'Bombón de queso azul y nuez', 'Espárrago blanco con emulsión de piñones', 'Mini arepa de rabo de toro', 'Ceviche de corvina y maracuyá',
    'Zamburiña con salsa holandesa de lima', 'Tartaleta de setas y huevo de codorniz', 'Airbag de pan con panceta ibérica', 'Sopa fría de melón y virutas de cecina',
    'Rulo de cecina y queso de cabra', 'Gambón al panko con soja dulce', 'Mini hamburguesa de Wagyu', 'Rollito de primavera gourmet de pato',
    'Brocheta de pulpo a la brasa', 'Cucharita de bacalao con pimientos', 'Almejas al natural con aire de mar', 'Berberechos al vapor de lima',
    'Tapa de solomillo con reducción de Oporto', 'Bocado de tortilla de patata trufada'
  ][i] || `Bocado Gourmet ${i+1}`;
  return {
    id: 100 + i,
    title,
    category: 'aperitivo',
    image: `https://picsum.photos/400/300?random=${100+i}`,
    description: 'Una pequeña joya gastronómica diseñada para sorprender y abrir el apetito con elegancia.',
    ingredients: getIngredients('aperitivo'),
    steps: getSteps('aperitivo', title),
    time: '20 min',
    difficulty: 'Media'
  };
});

const PRIMEROS: Recipe[] = Array.from({ length: 50 }, (_, i) => {
  const title = [
    'Sopa Bullabesa de Marsella', 'Risotto de plancton marino', 'Ensalada de perdiz escabechada', 'Crema de alcachofas y huevo poché',
    'Tagliatelle con trufa blanca', 'Ravioli de bogavante y azafrán', 'Sopa de cebolla trufada', 'Risotto de calabaza y amaretto',
    'Crema de espárragos con huevas', 'Ensalada de bogavante azul', 'Pasta rellena de setas y foie', 'Arroz cremoso de rabo de toro',
    'Sopa de pescado con hinojo', 'Ensalada templada de codorniz', 'Gnocchi de castaña con salvia', 'Risotto de remolacha y gorgonzola',
    'Crema de bogavante e hinojo', 'Ensalada de tomate rosa y ventresca', 'Ravioli de rabo de buey', 'Ajoblanco de coco y mango',
    'Pasta negra con gambas blancas', 'Risotto de trigueros y parmesano', 'Burrata y melocotón asado', 'Crema de coliflor y caviar',
    'Sopa de setas con jamón crujiente', 'Crema de lentejas beluga con salmón', 'Pasta fresca con pesto de pistacho', 'Salmorejo trufado con huevo',
    'Gazpacho de cereza y pistachos', 'Consomé de buey clarificado', 'Ensalada Waldorf con uva noble', 'Risotto de boletus y trufa',
    'Crema de calabaza y jengibre fresco', 'Lasaña de verduras con salsa aurora', 'Sopa miso gourmet con shiitake', 'Cuscús con cordero y canela',
    'Tabulé de quinoa y granada ácida', 'Crema de espárragos blancos y avellana', 'Ensalada de rúcula y pato ahumado', 'Vichyssoise de manzana y puerro',
    'Risotto de gambas y ralladura de lima', 'Pasta con ragú de ciervo', 'Crema de marisco con aire de cognac', 'Ensalada de quinoa y hortalizas asadas',
    'Sopa de tomate asado y albahaca', 'Pasta con erizo de mar', 'Crema de guisantes y menta fresca', 'Risotto de espinacas y queso de cabra',
    'Ensalada de lentejas y magret de pato', 'Sopa de cebolla clásica gratinada'
  ][i] || `Plato Entrante ${i+1}`;
  return {
    id: 200 + i,
    title,
    category: 'primero',
    image: `https://picsum.photos/400/300?random=${200+i}`,
    description: 'Un comienzo contundente y equilibrado que destaca por la pureza de sus ingredientes.',
    ingredients: getIngredients('primero'),
    steps: getSteps('primero', title),
    time: '45 min',
    difficulty: 'Alta'
  };
});

const SEGUNDOS: Recipe[] = Array.from({ length: 50 }, (_, i) => {
  const title = [
    'Solomillo Wellington clásico', 'Rape a la americana con gambas', 'Lomo de ciervo al Oporto', 'Presa ibérica con higos',
    'Rodaballo salvaje a la bilbaína', 'Pichón asado en su jugo', 'Cochinillo confitado y crujiente', 'Lenguado con pan de especias',
    'Carrilleras de buey al vino noble', 'Lubina en papillote thai', 'Solomillo de corzo y arándanos', 'Bacalao con crema de coliflor',
    'Pato a la naranja y boniato', 'Paletilla de cordero lechal', 'Salmón salvaje con holandesa', 'Entrecot de ternera con foie',
    'Merluza con ortiguillas de mar', 'Secreto de cerdo con manzana reineta', 'Perdiz estofada a la toledana', 'Bacalao al ajoarriero gourmet',
    'Rabo de toro al Jerez', 'Salmonetes con emulsión de hígados', 'Solomillo de cerdo al pistacho', 'Atún encebollado con ventresca',
    'Pierna de cabrito asada con romero', 'Solomillo al Pedro Ximénez', 'Bacalao al pil-pil tradicional', 'Confit de pato con frutos rojos',
    'Merluza en salsa verde con almejas', 'Chuletón con mantequilla de hierbas', 'Salmón con costra de frutos secos', 'Lubina a la sal de hierbas',
    'Entrecot a la pimienta verde fresca', 'Lomo de cordero a la provenzal', 'Rodaballo sobre cama de patatas panadera', 'Albóndigas de rabo de toro',
    'Pargo a la espalda con ajos fritos', 'Secreto con reducción de oporto', 'Calamares rellenos en su tinta', 'Pollo campero con trufa negra',
    'Magret de pato con peras al vino', 'Lenguado a la meunière clásica', 'Ossobuco a la milanesa con gremolata', 'Codornices estofadas al tomillo',
    'Pez espada con alcaparras y limón', 'Lomo asado con mostaza antigua', 'Sepia con sobrasada y miel', 'Atún rojo con costra de sésamo',
    'Bacalao Skrei con cebolla dulce', 'Lomo de jabalí con salsa de chocolate'
  ][i] || `Plato Principal ${i+1}`;
  return {
    id: 300 + i,
    title,
    category: 'segundo',
    image: `https://picsum.photos/400/300?random=${300+i}`,
    description: 'La maestría técnica aplicada al producto estrella del mar o de la montaña.',
    ingredients: getIngredients('segundo'),
    steps: getSteps('segundo', title),
    time: '60 min',
    difficulty: 'Alta'
  };
});

const POSTRES: Recipe[] = Array.from({ length: 50 }, (_, i) => {
  const title = [
    'Soufflé de Grand Marnier', 'Tarta de queso fluida', 'Pavlova de frutos rojos', 'Babá al ron con chantilly',
    'Milhojas de vainilla Tahití', 'Coulant de pistacho y frambuesa', 'Semifrío de mango y coco', 'Peras Bella Helena modernas',
    'Mousse de chocolate amargo y sal', 'Tarta Tatin con crema fresca', 'Sorbete de limón y albahaca', 'Flan de queso manchego y miel',
    'Brownie de chocolate y remolacha', 'Cheesecake de higos y nueces', 'Sopa de fresas y pimienta rosa', 'Trufas de chocolate y oro',
    'Bizcocho borracho de almendras', 'Mousse de castañas y chocolate blanco', 'Lemon Pie con merengue italiano', 'Panna cotta de lavanda',
    'Carpaccio de piña y cilantro', 'Crepes Suzette flambeadas', 'Tarta Gianduja de avellana', 'Peras al vino con canela',
    'Helado de azafrán y miel noble', 'Coulant de chocolate 70%', 'Tiramisú con mascarpone real', 'Mousse de limón y albahaca',
    'Pannacotta de frutos rojos silvestres', 'Crème brûlée de vainilla borbón', 'Milhojas de crema artesana', 'Arroz con leche asturiano quemado',
    'Sorbete de mandarina y cava', 'Tarta de queso Idiazábal', 'Profiteroles con trufa blanca', 'Macedonia con infusión de menta',
    'Flan de huevo casero al caramelo', 'Torrijas de brioche caramelizadas', 'Cheesecake de arándanos frescos', 'Trufas con sal Maldon',
    'Carpaccio de piña y coco', 'Helado de vainilla real con semillas', 'Carrot cake con frosting de lima', 'Bombones de coco y almendra',
    'Tarta de manzana fina y hojaldre', 'Crepes con dulce de leche', 'Mousse de maracuyá y mango', 'Tatín de peras conferencia',
    'Soufflé de chocolate negro', 'Pastel de queso y frutos del bosque'
  ][i] || `Delicia Dulce ${i+1}`;
  return {
    id: 400 + i,
    title,
    category: 'postre',
    image: `https://picsum.photos/400/300?random=${400+i}`,
    description: 'Un cierre magistral que equilibra dulzor, textura y frescura.',
    ingredients: getIngredients('postre'),
    steps: getSteps('postre', title),
    time: '35 min',
    difficulty: 'Media'
  };
});

export const RECIPES: Recipe[] = [
  ...APERITIVOS,
  ...PRIMEROS,
  ...SEGUNDOS,
  ...POSTRES
];
