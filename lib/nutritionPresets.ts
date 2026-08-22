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
 * Complete pre-seeded recipe catalog from Mariana Mont's books:
 * - "La Luna Verde (Recetas Veganas)"
 * - "DTX Plant Based / Renueva tus Hábitos en 7 Días"
 * - "Recetario Detox Otoñal"
 * - "Plan Semanal Clínico (Semanas 1 a 4)"
 */
export const MARIANA_MONT_PRESET_RECIPES: NutritionRecipe[] = [
  // ==========================================
  // 1. LECHADAS VEGETALES & BEBIDAS BASE
  // ==========================================
  {
    id: "rec-lechada-almendras",
    title: "Lechada de Almendras Casera",
    mealSlot: "breakfast",
    category: "Lechadas",
    bookSource: "La Luna Verde",
    portions: { fats_seeds: 1.0 },
    ingredients: [
      "1 taza de almendras crudas peladas (200g)",
      "1 litro de agua fresca",
      "Opcional: 1 cda miel de agave, 1 plátano maduro o dátiles"
    ],
    prepNotes: "Remojar almendras en 1L de agua al menos 2 hrs. Moler en batidora y colar con tela de algodón exprimiendo bien. Guardar el bagazo para bizcochos o queso vegetal.",
    isPreset: true,
  },
  {
    id: "rec-leche-alpiste",
    title: "Leche de Alpiste (Enzimática en Ayunas)",
    mealSlot: "breakfast",
    category: "Lechadas",
    bookSource: "La Luna Verde",
    portions: { cereals: 0.5, fats_seeds: 0.5 },
    ingredients: [
      "1 taza de alpiste para consumo humano",
      "1 litro de agua fresca"
    ],
    prepNotes: "Colocar en remojo toda la noche. Por la mañana tirar el agua y lavar. Licuar con 1L de agua fresca, colar con colador fino y luego con tela. Tomar al despertar y esperar 1 hora antes de desayunar (sin azúcar ni frutas).",
    isPreset: true,
  },
  {
    id: "rec-leche-coco",
    title: "Leche de Coco Pura",
    mealSlot: "breakfast",
    category: "Lechadas",
    bookSource: "La Luna Verde",
    portions: { fats_seeds: 1.0 },
    ingredients: [
      "1/2 taza de coco rallado sin azúcar",
      "2 tazas de agua a punto de ebullición"
    ],
    prepNotes: "Verter el agua hirviendo sobre el coco rallado y dejar infusionar hasta enfriar. Licuar 1-2 min y filtrar con doble colador o paño de gasa. Conservar en refrigerador máximo 2 días.",
    isPreset: true,
  },

  // ==========================================
  // 2. QUESOS VEGETALES, ADEREZOS & PATÉS
  // ==========================================
  {
    id: "rec-queso-vegetal",
    title: "Queso Vegetal de Semillas de Girasol / Bagazo",
    mealSlot: "sauce_dip",
    category: "Quesos & Patés",
    bookSource: "La Luna Verde",
    portions: { fats_seeds: 1.0 },
    ingredients: [
      "1 taza de semillas de girasol (o bagazo de lechada)",
      "Punta de 1 cda de levadura nutricional o de cerveza",
      "1 cdita de aceite de oliva",
      "Jugo de 1/2 limón",
      "Pizca de sal de mar",
      "Hierbas aromáticas al gusto",
      "Opcional: 1 cdita de agar agar para derretir"
    ],
    prepNotes: "Procesar en licuadora hasta obtener una pastita suave. Vaciar en refractario de vidrio y refrigerar un par de horas.",
    isPreset: true,
  },
  {
    id: "rec-mayonesa-zanahoria",
    title: "Mayonesa Saludable de Zanahoria",
    mealSlot: "sauce_dip",
    category: "Quesos & Patés",
    bookSource: "La Luna Verde",
    portions: { vegetables: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "2 zanahorias medianas",
      "Jugo de 1 o 2 limones",
      "1/4 taza de aceite de oliva extra virgen",
      "Pizca de ajo o cebolla",
      "1 cdita de miel de agave",
      "Pizca de comino",
      "1 cdita de ajonjolí crudo",
      "Pizca de sal"
    ],
    prepNotes: "Licuar todos los ingredientes excepto el aceite. Con la licuadora a velocidad media-alta, agregar el aceite en hilo delgado hasta que emulsione y recreme.",
    isPreset: true,
  },
  {
    id: "rec-pate-girasol-brocoli",
    title: "Paté de Semillas de Girasol y Brócoli",
    mealSlot: "sauce_dip",
    category: "Quesos & Patés",
    bookSource: "La Luna Verde",
    portions: { vegetables: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "100g de semillas de girasol remojadas toda la noche",
      "150g de brócoli cocido 15 min",
      "1 diente de ajo",
      "1/2 cebolla salteada",
      "Zumo de 1/2 limón",
      "Aceite de oliva, sal marina y pimienta negra",
      "Tomates cherry y orégano para decorar"
    ],
    prepNotes: "Saltear la cebolla y el ajo sin dorar. Triturar en batidora con el brócoli, semillas de girasol escurridas, aceite de oliva y limón. Acompañar con tostadas y tomatitos horneados.",
    isPreset: true,
  },
  {
    id: "rec-hummus-clasico",
    title: "Hummus Cremoso de Garbanzo",
    mealSlot: "sauce_dip",
    category: "Quesos & Patés",
    bookSource: "La Luna Verde",
    portions: { legumes: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "2 tazas de garbanzo cocido",
      "1/4 taza de aceite de oliva extra virgen",
      "Jugo de 2 limones",
      "1/4 taza de ajonjolí tostado (tahini)",
      "2 dientes de ajo fresco",
      "Sal de mar y pizca de comino"
    ],
    prepNotes: "Colocar todo en procesador o licuadora calculando el agua para obtener textura sedosa. Ideal para untar en wraps, ensaladas o verduras crudas.",
    isPreset: true,
  },
  {
    id: "rec-pesto-acelga",
    title: "Pesto de Acelga y Cacahuate Tostado",
    mealSlot: "sauce_dip",
    category: "Quesos & Patés",
    bookSource: "La Luna Verde",
    portions: { leafy_greens: 0.5, fats_seeds: 1.0 },
    ingredients: [
      "5 hojas de acelga lavadas",
      "3 cdas de aceite de oliva",
      "2 dientes de ajo",
      "2 puñados de cacahuate o maní tostado",
      "Sal marina y pimienta"
    ],
    prepNotes: "Licuar todos los ingredientes hasta tener una pasta homogénea. Agregar agua o aceite según la fluidez deseada.",
    isPreset: true,
  },
  {
    id: "rec-quesito-almendras",
    title: "Dip o Quesito Untable de Almendras",
    mealSlot: "sauce_dip",
    category: "Quesos & Patés",
    bookSource: "DTX Plant Based",
    portions: { fats_seeds: 1.5 },
    ingredients: [
      "1 taza de almendras o nueces remojadas 4 a 6 hrs",
      "1/2 taza de agua",
      "1/2 cdita de vinagre de manzana",
      "Jugo de 1 limón",
      "1/2 cdita de ajo y cebolla en polvo",
      "1/2 cdita de levadura nutricional",
      "Opcional: cebollín o pimiento asado picado"
    ],
    prepNotes: "Procesar las almendras remojadas con agua y colar con malla para retirar exceso de líquido. Incorporar sazonadores, compactar en refractario redondo y refrigerar.",
    isPreset: true,
  },
  {
    id: "rec-tahini-casero",
    title: "Tahini Puro de Ajonjolí Tostado",
    mealSlot: "sauce_dip",
    category: "Quesos & Patés",
    bookSource: "DTX Plant Based",
    portions: { fats_seeds: 1.0 },
    ingredients: [
      "1/2 taza de ajonjolí tostado",
      "2 cdas de aceite de oliva extra virgen",
      "1 pizca de sal de mar",
      "1 pizca de ajo en polvo"
    ],
    prepNotes: "Procesar lentamente en procesador haciendo pausas hasta que el ajonjolí suelte sus aceites naturales y quede una crema suave. Refrigerar.",
    isPreset: true,
  },
  {
    id: "rec-crema-cacahuate-avellana",
    title: "Crema Casera de Cacahuate, Almendras o Avellanas",
    mealSlot: "snack",
    category: "Snacks & Postres",
    bookSource: "DTX Plant Based",
    portions: { fats_seeds: 1.0 },
    ingredients: [
      "1/2 taza de cacahuate, avellanas o almendras sin cáscara",
      "1/4 cdita de sal de mar",
      "Opcional: 2 cdas de cacao puro y chorrito de leche de coco"
    ],
    prepNotes: "Remojar frutos secos 6h, tirar agua y secar en trapo. Tostar en sartén a fuego bajo por 5 min. Procesar lentamente en licuadora con pausas hasta obtener crema brillante.",
    isPreset: true,
  },

  // ==========================================
  // 3. DESAYUNOS, ALMUERZOS & PLATOS PRINCIPALES
  // ==========================================
  {
    id: "rec-tortilla-garbanzo",
    title: "Tortilla Española Vegana de Garbanzo",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { legumes: 1.5, tubers: 1.0, leafy_greens: 1.0, vegetables: 0.5 },
    ingredients: [
      "1 taza de harina de garbanzo",
      "1/2 taza de agua",
      "1 papa pre-cocida en láminas",
      "1 taza de espinacas picadas",
      "1/4 taza de cebolla en juliana",
      "1/2 taza de zanahoria o calabaza rallada",
      "Chorrito de aceite de aguacate y condimentos al gusto"
    ],
    prepNotes: "Mezclar harina de garbanzo, agua, cebolla, espinacas y especias (textura hotcake). Añadir las papas. Cocinar en sartén tapado a fuego bajo, voltear con otro sartén caliente engrasado y dorar. Servir en rebanadas.",
    isPreset: true,
  },
  {
    id: "rec-setas-rostizadas-ajillo",
    title: "Setas Rostizadas al Sartén con Cúrcuma y Cilantro",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { vegetables: 2.0, fats_seeds: 0.5 },
    ingredients: [
      "2 tazas de setas desmenuzadas",
      "1/2 taza de cebolla fileteada",
      "1/4 taza de cebollín picado",
      "1/2 taza de cilantro fresco picado",
      "Jugo de 1/2 limón",
      "Ajo en polvo, sal, comino y cúrcuma en polvo",
      "Aceite de aguacate"
    ],
    prepNotes: "Calentar aceite de aguacate en sartén, agregar cebolla, setas, condimentos y limón. Mover unos minutos hasta dorar. Terminar con cebollín y cilantro fresco.",
    isPreset: true,
  },
  {
    id: "rec-tofu-revuelto",
    title: "Tofu Revuelto a la Mexicana con Cúrcuma",
    mealSlot: "lunch",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { legumes: 2.0, vegetables: 1.0, fats_seeds: 0.5 },
    ingredients: [
      "1 taza de tofu firme o extra firme drenado",
      "1 jitomate en cubos pequeños",
      "1/4 taza de cebolla finamente picada",
      "1/4 taza de pimiento morrón picado",
      "1/4 cda de cúrcuma en polvo",
      "Ajo en polvo y sal de mar yodada",
      "1 chorrito de aceite de aguacate"
    ],
    prepNotes: "Saltear cebolla y pimiento en sartén por 3 min. Desmenuzar el tofu con las manos, agregar jitomate y cúrcuma. Cocinar y revolver 5 minutos.",
    isPreset: true,
  },
  {
    id: "rec-bowl-abundancia",
    title: "Bowl de la Abundancia (Hojas, Wok, Legumbres y Aguacate)",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { leafy_greens: 2.0, vegetables: 2.0, legumes: 1.0, fats_seeds: 1.5 },
    ingredients: [
      "2 tazas de hojas verdes frescas",
      "1 taza de verdura cruda (pepino, zanahoria)",
      "1 taza de verdura asada al wok (calabaza, brócoli)",
      "1/2 taza de legumbres cocidas o germinados",
      "2 cdas de semillas de girasol/pepitas",
      "1/4 de aguacate rebanado"
    ],
    prepNotes: "Montar las hojas verdes de base, acomodar las verduras crudas y asadas por secciones, añadir las legumbres, semillas tostadas y aguacate con aderezo cítrico.",
    isPreset: true,
  },
  {
    id: "rec-ensalada-garbanzos-nopoll",
    title: "Ensalada de Garbanzos con Crema de Almendras (Estilo No-Pollo)",
    mealSlot: "lunch",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { legumes: 1.5, tubers: 0.5, vegetables: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "1/4 taza de garbanzo cocido ligeramente procesado",
      "1 zanahoria cocida en cubos",
      "1 papa cocida en cubos",
      "1/4 taza de chícharos cocidos",
      "1/2 taza de espinaca picada",
      "Crema de almendras casera (almendras remojadas con limón y ajo)",
      "Sal de mar y ajo en polvo"
    ],
    prepNotes: "Mezclar los garbanzos machacados con las verduras cocidas en cubitos y la crema de almendras. Servir frío sobre tostadas horneadas o hojas de lechuga.",
    isPreset: true,
  },
  {
    id: "rec-fideos-al-wok-cacahuate",
    title: "Fideos al Wok con Verduras y Dip de Cacahuate",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { cereals: 2.0, vegetables: 2.0, legumes: 1.0, fats_seeds: 1.5 },
    ingredients: [
      "1 paquete de fideos de arroz o frijol mungo",
      "2 tazas de verdura en juliana (calabaza, zanahoria, pimiento)",
      "1/2 taza de edamames, chícharos o garbanzos pre-cocidos",
      "Dip: 4 cdas crema de cacahuate natural + 4 cdas salsa de soya baja en sodio + jugo de 1/2 limón"
    ],
    prepNotes: "Cocer los fideos en agua hirviendo por 3 min y escurrir. Saltear las verduras al wok con gotas de agua para dejarlas al dente (crujientes). Mezclar el dip de cacahuate con los fideos, verduras y legumbres.",
    isPreset: true,
  },
  {
    id: "rec-tabule-lentejas",
    title: "Tabulé Fresco de Lentejas con Menta y Laurel",
    mealSlot: "lunch",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { legumes: 1.5, vegetables: 1.5, fats_seeds: 0.5 },
    ingredients: [
      "1 taza de lentejas cocidas con hojas de laurel",
      "1/2 taza de perejil picado",
      "1/4 taza de menta fresca picada",
      "1 pepino en cubos sin cáscara",
      "1 pimiento en cubos",
      "1/2 taza de cebolla morada en cubos",
      "Jugo de 2 limones, sal de mar, cúrcuma y chorrito de aceite de oliva"
    ],
    prepNotes: "Incorporar lentejas frías con verduras y limón. Macerar en refrigerador 1 hora. Terminar con hierbas frescas y aceite de oliva antes de servir.",
    isPreset: true,
  },
  {
    id: "rec-picadillo-lentejas",
    title: "Picadillo Tradicional de Lentejas con Papa y Zanahoria",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { legumes: 1.5, tubers: 1.0, vegetables: 1.5 },
    ingredients: [
      "1/2 taza de lentejas cocidas",
      "1 zanahoria cocida en cubos",
      "1 papa cocida en cubos",
      "2 jitomates medianos",
      "1 diente de ajo y 1/4 cebolla",
      "Hojitas de laurel, comino, orégano y sal de mar"
    ],
    prepNotes: "Licuar jitomate, cebolla, ajo y condimentos con 1/4 tz agua. En sartén calentar poco aceite, saltear papa y zanahoria 2 min, agregar el caldillo, las lentejas y laurel. Cocinar unos minutos para integrar sabores.",
    isPreset: true,
  },
  {
    id: "rec-ceviche-quinoa",
    title: "Ceviche Refrescante de Quinoa y Semillas",
    mealSlot: "lunch",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { cereals: 1.5, vegetables: 1.5, fats_seeds: 1.0 },
    ingredients: [
      "1/2 taza de quinoa cocida (remojada 20 min y enjuagada)",
      "1/2 pepino sin cáscara en cubos",
      "1 taza de jitomate en cubos",
      "1 vara de apio picada",
      "1/2 taza de pimiento picado",
      "4 cdas de semillas de girasol o pepitas",
      "Jugo de 2 limones, cilantro picado y rebanadas de aguacate"
    ],
    prepNotes: "Incorporar todos los ingredientes en un bowl, bañar con limón y sal de mar. Servir sobre tostadas horneadas con aguacate.",
    isPreset: true,
  },
  {
    id: "rec-vegetales-wok-ajonjoli",
    title: "Salteado de Vegetales al Wok con Ajonjolí y Edamames",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "DTX Plant Based",
    portions: { vegetables: 2.5, legumes: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "2 zanahorias y 2 calabazas en rebanadas",
      "1/2 taza de champiñones",
      "1/4 taza de chícharos o edamames precocidos",
      "1/2 taza de brócoli",
      "1 taza de col morada o kale picada",
      "3 cdas de ajonjolí tostado",
      "Ajo, cebolla y aceite de aguacate"
    ],
    prepNotes: "Calentar sartén con gotas de aceite. Agregar verduras por orden de cocción tapando el sartén 2-3 min entre cada una (zanahoria, calabaza, brócoli, edamames y hojas al final). Sazonar y espolvorear ajonjolí.",
    isPreset: true,
  },
  {
    id: "rec-papas-crema-aguacate",
    title: "Papas al Dente con Crema de Aguacate y Hierbas",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "La Luna Verde",
    portions: { tubers: 1.5, fats_seeds: 1.0 },
    ingredients: [
      "1 kg de papas en trozos grandes cocidas al dente",
      "1 aguacate grande o 2 medianos",
      "Jugo de 3 limones",
      "Hierbas frescas picadas: cilantro, albahaca, romero",
      "Sal marina"
    ],
    prepNotes: "Machacar el aguacate con las hierbas finamente picadas, sal y limón. Mezclar suavemente con las papas tibias al dente.",
    isPreset: true,
  },
  {
    id: "rec-coliflor-naranja",
    title: "Coliflor Agridulce a la Naranja y Jengibre",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "La Luna Verde",
    portions: { vegetables: 2.0, cereals: 1.0, fats_seeds: 0.5 },
    ingredients: [
      "3 tazas de floretes de coliflor",
      "1/2 pimiento en rodajas",
      "1/2 taza harina de trigo/almendra + 1/3 tz fécula de maíz para capeado",
      "Salsa: 1/2 tz jugo de naranja natural + 3/4 tz caldo vegetal + 2 cdas soya + 1 cda jengibre fresco + 1 cda ralladura de naranja + ajonjolí"
    ],
    prepNotes: "Pasar floretes por la mezcla ligera de harina y agua y dorar en sartén caliente. Calentar la salsa de naranja con jengibre y espesar con 1 cdita de fécula. Bañar la coliflor y espolvorear ajonjolí.",
    isPreset: true,
  },
  {
    id: "rec-hamburguesas-avena-semillas",
    title: "Hamburguesas Caseras de Avena, Nueces y Semillas",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "La Luna Verde",
    portions: { cereals: 1.5, fats_seeds: 1.0, vegetables: 0.5 },
    ingredients: [
      "1 taza de copos de avena entera",
      "1/4 taza de semillas de girasol o calabaza",
      "1/4 taza de nueces o almendras molidas",
      "1/2 vaso de agua",
      "2 dientes de ajo, 1/2 zanahoria rallada, 1/4 cebolla",
      "Comino en polvo, perejil, pimienta negra y salsa de soya"
    ],
    prepNotes: "Mezclar avena, nueces, semillas y verduras picadas finas con el agua y sazonadores. Dejar reposar masa pegajosa, formar medallones y dorar 2 min por lado en sartén antiadherente.",
    isPreset: true,
  },
  {
    id: "rec-sushi-vegano",
    title: "Sushi Vegano con Nori, Hummus y Verduras Crujientes",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "La Luna Verde",
    portions: { vegetables: 1.5, legumes: 1.0, fats_seeds: 0.5 },
    ingredients: [
      "Hojas de alga Nori",
      "Hummus casero",
      "Vegetales en tiras finas: pimientos, zanahoria, espinaca, calabaza, pepino, betabel",
      "1/2 aguacate rebanado",
      "Perejil fresco"
    ],
    prepNotes: "Untar una capa generosa de hummus sobre el alga Nori, colocar los vegetales en bastones y el aguacate. Enrollar firmemente y cortar en rebanadas de 3 cm.",
    isPreset: true,
  },
  {
    id: "rec-arroz-thai-horneado",
    title: "Arroz Thai Horneado con Piña y Nueces de la India",
    mealSlot: "dinner",
    category: "Platos Fuertes",
    bookSource: "La Luna Verde",
    portions: { cereals: 2.0, fruits: 0.5, fats_seeds: 1.0 },
    ingredients: [
      "4 tazas de arroz integral cocido frío",
      "1 mazo de cebolla verde rebanada",
      "1/2 taza de piña fresca en trozos",
      "1/4 taza de nueces de la india",
      "3 cdtas de salsa de soya",
      "1 cda de aceite de ajonjolí o coco"
    ],
    prepNotes: "Mezclar el arroz con cebollín, piña y nueces. Bañar con la salsa de soya y aceite. Hornear a 200°C en charola por 40 min revolviendo cada 20 min hasta dorar.",
    isPreset: true,
  },

  // ==========================================
  // 4. ENSALADAS EXCLUSIVAS
  // ==========================================
  {
    id: "rec-ensalada-multicolor",
    title: "Ensalada Multicolor con Germinados de Alfalfa",
    mealSlot: "salad",
    category: "Ensaladas",
    bookSource: "La Luna Verde",
    portions: { leafy_greens: 1.0, vegetables: 2.0, fats_seeds: 1.0 },
    ingredients: [
      "Lechuga orejona, italiana y sangría",
      "Pimientos morrones tricolor",
      "1 betabel rallado, 2 zanahorias y 1/2 jícama rallada",
      "1 pepino y 3 jitomates picados",
      "Germinado de alfalfa fresco",
      "Aderezo: jugo de 1 naranja con semillas de girasol"
    ],
    prepNotes: "Picar y rallar todos los vegetales frescos. Añadir el germinado de alfalfa y bañar con el aderezo de jugo de naranja natural y semillas de girasol.",
    isPreset: true,
  },
  {
    id: "rec-ensalada-zanahoria-curry",
    title: "Ensalada de Zanahoria, Manzana y Nueces con Toque de Curry",
    mealSlot: "salad",
    category: "Ensaladas",
    bookSource: "La Luna Verde",
    portions: { vegetables: 1.5, fruits: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "4 zanahorias grandes ralladas finas",
      "2 manzanas dulces ralladas gruesas",
      "1 rama de apio fileteada con hojas",
      "5 nueces enteras troceadas y 1 puñado de pasas",
      "Cilantro picado",
      "Aderezo: 3 cdas aceite de linaza/oliva + jugo 1/2 limón + 1/4 cdita curry + 1 cdita jengibre rallado"
    ],
    prepNotes: "Mezclar las zanahorias y manzanas ralladas con el apio, nueces y pasas. Emulsionar el aderezo con aceite de linaza y curry e integrar todo en un bowl.",
    isPreset: true,
  },
  {
    id: "rec-ensalada-coliflor-arroz",
    title: "Ensalada Fresca de Coliflor 'Estilo Arroz'",
    mealSlot: "salad",
    category: "Ensaladas",
    bookSource: "La Luna Verde",
    portions: { vegetables: 2.0, fats_seeds: 0.5 },
    ingredients: [
      "1/2 cabeza de coliflor procesada",
      "2 tomates rojos picados",
      "1/2 pepino en rodajas",
      "1 trocito de col morada rallada",
      "Jugo de 2 limones y sal de mar",
      "Opcional: 1/2 aguacate"
    ],
    prepNotes: "Moler la coliflor en licuadora o procesador en pulsos hasta lograr consistencia de 'arroz'. Mezclar con el pepino, tomate, col morada y jugo de limón.",
    isPreset: true,
  },
  {
    id: "rec-ensalada-mango-aguacate",
    title: "Ensalada de Mango y Aguacate con Aderezo Cremoso de Mango",
    mealSlot: "salad",
    category: "Ensaladas",
    bookSource: "La Luna Verde",
    portions: { leafy_greens: 1.0, fruits: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "Lechuga morada fresca",
      "1/2 mango en cubos y 1/2 aguacate",
      "Aderezo: 1/2 mango licuado con 1 tomate, cilantro, cebolla cambray blanca y sal de mar"
    ],
    prepNotes: "Picar la lechuga, mango y aguacate. Licuar la otra mitad del mango con tomate, cilantro y cebollita hasta cremoso y verter sobre la ensalada.",
    isPreset: true,
  },
  {
    id: "rec-ensalada-nopal-verde",
    title: "Ensalada de Nopal con Aderezo Verde de Aguacate",
    mealSlot: "salad",
    category: "Ensaladas",
    bookSource: "La Luna Verde",
    portions: { vegetables: 2.0, fats_seeds: 1.0 },
    ingredients: [
      "1 nopal tierno en cubitos",
      "2 tomates rojos y 1/2 pepino",
      "Cilantro fresco picado",
      "Aderezo: 1/2 aguacate licuado con 1/2 tallo de apio, cebollín verde, jugo de 1/2 limón y sal de mar"
    ],
    prepNotes: "Picar el nopal crudo o desflemado con pepino y tomate. Licuar el aderezo de aguacate y apio e integrar muy bien.",
    isPreset: true,
  },
  {
    id: "rec-asian-fusion-salad",
    title: "Ensalada Asian Fusión con Mandarina y Cacahuate",
    mealSlot: "salad",
    category: "Ensaladas",
    bookSource: "La Luna Verde",
    portions: { leafy_greens: 1.0, vegetables: 2.0, fruits: 0.5, fats_seeds: 1.0 },
    ingredients: [
      "1/2 repollo blanco y 1/4 repollo morado picados finos",
      "4 zanahorias ralladas y 3 mazos de acelgas blancas",
      "1/2 jícama rallada y 1 vara de apio",
      "2 mandarinas o naranjas en gajos sin cáscara",
      "Cacahuates y ajonjolí tostados",
      "Aderezo Asian: 1/2 tz jugo de naranja fresco + 3 cdtas vinagre de manzana + 5 cm jengibre rallado + 1 ajo machacado"
    ],
    prepNotes: "Mezclar todos los vegetales crujientes con los gajos de mandarina y frutos secos. Bañar con el aderezo cítrico de jengibre fresco.",
    isPreset: true,
  },

  // ==========================================
  // 5. SOPAS, CREMAS & CALDOS CASEROS
  // ==========================================
  {
    id: "rec-crema-pimientos-morrones",
    title: "Crema de Pimientos Morrones Rostizados con Almendras",
    mealSlot: "soup",
    category: "Sopas & Cremas",
    bookSource: "La Luna Verde",
    portions: { vegetables: 2.0, fats_seeds: 0.5 },
    ingredients: [
      "6 pimientos morrones rojos y amarillos desvenados",
      "1/2 cebolla picada y 2 dientes de ajo",
      "1/2 litro de leche de almendras sin azúcar o agua",
      "2 cdas de sazonador vegetal o especias naturales",
      "Sal de mar y pimienta"
    ],
    prepNotes: "Dorar cebolla, ajo y pimientos con un poco de agua o aceite. Licuar con la leche de almendras y calentar a fuego lento 5 minutos.",
    isPreset: true,
  },
  {
    id: "rec-crema-aguacate-cilantro",
    title: "Crema de Aguacate y Papa con Caldo Vegetal",
    mealSlot: "soup",
    category: "Sopas & Cremas",
    bookSource: "La Luna Verde",
    portions: { tubers: 0.5, fats_seeds: 1.0, vegetables: 0.5 },
    ingredients: [
      "2 aguacates maduros",
      "1/2 papa chica cocida",
      "1 diente de ajo",
      "Caldo vegetal casero",
      "1 cda sopera de cilantro fresco",
      "Pimienta blanca y sal de mar"
    ],
    prepNotes: "Licuar la papa cocida con aguacate, ajo, cilantro, sal y un poco de caldo vegetal. Verter en cacerola, calentar hasta dar un hervor suave y servir tibia.",
    isPreset: true,
  },
  {
    id: "rec-sopa-verduras-fideos-arroz",
    title: "Sopa Casera de Verduras con Fideos Orientales de Arroz",
    mealSlot: "soup",
    category: "Sopas & Cremas",
    bookSource: "La Luna Verde",
    portions: { vegetables: 2.5, cereals: 1.0 },
    ingredients: [
      "4 jitomates licuados con cebolla, cilantro y orégano",
      "Brócoli, zanahoria, chayote, calabaza, espinacas y pimiento picados",
      "Fideos orientales de arroz o frijol mungo",
      "Sal de mar y pimienta"
    ],
    prepNotes: "Sazonar el caldillo de jitomate en olla, agregar las verduras picadas y 3 tazas de agua. Cuando estén cocidas, agregar los fideos de arroz 3 min, apagar y tapar.",
    isPreset: true,
  },
  {
    id: "rec-sopa-crudivegana-zanahoria",
    title: "Sopa Crudivegana de Zanahoria y Aguacate",
    mealSlot: "soup",
    category: "Sopas & Cremas",
    bookSource: "La Luna Verde",
    portions: { vegetables: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "1 zanahoria",
      "1 aguacate",
      "1 tallo de apio sin hojas",
      "1 diente de ajo pequeño",
      "2 cdas de aceite de oliva extra virgen",
      "1.5 tazas de agua tibia",
      "Sal marina y paprika"
    ],
    prepNotes: "Licuar todos los ingredientes juntos por 5 a 10 minutos (la fricción de la licuadora entibiará la sopa de forma natural preservando todas las enzimas).",
    isPreset: true,
  },

  // ==========================================
  // 6. SMOOTHIES, GREEN SMOOTHIES, SHOTS & INFUSIONES
  // ==========================================
  {
    id: "rec-formula-smoothie",
    title: "Fórmula Maestra de Smoothies Mariana Mont",
    mealSlot: "smoothie",
    category: "Smoothies",
    bookSource: "DTX Plant Based",
    portions: { leafy_greens: 0.5, fruits: 1.0, fats_seeds: 0.5, cereals: 0.5 },
    ingredients: [
      "Hojas (1/4 tz): Espinaca, Arúgula, Kale, Acelga o Hierbabuena",
      "Frutas (1 tz): Plátano, Durazno, Fresas o Frutos Rojos",
      "Semillas (1 cda): Almendras, Pepitas, Girasol, Nuez o Hemp",
      "Cereales (1 cda): Avena o Amaranto",
      "1 tz Leche vegetal sin azúcar + 1 tz agua",
      "Superfoods: 1/2 cdita canela, cacao puro, maca o jengibre"
    ],
    prepNotes: "Elegir 1 ingrediente de cada grupo. Licuar a máxima potencia 1 minuto. Tomar fresco por la mañana.",
    isPreset: true,
  },
  {
    id: "rec-green-smoothie-pina-curcuma",
    title: "Green Smoothie #1 (Piña, Apio, Cúrcuma y Chía)",
    mealSlot: "smoothie",
    category: "Smoothies",
    bookSource: "DTX Plant Based",
    portions: { fruits: 1.0, leafy_greens: 0.5, vegetables: 0.5, fats_seeds: 0.5 },
    ingredients: [
      "1 taza de piña fresca",
      "1/2 taza de perejil",
      "1 ramita de apio",
      "1 cm de cúrcuma fresca",
      "1 cda de chía",
      "250 ml de agua fresca"
    ],
    prepNotes: "Licuar con agua pura. No endulzar. Potente diurético y antiinflamatorio hepático.",
    isPreset: true,
  },
  {
    id: "rec-green-smoothie-frutos-rojos-pepino",
    title: "Green Smoothie #2 (Frutos Rojos, Espinaca y Pepino)",
    mealSlot: "smoothie",
    category: "Smoothies",
    bookSource: "DTX Plant Based",
    portions: { fruits: 1.0, leafy_greens: 0.5, vegetables: 0.5, fats_seeds: 0.5 },
    ingredients: [
      "1 taza de frutos rojos",
      "1/2 taza de espinacas",
      "1 cm de jengibre",
      "10 cm de pepino",
      "1 cda de chía",
      "250 ml de agua"
    ],
    prepNotes: "Licuar frío. Rico en antioxidantes antocianinas y flavonoides.",
    isPreset: true,
  },
  {
    id: "rec-green-smoothie-manzana-jengibre",
    title: "Green Smoothie #7 (Manzana Verde, Espinaca y Jengibre)",
    mealSlot: "smoothie",
    category: "Smoothies",
    bookSource: "DTX Plant Based",
    portions: { fruits: 1.0, leafy_greens: 0.5, vegetables: 0.5, fats_seeds: 0.5 },
    ingredients: [
      "1 manzana verde",
      "1/2 taza de espinacas",
      "1 cm de jengibre",
      "1 ramita de apio",
      "1 cda de chía",
      "250 ml de agua"
    ],
    prepNotes: "Licuar con agua sin colar para conservar toda la pectina y fibra prebiótica.",
    isPreset: true,
  },
  {
    id: "rec-infusion-diente-leon",
    title: "Infusión de Diente de León (Depurativo Hepático)",
    mealSlot: "infusion_shot",
    category: "Shots & Infusiones",
    bookSource: "DTX Plant Based",
    portions: {},
    ingredients: [
      "1 cda sopera de diente de león (o 2 sobres)",
      "250 ml de agua a ebullición"
    ],
    prepNotes: "Hervir el agua con la hierba por 2 minutos y dejar reposar 5 min tapado. Tomar sin endulzar.",
    isPreset: true,
  },
  {
    id: "rec-infusion-jengibre-curcuma",
    title: "Infusión Antiinflamatoria de Jengibre y Cúrcuma",
    mealSlot: "infusion_shot",
    category: "Shots & Infusiones",
    bookSource: "DTX Plant Based",
    portions: {},
    ingredients: [
      "300 ml de agua",
      "3 cm de jengibre en rodajas",
      "2 cm de cúrcuma fresca (o 1/4 cdita polvo)",
      "1 pizca de pimienta negra (activa la curcumina)"
    ],
    prepNotes: "Hervir el jengibre por 5 min, apagar el fuego, añadir la cúrcuma y la pizca de pimienta negra. Reposar 5 minutos antes de colar.",
    isPreset: true,
  },
  {
    id: "rec-shot-betabel-apio",
    title: "Shot #1 (Betabel, Apio, Pepino y Limón 30ml)",
    mealSlot: "infusion_shot",
    category: "Shots & Infusiones",
    bookSource: "DTX Plant Based",
    portions: { vegetables: 0.5 },
    ingredients: [
      "5 cm de betabel crudo",
      "1 rama de apio",
      "10 cm de pepino",
      "1 tz de espinaca",
      "Jugo de 1 limón"
    ],
    prepNotes: "Pasar por extractor de jugos o licuar con mínimo de agua y colar muy bien. Tomar en shot concentrado de 30 ml.",
    isPreset: true,
  },

  // ==========================================
  // 7. POSTRES, SNACKS & DULCES SALUDABLES
  // ==========================================
  {
    id: "rec-pancakes-avena-crema-coco",
    title: "Pancakes Integrales de Avena con Crema Batida de Coco",
    mealSlot: "lunch",
    category: "Snacks & Postres",
    bookSource: "La Luna Verde",
    portions: { cereals: 2.0, fruits: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "1.5 taza de harina de trigo integral o blanqueada",
      "4 cdas de harina de arroz",
      "1 taza de plátano maduro machacado",
      "1.5 taza de leche de almendras",
      "2 cdtas de miel de agave o azúcar mascabado",
      "2 cdtas de vainilla y canela",
      "Crema batida de coco y fresas rebanadas de topping"
    ],
    prepNotes: "Mezclar harinas, plátano machacado, leche vegetal y vainilla. Cocinar en sartén con gotas de aceite de coco 2 min por lado. Decorar con crema batida de coco fría y fresas.",
    isPreset: true,
  },
  {
    id: "rec-helado-nutella-fit",
    title: "Helado Saludable de 'Nutella' de Avellanas y Cacao",
    mealSlot: "snack",
    category: "Snacks & Postres",
    bookSource: "La Luna Verde",
    portions: { fats_seeds: 1.5, fruits: 0.5 },
    ingredients: [
      "2 cdas soperas de avellanas remojadas toda la noche",
      "1 cda sopera de cacao puro en polvo",
      "1 cda de sirope de agave",
      "1-2 cubitos de hielo",
      "Pizca de sal marina",
      "25g de nueces picadas para decorar"
    ],
    prepNotes: "Escurrir el agua de las avellanas remojadas y batir a alta velocidad con el cacao, sirope de agave, hielo y pizca de sal hasta cremoso. Decorar con nueces picadas.",
    isPreset: true,
  },
  {
    id: "rec-natilla-tofu-cacao",
    title: "Natilla Proteica de Cacao y Tofu Sedoso",
    mealSlot: "snack",
    category: "Snacks & Postres",
    bookSource: "DTX Plant Based",
    portions: { legumes: 1.0, fats_seeds: 0.5 },
    ingredients: [
      "1 barra de tofu suave o firme",
      "3 cdas de cacao puro en polvo",
      "Miel de agave o stevia al gusto",
      "1 chorrito de extracto de vainilla natural",
      "Chorrito de leche de coco",
      "Fresas picadas y 2 cdas de nueces o hemp"
    ],
    prepNotes: "Procesar el tofu con el cacao, vainilla, endulzante y leche de coco hasta textura de mousse suave. Refrigerar 30 min y servir con fresas y semillas.",
    isPreset: true,
  },
  {
    id: "rec-bolitas-energeticas-datil",
    title: "Bolitas Energéticas de Avena, Amaranto y Dátiles",
    mealSlot: "snack",
    category: "Snacks & Postres",
    bookSource: "DTX Plant Based",
    portions: { cereals: 0.5, fats_seeds: 0.5, fruits: 0.5 },
    ingredients: [
      "1/2 taza de avena molida",
      "1/4 taza de amaranto tostado",
      "1/4 taza de nuez picada",
      "1/4 taza de harina de linaza o chía",
      "2 dátiles remojados",
      "Chorrito de leche vegetal",
      "Cacao en polvo o matcha para rebozar"
    ],
    prepNotes: "Procesar los ingredientes en licuadora hasta pasta pegajosa. Reposar 15 min, formar bolitas con las manos y rebozar en cacao o matcha. Refrigerar.",
    isPreset: true,
  },
  {
    id: "rec-galletas-manzana-canela",
    title: "Galletas Crujientes de Manzana y Frutos Secos",
    mealSlot: "snack",
    category: "Snacks & Postres",
    bookSource: "La Luna Verde",
    portions: { fruits: 1.0, fats_seeds: 0.5 },
    ingredients: [
      "1/2 manzana rebanada finamente con mandolina",
      "1/2 cda de sirope de agave",
      "Almendras, avellanas, dátiles y pasas picadas finas",
      "Canela en polvo"
    ],
    prepNotes: "Picar frutos secos fino con canela y agave. Colocar sobre las láminas de manzana y hornear a 100°C con puerta entreabierta o deshidratar hasta que queden crujientes.",
    isPreset: true,
  },
  {
    id: "rec-mousse-frambuesa-macadamia",
    title: "Mousse Cremoso de Frambuesa y Nuez de Macadamia",
    mealSlot: "snack",
    category: "Snacks & Postres",
    bookSource: "La Luna Verde",
    portions: { fruits: 1.0, fats_seeds: 1.0 },
    ingredients: [
      "25g de nueces de macadamia",
      "25g de piñones",
      "Zumo de 1/2 limón",
      "1 cda de aceite de coco virgen",
      "1/2 cestita de arándanos y 1/2 de frambuesas"
    ],
    prepNotes: "Batir frutos secos con aceite de coco, limón y frutos rojos. Colocar en copas de cristal y refrigerar para que solidifique. Adornar con ralladura de naranja.",
    isPreset: true,
  },
];
