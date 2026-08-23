"use client";

import {
  deleteScheduledMealAction,
  scheduleMealSlotAction,
  toggleScheduledMealCompletedAction,
} from "@/app/actions/nutrition";
import { FOOD_GROUPS_CATALOG } from "@/lib/nutritionPresets";
import {
  FoodGroupKey,
  MealSlotType,
  NutritionRecipe,
  ScheduledMealItem,
} from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface MealPlannerCalendarProps {
  scheduledMeals: ScheduledMealItem[];
  recipesCatalog: NutritionRecipe[];
  currentDateStr: string;
  onSelectDate?: (date: string) => void;
  onRefresh?: () => void;
}

const MEAL_SLOTS: Array<{
  id: MealSlotType;
  title: string;
  subtitle: string;
  icon: string;
  badgeColor: string;
}> = [
  {
    id: "breakfast",
    title: "Desayuno",
    subtitle: "Smoothie matutino + Suplementos",
    icon: "🌅",
    badgeColor: "amber",
  },
  {
    id: "lunch",
    title: "Almuerzo",
    subtitle: "Bowl, avena, tostadas o tofu",
    icon: "🥣",
    badgeColor: "sky",
  },
  {
    id: "dinner",
    title: "Comida Fuerte",
    subtitle: "Platillo principal + Ensalada",
    icon: "🍲",
    badgeColor: "emerald",
  },
  {
    id: "snack",
    title: "Snack de Media Tarde",
    subtitle: "Fruta, semillas, obleas o pudín",
    icon: "🍎",
    badgeColor: "rose",
  },
  {
    id: "smoothie",
    title: "Cena",
    subtitle: "Green smoothie + taquitos/tostada",
    icon: "🥗",
    badgeColor: "violet",
  },
];

