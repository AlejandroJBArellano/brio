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
    <div className="space-y-6 font-sans">
      {/* 1. Week Ribbon Navigator */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#D99B43]" />
            <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
              Planificador de Comidas por Fecha
            </h3>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-all cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDayClick(getTodayDateStr())}
              className="px-2.5 py-1 rounded-lg border border-[#D99B43]/30 bg-[#221D16] text-xs font-bold text-[#D99B43] hover:bg-[#2A241C] transition-all cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-all cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 7 Days Row */}
        <div className="mt-3 grid grid-cols-7 gap-2 font-mono">
          {weekDays.map((day) => {
            const hasMeals = scheduledMeals.some((m) => m.date === day.dateStr);

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => handleDayClick(day.dateStr)}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  day.isSelected
                    ? "bg-[#221D16] border-[#D99B43]/40 text-[#F5F2EB] shadow-xs"
                    : day.isToday
                    ? "bg-[#181715] border-[#D99B43]/30 text-[#D99B43]"
                    : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:border-[#38332D] hover:text-[#DDD6C9]"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{day.dayName}</span>
                <span className="font-mono text-base font-bold mt-0.5">{day.dayNumber}</span>
                {hasMeals && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7EA35A]" />
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
              className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm transition-all"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#2A2723]">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{slot.icon}</span>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                      {slot.title}
                    </h4>
                    <p className="text-[11px] text-[#8E867B] font-mono">{slot.subtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openScheduleModal(slot.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#2A2723] bg-[#121110] text-xs font-semibold text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-all cursor-pointer font-sans"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Asignar</span>
                </button>
              </div>

              {/* Meals in this slot */}
              {slotMeals.length === 0 ? (
                <div className="mt-3 py-3.5 text-center rounded-lg border border-dashed border-[#2A2723] bg-[#121110]">
                  <p className="text-xs text-[#8E867B] font-mono">
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
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-all ${
                          meal.isCompleted
                            ? "border-[#7EA35A]/40 bg-[#1C2219]"
                            : "border-[#2A2723] bg-[#121110]"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold tracking-tight font-serif ${
                                meal.isCompleted
                                  ? "text-[#7EA35A] line-through opacity-80"
                                  : "text-[#F5F2EB]"
                              }`}
                            >
                              {title}
                            </span>
                            {meal.recipe?.optionLabel && (
                              <span className="rounded bg-[#181715] px-1.5 py-0.5 text-[10px] font-semibold text-[#8E867B] border border-[#2A2723] font-mono">
                                {meal.recipe.optionLabel}
                              </span>
                            )}
                          </div>

                          {/* Portion Badges */}
                          {Object.keys(portions).length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5 font-mono">
                              {(Object.keys(portions) as FoodGroupKey[]).map((k) => {
                                const meta = FOOD_GROUPS_CATALOG[k];
                                const qty = portions[k];
                                if (!qty || qty <= 0) return null;

                                return (
                                  <span
                                    key={k}
                                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border border-[#2A2723] bg-[#181715] text-[#DDD6C9]"
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
                            <p className="text-[11px] text-[#8E867B] font-mono">
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
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer font-sans ${
                              meal.isCompleted
                                ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                                : "bg-[#181715] border border-[#2A2723] text-[#7EA35A] hover:bg-[#1C2219]"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5 stroke-3" />
                            <span>{meal.isCompleted ? "¡Consumido!" : "Marcar Comido"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(meal.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#E05D52] hover:bg-[#251A18] transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-xl rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                    Programar {MEAL_SLOTS.find((s) => s.id === targetSlot)?.title}
                  </h3>
                  <p className="text-xs text-[#8E867B] font-mono">
                    Fecha: <strong className="text-[#D99B43]">{selectedDate}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Option A: Pick from Mariana Mont Presets */}
              <div>
                <label className="block text-xs font-bold text-[#DDD6C9] mb-2 font-serif">
                  Seleccionar del Recetario de Mariana Mont:
                </label>
                <div className="relative mb-2.5">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8E867B]" />
                  <input
                    type="text"
                    placeholder="Buscar receta o ingrediente..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-9 pr-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43] font-mono"
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
                        className={`w-full flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#221D16] border-[#D99B43]/40 text-[#F5F2EB]"
                            : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:border-[#38332D]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-[#F5F2EB] font-serif">
                            {recipe.title}
                          </span>
                          {recipe.weekNumber && (
                            <span className="text-[10px] font-mono text-[#D99B43]">
                              Sem {recipe.weekNumber}
                            </span>
                          )}
                        </div>

                        {recipe.ingredients.length > 0 && (
                          <p className="text-[11px] text-[#8E867B] mt-1 line-clamp-1 font-mono">
                            {recipe.ingredients.join(", ")}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option B: Or Custom meal title */}
              <div className="pt-2 border-t border-[#2A2723]">
                <label className="block text-xs font-bold text-[#DDD6C9] mb-1.5 font-serif">
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
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43] font-mono"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#2A2723] flex justify-end gap-2 font-sans">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isPending || (!selectedRecipeId && !customTitle.trim())}
                className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] font-bold text-xs text-[#121110] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
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
