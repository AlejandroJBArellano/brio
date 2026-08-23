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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl h-[90vh] max-h-212.5 rounded-3xl border border-white/12 bg-neutral-900 shadow-2xl overflow-hidden relative">
        {/* Toast Alert */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-neutral-950 font-bold text-xs shadow-xl animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 p-5 bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Asistente: ¿Qué Cocinar con lo que Tengo?
                </h3>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {inStockCount} en despensa
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Recetas rápidas (&lt;15 min), equilibrio de macros y cero pesadez mental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Recipes vs Pantry */}
            <div className="flex items-center p-1 rounded-2xl bg-neutral-900 border border-white/8 shadow-inner">
              <button
                onClick={() => setActiveTab("recipes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "recipes"
                    ? "bg-emerald-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Utensils className="h-3.5 w-3.5" />
                <span>Sugerencias de Recetas</span>
              </button>

              <button
                onClick={() => setActiveTab("pantry")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "pantry"
                    ? "bg-emerald-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Mi Despensa ({inStockCount})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Recipe Suggestions */}
        {activeTab === "recipes" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-white/6 bg-neutral-900/80 shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Buscar receta o ingrediente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Quick Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    activeFilter === "all"
                      ? "bg-white/15 text-white border border-white/20"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
                  }`}
                >
                  Todas ({matchedRecipes.length})
                </button>
                <button
                  onClick={() => setActiveFilter("100_match")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    activeFilter === "100_match"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span>100% Despensa</span>
                </button>
                <button
                  onClick={() => setActiveFilter("post_gym")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    activeFilter === "post_gym"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
                  }`}
                >
                  <Dumbbell className="h-3 w-3 text-rose-400" />
                  <span>Post-Gym 12-2PM</span>
                </button>
                <button
                  onClick={() => setActiveFilter("fast_15m")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    activeFilter === "fast_15m"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
                  }`}
                >
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span>Express &lt;15 min</span>
                </button>
                <button
                  onClick={() => setActiveFilter("lunch")}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    activeFilter === "lunch"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                      : "bg-white/5 text-neutral-400 hover:bg-white/10"
                  }`}
                >
                  Almuerzos
                </button>
              </div>
            </div>

            {/* Recipes Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecipes.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-neutral-400">
                  <ChefHat className="h-12 w-12 text-neutral-600 mb-3" />
                  <p className="text-sm font-semibold text-neutral-300">
                    No se encontraron recetas con estos filtros
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    Prueba cambiando el filtro o agrega más ingredientes disponibles en la pestaña &ldquo;Mi Despensa&rdquo;.
                  </p>
                  <button
                    onClick={() => setActiveTab("pantry")}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold"
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
                      className={`flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 ${
                        isFullyAvailable
                          ? "bg-neutral-950/70 border-emerald-500/30 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/50"
                          : "bg-neutral-950/40 border-white/6 hover:border-white/12"
                      }`}
                    >
                      <div className="flex flex-col gap-2.5">
                        {/* Tags / Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isFullyAvailable ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                <Check className="h-3 w-3" /> 100% Despensa
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                                Match {matchPercent}% (Faltan {missingIngredients.length})
                              </span>
                            )}

                            {isPostGym && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[10px] font-bold">
                                🏋️ Post-Gym
                              </span>
                            )}

                            {isFast15m && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 text-[10px] font-bold">
                                ⚡ &lt;15 min
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-medium text-neutral-500">
                            {recipe.category || "Mariana Mont"}
                          </span>
                        </div>

                        {/* Title & Prep */}
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-emerald-400">
                            {recipe.title}
                          </h4>
                          {recipe.prepNotes && (
                            <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                              {recipe.prepNotes}
                            </p>
                          )}
                        </div>

                        {/* Ingredients snippet */}
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="text-[10px] font-semibold text-neutral-400">
                            Ingredientes ({recipe.ingredients.length}):
                          </div>
                          <div className="text-[11px] text-neutral-300 line-clamp-2">
                            {recipe.ingredients.join(" • ")}
                          </div>

                          {missingIngredients.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-400/90 mt-0.5">
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
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/6">
                        <button
                          onClick={() => setSelectedRecipe(recipe)}
                          className="text-[11px] font-medium text-neutral-400 hover:text-white transition-colors"
                        >
                          Ver detalles
                        </button>

                        <button
                          onClick={() => handleLogRecipe(recipe)}
                          disabled={isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                            isFullyAvailable
                              ? "bg-emerald-500 hover:bg-emerald-600 text-neutral-950 shadow-emerald-500/20"
                              : "bg-white/10 hover:bg-white/20 text-white"
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-white/6 bg-neutral-900/80 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                <button
                  onClick={() => setSelectedPantryCat("all")}
                  className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                    selectedPantryCat === "all"
                      ? "bg-emerald-500 text-neutral-950 font-bold"
                      : "bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  Todos ({pantryItems.length})
                </button>
                {(Object.entries(PANTRY_CATEGORIES_META) as [PantryCategory, { label: string; icon: string }][]).map(
                  ([catKey, meta]) => (
                    <button
                      key={catKey}
                      onClick={() => setSelectedPantryCat(catKey)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                        selectedPantryCat === catKey
                          ? "bg-emerald-500 text-neutral-950 font-bold"
                          : "bg-white/5 text-neutral-400 hover:text-white"
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
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-semibold transition-colors shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar Ingrediente</span>
              </button>
            </div>

            {/* Custom Item Form */}
            {isAddingItem && (
              <form
                onSubmit={handleAddCustomItem}
                className="flex flex-wrap items-center gap-2 p-4 bg-neutral-950/80 border-b border-white/8 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Nombre del ingrediente (ej. Aguacate Hass, Salmón...)"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="flex-1 min-w-50 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white placeholder-neutral-500"
                />
                <select
                  value={newCustomCat}
                  onChange={(e) => setNewCustomCat(e.target.value as PantryCategory)}
                  className="px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white"
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
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-2 rounded-xl text-neutral-400 hover:text-white text-xs"
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
                    className={`flex items-center justify-between gap-2 p-3 rounded-2xl border text-left transition-all duration-150 ${
                      item.inStock
                        ? "bg-emerald-950/25 border-emerald-500/30 text-white shadow-sm"
                        : "bg-neutral-950/40 border-white/6 text-neutral-500 hover:border-white/12"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{item.icon || "🥑"}</span>
                      <span className={`text-xs font-medium truncate ${item.inStock ? "text-neutral-200 font-semibold" : "text-neutral-500"}`}>
                        {item.name}
                      </span>
                    </div>

                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                        item.inStock
                          ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                          : "border-neutral-700 bg-neutral-800 text-transparent"
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
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl border border-white/12 bg-neutral-900 p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                  {selectedRecipe.category || "Receta"}
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {selectedRecipe.bookSource || "Mariana Mont"}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-3">
                {selectedRecipe.title}
              </h3>

              {/* Portions breakdown */}
              {selectedRecipe.portions && Object.keys(selectedRecipe.portions).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Object.entries(selectedRecipe.portions).map(([group, val]) => (
                    <div
                      key={group}
                      className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-white/8 text-[11px] text-neutral-300 font-mono"
                    >
                      <strong className="text-emerald-400">+{val}</strong> {group}
                    </div>
                  ))}
                </div>
              )}

              {/* Ingredients List */}
              <div className="flex flex-col gap-2 mb-4">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Ingredientes:
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const norm = normalizeStr(ing);
                    const isAvailable = Array.from(inStockNames).some((stock) => norm.includes(stock));

                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed"
                      >
                        <span className="mt-1">
                          {isAvailable ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                          )}
                        </span>
                        <span className={isAvailable ? "text-neutral-200" : "text-amber-300/90 font-medium"}>
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
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Preparación:
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/80 p-3.5 rounded-2xl border border-white/6">
                    {selectedRecipe.prepNotes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/6">
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-neutral-300 hover:bg-white/10"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
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
