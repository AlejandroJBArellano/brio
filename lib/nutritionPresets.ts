import {
  FoodGroupKey,
  FoodGroupMeta,
  MacroEstimate,
  NutritionRecipe,
  NutritionSettings,
} from "./types";

/**
 * Metadata and macro approximation multipliers for each food group in the Mariana Mont nutrition system.
 */
export const FOOD_GROUPS_CATALOG: Record<FoodGroupKey, FoodGroupMeta> = {
  fruits: {
    key: "fruits",
    label: "Frutas",
    shortLabel: "Frutas",
    icon: "🍎",
    color: "#f43f5e", // Rose
    unit: "tazas",
    standardPortionDesc: "1 taza o 1 pieza de fruta mediana",
    defaultDailyTarget: 3.5,
    macroFactor: {
      kcal: 60,
      carbsGrams: 15,
      proteinGrams: 1,
      fatGrams: 0.2,
      fiberGrams: 2.5,
    },
  },
  vegetables: {
    key: "vegetables",
    label: "Verduras & Hongos",
    shortLabel: "Verduras",
    icon: "🥦",
    color: "#10b981", // Emerald
    unit: "raciones",
    standardPortionDesc: "1 taza de verdura cruda o 1/2 taza cocida / hongos",
    defaultDailyTarget: 4.5,
    macroFactor: {
      kcal: 25,
      carbsGrams: 4.5,
      proteinGrams: 1.5,
      fatGrams: 0.2,
      fiberGrams: 2.0,
    },
  },
  cereals: {
    key: "cereals",
    label: "Cereales Integrales",
    shortLabel: "Cereales",
    icon: "🌾",
    color: "#f59e0b", // Amber
    unit: "raciones",
    standardPortionDesc: "1 tapa de pan, 2 tortillas de maíz, 1/2 tz arroz/quinoa/avena/trigo sarraceno",
    defaultDailyTarget: 5.0,
    macroFactor: {
      kcal: 75,
      carbsGrams: 15,
      proteinGrams: 2.5,
      fatGrams: 0.8,
      fiberGrams: 2.5,
    },
  },
  tubers: {
    key: "tubers",
    label: "Tubérculos",
    shortLabel: "Tubérculos",
    icon: "🍠",
    color: "#d97706", // Amber dark
    unit: "ración",
    standardPortionDesc: "1 tz de papa o camote cocido (equivale a cereal, no proteína)",
    defaultDailyTarget: 1.0,
    macroFactor: {
      kcal: 85,
      carbsGrams: 20,
      proteinGrams: 2.0,
      fatGrams: 0.1,
      fiberGrams: 3.0,
    },
  },
  legumes: {
    key: "legumes",
    label: "Legumbres & Tofu",
    shortLabel: "Legumbres",
    icon: "🫘",
    color: "#8b5cf6", // Purple
    unit: "porciones",
    standardPortionDesc: "1/4 tz legumbres cocidas o 1/2 tz de Tofu / edamames",
    defaultDailyTarget: 3.0,
    macroFactor: {
      kcal: 110,
      carbsGrams: 16,
      proteinGrams: 7.5,
      fatGrams: 1.5,
      fiberGrams: 5.0,
    },
  },
  fats_seeds: {
    key: "fats_seeds",
    label: "Grasas & Semillas",
    shortLabel: "Semillas / Grasas",
    icon: "🥑",
    color: "#84cc16", // Lime
    unit: "raciones",
    standardPortionDesc: "2 cdas soperas (30g) de semillas / nueces / 1/3 aguacate",
    defaultDailyTarget: 3.5,
    macroFactor: {
      kcal: 120,
      carbsGrams: 4,
      proteinGrams: 3.5,
      fatGrams: 11,
      fiberGrams: 2.5,
    },
  },
  leafy_greens: {
    key: "leafy_greens",
    label: "Hojas Verdes",
    shortLabel: "Hojas",
    icon: "🥬",
    color: "#059669", // Emerald dark
    unit: "porciones",
    standardPortionDesc: "1 taza de espinacas baby, kale, lechugas (preferir cocidas o smoothie)",
    defaultDailyTarget: 2.0,
    macroFactor: {
      kcal: 15,
      carbsGrams: 2,
      proteinGrams: 1.5,
      fatGrams: 0.1,
      fiberGrams: 1.8,
    },
  },
};

