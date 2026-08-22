import { PantryCategory, PantryItem } from "./types";

export const PANTRY_CATEGORIES_META: Record<
  PantryCategory,
  { label: string; icon: string; color: string }
> = {
  proteins_legumes: {
    label: "Proteínas & Legumbres",
    icon: "🍳",
    color: "#ef4444",
  },
  carbs_cereals: {
    label: "Cereales & Granos",
    icon: "🌾",
    color: "#f59e0b",
  },
  healthy_fats: {
    label: "Grasas Saludables & Semillas",
    icon: "🥑",
    color: "#10b981",
  },
  vegetables_greens: {
    label: "Verduras & Hojas Verdes",
    icon: "🥦",
    color: "#059669",
  },
  fruits: {
    label: "Frutas Frescas",
    icon: "🍎",
    color: "#f43f5e",
  },
  kitchen_essentials: {
    label: "Básicos & Especias",
    icon: "🧂",
    color: "#8b5cf6",
  },
};

export const DEFAULT_PANTRY_ITEMS: PantryItem[] = [
  // 1. Proteínas & Legumbres
  { id: "huevos", name: "Huevos", category: "proteins_legumes", inStock: true, icon: "🥚" },
  { id: "tofu", name: "Tofu", category: "proteins_legumes", inStock: true, icon: "🧈" },
  { id: "lentejas", name: "Lentejas", category: "proteins_legumes", inStock: true, icon: "🍲" },
  { id: "frijoles", name: "Frijoles", category: "proteins_legumes", inStock: true, icon: "🫘" },
  { id: "garbanzos", name: "Garbanzos", category: "proteins_legumes", inStock: true, icon: "🧆" },
  { id: "proteina-polvo", name: "Proteína en Polvo", category: "proteins_legumes", inStock: true, icon: "🥤" },
  { id: "atun", name: "Atún", category: "proteins_legumes", inStock: false, icon: "🐟" },
  { id: "pollo", name: "Pechuga de Pollo", category: "proteins_legumes", inStock: false, icon: "🍗" },

  // 2. Cereales & Granos
  { id: "avena", name: "Avena", category: "carbs_cereals", inStock: true, icon: "🥣" },
  { id: "arroz", name: "Arroz", category: "carbs_cereals", inStock: true, icon: "🍚" },
  { id: "quinoa", name: "Quinoa", category: "carbs_cereals", inStock: true, icon: "🌾" },
  { id: "tortillas", name: "Tortillas de Maíz", category: "carbs_cereals", inStock: true, icon: "🫓" },
  { id: "pan-integral", name: "Pan Integral", category: "carbs_cereals", inStock: true, icon: "🍞" },
  { id: "papa", name: "Papa / Camote", category: "carbs_cereals", inStock: true, icon: "🍠" },
  { id: "fideos-arroz", name: "Fideos de Arroz", category: "carbs_cereals", inStock: false, icon: "🍜" },

  // 3. Grasas Saludables & Semillas
  { id: "aguacate", name: "Aguacate", category: "healthy_fats", inStock: true, icon: "🥑" },
  { id: "aceite-oliva", name: "Aceite de Oliva Extra Virgen", category: "healthy_fats", inStock: true, icon: "🫒" },
  { id: "chia", name: "Semillas de Chía", category: "healthy_fats", inStock: true, icon: "🌱" },
  { id: "almendras", name: "Almendras / Nueces", category: "healthy_fats", inStock: true, icon: "🥜" },
  { id: "hemp", name: "Semillas de Cáñamo (Hemp)", category: "healthy_fats", inStock: true, icon: "🌿" },
  { id: "crema-cacahuate", name: "Crema de Cacahuate", category: "healthy_fats", inStock: true, icon: "🍯" },
  { id: "ajonjoli", name: "Ajonjolí / Tahini", category: "healthy_fats", inStock: true, icon: "✨" },

  // 4. Verduras & Hojas Verdes
  { id: "espinacas", name: "Espinacas", category: "vegetables_greens", inStock: true, icon: "🥬" },
  { id: "jitomate", name: "Jitomate / Tomate", category: "vegetables_greens", inStock: true, icon: "🍅" },
  { id: "pepino", name: "Pepino", category: "vegetables_greens", inStock: true, icon: "🥒" },
  { id: "zanahoria", name: "Zanahoria", category: "vegetables_greens", inStock: true, icon: "🥕" },
  { id: "lechuga", name: "Lechuga / Arúgula", category: "vegetables_greens", inStock: true, icon: "🥗" },
  { id: "calabacita", name: "Calabacita / Zucchini", category: "vegetables_greens", inStock: true, icon: "🥒" },
  { id: "brocoli", name: "Brócoli", category: "vegetables_greens", inStock: true, icon: "🥦" },
  { id: "hongos", name: "Hongos / Champiñones", category: "vegetables_greens", inStock: true, icon: "🍄" },
  { id: "pimientos", name: "Pimientos Morrones", category: "vegetables_greens", inStock: true, icon: "🫑" },
  { id: "nopal", name: "Nopal", category: "vegetables_greens", inStock: true, icon: "🌵" },

  // 5. Frutas Frescas
  { id: "platano", name: "Plátano", category: "fruits", inStock: true, icon: "🍌" },
  { id: "frutos-rojos", name: "Frutos Rojos / Fresas", category: "fruits", inStock: true, icon: "🍓" },
  { id: "manzana", name: "Manzana Verde", category: "fruits", inStock: true, icon: "🍏" },
  { id: "limon", name: "Limones", category: "fruits", inStock: true, icon: "🍋" },
  { id: "pina", name: "Piña", category: "fruits", inStock: false, icon: "🍍" },
  { id: "mango", name: "Mango", category: "fruits", inStock: false, icon: "🥭" },

  // 6. Básicos & Especias
  { id: "ajo", name: "Ajo", category: "kitchen_essentials", inStock: true, icon: "🧄" },
  { id: "cebolla", name: "Cebolla", category: "kitchen_essentials", inStock: true, icon: "🧅" },
  { id: "cilantro", name: "Cilantro / Perejil", category: "kitchen_essentials", inStock: true, icon: "🌿" },
  { id: "leche-vegetal", name: "Leche Vegetal (Almendras/Avena)", category: "kitchen_essentials", inStock: true, icon: "🥛" },
  { id: "jengibre", name: "Jengibre", category: "kitchen_essentials", inStock: true, icon: "🫚" },
  { id: "cacao", name: "Cacao Puro en Polvo", category: "kitchen_essentials", inStock: true, icon: "🍫" },
  { id: "curcuma", name: "Cúrcuma", category: "kitchen_essentials", inStock: true, icon: "🟡" },
  { id: "sal-mar", name: "Sal de Mar", category: "kitchen_essentials", inStock: true, icon: "🧂" },
];
