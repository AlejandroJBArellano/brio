"use client";

import {
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
  ChefHat,
  Flame,
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
import { PantryAssistantModal } from "./PantryAssistantModal";
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
  const [isPantryModalOpen, setIsPantryModalOpen] = useState(false);
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
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Header Ribbon with Subtabs & Quick Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs">
            <Salad className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-[#F5F2EB] tracking-tight">
                Nutrición Holística & Dietas
              </h2>
              <span className="rounded-md border border-[#7EA35A]/30 bg-[#1C2219] px-2 py-0.5 text-[10px] font-mono font-bold text-[#7EA35A]">
                Plan Mariana Mont
              </span>
            </div>
            <p className="text-xs text-[#8E867B] mt-0.5 font-mono">
              Tracking de porciones, macro balance dinámico y menús clínicos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono">
          {/* Sub-nav Buttons */}
          <div className="flex items-center p-1 rounded-lg bg-[#121110] border border-[#2A2723]">
            <button
              type="button"
              onClick={() => setActiveSubTab("daily")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "daily"
                  ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Diario de Hoy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("planner")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "planner"
                  ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Planificador</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("recipes")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "recipes"
                  ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Recetas & Guía</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("grocery")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "grocery"
                  ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Lista del Súper</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPantryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer font-sans"
          >
            <ChefHat className="h-4 w-4" />
            <span>💡 ¿Qué cocino hoy? (&lt;15m)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] text-xs font-semibold transition-all cursor-pointer"
            title="Configurar metas de porciones y agua"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Metas</span>
          </button>
        </div>
      </div>

      {/* 2. SUBTAB: DIARIO DE HOY */}
      {activeSubTab === "daily" && (
        <div className="space-y-6">
          {/* Top Quick Status Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            {/* Target Met Count */}
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#8E867B] font-sans">
                <span>Grupos con Meta Cumplida</span>
                <Sparkles className="h-4 w-4 text-[#7EA35A]" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#7EA35A]">
                {groupsMetCount} de 7 grupos
              </div>
              <div className="mt-1 text-[11px] text-[#8E867B]">
                {Math.round((groupsMetCount / 7) * 100)}% de cumplimiento diario
              </div>
            </div>

            {/* Adherence Days */}
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#8E867B] font-sans">
                <span>Adherencia Semanal</span>
                <Flame className="h-4 w-4 text-[#D99B43]" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#D99B43]">
                {data.weeklyAdherence.daysWithPortionsMet} días en meta
              </div>
              <div className="mt-1 text-[11px] text-[#8E867B]">
                {data.weeklyAdherence.daysWithSalad} ensaladas esta semana
              </div>
            </div>

            {/* B12 & Key Supplement status */}
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#8E867B] font-sans">
                <span>Vitamina B12 Semanal</span>
                <Zap className="h-4 w-4 text-[#4EAB9E]" />
              </div>
              <div className="mt-2 text-xl font-bold text-[#F5F2EB] flex items-center gap-2 font-mono">
                {data.weeklyAdherence.b12LoggedThisWeek ? (
                  <span className="text-[#7EA35A] flex items-center gap-1">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Tomada esta semana</span>
                  </span>
                ) : (
                  <span className="text-[#D99B43] font-mono text-base">
                    ⏳ Pendiente de tomar
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-[#8E867B]">
                Dosis: 1000 mcg 1 vez por semana
              </div>
            </div>
          </div>

          {/* Today's Scheduled Meals Banner */}
          {data.scheduledMealsToday.length > 0 && (
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-[#7EA35A]" />
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                    Comidas Programadas para Hoy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab("planner")}
                  className="text-xs font-semibold text-[#D99B43] hover:underline cursor-pointer"
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
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        meal.isCompleted
                          ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                          : "border-[#2A2723] bg-[#121110] text-[#F5F2EB]"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block line-clamp-1 font-serif">{title}</span>
                        <span className="text-[10px] text-[#8E867B] uppercase font-semibold font-mono">
                          {meal.mealSlot}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleMeal(meal.id)}
                        disabled={isPending}
                        className={`flex h-6 px-2.5 items-center justify-center rounded text-xs font-bold transition-all cursor-pointer ${
                          meal.isCompleted
                            ? "bg-[#7EA35A] text-[#121110] font-extrabold"
                            : "bg-[#181715] border border-[#2A2723] text-[#7EA35A] hover:bg-[#1C2219]"
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
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Registro de Porciones del Día
                </h3>
                <p className="text-xs text-[#8E867B] font-mono">
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

      {/* Pantry Assistant Modal */}
      <PantryAssistantModal
        isOpen={isPantryModalOpen}
        onClose={() => setIsPantryModalOpen(false)}
        recipesCatalog={data.recipesCatalog}
        todayDate={data.todayLog.date}
        onRefresh={onRefresh}
      />
    </div>
  );
}