/**
 * Default nutrition settings matching Mariana Mont's clinical plan.
 */
export const DEFAULT_NUTRITION_SETTINGS: NutritionSettings = {
  dailyPortionGoals: {
    fruits: 3.5,
    vegetables: 4.5,
    cereals: 5.0,
    tubers: 1.0,
    legumes: 3.0,
    fats_seeds: 3.5,
    leafy_greens: 2.0,
  },
  macroFactors: {
    fruits: FOOD_GROUPS_CATALOG.fruits.macroFactor,
    vegetables: FOOD_GROUPS_CATALOG.vegetables.macroFactor,
    cereals: FOOD_GROUPS_CATALOG.cereals.macroFactor,
    tubers: FOOD_GROUPS_CATALOG.tubers.macroFactor,
    legumes: FOOD_GROUPS_CATALOG.legumes.macroFactor,
    fats_seeds: FOOD_GROUPS_CATALOG.fats_seeds.macroFactor,
    leafy_greens: FOOD_GROUPS_CATALOG.leafy_greens.macroFactor,
  },
  waterTargetMl: 2000,
  activeWeek: 1,
};

/**
 * Helper to calculate macro estimates from a portion log.
 */
export function calculateMacrosFromPortions(
  portions: Record<FoodGroupKey, number>,
  factors = DEFAULT_NUTRITION_SETTINGS.macroFactors
): MacroEstimate {
  let kcal = 0;
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatGrams = 0;
  let fiberGrams = 0;

  (Object.keys(portions) as FoodGroupKey[]).forEach((key) => {
    const qty = portions[key] || 0;
    const factor = factors[key] || FOOD_GROUPS_CATALOG[key].macroFactor;
    kcal += qty * factor.kcal;
    proteinGrams += qty * factor.proteinGrams;
    carbsGrams += qty * factor.carbsGrams;
    fatGrams += qty * factor.fatGrams;
    fiberGrams += qty * factor.fiberGrams;
  });

  return {
    kcal: Math.round(kcal),
    proteinGrams: Math.round(proteinGrams * 10) / 10,
    carbsGrams: Math.round(carbsGrams * 10) / 10,
    fatGrams: Math.round(fatGrams * 10) / 10,
    fiberGrams: Math.round(fiberGrams * 10) / 10,
  };
}

/**
 * Reference tables and guidelines from Mariana Mont nutritionist PDF.
 */