export function MealPlannerCalendar({
  scheduledMeals,
  recipesCatalog,
  currentDateStr,
  onSelectDate,
  onRefresh,
}: MealPlannerCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(currentDateStr);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<MealSlotType>("lunch");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Helper to generate current 7-day week view around selectedDate
  const curr = new Date(`${selectedDate}T12:00:00Z`);
  const dayOfWeek = curr.getUTCDay();
  const diffToMon = (dayOfWeek + 6) % 7;
  const monday = new Date(curr);
  monday.setUTCDate(monday.getUTCDate() - diffToMon);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    return {
      dateStr,
      dayName: dayNames[i],
      dayNumber: d.getUTCDate(),
      isToday: dateStr === getTodayDateStr(),
      isSelected: dateStr === selectedDate,
    };
  });

  const handlePrevWeek = () => {
    const prev = new Date(monday);
    prev.setUTCDate(monday.getUTCDate() - 7);
    const newDateStr = prev.toISOString().split("T")[0];
    setSelectedDate(newDateStr);
    if (onSelectDate) onSelectDate(newDateStr);
  };

  const handleNextWeek = () => {
    const next = new Date(monday);
    next.setUTCDate(monday.getUTCDate() + 7);
    const newDateStr = next.toISOString().split("T")[0];
    setSelectedDate(newDateStr);
    if (onSelectDate) onSelectDate(newDateStr);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (onSelectDate) onSelectDate(dateStr);
  };

  const openScheduleModal = (slot: MealSlotType) => {
    setTargetSlot(slot);
    setSelectedRecipeId(null);
    setCustomTitle("");
    setRecipeSearch("");
    setIsModalOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!selectedRecipeId && !customTitle.trim()) return;

    startTransition(async () => {
      await scheduleMealSlotAction({
        date: selectedDate,
        mealSlot: targetSlot,
        recipeId: selectedRecipeId || undefined,
        customTitle: customTitle.trim() || undefined,
      });
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    });
  };

  const handleToggleCompleted = (mealId: string) => {
    startTransition(async () => {
      await toggleScheduledMealCompletedAction(mealId, true);
      if (onRefresh) onRefresh();
    });
  };

  const handleDeleteMeal = (mealId: string) => {
    startTransition(async () => {
      await deleteScheduledMealAction(mealId);
      if (onRefresh) onRefresh();
    });
  };

  // Filter recipes for modal
  const filteredRecipes = recipesCatalog.filter((r) => {
    const matchesSlot =
      r.mealSlot === targetSlot ||
      (targetSlot === "smoothie" && (r.mealSlot === "dinner" || r.mealSlot === "breakfast"));
    const matchesSearch =
      r.title.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      r.ingredients.some((ing) => ing.toLowerCase().includes(recipeSearch.toLowerCase()));
    return (matchesSlot || recipeSearch.length > 0) && matchesSearch;
  });

  const mealsForSelectedDate = scheduledMeals.filter((m) => m.date === selectedDate);

  return (
    <div className="space-y-6">
      {/* 1. Week Ribbon Navigator */}
      <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Planificador de Comidas por Fecha
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg border border-white/6 bg-neutral-950/60 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
              title="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDayClick(getTodayDateStr())}
              className="px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg border border-white/6 bg-neutral-950/60 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
              title="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 7 Days Row */}
        <div className="mt-3 grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const hasMeals = scheduledMeals.some((m) => m.date === day.dateStr);

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => handleDayClick(day.dateStr)}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                  day.isSelected
                    ? "bg-emerald-500/20 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10"
                    : day.isToday
                    ? "bg-neutral-950/80 border-emerald-500/30 text-emerald-300"
                    : "bg-neutral-950/40 border-white/6 text-neutral-400 hover:border-white/12 hover:text-neutral-200"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{day.dayName}</span>
                <span className="font-mono text-base font-extrabold mt-0.5">{day.dayNumber}</span>
                {hasMeals && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Meal Slots Timeline for Selected Date */}
      <div className="space-y-3">
        {MEAL_SLOTS.map((slot) => {
          const slotMeals = mealsForSelectedDate.filter((m) => m.mealSlot === slot.id);

          return (
            <div
              key={slot.id}
              className="rounded-2xl border border-white/8 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-lg transition-all"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-white/4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{slot.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {slot.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500">{slot.subtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openScheduleModal(slot.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/8 bg-neutral-950/60 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Asignar</span>
                </button>
              </div>

              {/* Meals in this slot */}
              {slotMeals.length === 0 ? (
                <div className="mt-3 py-4 text-center rounded-xl border border-dashed border-white/6 bg-neutral-950/20">
                  <p className="text-xs text-neutral-500">
                    No has programado comida para este tiempo.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {slotMeals.map((meal) => {
                    const title = meal.recipe?.title || meal.customTitle || "Comida programada";
                    const portions = meal.portions || meal.recipe?.portions || {};

                    return (
                      <div
                        key={meal.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                          meal.isCompleted
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-white/8 bg-neutral-950/70"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold tracking-tight ${
                                meal.isCompleted
                                  ? "text-emerald-200 line-through opacity-80"
                                  : "text-white"
                              }`}
                            >
                              {title}
                            </span>
                            {meal.recipe?.optionLabel && (
                              <span className="rounded bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400">
                                {meal.recipe.optionLabel}
                              </span>
                            )}
                          </div>

                          {/* Portion Badges */}
                          {Object.keys(portions).length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {(Object.keys(portions) as FoodGroupKey[]).map((k) => {
                                const meta = FOOD_GROUPS_CATALOG[k];
                                const qty = portions[k];
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

                          {meal.recipe?.prepNotes && (
                            <p className="text-[11px] text-neutral-400 italic">
                              💡 {meal.recipe.prepNotes}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggleCompleted(meal.id)}
                            disabled={isPending}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                              meal.isCompleted
                                ? "bg-emerald-500 border-emerald-400 text-neutral-950 shadow-md shadow-emerald-500/20"
                                : "bg-neutral-900 border-white/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/40"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5 stroke-3" />
                            <span>{meal.isCompleted ? "¡Consumido!" : "Marcar Comido"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(meal.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Eliminar comida"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule Meal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Programar {MEAL_SLOTS.find((s) => s.id === targetSlot)?.title}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Fecha: <strong className="text-emerald-300">{selectedDate}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Option A: Pick from Mariana Mont Presets */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2">
                  Seleccionar del Recetario de Mariana Mont:
                </label>
                <div className="relative mb-2.5">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar receta o ingrediente..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-950/80 pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {filteredRecipes.map((recipe) => {
                    const isSelected = selectedRecipeId === recipe.id;

                    return (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecipeId(recipe.id);
                          setCustomTitle("");
                        }}
                        className={`w-full flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/60 shadow-md shadow-emerald-500/10 text-white"
                            : "bg-neutral-950/60 border-white/6 text-neutral-300 hover:border-white/12"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">
                            {recipe.title}
                          </span>
                          {recipe.weekNumber && (
                            <span className="text-[10px] font-mono text-emerald-400">
                              Sem {recipe.weekNumber}
                            </span>
                          )}
                        </div>

                        {recipe.ingredients.length > 0 && (
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                            {recipe.ingredients.join(", ")}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option B: Or Custom meal title */}
              <div className="pt-2 border-t border-white/6">
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  O escribe un platillo personalizado:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ensalada de garbanzo con aguacate y tostadas"
                  value={customTitle}
                  onChange={(e) => {
                    setCustomTitle(e.target.value);
                    if (e.target.value) setSelectedRecipeId(null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-neutral-950/80 p-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/8 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isPending || (!selectedRecipeId && !customTitle.trim())}
                className="px-5 py-2 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-500 disabled:opacity-40 transition-all shadow-lg shadow-emerald-600/20"
              >
                {isPending ? "Guardando..." : "Programar Comida"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
