"use client";

import { deleteWorkoutSessionAction } from "@/app/actions/workouts";
import { soundFx } from "@/lib/soundFx";
import { WorkoutSession } from "@/lib/types";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Layers,
  Trash2,
  Trophy,
} from "lucide-react";
import { useState, useTransition } from "react";

interface WorkoutHistoryViewProps {
  workouts: WorkoutSession[];
  onRefresh: () => void;
}

export function WorkoutHistoryView({
  workouts,
  onRefresh,
}: WorkoutHistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggleExpand = (id: string) => {
    soundFx.click();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.click();
    startTransition(async () => {
      await deleteWorkoutSessionAction({ sessionId: id });
      onRefresh();
    });
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-[#2A2723] bg-[#181715]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-[#F5F2EB]">
              Historial de Entrenamientos
            </h2>
            <div className="text-xs text-[#8E867B] font-mono mt-0.5">
              {workouts.length} sesiones completadas registradas
            </div>
          </div>
        </div>
      </div>

      {/* Workouts List */}
      {workouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2A2723] p-10 text-center space-y-2">
          <p className="text-xs text-[#8E867B]">
            No tienes entrenamientos completados en tu historial aún.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => {
            const isExpanded = expandedId === w.id;
            const hasPrs = w.prsAchieved && w.prsAchieved.length > 0;

            return (
              <div
                key={w.id}
                className="rounded-2xl border border-[#2A2723] bg-[#181715] overflow-hidden transition-all shadow-sm"
              >
                {/* Summary Row */}
                <div
                  onClick={() => toggleExpand(w.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#22201D]/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-base text-[#F5F2EB]">
                        {w.title}
                      </h3>
                      {hasPrs && (
                        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#221D16] border border-[#D99B43]/40 text-[#D99B43]">
                          <Trophy className="h-3 w-3" />
                          {w.prsAchieved?.length} PRs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8E867B] font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {w.date}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 font-mono text-xs">
                    <div className="flex items-center gap-1.5 text-[#DDD6C9]">
                      <Clock className="h-3.5 w-3.5 text-[#4EAB9E]" />
                      <span>{formatDuration(w.durationSeconds)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#7EA35A] font-bold">
                      <Dumbbell className="h-3.5 w-3.5" />
                      <span>{w.totalVolumeKg.toLocaleString("es-MX")} kg</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#DDD6C9]">
                      <Layers className="h-3.5 w-3.5 text-[#D99B43]" />
                      <span>{w.setsCount} series</span>
                    </div>

                    <div className="flex items-center gap-1 text-[#8E867B] ml-2">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(w.id, e)}
                        className="p-1.5 rounded-lg hover:bg-[#2A1715] hover:text-[#E05D52] transition-colors cursor-pointer"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="p-1.5 text-[#8E867B]">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Exercise Breakdown */}
                {isExpanded && (
                  <div className="border-t border-[#2A2723] bg-[#121110] p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                    <div className="text-xs font-mono text-[#8E867B] uppercase tracking-wider">
                      Desglose de ejercicios ({w.exercises.length})
                    </div>

                    <div className="space-y-3">
                      {w.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="rounded-xl border border-[#2A2723] bg-[#181715] p-3.5 space-y-2 text-xs font-mono"
                        >
                          <div className="font-bold font-sans text-sm text-[#F5F2EB]">
                            {ex.title}
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {ex.sets.map((s, sIdx) => (
                              <div
                                key={sIdx}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                                  s.isPr
                                    ? "bg-[#221D16] border-[#D99B43]/50 text-[#D99B43] font-bold"
                                    : "bg-[#121110] border-[#2A2723] text-[#DDD6C9]"
                                }`}
                              >
                                <span className="text-[#8E867B]">S{sIdx + 1}:</span>
                                <span>
                                  {s.weightKg ? `${s.weightKg}kg` : "0kg"} × {s.reps || 0}
                                </span>
                                {s.rpe && (
                                  <span className="text-[10px] text-[#8E867B]">
                                    @{s.rpe}
                                  </span>
                                )}
                                {s.isPr && <Trophy className="h-3 w-3 text-[#D99B43]" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
