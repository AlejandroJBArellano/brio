"use client";

import {
  addCustomPantryItemAction,
  fetchPantryItemsAction,
  togglePantryItemAction,
} from "@/app/actions/pantry";
import {
  quickAdjustPortionAction,
  scheduleMealSlotAction,
} from "@/app/actions/nutrition";
import { MARIANA_MONT_PRESET_RECIPES } from "@/lib/nutritionPresets";
import { PANTRY_CATEGORIES_META } from "@/lib/pantryCatalog";
import {
  FoodGroupKey,
  NutritionRecipe,
  PantryCategory,
  PantryItem,
} from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Dumbbell,
  Layers,
  Plus,
  Search,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

interface PantryAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipesCatalog?: NutritionRecipe[];
  todayDate?: string;
  onRefresh?: () => void;
}

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function PantryAssistantModal({
  isOpen,
  onClose,
  recipesCatalog = MARIANA_MONT_PRESET_RECIPES,
  todayDate = getTodayDateStr(),
  onRefresh,
}: PantryAssistantModalProps) {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"recipes" | "pantry">("recipes");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "100_match" | "post_gym" | "fast_15m" | "lunch" | "breakfast" | "dinner"
  >("all");
  const [selectedPantryCat, setSelectedPantryCat] = useState<PantryCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<NutritionRecipe | null>(null);
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomCat, setNewCustomCat] = useState<PantryCategory>("proteins_legumes");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load pantry items from DB on mount
  useEffect(() => {
    if (isOpen) {
      fetchPantryItemsAction().then((items) => {
        setPantryItems(items);
      });
    }
  }, [isOpen]);

  const inStockNames = useMemo(() => {
    return new Set(
      pantryItems
        .filter((item) => item.inStock)
        .map((item) => normalizeStr(item.name))
    );
  }, [pantryItems]);

  const inStockCount = pantryItems.filter((i) => i.inStock).length;

  // Recipe match algorithm
  const matchedRecipes = useMemo(() => {
    const allRecipes = recipesCatalog.length > 0 ? recipesCatalog : MARIANA_MONT_PRESET_RECIPES;

    return allRecipes.map((recipe) => {
      const totalIngredients = recipe.ingredients.length;
      if (totalIngredients === 0) {
        return {
          recipe,
          matchPercent: 100,
          availableCount: 0,
          missingCount: 0,
          missingIngredients: [] as string[],
          isFullyAvailable: true,
          isPostGym: false,
          isFast15m: true,
        };
      }

      let availableCount = 0;
      const missingIngredients: string[] = [];

      recipe.ingredients.forEach((ing) => {
        const normIng = normalizeStr(ing);
        let found = false;

        // Check if any in-stock item is contained in the ingredient line
        for (const stockItem of inStockNames) {
          // Split stock item words (e.g. "aceite de oliva" -> "aceite", "oliva")
          const stockWords = stockItem.split(" ").filter((w) => w.length > 3);
          if (
            normIng.includes(stockItem) ||
            stockWords.some((w) => normIng.includes(w))
          ) {
            found = true;
            break;
          }
        }

        if (found) {
          availableCount++;
        } else {
          // Clean up ingredient description for missing display
          const cleanShort = ing.split("(")[0].replace(/^[0-9/.\s]+(taza|tz|cdita|cda|cucharada|gramos|g|ml|litro|litros|cm|pieza|piezas)?\s*(de)?\s*/i, "").trim();
          missingIngredients.push(cleanShort || ing);
        }
      });

      const matchPercent = Math.round((availableCount / totalIngredients) * 100);
      const isFullyAvailable = missingIngredients.length === 0 || matchPercent >= 80;

      // Classify as post-gym if high in protein/legumes or whole carbs
      const isPostGym = Boolean(
        (recipe.portions.legumes && recipe.portions.legumes >= 0.5) ||
        (recipe.portions.fats_seeds && recipe.portions.fats_seeds >= 0.5) ||
        (recipe.portions.cereals && recipe.portions.cereals >= 1.0) ||
        recipe.title.toLowerCase().includes("proteica") ||
        recipe.title.toLowerCase().includes("tofu") ||
        recipe.title.toLowerCase().includes("lentejas") ||
        recipe.title.toLowerCase().includes("garbanzo")
      );

      // Fast <15m check
      const prep = (recipe.prepNotes || "").toLowerCase();
      const isFast15m = !prep.includes("horno") && !prep.includes("hornear") && !prep.includes("toda la noche") && !prep.includes("cocer por 45");

      return {
        recipe,
        matchPercent,
        availableCount,
        missingCount: missingIngredients.length,
        missingIngredients,
        isFullyAvailable,
        isPostGym,
        isFast15m,
      };
    });
  }, [recipesCatalog, inStockNames]);

  // Filtered & sorted recipes
  const filteredRecipes = useMemo(() => {
    let list = matchedRecipes;

    if (searchQuery.trim()) {
      const q = normalizeStr(searchQuery);
      list = list.filter(
        (m) =>
          normalizeStr(m.recipe.title).includes(q) ||
          m.recipe.ingredients.some((i) => normalizeStr(i).includes(q))
      );
    }

    if (activeFilter === "100_match") {
      list = list.filter((m) => m.isFullyAvailable);
    } else if (activeFilter === "post_gym") {
      list = list.filter((m) => m.isPostGym);
    } else if (activeFilter === "fast_15m") {
      list = list.filter((m) => m.isFast15m);
    } else if (activeFilter === "lunch") {
      list = list.filter((m) => m.recipe.mealSlot === "lunch" || m.recipe.category === "Platos Fuertes" || m.recipe.category === "Sopas & Cremas");
    } else if (activeFilter === "breakfast") {
      list = list.filter((m) => m.recipe.mealSlot === "breakfast" || m.recipe.mealSlot === "smoothie");
    } else if (activeFilter === "dinner") {
      list = list.filter((m) => m.recipe.mealSlot === "dinner" || m.recipe.mealSlot === "salad");
    }

    // Sort: 100% matches first, then highest match percent
    return list.sort((a, b) => {
      if (a.isFullyAvailable && !b.isFullyAvailable) return -1;
      if (!a.isFullyAvailable && b.isFullyAvailable) return 1;
      return b.matchPercent - a.matchPercent;
    });
  }, [matchedRecipes, searchQuery, activeFilter]);

  const handleTogglePantryItem = (id: string) => {
    setPantryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inStock: !item.inStock } : item))
    );
    startTransition(async () => {
      await togglePantryItemAction(id);
    });
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName.trim()) return;
    startTransition(async () => {
      const res = await addCustomPantryItemAction(newCustomName.trim(), newCustomCat);
      if (res.success && res.item) {
        setPantryItems((prev) => [...prev, res.item!]);
        setNewCustomName("");
        setIsAddingItem(false);
      }
    });
  };

  const handleLogRecipe = (recipe: NutritionRecipe) => {
    startTransition(async () => {
      // 1. Schedule & complete meal
      await scheduleMealSlotAction({
        date: todayDate,
        mealSlot: recipe.mealSlot,
        recipeId: recipe.id,
        customTitle: recipe.title,
        portions: recipe.portions,
        notes: "Preparado desde Asistente de Despensa",
      });

      // 2. Adjust portions into today's log directly
      const entries = Object.entries(recipe.portions) as [FoodGroupKey, number][];
      for (const [groupKey, delta] of entries) {
        if (delta > 0) {
          await quickAdjustPortionAction(todayDate, groupKey, delta);
        }
      }

      setSuccessToast(`¡Listo! Se registró "${recipe.title}" y se sumaron sus porciones.`);
      setTimeout(() => setSuccessToast(null), 4000);

      if (onRefresh) onRefresh();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="flex flex-col w-full max-w-5xl h-[90vh] max-h-212.5 rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl overflow-hidden relative">
        {/* Toast Alert */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7EA35A] text-[#121110] font-bold text-xs shadow-lg animate-in slide-in-from-top duration-200 font-sans">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2723] p-5 bg-[#121110] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB] tracking-tight">
                  Asistente: ¿Qué Cocinar con lo que Tengo?
                </h3>
                <span className="rounded-md border border-[#7EA35A]/30 bg-[#1C2219] px-2 py-0.5 text-[10px] font-mono font-bold text-[#7EA35A]">
                  {inStockCount} en despensa
                </span>
              </div>
              <p className="text-xs text-[#8E867B] font-mono">
                Recetas rápidas (&lt;15 min), equilibrio de macros y cero pesadez mental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            {/* View Switcher: Recipes vs Pantry */}
            <div className="flex items-center p-1 rounded-lg bg-[#181715] border border-[#2A2723]">
              <button
                onClick={() => setActiveTab("recipes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "recipes"
                    ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <Utensils className="h-3.5 w-3.5" />
                <span>Sugerencias de Recetas</span>
              </button>

              <button
                onClick={() => setActiveTab("pantry")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "pantry"
                    ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Mi Despensa ({inStockCount})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer border border-transparent hover:border-[#2A2723]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Recipe Suggestions */}
        {activeTab === "recipes" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-[#2A2723] bg-[#121110] shrink-0 font-mono">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
                <input
                  type="text"
                  placeholder="Buscar receta o ingrediente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#181715] border border-[#2A2723] text-xs text-[#F5F2EB] placeholder-[#8E867B] focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              {/* Quick Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer border ${
                    activeFilter === "all"
                      ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  Todas ({matchedRecipes.length})
                </button>
                <button
                  onClick={() => setActiveFilter("100_match")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer border ${
                    activeFilter === "100_match"
                      ? "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/40"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-[#7EA35A]" />
                  <span>100% Despensa</span>
                </button>
                <button
                  onClick={() => setActiveFilter("post_gym")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer border ${
                    activeFilter === "post_gym"
                      ? "bg-[#251A18] text-[#E05D52] border-[#E05D52]/40"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <Dumbbell className="h-3 w-3 text-[#E05D52]" />
                  <span>Post-Gym 12-2PM</span>
                </button>
                <button
                  onClick={() => setActiveFilter("fast_15m")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer border ${
                    activeFilter === "fast_15m"
                      ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/40"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <Clock className="h-3 w-3 text-[#D99B43]" />
                  <span>Express &lt;15 min</span>
                </button>
                <button
                  onClick={() => setActiveFilter("lunch")}
                  className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer border ${
                    activeFilter === "lunch"
                      ? "bg-[#1A2221] text-[#4EAB9E] border-[#4EAB9E]/40"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  Almuerzos
                </button>
              </div>
            </div>

            {/* Recipes Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecipes.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-[#8E867B]">
                  <ChefHat className="h-10 w-10 text-[#8E867B] mb-3" />
                  <p className="font-serif text-sm font-semibold text-[#DDD6C9]">
                    No se encontraron recetas con estos filtros
                  </p>
                  <p className="text-xs text-[#8E867B] mt-1 max-w-sm font-mono">
                    Prueba cambiando el filtro o agrega más ingredientes disponibles en la pestaña &ldquo;Mi Despensa&rdquo;.
                  </p>
                  <button
                    onClick={() => setActiveTab("pantry")}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold cursor-pointer font-sans"
                  >
                    Abrir Mi Despensa
                  </button>
                </div>
              ) : (
                filteredRecipes.map((item) => {
                  const {
                    recipe,
                    matchPercent,
                    isFullyAvailable,
                    missingIngredients,
                    isPostGym,
                    isFast15m,
                  } = item;

                  return (
                    <div
                      key={recipe.id}
                      className={`flex flex-col justify-between p-4 rounded-lg border transition-all duration-150 ${
                        isFullyAvailable
                          ? "bg-[#141813] border-[#7EA35A]/40 hover:border-[#7EA35A]/60"
                          : "bg-[#121110] border-[#2A2723] hover:border-[#38332D]"
                      }`}
                    >
                      <div className="flex flex-col gap-2.5">
                        {/* Tags / Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 font-mono">
                            {isFullyAvailable ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30 text-[10px] font-bold">
                                <Check className="h-3 w-3" /> 100% Despensa
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 text-[10px] font-bold">
                                Match {matchPercent}% (Faltan {missingIngredients.length})
                              </span>
                            )}

                            {isPostGym && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#251A18] text-[#E05D52] border border-[#E05D52]/30 text-[10px] font-bold">
                                🏋️ Post-Gym
                              </span>
                            )}

                            {isFast15m && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1A2221] text-[#4EAB9E] border border-[#4EAB9E]/30 text-[10px] font-bold">
                                ⚡ &lt;15 min
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-medium text-[#8E867B] font-mono">
                            {recipe.category || "Mariana Mont"}
                          </span>
                        </div>

                        {/* Title & Prep */}
                        <div>
                          <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">
                            {recipe.title}
                          </h4>
                          {recipe.prepNotes && (
                            <p className="text-[11px] text-[#8E867B] mt-1 line-clamp-2 leading-relaxed font-sans">
                              {recipe.prepNotes}
                            </p>
                          )}
                        </div>

                        {/* Ingredients snippet */}
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="text-[10px] font-semibold text-[#8E867B] font-mono">
                            Ingredientes ({recipe.ingredients.length}):
                          </div>
                          <div className="text-[11px] text-[#DDD6C9] line-clamp-2">
                            {recipe.ingredients.join(" • ")}
                          </div>

                          {missingIngredients.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-[#D99B43] mt-0.5 font-mono">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                Te falta: {missingIngredients.slice(0, 2).join(", ")}
                                {missingIngredients.length > 2 ? ` (+${missingIngredients.length - 2} más)` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#2A2723]">
                        <button
                          onClick={() => setSelectedRecipe(recipe)}
                          className="text-[11px] font-medium text-[#8E867B] hover:text-[#F5F2EB] transition-colors cursor-pointer font-mono"
                        >
                          Ver detalles
                        </button>

                        <button
                          onClick={() => handleLogRecipe(recipe)}
                          disabled={isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans ${
                            isFullyAvailable
                              ? "bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110]"
                              : "bg-[#221D16] hover:bg-[#2A241C] text-[#D99B43] border border-[#D99B43]/30"
                          }`}
                        >
                          <Utensils className="h-3.5 w-3.5" />
                          <span>Cocinar y Registrar</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: My Pantry Inventory */}
        {activeTab === "pantry" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Category Filter & Add custom bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-[#2A2723] bg-[#121110] shrink-0 font-mono">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  onClick={() => setSelectedPantryCat("all")}
                  className={`px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer border ${
                    selectedPantryCat === "all"
                      ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30 font-bold"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  Todos ({pantryItems.length})
                </button>
                {(Object.entries(PANTRY_CATEGORIES_META) as [PantryCategory, { label: string; icon: string }][]).map(
                  ([catKey, meta]) => (
                    <button
                      key={catKey}
                      onClick={() => setSelectedPantryCat(catKey)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer border ${
                        selectedPantryCat === catKey
                          ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30 font-bold"
                          : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setIsAddingItem(!isAddingItem)}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#221D16] hover:bg-[#2A241C] text-xs text-[#D99B43] border border-[#D99B43]/30 font-semibold transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar Ingrediente</span>
              </button>
            </div>

            {/* Custom Item Form */}
            {isAddingItem && (
              <form
                onSubmit={handleAddCustomItem}
                className="flex flex-wrap items-center gap-2 p-4 bg-[#121110] border-b border-[#2A2723] shrink-0 font-mono"
              >
                <input
                  type="text"
                  placeholder="Nombre del ingrediente (ej. Aguacate Hass, Salmón...)"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="flex-1 min-w-50 px-3 py-2 rounded-lg bg-[#181715] border border-[#2A2723] text-xs text-[#F5F2EB] placeholder-[#8E867B] focus:border-[#D99B43]"
                />
                <select
                  value={newCustomCat}
                  onChange={(e) => setNewCustomCat(e.target.value as PantryCategory)}
                  className="px-3 py-2 rounded-lg bg-[#181715] border border-[#2A2723] text-xs text-[#F5F2EB]"
                >
                  {(Object.entries(PANTRY_CATEGORIES_META) as [PantryCategory, { label: string }][]).map(
                    ([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    )
                  )}
                </select>
                <button
                  type="submit"
                  disabled={isPending || !newCustomName.trim()}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold cursor-pointer font-sans"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-2 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] text-xs cursor-pointer font-sans"
                >
                  Cancelar
                </button>
              </form>
            )}

            {/* Pantry Items Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {pantryItems
                .filter(
                  (item) =>
                    selectedPantryCat === "all" || item.category === selectedPantryCat
                )
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTogglePantryItem(item.id)}
                    className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                      item.inStock
                        ? "bg-[#1C2219] border-[#7EA35A]/40 text-[#F5F2EB]"
                        : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:border-[#38332D]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{item.icon || "🥑"}</span>
                      <span className={`text-xs truncate ${item.inStock ? "text-[#F5F2EB] font-semibold font-serif" : "text-[#8E867B]"}`}>
                        {item.name}
                      </span>
                    </div>

                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                        item.inStock
                          ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                          : "border-[#2A2723] bg-[#181715] text-transparent"
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-3" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in font-sans">
            <div className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer border border-transparent hover:border-[#2A2723]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-1 font-mono">
                <span className="px-2 py-0.5 rounded bg-[#1C2219] text-[#7EA35A] text-[10px] font-bold border border-[#7EA35A]/30">
                  {selectedRecipe.category || "Receta"}
                </span>
                <span className="text-xs text-[#8E867B]">
                  {selectedRecipe.bookSource || "Mariana Mont"}
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#F5F2EB] mb-3">
                {selectedRecipe.title}
              </h3>

              {/* Portions breakdown */}
              {selectedRecipe.portions && Object.keys(selectedRecipe.portions).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4 font-mono">
                  {Object.entries(selectedRecipe.portions).map(([group, val]) => (
                    <div
                      key={group}
                      className="px-2.5 py-1 rounded bg-[#121110] border border-[#2A2723] text-[11px] text-[#DDD6C9]"
                    >
                      <strong className="text-[#7EA35A]">+{val}</strong> {group}
                    </div>
                  ))}
                </div>
              )}

              {/* Ingredients List */}
              <div className="flex flex-col gap-2 mb-4">
                <h4 className="font-serif text-xs font-bold text-[#DDD6C9] uppercase tracking-wider">
                  Ingredientes:
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const norm = normalizeStr(ing);
                    const isAvailable = Array.from(inStockNames).some((stock) => norm.includes(stock));

                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-[#DDD6C9] leading-relaxed"
                      >
                        <span className="mt-1">
                          {isAvailable ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#7EA35A]" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-[#D99B43]" />
                          )}
                        </span>
                        <span className={isAvailable ? "text-[#F5F2EB]" : "text-[#D99B43] font-medium"}>
                          {ing}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Preparation */}
              {selectedRecipe.prepNotes && (
                <div className="flex flex-col gap-1.5 mb-6">
                  <h4 className="font-serif text-xs font-bold text-[#DDD6C9] uppercase tracking-wider">
                    Preparación:
                  </h4>
                  <p className="text-xs text-[#DDD6C9] leading-relaxed bg-[#121110] p-3.5 rounded-lg border border-[#2A2723]">
                    {selectedRecipe.prepNotes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2A2723]">
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="px-4 py-2 rounded-lg border border-[#2A2723] bg-[#121110] text-xs text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#181715] cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLogRecipe(selectedRecipe);
                    setSelectedRecipe(null);
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Utensils className="h-4 w-4" />
                  <span>Preparar y Registrar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
