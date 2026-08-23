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
    <div className="space-y-5 font-sans">
      {/* 1. Sub-navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#2A2723] bg-[#181715] p-3 shadow-sm font-mono">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#121110] border border-[#2A2723] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("recipes")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "recipes"
                ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Recetario ({recipesCatalog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guidelines")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "guidelines"
                ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
            }`}
          >
            <ChefHat className="h-3.5 w-3.5" />
            <span>Insumos & Tips de Cocina</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("equivalencies")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "equivalencies"
                ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Tabla de Alimentos</span>
          </button>
        </div>

        {activeTab === "recipes" && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-[#8E867B]" />
            <input
              type="text"
              placeholder="Buscar por nombre o ingrediente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-8 pr-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
            />
          </div>
        )}
      </div>

      {/* 2. TAB CONTENT: RECETARIO */}
      {activeTab === "recipes" && (
        <div className="space-y-4">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar font-mono">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/40 shadow-xs"
                    : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:text-[#DDD6C9] hover:border-[#38332D]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Book Source Filter */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[11px] font-semibold text-[#8E867B]">Colección:</span>
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
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                  selectedBook === b.id
                    ? "bg-[#221D16] text-[#D99B43] font-bold border-[#D99B43]/30"
                    : "text-[#8E867B] border-transparent hover:text-[#DDD6C9]"
                }`}
              >
                {b.label}
              </button>
            ))}
            <span className="ml-auto font-mono text-[11px] text-[#8E867B]">
              {filteredRecipes.length} recetas encontradas
            </span>
          </div>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => setActiveRecipeModal(recipe)}
                className="group cursor-pointer flex flex-col justify-between rounded-lg border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm hover:border-[#D99B43]/40 hover:bg-[#1E1C19] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#2A2723]">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight leading-snug group-hover:text-[#D99B43] transition-colors">
                        {recipe.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 font-mono">
                        {recipe.category && (
                          <span className="rounded bg-[#121110] px-1.5 py-0.5 text-[10px] font-semibold text-[#8E867B] border border-[#2A2723]">
                            {recipe.category}
                          </span>
                        )}
                        {recipe.bookSource && (
                          <span className="text-[10px] font-mono text-[#D99B43]">
                            {recipe.bookSource}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Portions Contribution */}
                  {Object.keys(recipe.portions).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1 font-mono">
                      {(Object.keys(recipe.portions) as FoodGroupKey[]).map((k) => {
                        const meta = FOOD_GROUPS_CATALOG[k];
                        const qty = recipe.portions[k];
                        if (!qty || qty <= 0) return null;

                        return (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border border-[#2A2723] bg-[#121110] text-[#DDD6C9]"
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E867B] font-mono">
                        Ingredientes principales:
                      </span>
                      <p className="text-[11px] text-[#DDD6C9] line-clamp-2 leading-relaxed">
                        {recipe.ingredients.join(" • ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-[#2A2723] flex items-center justify-between text-[11px] text-[#D99B43] font-semibold font-mono">
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
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
            <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#7EA35A]" />
              <span>Indicaciones Clave de Mariana Mont</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MARIANA_MONT_KNOWLEDGE_BASE.indications.map((ind) => (
                <div
                  key={ind.id}
                  className="flex items-start gap-3 p-3.5 rounded-lg border border-[#2A2723] bg-[#121110]"
                >
                  <span className="text-xl mt-0.5">{ind.icon}</span>
                  <div>
                    <h4 className="font-serif text-xs font-bold text-[#F5F2EB] tracking-tight">
                      {ind.title}
                    </h4>
                    <p className="text-[11px] text-[#8E867B] mt-0.5 leading-relaxed font-mono">
                      {ind.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Rules & Tips */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
            <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2 mb-4">
              <ChefHat className="h-4 w-4 text-[#D99B43]" />
              <span>Reglas de Preparación & Digestibilidad</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MARIANA_MONT_KNOWLEDGE_BASE.preparationTips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-lg border border-[#2A2723] bg-[#121110]"
                >
                  <span className="text-xl mt-0.5">{tip.icon}</span>
                  <div>
                    <h4 className="font-serif text-xs font-bold text-[#D99B43] tracking-tight">
                      {tip.topic}
                    </h4>
                    <p className="text-[11px] text-[#DDD6C9] mt-1 leading-relaxed font-sans">
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
            <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
              <h4 className="font-serif text-xs font-bold text-[#7EA35A] tracking-tight flex items-center gap-2 mb-3">
                <Droplets className="h-4 w-4" />
                <span>Aceites Recomendados</span>
              </h4>
              <div className="space-y-2 font-mono">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.oils.map((oil, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[11px]">
                    <strong className="text-[#F5F2EB] block font-sans">{oil.name}</strong>
                    <span className="text-[#8E867B]">{oil.use}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sweeteners */}
            <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
              <h4 className="font-serif text-xs font-bold text-[#D99B43] tracking-tight flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                <span>Endulzantes Permitidos</span>
              </h4>
              <div className="space-y-2 font-mono">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.sweeteners.map((sw, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[11px]">
                    <strong className="text-[#F5F2EB] block font-sans">{sw.name}</strong>
                    <span className="text-[#8E867B]">{sw.notes}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonings & Salt */}
            <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
              <h4 className="font-serif text-xs font-bold text-[#4EAB9E] tracking-tight flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" />
                <span>Sal & Especias</span>
              </h4>
              <div className="space-y-2 font-mono">
                {MARIANA_MONT_KNOWLEDGE_BASE.cookingSupplies.seasonings.map((sn, i) => (
                  <div key={i} className="p-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[11px]">
                    <strong className="text-[#F5F2EB] block font-sans">{sn.name}</strong>
                    <span className="text-[#8E867B]">{sn.notes}</span>
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
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2A2723]">
              <span className="text-xl">🍎</span>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">Frutas (1 tz = 1 porción)</h4>
                <p className="text-[11px] text-[#E05D52] font-mono">Meta: 3 a 4 tazas/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.fruits.map((f, i) => (
                <span
                  key={i}
                  className="rounded bg-[#121110] border border-[#2A2723] px-2 py-1 text-xs text-[#DDD6C9]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Vegetables */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2A2723]">
              <span className="text-xl">🥦</span>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">Verduras & Hongos</h4>
                <p className="text-[11px] text-[#7EA35A] font-mono">Meta: 4 a 5 raciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.vegetables.map((v, i) => (
                <span
                  key={i}
                  className="rounded bg-[#121110] border border-[#2A2723] px-2 py-1 text-xs text-[#DDD6C9]"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Legumes */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2A2723]">
              <span className="text-xl">🫘</span>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">Legumbres & Tofu</h4>
                <p className="text-[11px] text-[#4EAB9E] font-mono">Meta: 2 a 4 porciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.legumes.map((l, i) => (
                <span
                  key={i}
                  className="rounded bg-[#121110] border border-[#2A2723] px-2 py-1 text-xs text-[#DDD6C9]"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Cereals */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2A2723]">
              <span className="text-xl">🌾</span>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">Cereales Integrales</h4>
                <p className="text-[11px] text-[#D99B43] font-mono">Meta: 4 a 6 raciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.cereals.map((c, i) => (
                <span
                  key={i}
                  className="rounded bg-[#121110] border border-[#2A2723] px-2 py-1 text-xs text-[#DDD6C9]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Seeds & Fats */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2A2723]">
              <span className="text-xl">🥑</span>
              <div>
                <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">Grasas & Semillas</h4>
                <p className="text-[11px] text-[#7EA35A] font-mono">Meta: 3 a 4 raciones/día</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 font-mono">
              {MARIANA_MONT_KNOWLEDGE_BASE.foodEquivalencies.seeds.map((s, i) => (
                <span
                  key={i}
                  className="rounded bg-[#121110] border border-[#2A2723] px-2 py-1 text-xs text-[#DDD6C9]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-xl rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between pb-4 border-b border-[#2A2723]">
              <div>
                <span className="text-xs font-bold text-[#D99B43] font-mono">
                  {activeRecipeModal.bookSource || "Mariana Mont"} • {activeRecipeModal.category || activeRecipeModal.mealSlot}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#F5F2EB] tracking-tight mt-0.5">
                  {activeRecipeModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveRecipeModal(null)}
                className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Portions Contribution */}
              {Object.keys(activeRecipeModal.portions).length > 0 && (
                <div>
                  <span className="text-xs font-bold text-[#8E867B] block mb-1.5 font-mono">
                    Aporte de Porciones:
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono">
                    {(Object.keys(activeRecipeModal.portions) as FoodGroupKey[]).map((k) => {
                      const meta = FOOD_GROUPS_CATALOG[k];
                      const qty = activeRecipeModal.portions[k];
                      if (!qty || qty <= 0) return null;

                      return (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold border border-[#2A2723] bg-[#121110] text-[#DDD6C9]"
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
                  <span className="font-serif text-xs font-bold text-[#F5F2EB] block">
                    Ingredientes:
                  </span>
                  <ul className="space-y-1.5 p-3 rounded-lg bg-[#121110] border border-[#2A2723]">
                    {activeRecipeModal.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-xs text-[#DDD6C9] flex items-start gap-2 leading-relaxed"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7EA35A] mt-1.5 shrink-0" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions / Prep notes */}
              {activeRecipeModal.prepNotes && (
                <div className="space-y-2">
                  <span className="font-serif text-xs font-bold text-[#F5F2EB] block">
                    Elaboración & Preparación:
                  </span>
                  <div className="p-3.5 rounded-lg bg-[#121110] border border-[#2A2723] text-xs text-[#DDD6C9] leading-relaxed font-sans">
                    {activeRecipeModal.prepNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2A2723] flex justify-between items-center font-mono">
              <span className="text-[11px] text-[#8E867B]">
                100% Plant-Based & Holístico
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRecipeModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
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
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] font-bold text-xs text-[#121110] transition-all cursor-pointer shadow-xs font-sans"
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
