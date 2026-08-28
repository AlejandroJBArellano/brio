"use client";

import { toggleNutritionHabitAction } from "@/app/actions/nutrition";
import { toggleSupplementAction } from "@/app/actions/health";
import { NutritionHabitLog, SupplementItem, UserSupplement } from "@/lib/types";
import {
  Check,
  LucideIcon,
  Pill,
  Plus,
  Salad,
  Settings2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useTransition } from "react";

interface NutritionHabitsChecklistProps {
  date: string;
  habits: NutritionHabitLog;
  supplements?: SupplementItem[];
  supplementsCatalog?: UserSupplement[];
  onOpenManageSupplements?: () => void;
  onRefresh?: () => void;
}

export function NutritionHabitsChecklist({
  date,
  habits,
  supplements = [],
  onOpenManageSupplements,
  onRefresh,
}: NutritionHabitsChecklistProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleHabit = (key: keyof NutritionHabitLog) => {
    startTransition(async () => {
      await toggleNutritionHabitAction(date, key);
      if (onRefresh) onRefresh();
    });
  };

  const handleToggleSupplement = (id: string) => {
    startTransition(async () => {
      await toggleSupplementAction(id);
      if (onRefresh) onRefresh();
    });
  };

  const dietaryHabitItems: Array<{
    key: "dailySalad" | "noUltraProcessed";
    title: string;
    description: string;
    icon: LucideIcon;
  }> = [
    {
      key: "dailySalad",
      title: "1 Ensalada Diaria con Semillas",
      description: "2 tz de verdura cruda + 2 cdas de pepitas de calabaza, ajonjolí o girasol + germinados",
      icon: Salad,
    },
    {
      key: "noUltraProcessed",
      title: "Cero Ultraprocesados & Fritos",
      description: "Sin productos procesados, enlatados, harinas/sal refinada ni edulcorantes artificiales",
      icon: ShieldCheck,
    },
  ];

  const dietaryCompletedCount = dietaryHabitItems.filter(
    (item) => habits[item.key]
  ).length;

  const supplementsTakenCount = supplements.filter((s) => s.taken).length;
  const totalItemsCount = dietaryHabitItems.length + supplements.length;
  const totalCompletedCount = dietaryCompletedCount + supplementsTakenCount;

  return (
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs">
            <Salad className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                Indicaciones & Suplementación Diaria
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-[#221D16] border border-[#D99B43]/30 px-1.5 py-0.2 text-[9px] font-mono text-[#D99B43]">
                <Zap className="size-2.5" />
                Habitica RPG
              </span>
            </div>
            <p className="text-xs text-[#8E867B] font-mono">
              Reglas clínicas de Mariana Mont sincronizadas con tu personaje (+EXP/Oro)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          {onOpenManageSupplements && (
            <button
              type="button"
              onClick={onOpenManageSupplements}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#121110] hover:bg-[#22201D] text-[#DDD6C9] border border-[#2A2723] text-xs font-semibold transition-all cursor-pointer font-sans"
              title="Configurar suplementos"
            >
              <Settings2 className="h-3.5 w-3.5 text-[#D99B43]" />
              <span className="hidden sm:inline">Configurar</span>
            </button>
          )}
          <span className="rounded px-2.5 py-1 text-xs font-bold font-mono border border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]">
            {totalCompletedCount} / {totalItemsCount} completados
          </span>
        </div>
      </div>

      {/* 1. Bloque de Reglas Dietéticas & Hábitos */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7EA35A] flex items-center gap-1.5 font-serif">
            <Sparkles className="h-3.5 w-3.5 text-[#7EA35A]" />
            Reglas de Alimentación
          </span>
          <span className="text-[11px] text-[#8E867B] font-mono">
            {dietaryCompletedCount} / {dietaryHabitItems.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {dietaryHabitItems.map((item) => {
            const isDone = habits[item.key];
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggleHabit(item.key)}
                disabled={isPending}
                className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isDone
                    ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#F5F2EB]"
                    : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:border-[#38332D] hover:bg-[#181715]"
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border ${
                      isDone
                        ? "bg-[#1C2219] border-[#7EA35A]/40 text-[#7EA35A]"
                        : "bg-[#181715] border-[#2A2723] text-[#8E867B]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                      isDone
                        ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                        : "border-[#2A2723] bg-[#181715]"
                    }`}
                  >
                    {isDone && <Check className="h-3.5 w-3.5 stroke-3" />}
                  </div>
                </div>

                <div className="mt-2.5">
                  <span
                    className={`text-xs font-bold block font-serif ${
                      isDone ? "text-[#F5F2EB]" : "text-[#DDD6C9]"
                    }`}
                  >
                    {item.title}
                  </span>
                  <p className="text-[10px] text-[#8E867B] mt-0.5 leading-snug font-mono">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Bloque de Suplementación */}
      <div className="space-y-2.5 pt-2 border-t border-[#2A2723]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D99B43] flex items-center gap-1.5 font-serif">
            <Pill className="h-3.5 w-3.5 text-[#D99B43]" />
            Suplementos del Día
          </span>
          <span className="text-[11px] text-[#8E867B] font-mono">
            {supplementsTakenCount} / {supplements.length} tomados
          </span>
        </div>

        {supplements.length === 0 ? (
          <div className="p-4 text-center rounded-lg border border-dashed border-[#2A2723] bg-[#121110]">
            <p className="text-xs text-[#8E867B] mb-2 font-mono">
              No tienes suplementos configurados para hoy.
            </p>
            {onOpenManageSupplements && (
              <button
                type="button"
                onClick={onOpenManageSupplements}
                className="px-3 py-1.5 rounded-lg bg-[#221D16] hover:bg-[#2A241C] text-[#D99B43] border border-[#D99B43]/30 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar Suplemento</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {supplements.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleSupplement(item.id)}
                disabled={isPending}
                className={`flex items-start justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  item.taken
                    ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#F5F2EB]"
                    : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:border-[#38332D] hover:bg-[#181715]"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#F5F2EB]">
                      {item.name}
                    </span>
                  </div>
                  {item.timing && (
                    <span className="text-[10px] text-[#8E867B] block font-mono">
                      ⏰ {item.timing}
                    </span>
                  )}
                </div>

                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                    item.taken
                      ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                      : "border-[#2A2723] bg-[#181715]"
                  }`}
                >
                  {item.taken && <Check className="h-3.5 w-3.5 stroke-3" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