export const MARIANA_MONT_KNOWLEDGE_BASE = {
  indications: [
    {
      id: "ind-1",
      title: "Harinas y Arroces Integrales",
      description: "Las pastas y harinas deben ser 100% integrales. El arroz siempre integral.",
      icon: "🌾",
    },
    {
      id: "ind-2",
      title: "1 Ensalada Diaria Obligatoria",
      description: "2 tazas de verdura cruda con 2 cdas de pepitas de calabaza, ajonjolí o semillas de girasol. Agregar germinados habitualmente.",
      icon: "🥗",
    },
    {
      id: "ind-3",
      title: "Hidratación 1.5L a 2L al día",
      description: "Beber agua pura a lo largo del día entre comidas.",
      icon: "💧",
    },
    {
      id: "ind-4",
      title: "Cero Ultraprocesados & Fritos",
      description: "Evitar productos enlatados, embutidos, azúcar refinada, refrescos, edulcorantes químicos (Splenda, Nutrasweet), harinas blancas y frituras.",
      icon: "🚫",
    },
  ],
  cookingSupplies: {
    oils: [
      { name: "Aceite de Oliva prensado en frío", use: "Vinagretas y ensaladas (en crudo)" },
      { name: "Aceite de Linaza prensado en frío", use: "Vinagretas y aderezos con moderación" },
      { name: "Aceite de Pepita de Uva / Aguacate", use: "Cocinar a fuego moderado (poca cantidad)" },
    ],
    sweeteners: [
      { name: "Fruto del Monje (Monkfruit)", notes: "Sin eritritol añadido" },
      { name: "Stevia natural", notes: "Hojas o extracto puro" },
      { name: "Miel de Agave", notes: "Uso con moderación" },
    ],
    seasonings: [
      { name: "Sal de Mar Yodada", notes: "Garantiza aporte de yodo en dieta plant-based" },
      { name: "Especias Naturales", notes: "Cúrcuma, pimienta, orégano, comino, páprika, ajo" },
    ],
  },
  preparationTips: [
    {
      topic: "Remojo de Legumbres",
      text: "Remojar frijoles, lentejas, garbanzos y habas por 8 horas. Tirar el agua de remojo antes de cocinarlos. En caso de inflamación, licuar/procesar (como humus o cremas) para mejorar la asimilación.",
      icon: "🫘",
    },
    {
      topic: "Remojo de Quinoa",
      text: "Remojar la quinoa durante 15 minutos en agua y luego enjuagar profusamente bajo chorro de agua por 1 minuto para eliminar saponinas amargas.",
      icon: "🥣",
    },
    {
      topic: "Frutas que se comen solas",
      text: "El Melón y la Sandía deben consumirse solos, separados de otras comidas para evitar fermentaciones gastrointestinales.",
      icon: "🍉",
    },
    {
      topic: "Hojas Verdes & Espinacas",
      text: "Se prefiere consumir las espinacas cocidas al vapor o licuadas en smoothies para reducir oxalatos y maximizar absorción de hierro y calcio.",
      icon: "🥬",
    },
    {
      topic: "Aporte de DHA",
      text: "Consumir 2 cucharaditas diarias de fuentes ricas en Omega-3 (semillas de chía/linaza molida) o cápsula de microalgas.",
      icon: "🌱",
    },
  ],
  supplementationList: [
    { name: "Vitamina C (1g)", timing: "Con la comida fuerte", frequency: "Diario" },
    { name: "Vitamina B12 (1000 mcg)", timing: "Cualquier momento del día", frequency: "1 vez por semana" },
    { name: "Omega 3 de Microalgas (1 cap)", timing: "Con el desayuno", frequency: "Diario" },
    { name: "Vitamina D + K (1 dosis)", timing: "Con el desayuno", frequency: "Diario por 1 mes" },
    { name: "Ser + Magnesio Complex", timing: "Por la noche antes de dormir", frequency: "Diario" },
    { name: "Spirulina", timing: "4 tabs con desayuno + 3 tabs con comida", frequency: "Diario por 1 mes" },
  ],
  foodEquivalencies: {
    fruits: ["Plátano", "Pera", "Manzana", "Durazno", "Melón (solo)", "Sandía (sola)", "Uva", "Higo", "Piña", "Mango", "Aguacate", "Jitomate", "Naranja", "Fresas / Frutos rojos", "Kiwi"],
    vegetables: ["Zanahoria", "Calabaza", "Chayote", "Pepino (sin cáscara ni semillas)", "Espárragos", "Nopal", "Berenjena", "Brócoli", "Col", "Coliflor", "Col morada", "Kale", "Setas", "Champiñones", "Portobello"],
    legumes: ["Frijol (remojado 8h)", "Lentejas", "Chícharos", "Garbanzos (humus)", "Habas", "Ejote", "Tofu orgánico", "Edamames de soya"],
    cereals: ["Amaranto", "Maíz o elote (Tortilla)", "Quinoa", "Arroz integral", "Avena natural", "Trigo sarraceno"],
    seeds: ["Nueces", "Almendras", "Pepitas de calabaza", "Semillas de girasol", "Ajonjolí", "Pistache", "Hemp", "Cacahuate", "Linaza", "Chía"],
  },
};

/**
 * Pre-seeded recipe catalog from Mariana Mont 4-week meal plans.
 */
