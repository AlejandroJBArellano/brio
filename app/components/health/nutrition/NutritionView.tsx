"use client";

import {
  logDailyPortionsAction,
  quickAdjustPortionAction,
  toggleScheduledMealCompletedAction,
} from "@/app/actions/nutrition";
import { FOOD_GROUPS_CATALOG } from "@/lib/nutritionPresets";
import { FoodGroupKey, NutritionDashboardData } from "@/lib/types";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Flame,
  Layers,
  ListTodo,
  Plus,
  Salad,
  Settings2,
  ShoppingBag,
  Sparkles,
  Utensils,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";
import { MacroBalanceWidget } from "./MacroBalanceWidget";
import { MealPlannerCalendar } from "./MealPlannerCalendar";
import { NutritionHabitsChecklist } from "./NutritionHabitsChecklist";
import { NutritionSettingsModal } from "./NutritionSettingsModal";
import { PortionCounterCard } from "./PortionCounterCard";
import { RecipeLibraryGuide } from "./RecipeLibraryGuide";
import { SmartGroceryList } from "./SmartGroceryList";

interface NutritionViewProps {
  data: NutritionDashboardData;
  onOpenManageSupplements?: () => void;
  onRefresh?: () => void;
}

export function NutritionView({
  data,
  onOpenManageSupplements,
  onRefresh,
}: NutritionViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "daily" | "planner" | "recipes" | "grocery"
  >("daily");
  const [selectedDate, setSelectedDate] = useState<string>(data.todayLog.date);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAdjustPortion = (key: FoodGroupKey, delta: number) => {
    startTransition(async () => {
      await quickAdjustPortionAction(data.todayLog.date, key, delta);
      if (onRefresh) onRefresh();
    });
  };

  const handleToggleMeal = (mealId: string) => {
    startTransition(async () => {
      await toggleScheduledMealCompletedAction(mealId, true);
      if (onRefresh) onRefresh();
    });
  };

  // Count total groups meeting their daily target
  const groupsMetCount = (Object.keys(FOOD_GROUPS_CATALOG) as FoodGroupKey[]).filter((key) => {
    const consumed = data.todayLog.portions[key] || 0;
    const target = data.settings.dailyPortionGoals[key] || 1;
    return consumed >= target;
  }).length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header Ribbon with Subtabs & Quick Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-neutral-900/80 p-5 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Salad className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Nutrición Holística & Dietas
              </h2>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                Plan Mariana Mont
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tracking de porciones, macro balance dinámico y menús clínicos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-nav Buttons */}
          <div className="flex items-center p-1 rounded-2xl bg-neutral-950/80 border border-white/[0.06] shadow-inner">
            <button
              type="button"
              onClick={() => setActiveSubTab("daily")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "daily"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Diario de Hoy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("planner")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "planner"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Planificador</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("recipes")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "recipes"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Recetas & Guía</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("grocery")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === "grocery"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Lista del Súper</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950/80 border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-neutral-900 text-xs font-semibold transition-all shadow-sm"
            title="Configurar metas de porciones y agua"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Metas</span>
          </button>
        </div>
      </div>

      {/* 2. SUBTAB: DIARIO DE HOY */}
      {activeSubTab === "daily" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Quick Status Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Met Count */}
            <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Grupos con Meta Cumplida</span>
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
                {groupsMetCount} de 7 grupos
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                {Math.round((groupsMetCount / 7) * 100)}% de cumplimiento diario
              </div>
            </div>

            {/* Adherence Days */}
            <div className="rounded-2xl border border-teal-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Adherencia Semanal</span>
                <Flame className="h-4 w-4 text-teal-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-teal-400">
                {data.weeklyAdherence.daysWithPortionsMet} días en meta
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                {data.weeklyAdherence.daysWithSalad} ensaladas registradas esta semana
              </div>
            </div>

            {/* B12 & Key Supplement status */}
            <div className="rounded-2xl border border-violet-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Vitamina B12 Semanal</span>
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <div className="mt-2 text-xl font-bold text-white flex items-center gap-2">
                {data.weeklyAdherence.b12LoggedThisWeek ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Tomada esta semana</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono text-base">
                    ⏳ Pendiente de tomar
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Dosis clínica: 1000 mcg 1 vez por semana
              </div>
            </div>
          </div>

          {/* Today's Scheduled Meals Banner */}
          {data.scheduledMealsToday.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Comidas Programadas para Hoy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("planner")}
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Ver calendario completo →
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {data.scheduledMealsToday.map((meal) => {
                  const title = meal.recipe?.title || meal.customTitle || "Comida";

                  return (
                    <div
                      key={meal.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        meal.isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-white/[0.08] bg-neutral-950/60 text-white"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block line-clamp-1">{title}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                          {meal.mealSlot}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleMeal(meal.id)}
                        disabled={isPending}
                        className={`flex h-6 px-2.5 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          meal.isCompleted
                            ? "bg-emerald-500 text-neutral-950 font-extrabold"
                            : "bg-neutral-900 border border-white/[0.1] text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        {meal.isCompleted ? "Comido ✓" : "Comer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Food Groups Portion Counters Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Registro de Porciones del Día
                </h3>
                <p className="text-xs text-neutral-400">
                  Haz clic en (+ / -) para registrar lo que vas comiendo
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(Object.keys(FOOD_GROUPS_CATALOG) as FoodGroupKey[]).map((key) => {
                const meta = FOOD_GROUPS_CATALOG[key];
                const current = data.todayLog.portions[key] || 0;
                const target = data.settings.dailyPortionGoals[key] || meta.defaultDailyTarget;

                return (
                  <PortionCounterCard
                    key={key}
                    meta={meta}
                    current={current}
                    target={target}
                    onAdjust={(delta) => handleAdjustPortion(key, delta)}
                    disabled={isPending}
                  />
                );
              })}
            </div>
          </div>

          {/* Macro Balance & Habits Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MacroBalanceWidget macros={data.todayLog.calculatedMacros} />
            <NutritionHabitsChecklist
              date={data.todayLog.date}
              habits={data.todayLog.habits}
              supplements={data.supplements}
              supplementsCatalog={data.supplementsCatalog}
              onOpenManageSupplements={onOpenManageSupplements}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      )}

      {/* 3. SUBTAB: PLANIFICADOR & CALENDARIO */}
      {activeSubTab === "planner" && (
        <div className="animate-in fade-in duration-200">
          <MealPlannerCalendar
            scheduledMeals={data.scheduledMealsThisWeek}
            recipesCatalog={data.recipesCatalog}
            currentDateStr={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* 4. SUBTAB: RECETAS & GUÍA */}
      {activeSubTab === "recipes" && (
        <div className="animate-in fade-in duration-200">
          <RecipeLibraryGuide
            recipesCatalog={data.recipesCatalog}
            onScheduleRecipe={() => setActiveSubTab("planner")}
          />
        </div>
      )}

      {/* 5. SUBTAB: LISTA DEL SÚPER */}
      {activeSubTab === "grocery" && (
        <div className="animate-in fade-in duration-200">
          <SmartGroceryList />
        </div>
      )}

      {/* Settings Modal */}
      <NutritionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={data.settings}
        onSuccess={onRefresh}
      />
    </div>
  );
}
