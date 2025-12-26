
import { Recipe } from './types.ts';

// Temas visuales para cada categoría de receta
// Se mueve aquí para evitar dependencias circulares entre App.tsx y RecipeModal.tsx
export const CATEGORY_THEMES: Record<string, { bg: string, text: string, accent: string, light: string, border: string, header: string }> = {
  desayuno: { 
    header: 'bg-amber-400', 
    bg: 'bg-stone-900', 
    text: 'text-amber-400', 
    accent: 'bg-amber-500', 
    light: 'bg-amber-950', 
    border: 'border-amber-500/30' 
  },
  aperitivo: { 
    header: 'bg-orange-500', 
    bg: 'bg-stone-900', 
    text: 'text-orange-400', 
    accent: 'bg-orange-600', 
    light: 'bg-orange-950', 
    border: 'border-orange-500/30' 
  },
  primero: { 
    header: 'bg-emerald-500', 
    bg: 'bg-stone-900', 
    text: 'text-emerald-400', 
    accent: 'bg-emerald-600', 
    light: 'bg-emerald-950', 
    border: 'border-emerald-500/30' 
  },
  segundo: { 
    header: 'bg-rose-600', 
    bg: 'bg-stone-900', 
    text: 'text-rose-400', 
    accent: 'bg-rose-700', 
    light: 'bg-rose-950', 
    border: 'border-rose-500/30' 
  },
  postre: { 
    header: 'bg-fuchsia-600', 
    bg: 'bg-stone-900', 
    text: 'text-fuchsia-400', 
    accent: 'bg-fuchsia-700', 
    light: 'bg-fuchsia-950', 
    border: 'border-fuchsia-500/30' 
  },
  todos: { 
    header: 'bg-stone-700', 
    bg: 'bg-stone-900', 
    text: 'text-stone-300', 
    accent: 'bg-stone-100', 
    light: 'bg-stone-800', 
    border: 'border-stone-700' 
  },
  favoritos: {
    header: 'bg-yellow-500', 
    bg: 'bg-stone-900', 
    text: 'text-yellow-400', 
    accent: 'bg-yellow-600', 
    light: 'bg-yellow-950', 
    border: 'border-yellow-500/30'
  }
};

const BASES_TECNICAS = {
  arroz: {
    base: ['Arroz Carnaroli o Bomba', 'Caldo casero caliente', 'Cebolla chalota', 'Vino blanco seco', 'Mantequilla', 'Parmesano'],
    verbos: ['Nacarar el arroz', 'Añadir caldo cazo a cazo', 'Mantecar con energía']
  },
  guiso: {
    base: ['Cebolla', 'Zanahoria', 'Ajo', 'Laurel', 'Vino tinto', 'Caldo de carne'],
    verbos: ['Sellar la pieza', 'Pochar verduras', 'Guisar a fuego lento']
  },
  asado: {
    base: ['Patatas panadera', 'Cebolla roja', 'Aceite de oliva', 'Tomillo fresco'],
    verbos: ['Precalentar horno', 'Asar regando con jugos', 'Gratinar final']
  },
  reposteria: {
    base: ['Harina', 'Huevos', 'Azúcar', 'Mantequilla', 'Vainilla'],
    verbos: ['Tamizar secos', 'Montar huevos', 'Hornear con cuidado']
  },
  huevos: {
    base: ['Huevos de corral', 'Sal en escamas', 'Aceite virgen extra'],
    verbos: ['Preparar base', 'Cocinar al punto', 'Emplatar con mimo']
  }
};

const TITULOS_POOL = {
  desayuno: [
    'Huevos Benedictinos', 'Shakshuka con Queso Feta', 'Bol de Açaí Real', 'Tostada de Aguacate y Huevo Poché',
    'Tortitas de Avena y Plátano', 'Gofres Belgas con Frutas', 'Bollo Suizo de Almendras', 'Panecillo de Salmón Ahumado',
    'Tortilla de Trufa Negra', 'Gachas de Chía y Mango', 'Tostada Francesa Gourmet'
  ],
  aperitivo: [
    'Croquetas de Jamón Caseras', 'Gildas de Anchoa y Oliva', 'Patatas Bravas Crujientes', 'Ensaladilla de Ventresca',
    'Boquerones al Vinagre', 'Pimientos de Padrón', 'Tortilla de Patata Melosa', 'Salmorejo Cordobés'
  ],
  primero: [
    'Risotto a los Cuatro Quesos (Gorgonzola, Parmesano, Fontina y Taleggio)',
    'Risotto de Fresas y Vinagre Balsámico',
    'Risotto de Castañas y Panceta Crujiente',
    'Risotto de Cerveza Negra y Salchicha',
    'Risotto de Setas y Trufa Blanca',
    'Risotto de Gamba Roja Denia',
    'Pasta al Pesto de Pistacho',
    'Crema de Calabaza y Coco',
    'Risotto de Remolacha y Queso de Cabra',
    'Risotto de Espárragos y Limón'
  ],
  segundo: [
    'Cochinillo Asado Crujiente', 'Bacalao al Pil-Pil', 'Solomillo al Oporto', 'Merluza en Salsa Verde',
    'Carrilleras al Vino Tinto', 'Lubina a la Sal', 'Cordero Lechal al Horno'
  ],
  postre: [
    'Arroz con Leche Cremoso', 'Tarta de Queso de la Viña', 'Natillas con Galleta', 'Torrijas de Brioche',
    'Mousse de Chocolate Puro', 'Tarta de Santiago', 'Crema Catalana'
  ]
};

