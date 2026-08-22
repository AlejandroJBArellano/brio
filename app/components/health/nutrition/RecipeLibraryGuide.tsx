"use client";

import { FOOD_GROUPS_CATALOG, MARIANA_MONT_KNOWLEDGE_BASE } from "@/lib/nutritionPresets";
import { FoodGroupKey, MealSlotType, NutritionRecipe } from "@/lib/types";
import {
  BookOpen,
  CalendarPlus,
  Check,
  ChefHat,
  Droplets,
  Flame,
  Info,
  Layers,
  Leaf,
  Plus,
  Search,
  Sparkles,
  Utensils,
  Wheat,
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
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [selectedSlot, setSelectedSlot] = useState<MealSlotType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter recipes
  const filteredRecipes = recipesCatalog.filter((r) => {
    const matchesWeek = selectedWeek === "all" || r.weekNumber === selectedWeek;
    const matchesSlot = selectedSlot === "all" || r.mealSlot === selectedSlot;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.prepNotes && r.prepNotes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesWeek && matchesSlot && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* 1. Sub-navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/80 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("recipes")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "recipes"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Recetario Clínico ({recipesCatalog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guidelines")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar receta o ingrediente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-neutral-950/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        )}
      </div>

      {/* 2. TAB CONTENT: RECETARIO */}
      {activeTab === "recipes" && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Week filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950/60 border border-white/[0.06] text-xs">
              <span className="text-[11px] text-neutral-500 px-2 font-medium">Semana:</span>
              {(["all", 1, 2, 3, 4] as const).map((w) => (
                <button
                  key={String(w)}
                  type="button"
                  onClick={() => setSelectedWeek(w)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                    selectedWeek === w
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {w === "all" ? "Todas" : `Semana ${w}`}
                </button>
              ))}
            </div>

            {/* Meal slot filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950/60 border border-white/[0.06] text-xs">
              <span className="text-[11px] text-neutral-500 px-2 font-medium">Tiempo:</span>
              {[
                { id: "all", label: "Todos" },
                { id: "breakfast", label: "Desayuno" },
                { id: "lunch", label: "Almuerzo" },
                { id: "dinner", label: "Comida" },
                { id: "snack", label: "Snack" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSlot(s.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                    selectedSlot === s.id
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg hover:border-white/[0.14] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/[0.06]">
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                        {recipe.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {recipe.weekNumber && (
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                            Semana {recipe.weekNumber}
                          </span>
                        )}
                        {recipe.optionLabel && (
                          <span className="text-[10px] text-neutral-400 font-semibold">
                            {recipe.optionLabel}
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

                  {/* Ingredients List */}
                  {recipe.ingredients.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Ingredientes:
                      </span>
                      <ul className="space-y-0.5">
                        {recipe.ingredients.map((ing, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-neutral-300 flex items-center gap-1.5"
                          >
                            <span className="h-1 w-1 rounded-full bg-emerald-400/60" />
                            <span>{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preparation Notes */}
                  {recipe.prepNotes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-neutral-950/80 border border-white/[0.04]">
                      <p className="text-[11px] text-neutral-400 italic leading-relaxed">
                        💡 {recipe.prepNotes}
                      </p>
                    </div>
                  )}
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
          <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Indicaciones Clave de la Nutrióloga</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MARIANA_MONT_KNOWLEDGE_BASE.indications.map((ind) => (
                <div
                  key={ind.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-neutral-950/60"
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
          <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <ChefHat className="h-4 w-4 text-amber-400" />
              <span>Reglas de Preparación & Digestibilidad</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MARIANA_MONT_KNOWLEDGE_BASE.preparationTips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-neutral-950/60"
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
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4.5 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-emerald-300 tracking-tight flex items-center gap-2 mb-3">
                <Droplets className="h-4 w-4" />
                <span>Aceites Recomendados</span>
              </h4>
              <div className="space-y-2">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.oils.map((oil, i) => (
                  <div key={i} className="p-2 rounded-lg bg-neutral-950/60 border border-white/[0.04] text-[11px]">
                    <strong className="text-white block">{oil.name}</strong>
                    <span className="text-neutral-400">{oil.use}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sweeteners */}
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4.5 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-amber-300 tracking-tight flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                <span>Endulzantes Permitidos</span>
              </h4>
              <div className="space-y-2">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.sweeteners.map((sw, i) => (
                  <div key={i} className="p-2 rounded-lg bg-neutral-950/60 border border-white/[0.04] text-[11px]">
                    <strong className="text-white block">{sw.name}</strong>
                    <span className="text-neutral-400">{sw.notes}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonings & Salt */}
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4.5 backdrop-blur-xl">
              <h4 className="text-xs font-bold text-sky-300 tracking-tight flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" />
                <span>Sal & Especias</span>
              </h4>
              <div className="space-y-2">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.seasonings.map((sn, i) => (
                  <div key={i} className="p-2 rounded-lg bg-neutral-950/60 border border-white/[0.04] text-[11px]">
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
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
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
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
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
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
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
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
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
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
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
    </div>
  );
}
