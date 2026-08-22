"use client";

import { HeatmapDay } from "@/lib/types";
import { Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { useState } from "react";

interface HabitHeatmapProps {
  days: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  totalActivities: number;
}

const LEVEL_CLASSES = [
  "bg-neutral-900 border-white/[0.04]", // Level 0
  "bg-indigo-950/80 border-indigo-800/40 text-indigo-300", // Level 1
  "bg-indigo-800/80 border-indigo-600/50 text-white", // Level 2
  "bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-500/20", // Level 3
  "bg-emerald-500 border-emerald-300 text-neutral-950 font-bold shadow-md shadow-emerald-500/30", // Level 4
];

export function HabitHeatmap({
  days,
  currentStreak,
  longestStreak,
  totalActivities,
}: HabitHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  // Group days into weeks (7 days per column)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  for (let i = 0; i < days.length; i++) {
    currentWeek.push(days[i]);
    if (currentWeek.length === 7 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Heatmap de Consistencia & Hábitos
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Registro de actividad diaria en Brio (Dailies, Hábitos y Gastos)
          </p>
        </div>

        {/* Streak Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 font-bold">
            <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>Racha: {currentStreak} días</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 font-medium">
            <Trophy className="h-4 w-4 text-indigo-400" />
            <span>Récord: {longestStreak} días</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`h-4 w-4 rounded-[4px] border transition-all hover:scale-125 hover:z-10 ${
                    LEVEL_CLASSES[day.level]
                  }`}
                  aria-label={`${day.date}: ${day.count} actividades`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Tooltip & Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06] text-xs">
        <div className="text-neutral-400 min-h-[20px] font-mono">
          {hoveredDay ? (
            <span className="text-white">
              📅 <strong>{hoveredDay.date}</strong>: {hoveredDay.count} actividades (
              {hoveredDay.habitsCount} hábitos, {hoveredDay.dailiesCount} dailies, {hoveredDay.expensesCount} finanzas)
            </span>
          ) : (
            <span>Pasa el cursor sobre un día para ver el detalle</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span>Menos</span>
          <span className="h-3 w-3 rounded-sm bg-neutral-900 border border-white/[0.04]" />
          <span className="h-3 w-3 rounded-sm bg-indigo-950 border border-indigo-800/40" />
          <span className="h-3 w-3 rounded-sm bg-indigo-800 border border-indigo-600" />
          <span className="h-3 w-3 rounded-sm bg-indigo-600 border border-indigo-400" />
          <span className="h-3 w-3 rounded-sm bg-emerald-500 border border-emerald-300" />
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
