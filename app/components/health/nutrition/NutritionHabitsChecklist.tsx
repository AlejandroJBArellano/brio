"use client";

import { toggleNutritionHabitAction } from "@/app/actions/nutrition";
import { toggleSupplementAction } from "@/app/actions/health";
import { NutritionHabitLog, SupplementItem, UserSupplement } from "@/lib/types";
import {
  Check,
  Droplet,
  LucideIcon,
  Pill,
  Plus,
  Salad,
  Settings2,
  ShieldCheck,
  Sparkles,
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
    <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Salad className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Indicaciones & Suplementación Diaria
            </h3>
            <p className="text-xs text-neutral-400">
              Reglas clínicas de alimentación y suplementación sincronizada
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenManageSupplements && (
            <button
              type="button"
              onClick={onOpenManageSupplements}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/8 text-xs font-semibold transition-all shadow-sm"
              title="Configurar suplementos"
            >
              <Settings2 className="h-3.5 w-3.5 text-violet-400" />
              <span className="hidden sm:inline">Configurar</span>
            </button>
          )}
          <span className="rounded-full px-3 py-1 text-xs font-bold font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            {totalCompletedCount} / {totalItemsCount} completados
          </span>
        </div>
      </div>

      {/* 1. Bloque de Reglas Dietéticas & Hábitos */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Reglas de Alimentación
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
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
                className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/10 text-white shadow-sm"
                    : "border-white/6 bg-neutral-950/60 text-neutral-300 hover:border-white/12 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                      isDone
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-neutral-900 border-white/8 text-neutral-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      isDone
                        ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                        : "border-neutral-700 bg-neutral-900"
                    }`}
                  >
                    {isDone && <Check className="h-3.5 w-3.5 stroke-3" />}
                  </div>
                </div>

                <div className="mt-2.5">
                  <span className="text-xs font-bold text-white block">
                    {item.title}
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Bloque de Suplementos Clínicos Personalizados (Fuente de la Verdad) */}
      <div className="space-y-2.5 pt-2 border-t border-white/6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5" />
            Suplementos Diarios (Sincronizado)
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {supplementsTakenCount} / {supplements.length} tomados
          </span>
        </div>

        {supplements.length === 0 ? (
          <div className="p-4 text-center rounded-xl border border-dashed border-white/8 bg-neutral-950/30">
            <Pill className="h-6 w-6 text-neutral-600 mx-auto mb-1.5" />
            <p className="text-xs text-neutral-400 mb-2">
              No tienes suplementos configurados.
            </p>
            {onOpenManageSupplements && (
              <button
                type="button"
                onClick={onOpenManageSupplements}
                className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Configurar Suplementos</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {supplements.map((supp) => {
              const isB12 =
                supp.name.toLowerCase().includes("b12") ||
                supp.name.toLowerCase().includes("b-12") ||
                supp.id.toLowerCase().includes("b12");

              return (
                <button
                  key={supp.id}
                  type="button"
                  onClick={() => handleToggleSupplement(supp.id)}
                  disabled={isPending}
                  className={`flex items-start justify-between p-3 rounded-xl border text-left transition-all ${
                    supp.taken
                      ? "border-emerald-500/30 bg-emerald-500/10 text-white shadow-sm"
                      : "border-white/6 bg-neutral-950/60 text-neutral-300 hover:border-white/12 hover:bg-neutral-900/80"
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white tracking-tight">
                        {supp.name}
                      </span>
                      {isB12 && (
                        <span className="rounded bg-violet-500/20 border border-violet-500/30 px-1 py-0.2 text-[9px] font-bold text-violet-300">
                          Semanal
                        </span>
                      )}
                    </div>
                    {supp.timing && (
                      <span className="inline-block text-[10px] font-medium text-neutral-400 bg-white/4 px-1.5 py-0.5 rounded border border-white/4">
                        {supp.timing}
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all mt-0.5 ${
                      supp.taken
                        ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                        : "border-neutral-700 bg-neutral-900"
                    }`}
                  >
                    {supp.taken && <Check className="h-3.5 w-3.5 stroke-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
