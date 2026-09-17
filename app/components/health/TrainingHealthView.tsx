"use client";

import { startWorkoutSessionAction } from "@/app/actions/workouts";
import { soundFx } from "@/lib/soundFx";
import { TrainingHealthData, WorkoutSession } from "@/lib/types";
import {
  Activity,
  Calendar,
  Dumbbell,
  Flame,
  Layers,
  Play,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ActiveWorkoutLogger } from "./workout/ActiveWorkoutLogger";
import { ExerciseCatalogView } from "./workout/ExerciseCatalogView";
import { RoutineManager } from "./workout/RoutineManager";
import { WorkoutHistoryView } from "./workout/WorkoutHistoryView";
import { MuscleRecoveryWidget } from "./MuscleRecoveryWidget";

interface TrainingHealthViewProps {
  data: TrainingHealthData;
  onRefresh?: () => void;
}

type TrainingSubTab = "track" | "routines" | "history" | "catalog" | "recovery";

export function TrainingHealthView({ data, onRefresh }: TrainingHealthViewProps) {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(
    data.activeSession || null
  );
  const [trainingSubTab, setTrainingSubTab] = useState<TrainingSubTab>(
    data.activeSession ? "track" : "track"
  );
  const [isStarting, startTransition] = useTransition();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };

  const handleStartFreeWorkout = () => {
    soundFx.click();
    startTransition(async () => {
      const res = await startWorkoutSessionAction({
        title: "Entrenamiento libre",
      });

      if (res.success && res.session) {
        setActiveSession(res.session);
        setTrainingSubTab("track");
      }
    });
  };

  const allWorkouts = data.recentWorkouts || [];
  const routines = data.routines || [];
  const catalog = data.exercises || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* 1. Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2723] pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#181715] rounded-xl border border-[#2A2723] overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              soundFx.click();
              setTrainingSubTab("track");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              trainingSubTab === "track"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Entrenar</span>
            {activeSession && (
              <span className="h-2 w-2 rounded-full bg-[#7EA35A] animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.click();
              setTrainingSubTab("routines");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              trainingSubTab === "routines"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Mis Rutinas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.click();
              setTrainingSubTab("history");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              trainingSubTab === "history"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Historial</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.click();
              setTrainingSubTab("catalog");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              trainingSubTab === "catalog"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Ejercicios & PRs</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.click();
              setTrainingSubTab("recovery");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              trainingSubTab === "recovery"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Recuperación Muscular</span>
          </button>
        </div>

        {/* Streak Ribbon */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#8E867B] px-2 py-1 rounded-lg bg-[#181715] border border-[#2A2723] shrink-0">
          <Flame className="h-3.5 w-3.5 text-[#D99B43]" />
          <span>
            Racha: <strong className="text-[#F5F2EB]">{data.workoutStreak} días</strong>
          </span>
          <span className="text-[#2A2723]">|</span>
          <span>{data.weeklyWorkoutsCount} esta semana</span>
        </div>
      </div>

      {/* 2. TAB CONTENT */}

      {/* TAB 1: ENTRENAR (Live Session or Quick Start) */}
      {trainingSubTab === "track" && (
        <>
          {activeSession ? (
            <ActiveWorkoutLogger
              initialSession={activeSession}
              catalog={catalog}
              onWorkoutFinished={() => {
                setActiveSession(null);
                handleRefresh();
              }}
              onWorkoutDiscarded={() => {
                setActiveSession(null);
                handleRefresh();
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Quick Start Hero Card */}
              <div className="rounded-2xl border border-[#2A2723] bg-[#181715] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D99B43] uppercase tracking-wider">
                    <Dumbbell className="h-4 w-4" />
                    <span>Hoy toca entrenar</span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F2EB]">
                    Inicia tu sesión de entrenamiento
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8E867B] max-w-md">
                    Registra tus series, peso, repeticiones y descansos con aviso sonoro en tiempo real.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartFreeWorkout}
                  disabled={isStarting}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>{isStarting ? "Iniciando..." : "Entrenamiento libre"}</span>
                </button>
              </div>

              {/* Quick Launch From Routine */}
              {routines.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#F5F2EB] uppercase font-mono tracking-wider">
                      O inicia desde tus rutinas guardadas
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTrainingSubTab("routines")}
                      className="text-xs text-[#D99B43] hover:underline cursor-pointer"
                    >
                      Ver todas ({routines.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {routines.slice(0, 3).map((routine) => (
                      <div
                        key={routine.id}
                        className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 flex flex-col justify-between space-y-3 hover:border-[#D99B43]/30 transition-all shadow-xs"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#F5F2EB]">
                            {routine.title}
                          </div>
                          <div className="text-[11px] text-[#8E867B] font-mono mt-0.5">
                            {routine.exercises.length} ejercicios
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            soundFx.click();
                            startTransition(async () => {
                              const res = await startWorkoutSessionAction({
                                routineId: routine.id,
                                title: routine.title,
                              });
                              if (res.success && res.session) {
                                setActiveSession(res.session);
                              }
                            });
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] hover:bg-[#D99B43] hover:text-[#121110] text-xs font-bold transition-all cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Iniciar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-3.5">
                  <div className="text-[11px] text-[#8E867B] font-mono">Sesiones Totales</div>
                  <div className="mt-1 text-xl font-bold font-mono text-[#F5F2EB]">
                    {data.stats?.totalWorkouts || allWorkouts.length}
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-3.5">
                  <div className="text-[11px] text-[#8E867B] font-mono">Volumen Total</div>
                  <div className="mt-1 text-xl font-bold font-mono text-[#7EA35A]">
                    {Math.round(data.stats?.totalVolumeKg || 0).toLocaleString("es-MX")} kg
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-3.5">
                  <div className="text-[11px] text-[#8E867B] font-mono">Último Entreno</div>
                  <div className="mt-1 text-sm font-bold text-[#F5F2EB] truncate">
                    {allWorkouts[0]?.title || "Ninguno"}
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-3.5">
                  <div className="text-[11px] text-[#8E867B] font-mono">Ejercicios en Catálogo</div>
                  <div className="mt-1 text-xl font-bold font-mono text-[#4EAB9E]">
                    {catalog.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: MIS RUTINAS */}
      {trainingSubTab === "routines" && (
        <RoutineManager
          routines={routines}
          catalog={catalog}
          onStartSession={(session) => {
            setActiveSession(session);
            setTrainingSubTab("track");
          }}
          onRefresh={handleRefresh}
        />
      )}

      {/* TAB 3: HISTORIAL */}
      {trainingSubTab === "history" && (
        <WorkoutHistoryView
          workouts={allWorkouts}
          onRefresh={handleRefresh}
        />
      )}

      {/* TAB 4: EJERCICIOS & PRS */}
      {trainingSubTab === "catalog" && (
        <ExerciseCatalogView
          catalog={catalog}
          onRefresh={handleRefresh}
        />
      )}

      {/* TAB 5: RECUPERACIÓN MUSCULAR */}
      {trainingSubTab === "recovery" && (
        <MuscleRecoveryWidget
          recentWorkouts={allWorkouts.length > 0 ? allWorkouts : data.recentWorkouts}
        />
      )}
    </div>
  );
}
