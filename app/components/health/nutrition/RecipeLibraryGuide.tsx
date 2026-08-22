"use client";

import { FOOD_GROUPS_CATALOG, MARIANA_MONT_KNOWLEDGE_BASE } from "@/lib/nutritionPresets";
import { FoodGroupKey, NutritionRecipe } from "@/lib/types";
import {
  BookOpen,
  CalendarPlus,
  ChefHat,
  Droplets,
  Flame,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

interface RecipeLibraryGuideProps {
  recipesCatalog: NutritionRecipe[];
  onScheduleRecipe?: (recipeId: string) => void;
}

export function RecipeLibraryGuide({
  recipesCatalog,
  onScheduleRecipe,
}: RecipeLibraryGuideProps) {
  const [activeTab, setActiveTab] = useState<"recipes" | "guidelines" | "equivalencies">("recipes");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBook, setSelectedBook] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRecipeModal, setActiveRecipeModal] = useState<NutritionRecipe | null>(null);

  // Filter recipes
  const filteredRecipes = recipesCatalog.filter((r) => {
    const matchesCategory =
      selectedCategory === "all" ||
      r.category === selectedCategory ||
      (selectedCategory === "Smoothies" && (r.mealSlot === "smoothie" || r.mealSlot === "breakfast")) ||
      (selectedCategory === "Ensaladas" && r.mealSlot === "salad") ||
      (selectedCategory === "Sopas & Cremas" && r.mealSlot === "soup");

    const matchesBook =
      selectedBook === "all" ||
      r.bookSource === selectedBook ||
      (!r.bookSource && selectedBook === "Plan Semanal");

    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.prepNotes && r.prepNotes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesBook && matchesSearch;
  });

  const categoriesList = [
    { id: "all", label: "Todas las Recetas", icon: "✨" },
    { id: "Platos Fuertes", label: "Platos Fuertes & Comidas", icon: "🍲" },
    { id: "Ensaladas", label: "Ensaladas", icon: "🥗" },
    { id: "Sopas & Cremas", label: "Sopas & Cremas", icon: "🥣" },
    { id: "Quesos & Patés", label: "Quesos, Patés & Dips", icon: "🥑" },
    { id: "Smoothies", label: "Smoothies & Green Detox", icon: "🥤" },
    { id: "Snacks & Postres", label: "Snacks & Postres", icon: "🍎" },
    { id: "Lechadas", label: "Lechadas Vegetales", icon: "🥛" },
    { id: "Shots & Infusiones", label: "Shots & Infusiones", icon: "🍵" },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Sub-navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/8 bg-neutral-900/60 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/80 border border-white/6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("recipes")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === "recipes"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Recetario ({recipesCatalog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guidelines")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === "guidelines"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span>Insumos & Tips de Cocina</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("equivalencies")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === "equivalencies"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Tabla de Alimentos</span>
          </button>
        </div>

        {activeTab === "recipes" && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o ingrediente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-neutral-950/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        )}
      </div>

      {/* 2. TAB CONTENT: RECETARIO */}
      {activeTab === "recipes" && (
        <div className="space-y-4">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                    : "bg-neutral-950/60 border-white/6 text-neutral-400 hover:text-white hover:border-white/12"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Book Source Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-neutral-500">Colección:</span>
            {[
              { id: "all", label: "Todas" },
              { id: "La Luna Verde", label: "La Luna Verde 📖" },
              { id: "DTX Plant Based", label: "DTX 7 Días 🌿" },
              { id: "Plan Semanal", label: "Plan Clínico 🥑" },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBook(b.id)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  selectedBook === b.id
                    ? "bg-neutral-800 text-white font-bold border border-white/10"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {b.label}
              </button>
            ))}
            <span className="ml-auto font-mono text-[11px] text-neutral-500">
              {filteredRecipes.length} recetas encontradas
            </span>
          </div>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => setActiveRecipeModal(recipe)}
                className="group cursor-pointer flex flex-col justify-between rounded-2xl border border-white/8 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg hover:border-emerald-500/30 hover:bg-neutral-900/90 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/6">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-emerald-300 transition-colors">
                        {recipe.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {recipe.category && (
                          <span className="rounded bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400">
                            {recipe.category}
                          </span>
                        )}
                        {recipe.bookSource && (
                          <span className="text-[10px] font-mono text-emerald-400">
                            {recipe.bookSource}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Portions Contribution */}
                  {Object.keys(recipe.portions).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(Object.keys(recipe.portions) as FoodGroupKey[]).map((k) => {
                        const meta = FOOD_GROUPS_CATALOG[k];
                        const qty = recipe.portions[k];
                        if (!qty || qty <= 0) return null;

                        return (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${meta.color}15`,
                              borderColor: `${meta.color}30`,
                              color: "#ffffff",
                            }}
                          >
                            <span>{meta.icon}</span>
                            <span>
                              +{qty} {meta.shortLabel}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Ingredients preview */}
                  {recipe.ingredients.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                        Ingredientes principales:
                      </span>
                      <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
                        {recipe.ingredients.join(" • ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-white/4 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                  <span>Ver receta completa & preparación</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: GUIDELINES & INSUMOS */}
      {activeTab === "guidelines" && (
        <div className="space-y-6">
          {/* General Indications */}
          <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Indicaciones Clave de Mariana Mont</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MARIANA_MONT_KNOWLEDGE_BASE.indications.map((ind) => (
                <div
                  key={ind.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-white/6 bg-neutral-950/60"
                >
                  <span className="text-2xl mt-0.5">{ind.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {ind.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                      {ind.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Rules & Tips */}
          <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <ChefHat className="h-4 w-4 text-amber-400" />
              <span>Reglas de Preparación & Digestibilidad</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MARIANA_MONT_KNOWLEDGE_BASE.preparationTips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-white/6 bg-neutral-950/60"
                >
                  <span className="text-2xl mt-0.5">{tip.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 tracking-tight">
                      {tip.topic}
                    </h4>
                    <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                      {tip.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cooking Supplies Reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Oils */}
            <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-4.5 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-emerald-300 tracking-tight flex items-center gap-2 mb-3">
                <Droplets className="h-4 w-4" />
                <span>Aceites Recomendados</span>
              </h4>
              <div className="space-y-2">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.oils.map((oil, i) => (
                  <div key={i} className="p-2 rounded-lg bg-neutral-950/60 border border-white/4 text-[11px]">
                    <strong className="text-white block">{oil.name}</strong>
                    <span className="text-neutral-400">{oil.use}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sweeteners */}
            <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-4.5 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-amber-300 tracking-tight flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                <span>Endulzantes Permitidos</span>
              </h4>
              <div className="space-y-2">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.sweeteners.map((sw, i) => (
                  <div key={i} className="p-2 rounded-lg bg-neutral-950/60 border border-white/4 text-[11px]">
                    <strong className="text-white block">{sw.name}</strong>
                    <span className="text-neutral-400">{sw.notes}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonings & Salt */}
            <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-4.5 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-sky-300 tracking-tight flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" />
                <span>Sal & Especias</span>
              </h4>
              <div className="space-y-2">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.seasonings.map((sn, i) => (
                  <div key={i} className="p-2 rounded-lg bg-neutral-950/60 border border-white/4 text-[11px]">
                    <strong className="text-white block">{sn.name}</strong>
                    <span className="text-neutral-400">{sn.notes}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: EQUIVALENCIES TABLE */}
      {activeTab === "equivalencies" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Fruits */}
          <div className="rounded-2xl border border-rose-500/20 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-white/6">
              <span className="text-xl">🍎</span>
              <div>
                <h4 className="text-sm font-bold text-white">Frutas (1 tz = 1 porción)</h4>
                <p className="text-[11px] text-rose-300 font-medium">Meta: 3 a 4 tazas/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.fruits.map((f, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-1 text-xs font-medium text-rose-200"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Vegetables */}
          <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-white/6">
              <span className="text-xl">🥦</span>
              <div>
                <h4 className="text-sm font-bold text-white">Verduras & Hongos</h4>
                <p className="text-[11px] text-emerald-300 font-medium">Meta: 4 a 5 raciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.vegetables.map((v, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-200"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Legumes */}
          <div className="rounded-2xl border border-purple-500/20 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-white/6">
              <span className="text-xl">🫘</span>
              <div>
                <h4 className="text-sm font-bold text-white">Legumbres & Tofu</h4>
                <p className="text-[11px] text-purple-300 font-medium">Meta: 2 a 4 porciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.legumes.map((l, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-xs font-medium text-purple-200"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Cereals */}
          <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-white/6">
              <span className="text-xl">🌾</span>
              <div>
                <h4 className="text-sm font-bold text-white">Cereales Integrales</h4>
                <p className="text-[11px] text-amber-300 font-medium">Meta: 4 a 6 raciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.cereals.map((c, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-xs font-medium text-amber-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Seeds & Fats */}
          <div className="rounded-2xl border border-lime-500/20 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b border-white/6">
              <span className="text-xl">🥑</span>
              <div>
                <h4 className="text-sm font-bold text-white">Grasas & Semillas</h4>
                <p className="text-[11px] text-lime-300 font-medium">Meta: 3 a 4 raciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.seeds.map((s, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-lime-500/10 border border-lime-500/20 px-2 py-1 text-xs font-medium text-lime-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. RECIPE DETAIL MODAL */}
      {activeRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between pb-4 border-b border-white/8">
              <div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {activeRecipeModal.bookSource || "Mariana Mont"} • {activeRecipeModal.category || activeRecipeModal.mealSlot}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  {activeRecipeModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveRecipeModal(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Portions Contribution */}
              {Object.keys(activeRecipeModal.portions).length > 0 && (
                <div>
                  <span className="text-xs font-bold text-neutral-400 block mb-1.5">
                    Aporte de Porciones:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(activeRecipeModal.portions) as FoodGroupKey[]).map((k) => {
                      const meta = FOOD_GROUPS_CATALOG[k];
                      const qty = activeRecipeModal.portions[k];
                      if (!qty || qty <= 0) return null;

                      return (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border"
                          style={{
                            backgroundColor: `${meta.color}20`,
                            borderColor: `${meta.color}40`,
                            color: "#ffffff",
                          }}
                        >
                          <span>{meta.icon}</span>
                          <span>
                            +{qty} {meta.label}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ingredients List */}
              {activeRecipeModal.ingredients.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block">
                    Ingredientes:
                  </span>
                  <ul className="space-y-1.5 p-3 rounded-2xl bg-neutral-950/60 border border-white/6">
                    {activeRecipeModal.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-xs text-neutral-200 flex items-start gap-2 leading-relaxed"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions / Prep notes */}
              {activeRecipeModal.prepNotes && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block">
                    Elaboración & Preparación:
                  </span>
                  <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-emerald-500/20 text-xs text-neutral-300 leading-relaxed">
                    {activeRecipeModal.prepNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/8 flex justify-between items-center">
              <span className="text-[11px] text-neutral-500">
                100% Plant-Based & Holístico
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRecipeModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cerrar
                </button>
                {onScheduleRecipe && (
                  <button
                    type="button"
                    onClick={() => {
                      onScheduleRecipe(activeRecipeModal.id);
                      setActiveRecipeModal(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span>Programar en Calendario</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
