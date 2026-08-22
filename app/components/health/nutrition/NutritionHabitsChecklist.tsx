"use client";

import { toggleNutritionHabitAction } from "@/app/actions/nutrition";
import { NutritionHabitLog } from "@/lib/types";
import {
  Check,
  CheckCircle2,
  Droplet,
  HeartPulse,
  Moon,
  Pill,
  Salad,
  ShieldCheck,
  Sparkles,
  Sun,
  XCircle,
  Zap,
} from "lucide-react";
import { useTransition } from "react";

interface NutritionHabitsChecklistProps {
  date: string;
  habits: NutritionHabitLog;
  onRefresh?: () => void;
}

export function NutritionHabitsChecklist({
  date,
  habits,
  onRefresh,
}: NutritionHabitsChecklistProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (key: keyof NutritionHabitLog) => {
    startTransition(async () => {
      await toggleNutritionHabitAction(date, key);
      if (onRefresh) onRefresh();
    });
  };

  const habitItems: Array<{
    key: keyof NutritionHabitLog;
    title: string;
    description: string;
    icon: any;
    color: string;
    isWeekly?: boolean;
  }> = [
    {
      key: "dailySalad",
      title: "1 Ensalada Diaria con Semillas",
      description: "2 tz de verdura cruda + 2 cdas de pepitas de calabaza, ajonjolí o girasol + germinados",
      icon: Salad,
      color: "emerald",
    },
    {
      key: "hydrationGoal",
      title: "Hidratación 1.5L a 2L de Agua",
      description: "Agua natural distribuida a lo largo del día entre comidas",
      icon: Droplet,
      color: "sky",
    },
    {
      key: "noUltraProcessed",
      title: "Cero Ultraprocesados & Fritos",
      description: "Sin productos procesados, enlatados, harinas/sal refinada ni edulcorantes artificiales",
      icon: ShieldCheck,
      color: "amber",
    },
    {
      key: "b12Weekly",
      title: "Vitamina B12 (1000 mcg)",
      description: "Suplemento semanal indispensable para nutrición plant-based",
      icon: Pill,
      color: "violet",
      isWeekly: true,
    },
    {
      key: "omega3Dha",
      title: "Omega 3 DHA de Microalgas",
      description: "1 cap con el desayuno o 2 cditas de semillas ricas en DHA",
      icon: HeartPulse,
      color: "cyan",
    },
    {
      key: "vitC",
      title: "Vitamina C (1 gramo)",
      description: "Tomar con la comida fuerte para maximizar absorción de hierro vegetal",
      icon: Zap,
      color: "yellow",
    },
    {
      key: "spirulina",
      title: "Spirulina (Desayuno & Comida)",
      description: "4 tabletas con desayuno + 3 con comida fuerte",
      icon: Sparkles,
      color: "teal",
    },
    {
      key: "magnesium",
      title: "Ser + Magnesio Complex (Noche)",
      description: "1 cápsula antes de dormir para relajación muscular y recuperación del SNC",
      icon: Moon,
      color: "indigo",
    },
  ];

  const completedCount = Object.values(habits).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Salad className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Indicaciones & Suplementación Clínica
            </h3>
            <p className="text-xs text-neutral-400">
              Reglas diarias y micronutrientes recetados por Mariana Mont
            </p>
          </div>
        </div>

        <span className="rounded-full px-3 py-1 text-xs font-bold font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          {completedCount} / {habitItems.length} completados
        </span>
      </div>

      {/* Grid of habits */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {habitItems.map((item) => {
          const isDone = habits[item.key];
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleToggle(item.key)}
              disabled={isPending}
              className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                isDone
                  ? "border-emerald-500/30 bg-emerald-500/10 text-white shadow-sm"
                  : "border-white/[0.06] bg-neutral-950/60 text-neutral-300 hover:border-white/[0.12] hover:bg-neutral-900/80"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    isDone
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-neutral-900 border-white/[0.08] text-neutral-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {item.title}
                    </span>
                    {item.isWeekly && (
                      <span className="rounded bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.2 text-[9px] font-bold text-violet-300">
                        Semanal
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>

              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ml-3 mt-1 transition-all ${
                  isDone
                    ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                    : "border-neutral-700 bg-neutral-900"
                }`}
              >
                {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