function extraerIngredientePrincipal(titulo: string): string {
  const palabrasClave = titulo.split(' ');
  const preposiciones = ['de', 'con', 'a', 'al', 'los', 'las', 'y'];
  // Intentamos sacar el ingrediente ignorando preposiciones
  const filtradas = palabrasClave.filter(p => !preposiciones.includes(p.toLowerCase()));
  return filtradas.length > 1 ? filtradas.slice(-2).join(' ') : filtradas[0] || 'Ingrediente secreto';
}

export const RECIPES: Recipe[] = ((): Recipe[] => {
  const todas: Recipe[] = [];
  const cats: Recipe['category'][] = ['desayuno', 'aperitivo', 'primero', 'segundo', 'postre'];
  
  cats.forEach((cat, cIdx) => {
    const pool = TITULOS_POOL[cat] || [];
    const count = 30; // 30 variaciones para no saturar pero dar variedad

    for (let i = 0; i < count; i++) {
      const baseTitle = pool[i % pool.length];
      const title = i >= pool.length ? `${baseTitle} Selección Gourmet` : baseTitle;
      const tLow = title.toLowerCase();
      const principal = extraerIngredientePrincipal(title);

      let tecnica = BASES_TECNICAS.huevos;
      let extraIngs: string[] = [];
      let extraSteps: string[] = [];
      let desc = "";

      if (tLow.includes('risotto') || tLow.includes('arroz')) {
        tecnica = BASES_TECNICAS.arroz;
        extraIngs = [principal, 'Queso rallado extra', 'Caldo de verduras intenso'];
        extraSteps = [
          `Sofreír la chalota picada hasta que esté transparente`,
          `Incorporar el ${principal} y saltear 1 minuto`,
          `Añadir el vino y dejar que se evapore por completo`,
          `Añadir el caldo poco a poco sin dejar de remover`,
          `Finalizar mantecando con mantequilla fría y el queso`
        ];
        desc = `Una interpretación sublime del risotto centrada en la pureza de ${principal}.`;
      } 
      else if (cat === 'segundo' || tLow.includes('guiso') || tLow.includes('bacalao')) {
        tecnica = BASES_TECNICAS.guiso;
        extraIngs = [principal, 'Pimiento de la vera', 'Vino tinto reserva', 'Fumet de pescado'];
        extraSteps = [
          `Sellar ${principal} a fuego muy fuerte para atrapar los jugos`,
          `Pochar la cebolla y el pimiento con una pizca de sal`,
          `Mojar con el vino y dejar reducir a la mitad`,
          `Cocinar tapado a fuego mínimo durante el tiempo necesario`
        ];
        desc = `Cocina de paciencia y tradición donde ${principal} alcanza su máxima expresión.`;
      }
      else if (cat === 'postre' || tLow.includes('tarta')) {
        tecnica = BASES_TECNICAS.reposteria;
        extraIngs = [principal, 'Azúcar glass', 'Canela en rama'];
        extraSteps = [
          `Preparar la base mezclando con cuidado ${principal}`,
          `Precalentar el horno a 180 grados sin ventilación`,
          `Hornear hasta que al pinchar el centro salga limpio`,
          `Dejar enfriar totalmente antes de servir`
        ];
        desc = `Un final dulce e inolvidable con la delicadeza de ${principal}.`;
      }
      else {
        extraIngs = [principal, 'Aceite de oliva extra', 'Brotes tiernos'];
        extraSteps = [
          `Limpiar y trocear ${principal} en bocados uniformes`,
          `Aliñar con el aceite y las hierbas frescas`,
          `Montar el plato buscando un equilibrio visual`
        ];
        desc = `Receta fresca y rápida que resalta la calidad natural de ${principal}.`;
      }

      todas.push({
        id: (cIdx + 1) * 1000 + i,
        title,
        category: cat,
        image: `https://picsum.photos/600/400?random=${(cIdx + 1) * 1000 + i}`,
        description: desc,
        ingredients: [...new Set([...tecnica.base, ...extraIngs])],
        steps: [`Organizar el espacio de trabajo`, ...extraSteps, `Rectificar de sazón y emplatar`],
        tips: [`Para potenciar el sabor de ${principal}, úsalo siempre a temperatura ambiente.`],
        time: `${25 + (i % 4) * 10} min`,
        difficulty: (i % 3 === 0 ? 'Alta' : i % 2 === 0 ? 'Media' : 'Baja') as any
      });
    }
  });

  return todas;
})();