export const MARIANA_MONT_PRESET_RECIPES: NutritionRecipe[] = [
  // --- DESAYUNOS (Smoothies base) ---
  {
    id: "rec-smoothie-s1",
    title: "Smoothie Energético Matutino",
    mealSlot: "breakfast",
    weekNumber: 1,
    optionLabel: "Base Semanal",
    portions: { fruits: 1.5, leafy_greens: 1.0, fats_seeds: 1.0 },
    ingredients: ["1 tz espinacas baby", "1 plátano congelado", "1/2 tz frutos rojos", "1 cda semillas de chía", "Agua o leche vegetal"],
    prepNotes: "Licuar a máxima potencia. Tomar junto con Omega 3 y Vit D+K.",
    isPreset: true,
  },
  {
    id: "rec-smoothie-s2",
    title: "Green Power Smoothie",
    mealSlot: "breakfast",
    weekNumber: 2,
    optionLabel: "Base Semanal",
    portions: { fruits: 1.5, leafy_greens: 1.5, fats_seeds: 1.0 },
    ingredients: ["1.5 tz hojas verdes (kale/espinaca)", "1 manzana verde", "1/2 plátano", "1 cda semillas de girasol", "Agua fresca"],
    prepNotes: "Licuar bien para romper fibras verdes.",
    isPreset: true,
  },

  // --- ALMUERZOS ---
  {
    id: "rec-alm-s1-a",
    title: "Bowl de Avena con Semillas, Amaranto y Fruta",
    mealSlot: "lunch",
    weekNumber: 1,
    optionLabel: "Opción A",
    portions: { cereals: 2.0, fats_seeds: 1.0, fruits: 1.0 },
    ingredients: ["1/2 tz avena integral", "2 cdas amaranto", "1 cda pepitas de calabaza", "1 manzana o plátano picado", "Canela"],
    prepNotes: "Cocinar la avena con agua y canela. Servir con las semillas y la fruta fresca encima.",
    isPreset: true,
  },
  {
    id: "rec-alm-s1-b",
    title: "Tortitas de Lenteja y Plátano Macho",
    mealSlot: "lunch",
    weekNumber: 1,
    optionLabel: "Opción B",
    portions: { legumes: 1.5, cereals: 1.0, tubers: 0.5 },
    ingredients: ["1/2 tz lentejas cocidas procesadas", "1/3 plátano macho cocido machacado", "1 cda harina de avena integral", "Especias al gusto"],
    prepNotes: "Formar tortitas y dorar en sartén con una gota de aceite de pepita de uva.",
    isPreset: true,
  },
  {
    id: "rec-alm-s2-a",
    title: "Pudín de Avena con Chía + Plátano y Cacao",
    mealSlot: "lunch",
    weekNumber: 2,
    optionLabel: "Opción A",
    portions: { cereals: 1.5, fats_seeds: 1.0, fruits: 1.0 },
    ingredients: ["1/2 tz avena", "1.5 cdas chía", "1 cda cacao puro en polvo", "1 plátano", "Leche de almendras"],
    prepNotes: "Dejar reposar la chía y avena desde la noche anterior en refrigeración.",
    isPreset: true,
  },
  {
    id: "rec-alm-s2-b",
    title: "Tofu Revuelto con 1/2 tz Frijol y Aguacate",
    mealSlot: "lunch",
    weekNumber: 2,
    optionLabel: "Opción B",
    portions: { legumes: 2.0, fats_seeds: 1.0, vegetables: 0.5 },
    ingredients: ["1/2 tz tofu firme desmenuzado con cúrcuma", "1/2 tz frijoles cocidos", "1/3 aguacate", "Jitomate y cebolla picados"],
    prepNotes: "Saltear el tofu con cúrcuma y sal de mar yodada. Acompañar con frijoles y aguacate.",
    isPreset: true,
  },
  {
    id: "rec-alm-s3-a",
    title: "1 tz de Quinoa con Leche de Coco y Fresas",
    mealSlot: "lunch",
    weekNumber: 3,
    optionLabel: "Opción A",
    portions: { cereals: 2.0, fruits: 1.0, fats_seeds: 0.5 },
    ingredients: ["1/2 tz quinoa cocida (remojada 15 min y enjuagada)", "1/2 tz leche de coco sin azúcar", "1 tz fresas rebanadas", "Canela"],
    prepNotes: "Calentar la quinoa con la leche de coco y servir con fresas frescas.",
    isPreset: true,
  },
  {
    id: "rec-alm-s3-b",
    title: "Sopes de Frijol y Verduras",
    mealSlot: "lunch",
    weekNumber: 3,
    optionLabel: "Opción B",
    portions: { cereals: 2.0, legumes: 1.0, vegetables: 1.5 },
    ingredients: ["2 bases de sope de maíz horneadas", "1/2 tz frijoles refritos sin grasa", "Lechuga, jitomate, nopal cocido", "Salsa casera"],
    prepNotes: "Untar los frijoles sobre los sopes calientes y cubrir con abundante nopal y lechuga.",
    isPreset: true,
  },
  {
    id: "rec-alm-s4-a",
    title: "Hotcakes de Avena con Miel de Agave y Plátano",
    mealSlot: "lunch",
    weekNumber: 4,
    optionLabel: "Opción A",
    portions: { cereals: 2.0, fruits: 1.0, fats_seeds: 0.5 },
    ingredients: ["3/4 tz avena molida", "1 plátano maduro", "1 cdita miel de agave", "Leche de soya o agua", "Vainilla"],
    prepNotes: "Licuar y cocer en sartén antiadherente.",
    isPreset: true,
  },
  {
    id: "rec-alm-s4-b",
    title: "Entomatadas Rellenas de Frijol y Papa + Queso de Almendras",
    mealSlot: "lunch",
    weekNumber: 4,
    optionLabel: "Opción B",
    portions: { cereals: 2.0, legumes: 1.0, tubers: 0.5, fats_seeds: 0.5 },
    ingredients: ["2 tortillas de maíz", "1/3 tz frijoles negros", "1/4 tz papa cocida machacada", "Salsa de jitomate natural", "Crema de almendras casera"],
    prepNotes: "Rellenar las tortillas calientes con frijol y papa, bañar en salsa tibia y crema de almendras.",
    isPreset: true,
  },

  // --- COMIDAS FUERTES ---
  {
    id: "rec-com-s1-a",
    title: "Ensalada Mediterránea con Dip de Semillas + Arroz con Vegetales y Edamames",
    mealSlot: "dinner",
    weekNumber: 1,
    optionLabel: "Opción A",
    portions: { vegetables: 2.0, leafy_greens: 1.0, cereals: 1.5, legumes: 1.5, fats_seeds: 1.0 },
    ingredients: ["2 tz ensalada mixta", "2 cdas dip de semillas de girasol", "1/2 tz arroz integral", "1/2 tz edamames al ajillo", "Calabacita y pimientos rostizados"],
    prepNotes: "Acompañar con Vitamina C de 1g. Saltear los edamames con poco ajo y aceite de oliva.",
    isPreset: true,
  },
  {
    id: "rec-com-s1-b",
    title: "Ensalada + Sopa de Verduras con Garbanzo + Champiñones al Ajillo",
    mealSlot: "dinner",
    weekNumber: 1,
    optionLabel: "Opción B",
    portions: { vegetables: 2.5, legumes: 1.5, fats_seeds: 1.0 },
    ingredients: ["1 tz sopa de verduras casera", "1/2 tz garbanzos cocidos", "1.5 tz champiñones rebanados", "Ajo, guajillo, perejil", "1 ensalada verde con pepitas"],
    prepNotes: "Cocinar los champiñones al ajillo con 1 cdita de aceite de aguacate.",
    isPreset: true,
  },
  {
    id: "rec-com-s2-a",
    title: "Crema de Pimientos con Pepitas + Medallón de Garbanzo, Avena y Camote",
    mealSlot: "dinner",
    weekNumber: 2,
    optionLabel: "Opción A",
    portions: { vegetables: 2.0, legumes: 1.5, cereals: 1.0, tubers: 0.5, fats_seeds: 1.0 },
    ingredients: ["1 tz crema de pimientos rostizados con pepitas trituradas", "1 medallón casero de garbanzo con avena y camote", "1 ensalada verde fresca"],
    prepNotes: "Hornear el medallón hasta dorar ligeramente.",
    isPreset: true,
  },
  {
    id: "rec-com-s2-b",
    title: "Ensalada con Edamames y Tahini + Arroz Thai",
    mealSlot: "dinner",
    weekNumber: 2,
    optionLabel: "Opción B",
    portions: { vegetables: 1.5, legumes: 1.5, cereals: 1.5, fats_seeds: 1.0 },
    ingredients: ["1/2 tz arroz integral al vapor con jengibre", "1/2 tz edamames de soya", "1 cda tahini (ajonjolí)", "Zanahoria y pepino en julianas"],
    prepNotes: "Mezclar el tahini con jugo de limón y agua para el aderezo thai.",
    isPreset: true,
  },
  {
    id: "rec-com-s3-a",
    title: "Bowl de Quinoa Citrus + 'Salmón' de Tofu a la Plancha",
    mealSlot: "dinner",
    weekNumber: 3,
    optionLabel: "Opción A",
    portions: { cereals: 1.5, legumes: 2.0, vegetables: 1.5, fats_seeds: 1.0 },
    ingredients: ["1/2 tz quinoa con vinagreta cítrica", "1/2 tz tofu marinado con páprika y salsa de soya", "Espárragos y pimientos asados", "Aguacate"],
    prepNotes: "Sellar el tofu a fuego medio para que quede crujiente.",
    isPreset: true,
  },
  {
    id: "rec-com-s3-b",
    title: "Ensalada de Mango y Aguacate + Pasta Integral con Champiñones + Garbanzos a la Páprika",
    mealSlot: "dinner",
    weekNumber: 3,
    optionLabel: "Opción B",
    portions: { fruits: 0.5, fats_seeds: 1.0, cereals: 1.5, vegetables: 1.0, legumes: 1.0 },
    ingredients: ["1/2 tz pasta 100% integral cocida", "1 tz champiñones salteados", "1/3 tz garbanzos dorados con páprika", "Ensalada de espinaca, mango y aguacate"],
    prepNotes: "Ideal para días de entrenamiento intenso.",
    isPreset: true,
  },
  {
    id: "rec-com-s4-a",
    title: "Fideos Thai con Cubos de Tofu + Tacos de Coliflor a la Mexicana",
    mealSlot: "dinner",
    weekNumber: 4,
    optionLabel: "Opción A",
    portions: { cereals: 2.0, legumes: 1.5, vegetables: 2.0, fats_seeds: 0.5 },
    ingredients: ["1/2 tz fideos de arroz o trigo sarraceno", "Cubos de tofu salteado", "2 tortillas de maíz con coliflor asada con jitomate, cebolla y cilantro"],
    prepNotes: "Excelente balance de carbohidratos complejos y proteína vegetal.",
    isPreset: true,
  },
  {
    id: "rec-com-s4-b",
    title: "Ensalada Mixta + Falafel Horneado con Crema de Semillas",
    mealSlot: "dinner",
    weekNumber: 4,
    optionLabel: "Opción B",
    portions: { vegetables: 2.0, legumes: 2.0, fats_seeds: 1.5, leafy_greens: 1.0 },
    ingredients: ["3 piezas de falafel horneado de garbanzo", "2 cdas aderezo cremoso de ajonjolí y pepitas", "Abundante ensalada verde y pepino"],
    prepNotes: "Hornear el falafel a 190°C por 20 min en lugar de freír.",
    isPreset: true,
  },

  // --- SNACKS ---
  {
    id: "rec-snk-1",
    title: "Mango Picado con 1 cda de Amaranto",
    mealSlot: "snack",
    weekNumber: 1,
    optionLabel: "Opción A",
    portions: { fruits: 1.0, cereals: 0.5 },
    ingredients: ["1 tz mango picado", "1 cda amaranto tostado natural"],
    prepNotes: "Comer fresco a media tarde.",
    isPreset: true,
  },
  {
    id: "rec-snk-2",
    title: "Bolita Energética + Melón en Cubos",
    mealSlot: "snack",
    weekNumber: 1,
    optionLabel: "Opción B",
    portions: { fruits: 1.0, fats_seeds: 0.5, cereals: 0.5 },
    ingredients: ["1 bolita de dátil, avena y nuez", "1 tz melón picado"],
    prepNotes: "Recordar que el melón se digiere mejor solo.",
    isPreset: true,
  },
  {
    id: "rec-snk-3",
    title: "Mousse de Frambuesa y Arándanos",
    mealSlot: "snack",
    weekNumber: 2,
    optionLabel: "Opción A",
    portions: { fruits: 1.0, fats_seeds: 0.5 },
    ingredients: ["1/2 tz frambuesas", "1/2 tz arándanos", "1 cda crema de coco o tofu sedoso licuado"],
    prepNotes: "Licuar frío y refrigerar 15 min.",
    isPreset: true,
  },
  {
    id: "rec-snk-4",
    title: "Manzana en Obleas con Crema de Cacahuate",
    mealSlot: "snack",
    weekNumber: 3,
    optionLabel: "Opción B",
    portions: { fruits: 1.0, fats_seeds: 1.0 },
    ingredients: ["1 manzana rebanada finamente", "1.5 cdas crema de cacahuate 100% natural"],
    prepNotes: "Espolvorear canela encima.",
    isPreset: true,
  },
  {
    id: "rec-snk-5",
    title: "Helado Saludable de 'Nutella' (Plátano, Cacao y Avellana)",
    mealSlot: "snack",
    weekNumber: 4,
    optionLabel: "Opción A",
    portions: { fruits: 1.0, fats_seeds: 1.0 },
    ingredients: ["1 plátano congelado", "1 cda cacao puro", "1 cda crema de avellana o cacahuate natural"],
    prepNotes: "Procesar en licuadora hasta lograr textura cremosa.",
    isPreset: true,
  },

  // --- CENAS ---
  {
    id: "rec-cen-s1-a",
    title: "Green Smoothie + 2 Taquitos de Nopales con Papa",
    mealSlot: "dinner",
    weekNumber: 1,
    optionLabel: "Opción A",
    portions: { leafy_greens: 1.0, fruits: 0.5, vegetables: 1.5, cereals: 1.0, tubers: 0.5 },
    ingredients: ["1 vaso green smoothie (espinaca, pepino, limón)", "2 tortillas de maíz", "1 tz nopales asados con cubos de papa"],
    prepNotes: "Cena ligera de fácil digestión para favorecer el descanso.",
    isPreset: true,
  },
  {
    id: "rec-cen-s1-b",
    title: "Tostadas de Cereal con Crema de Cacahuate y Fresas",
    mealSlot: "dinner",
    weekNumber: 1,
    optionLabel: "Opción B",
    portions: { cereals: 1.5, fats_seeds: 1.0, fruits: 1.0 },
    ingredients: ["2 tostadas de maíz horneadas o tortitas de arroz", "1.5 cdas crema de cacahuate", "Fresas rebanadas"],
    prepNotes: "Ideal cuando se busca algo rápido y dulce pero nutritivo.",
    isPreset: true,
  },
  {
    id: "rec-cen-s2-a",
    title: "Green Smoothie + Taquitos de Setas Rostizadas con Quesito de Almendras",
    mealSlot: "dinner",
    weekNumber: 2,
    optionLabel: "Opción A",
    portions: { leafy_greens: 1.0, vegetables: 1.5, cereals: 1.0, fats_seeds: 0.5 },
    ingredients: ["Green smoothie", "2 tortillas de maíz", "1 tz setas rostizadas con ajo y orégano", "1 cda requesón de almendra"],
    prepNotes: "Las setas aportan textura y antioxidantes.",
    isPreset: true,
  },
  {
    id: "rec-cen-s3-a",
    title: "Green Smoothie + Wraps de Humus con Verdura Rallada",
    mealSlot: "dinner",
    weekNumber: 3,
    optionLabel: "Opción A",
    portions: { leafy_greens: 1.0, legumes: 1.0, vegetables: 1.5, cereals: 1.0 },
    ingredients: ["Green smoothie", "1 tortilla integral o de maíz", "3 cdas humus casero", "Zanahoria, pepino y germinados rallados"],
    prepNotes: "Enrollar en forma de wrap y disfrutar fresco.",
    isPreset: true,
  },
  {
    id: "rec-cen-s4-a",
    title: "Green Smoothie + Huarache de Nopal con Champiñones a la Mexicana y Tahini",
    mealSlot: "dinner",
    weekNumber: 4,
    optionLabel: "Opción A",
    portions: { leafy_greens: 1.0, vegetables: 2.0, fats_seeds: 0.5 },
    ingredients: ["Green smoothie", "1 penca de nopal asada grande como base", "1 tz champiñones con jitomate y cebolla", "1 cda tahini"],
    prepNotes: "Cena muy baja en carbohidratos simples, alta en fibra y minerales.",
    isPreset: true,
  },
];
