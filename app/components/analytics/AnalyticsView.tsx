"use client";

import { AnalyticsDashboardData } from "@/lib/types";
import { Activity, Flame, Sparkles } from "lucide-react";
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
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Racha Actual</span>
            <Flame className="h-4 w-4 text-[#D99B43]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#D99B43]">
            {data.currentStreak} días consecutivos
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B] font-mono">
            Récord personal: {data.longestStreak} días
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Actividades Registradas (90d)</span>
            <Activity className="h-4 w-4 text-[#DDD6C9]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#F5F2EB]">
            {data.totalActivitiesLogged} acciones
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B]">
            Dailies, hábitos, tareas y finanzas
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Pilares de Vida Activos</span>
            <Sparkles className="h-4 w-4 text-[#7EA35A]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#7EA35A]">
            {data.activeLifePillars} categorías
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B]">
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
