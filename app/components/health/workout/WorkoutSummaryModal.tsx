"use client";

import { PRRecord, WorkoutSession } from "@/lib/types";
import { Check, Clock, Dumbbell, Flame, Layers, Sparkles, Trophy, X } from "lucide-react";

interface WorkoutSummaryModalProps {
  session: WorkoutSession;
  prsAchieved?: PRRecord[];
  onClose: () => void;
}

export function WorkoutSummaryModal({
  session,
  prsAchieved = [],
  onClose,
}: WorkoutSummaryModalProps) {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl text-[#F5F2EB]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#221D16] border border-[#D99B43]/40 text-[#D99B43] shadow-md">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-semibold text-[#D99B43] uppercase tracking-wider">
              Entrenamiento completado
            </div>
            <h2 className="text-xl font-bold font-serif text-[#F5F2EB]">
              {session.title}
            </h2>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-3.5 text-center">
            <div className="flex items-center justify-center text-[#8E867B] mb-1">
              <Clock className="h-4 w-4 text-[#4EAB9E]" />
            </div>
            <div className="text-lg font-bold font-mono text-[#F5F2EB]">
              {formatDuration(session.durationSeconds)}
            </div>
            <div className="text-[10px] text-[#8E867B] uppercase font-mono mt-0.5">
              Tiempo
            </div>
          </div>

          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-3.5 text-center">
            <div className="flex items-center justify-center text-[#8E867B] mb-1">
              <Dumbbell className="h-4 w-4 text-[#7EA35A]" />
            </div>
            <div className="text-lg font-bold font-mono text-[#7EA35A]">
              {session.totalVolumeKg.toLocaleString("es-MX")} kg
            </div>
            <div className="text-[10px] text-[#8E867B] uppercase font-mono mt-0.5">
              Volumen
            </div>
          </div>

          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-3.5 text-center">
            <div className="flex items-center justify-center text-[#8E867B] mb-1">
              <Layers className="h-4 w-4 text-[#D99B43]" />
            </div>
            <div className="text-lg font-bold font-mono text-[#F5F2EB]">
              {session.setsCount}
            </div>
            <div className="text-[10px] text-[#8E867B] uppercase font-mono mt-0.5">
              Series
            </div>
          </div>

          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-3.5 text-center">
            <div className="flex items-center justify-center text-[#8E867B] mb-1">
              <Flame className="h-4 w-4 text-[#E05D52]" />
            </div>
            <div className="text-lg font-bold font-mono text-[#F5F2EB]">
              {session.exercisesCount}
            </div>
            <div className="text-[10px] text-[#8E867B] uppercase font-mono mt-0.5">
              Ejercicios
            </div>
          </div>
        </div>

        {/* PRs Achieved Section */}
        {prsAchieved.length > 0 ? (
          <div className="mt-6 rounded-xl border border-[#D99B43]/30 bg-[#221D16]/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D99B43] uppercase tracking-wider font-mono">
              <Trophy className="h-4 w-4" />
              <span>{prsAchieved.length} Récords Personales Batidos</span>
            </div>
            <div className="space-y-2">
              {prsAchieved.map((pr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-[#181715] border border-[#2A2723] p-2.5 text-xs"
                >
                  <div className="font-semibold text-[#F5F2EB]">
                    {pr.exerciseTitle}
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[11px] text-[#8E867B]">
                      {pr.type === "weight" ? "Peso" : pr.type === "1rm" ? "1RM Est." : "Vol. Serie"}
                    </span>
                    <span className="font-bold text-[#7EA35A]">
                      {pr.value} {pr.unit}
                    </span>
                    {pr.prevValue && (
                      <span className="text-[10px] text-[#8E867B] line-through">
                        ({pr.prevValue} {pr.unit})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[#2A2723] bg-[#121110] p-4 text-center text-xs text-[#8E867B]">
            Buen trabajo. Se ha registrado tu volumen y actualizado tu mapa de fatiga muscular.
          </div>
        )}

        {/* Habitica XP Reward Confirmation */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#7EA35A]/30 bg-[#1C2219] p-3 text-xs text-[#7EA35A]">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Experiencia y racha de salud actualizadas.</span>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Listo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
