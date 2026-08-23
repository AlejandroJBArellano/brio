"use client";

import { HeatmapDay } from "@/lib/types";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { useState } from "react";

interface HabitHeatmapProps {
  days: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  totalActivities: number;
}

const LEVEL_CLASSES = [
  "bg-[#181715] border-[#2A2723]", // Level 0
  "bg-[#241E17] border-[#4A3B25] text-[#D99B43]", // Level 1
  "bg-[#3D301E] border-[#70562D] text-[#F5F2EB]", // Level 2
  "bg-[#8A5E23] border-[#B88133] text-[#121110] font-bold", // Level 3
  "bg-[#D99B43] border-[#F5F2EB]/40 text-[#121110] font-bold shadow-xs", // Level 4
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
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2723]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D99B43]" />
            <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
              Heatmap de Consistencia & Hábitos
            </h3>
          </div>
          <p className="text-xs text-[#8E867B] mt-0.5">
            Registro de actividad diaria en Brio (Dailies, Hábitos y Gastos)
          </p>
        </div>

        {/* Streak Stats */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#D99B43]/30 bg-[#221D16] px-3 py-1.5 text-xs text-[#D99B43] font-bold">
            <Flame className="h-4 w-4 text-[#D99B43]" />
            <span>Racha: {currentStreak} días</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-1.5 text-xs text-[#DDD6C9] font-medium">
            <Trophy className="h-4 w-4 text-[#D99B43]" />
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
                  className={`h-4 w-4 rounded-[3px] border transition-all hover:scale-125 hover:z-10 cursor-pointer ${
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
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2A2723] text-xs">
        <div className="text-[#8E867B] min-h-5 font-mono">
          {hoveredDay ? (
            <span className="text-[#F5F2EB]">
              📅 <strong>{hoveredDay.date}</strong>: {hoveredDay.count} actividades (
              {hoveredDay.habitsCount} hábitos, {hoveredDay.dailiesCount} dailies, {hoveredDay.expensesCount} finanzas)
            </span>
          ) : (
            <span>Pasa el cursor sobre un día para ver el detalle</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#8E867B] font-mono">
          <span>Menos</span>
          <span className="h-3 w-3 rounded-xs bg-[#181715] border border-[#2A2723]" />
          <span className="h-3 w-3 rounded-xs bg-[#241E17] border border-[#4A3B25]" />
          <span className="h-3 w-3 rounded-xs bg-[#3D301E] border border-[#70562D]" />
          <span className="h-3 w-3 rounded-xs bg-[#8A5E23] border border-[#B88133]" />
          <span className="h-3 w-3 rounded-xs bg-[#D99B43] border border-[#F5F2EB]/40" />
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
