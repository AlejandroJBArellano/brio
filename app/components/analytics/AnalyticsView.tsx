"use client";

import { AnalyticsDashboardData } from "@/lib/types";
import { HabitHeatmap } from "./HabitHeatmap";
import { LifeBalanceRadar } from "./LifeBalanceRadar";

interface AnalyticsViewProps {
  data: AnalyticsDashboardData;
}

export function AnalyticsView({ data }: AnalyticsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      {/* Columna Izquierda: Heatmap de Consistencia & Hábitos */}
      <div className="lg:col-span-7">
        <HabitHeatmap
          days={data.heatmap}
          currentStreak={data.currentStreak}
          longestStreak={data.longestStreak}
          totalActivities={data.totalActivitiesLogged}
        />
      </div>

      {/* Columna Derecha: Balance de Vida por Pilares */}
      <div className="lg:col-span-5">
        <LifeBalanceRadar tagDistributions={data.tagDistributions} />
      </div>
    </div>
  );
}
