"use client";

import { deleteRoutineAction, startWorkoutSessionAction } from "@/app/actions/workouts";
import { soundFx } from "@/lib/soundFx";
import {
  ExerciseCatalogItem,
  WorkoutRoutine,
  WorkoutSession,
} from "@/lib/types";
import {
  Clock,
  Dumbbell,
  Edit2,
  Layers,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { RoutineModal } from "./RoutineModal";

interface RoutineManagerProps {
  routines: WorkoutRoutine[];
  catalog: ExerciseCatalogItem[];
  onStartSession: (session: WorkoutSession) => void;
  onRefresh: () => void;
}

export function RoutineManager({
  routines,
  catalog,
  onStartSession,
  onRefresh,
}: RoutineManagerProps) {
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isStartingId, setIsStartingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleStartRoutine = (routine: WorkoutRoutine) => {
    soundFx.click();
    setIsStartingId(routine.id);

    startTransition(async () => {
      const res = await startWorkoutSessionAction({
        routineId: routine.id,
        title: routine.title,
      });

      if (res.success && res.session) {
        onStartSession(res.session);
      }
      setIsStartingId(null);
    });
  };

  const handleDeleteRoutine = (routineId: string) => {
    soundFx.click();
    startTransition(async () => {
      await deleteRoutineAction(routineId);
      onRefresh();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[#2A2723] bg-[#181715]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43]">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-[#F5F2EB]">
              Mis Rutinas Personalizadas
            </h2>
            <div className="text-xs text-[#8E867B] font-mono mt-0.5">
              {routines.length} rutinas guardadas
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setEditingRoutine(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva rutina</span>
        </button>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2A2723] p-10 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#221D16] text-[#D99B43] mx-auto border border-[#D99B43]/20">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#F5F2EB] text-sm">
              No tienes rutinas creadas
            </h3>
            <p className="text-xs text-[#8E867B] max-w-sm mx-auto">
              Crea tus propias rutinas divididas por grupos musculares para iniciar tus entrenamientos en 1 clic.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.click();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#221D16] border border-[#D99B43]/40 text-[#D99B43] hover:bg-[#2A241C] text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Crear mi primera rutina</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="rounded-2xl border border-[#2A2723] bg-[#181715] p-5 flex flex-col justify-between space-y-4 hover:border-[#D99B43]/30 transition-all shadow-sm group"
            >
              <div className="space-y-3">
                {/* Routine Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-[#F5F2EB] group-hover:text-[#D99B43] transition-colors">
                      {routine.title}
                    </h3>
                    {routine.description && (
                      <p className="text-xs text-[#8E867B] mt-0.5 line-clamp-1">
                        {routine.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.click();
                        setEditingRoutine(routine);
                        setShowModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-[#121110] border border-[#2A2723] hover:text-[#F5F2EB] text-[#8E867B] transition-all cursor-pointer"
                      title="Editar rutina"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoutine(routine.id)}
                      className="p-1.5 rounded-lg bg-[#121110] border border-[#2A2723] hover:border-[#E05D52]/40 hover:text-[#E05D52] text-[#8E867B] transition-all cursor-pointer"
                      title="Eliminar rutina"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Exercises Preview */}
                <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8E867B] border-b border-[#2A2723]/60 pb-1.5">
                    <span>{routine.exercises.length} ejercicios</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#4EAB9E]" />
                      ~{routine.exercises.length * 8} min
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {routine.exercises.slice(0, 4).map((ex, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[#DDD6C9] font-mono text-[11px]"
                      >
                        <span className="truncate font-sans font-medium text-xs text-[#F5F2EB]">
                          {ex.title}
                        </span>
                        <span className="text-[#8E867B] shrink-0">
                          {ex.targetSets} × {ex.targetReps || "10"}
                        </span>
                      </div>
                    ))}
                    {routine.exercises.length > 4 && (
                      <div className="text-[10px] text-[#8E867B] font-mono pt-1">
                        + {routine.exercises.length - 4} ejercicios más...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Start Workout Button */}
              <button
                type="button"
                onClick={() => handleStartRoutine(routine)}
                disabled={isStartingId === routine.id}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#221D16] border border-[#D99B43]/40 hover:bg-[#D99B43] hover:text-[#121110] text-[#D99B43] font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  {isStartingId === routine.id ? "Iniciando..." : "Iniciar entreno"}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Routine Modal */}
      {showModal && (
        <RoutineModal
          routine={editingRoutine}
          catalog={catalog}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
