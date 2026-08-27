"use client";

import { AnalyticsDashboardData } from "@/lib/types";
import { HabitHeatmap } from "./HabitHeatmap";
import { LifeBalanceRadar } from "./LifeBalanceRadar";

interface AnalyticsViewProps {
  data: AnalyticsDashboardData;
}

export function AnalyticsView({ data }: AnalyticsViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

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
