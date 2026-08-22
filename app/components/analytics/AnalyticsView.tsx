"use client";

import { AnalyticsDashboardData } from "@/lib/types";
import { Activity, BarChart3, Flame, Shield, Sparkles, Trophy } from "lucide-react";
import { HabitHeatmap } from "./HabitHeatmap";
import { LifeBalanceRadar } from "./LifeBalanceRadar";

interface AnalyticsViewProps {
  data: AnalyticsDashboardData;
}

export function AnalyticsView({ data }: AnalyticsViewProps) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Racha Actual</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {data.currentStreak} días consecutivos
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Récord personal: {data.longestStreak} días
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Actividades Registradas (90d)</span>
            <Activity className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-400">
            {data.totalActivitiesLogged} acciones
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Dailies, hábitos, tareas y finanzas
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Pilares de Vida Activos</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {data.activeLifePillars} categorías
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Equilibrio holístico de vida
          </div>
        </div>
      </div>

      {/* Main Heatmap */}
      <HabitHeatmap
        days={data.heatmap}
        currentStreak={data.currentStreak}
        longestStreak={data.longestStreak}
        totalActivities={data.totalActivitiesLogged}
      />

      {/* Life Balance Radar Breakdown */}
      <LifeBalanceRadar tagDistributions={data.tagDistributions} />
    </div>
  );
}
