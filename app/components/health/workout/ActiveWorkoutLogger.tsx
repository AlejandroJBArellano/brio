"use client";

import {
  discardActiveWorkoutSessionAction,
  finishWorkoutSessionAction,
  updateActiveWorkoutSessionAction,
} from "@/app/actions/workouts";
import { soundFx } from "@/lib/soundFx";
import {
  ExerciseCatalogItem,
  MuscleGroupId,
  PRRecord,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetType,
} from "@/lib/types";
import { calculateWorkoutVolume } from "@/lib/workouts";
import { identifyMusclesForExercise, MUSCLE_METADATA } from "@/lib/muscleRecovery";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Dumbbell,
  Flame,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { RestTimerBar } from "./RestTimerBar";
import { WorkoutSummaryModal } from "./WorkoutSummaryModal";

interface ActiveWorkoutLoggerProps {
  initialSession: WorkoutSession;
  catalog?: ExerciseCatalogItem[];
  onWorkoutFinished: () => void;
  onWorkoutDiscarded: () => void;
}

function getInitialElapsedSeconds(session: WorkoutSession): number {
  if (session.durationSeconds) return session.durationSeconds;
  if (!session.startTime) return 0;
  const startMs = new Date(session.startTime).getTime();
  if (isNaN(startMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
}

export function ActiveWorkoutLogger({
  initialSession,
  catalog = [],
  onWorkoutFinished,
  onWorkoutDiscarded,
}: ActiveWorkoutLoggerProps) {
  const [session, setSession] = useState<WorkoutSession>(initialSession);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    getInitialElapsedSeconds(initialSession)
  );

  const [isFinishing, startFinishTransition] = useTransition();
  const [isDiscarding, startDiscardTransition] = useTransition();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    session: WorkoutSession;
    prs: PRRecord[];
  } | null>(null);

  // Exercise Picker Modal State
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all");

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimerKey, setRestTimerKey] = useState(0);

  // Sync ref for debounced server updates
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Elapsed Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Debounced server auto-sync
  const queueAutoSync = useCallback((updatedExercises: WorkoutExercise[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await updateActiveWorkoutSessionAction({
        sessionId: session.id,
        exercises: updatedExercises,
        durationSeconds: elapsedSeconds,
      });
    }, 800);
  }, [session.id, elapsedSeconds]);

  const { totalVolumeKg, totalSetsCount } = calculateWorkoutVolume(session.exercises);

  // Update Set Data
  const updateSet = (
    exIdx: number,
    setIdx: number,
    fields: Partial<WorkoutSet>
  ) => {
    const nextExercises = session.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const nextSets = ex.sets.map((s, j) => {
        if (j !== setIdx) return s;
        return { ...s, ...fields };
      });
      return { ...ex, sets: nextSets };
    });

    setSession((prev) => ({ ...prev, exercises: nextExercises }));
    queueAutoSync(nextExercises);
  };

  // Toggle Set Completed
  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    soundFx.click();
    const currentSet = session.exercises[exIdx].sets[setIdx];
    const willBeCompleted = !currentSet.completed;

    updateSet(exIdx, setIdx, { completed: willBeCompleted });

    if (willBeCompleted) {
      // Trigger rest timer
      const targetRest = session.exercises[exIdx].targetRestSeconds || 90;
      setRestTimerSeconds(targetRest);
      setRestTimerKey((prev) => prev + 1);
      setShowRestTimer(true);
    }
  };

  // Add Set to Exercise
  const addSet = (exIdx: number) => {
    soundFx.click();
    const ex = session.exercises[exIdx];
    const lastSet = ex.sets[ex.sets.length - 1];

    const newSet: WorkoutSet = {
      index: ex.sets.length,
      type: "normal",
      weightKg: lastSet?.weightKg || null,
      reps: lastSet?.reps || null,
      rpe: lastSet?.rpe || null,
      completed: false,
      prevWeightKg: lastSet?.prevWeightKg || null,
      prevReps: lastSet?.prevReps || null,
    };

    const nextExercises = session.exercises.map((e, i) =>
      i === exIdx ? { ...e, sets: [...e.sets, newSet] } : e
    );

    setSession((prev) => ({ ...prev, exercises: nextExercises }));
    queueAutoSync(nextExercises);
  };

  // Remove Set from Exercise
  const removeSet = (exIdx: number, setIdx: number) => {
    soundFx.click();
    const nextExercises = session.exercises.map((e, i) => {
      if (i !== exIdx) return e;
      const filtered = e.sets.filter((_, j) => j !== setIdx);
      const reindexed = filtered.map((s, idx) => ({ ...s, index: idx }));
      return { ...e, sets: reindexed };
    });

    setSession((prev) => ({ ...prev, exercises: nextExercises }));
    queueAutoSync(nextExercises);
  };

  // Move Exercise Up / Down
  const moveExercise = (index: number, direction: "up" | "down") => {
    soundFx.click();
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= session.exercises.length) return;

    const list = [...session.exercises];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reindexed = list.map((e, idx) => ({ ...e, index: idx }));
    setSession((prev) => ({ ...prev, exercises: reindexed }));
    queueAutoSync(reindexed);
  };

  // Remove Exercise
  const removeExercise = (index: number) => {
    soundFx.click();
    const filtered = session.exercises.filter((_, i) => i !== index);
    const reindexed = filtered.map((e, idx) => ({ ...e, index: idx }));
    setSession((prev) => ({ ...prev, exercises: reindexed }));
    queueAutoSync(reindexed);
  };

  // Add Exercise from Catalog
  const handleSelectExerciseFromCatalog = (item: ExerciseCatalogItem | { title: string; muscleGroup: MuscleGroupId }) => {
    soundFx.click();
    const exId = "id" in item ? item.id : `ex-${session.exercises.length}`;
    const newEx: WorkoutExercise = {
      index: session.exercises.length,
      exerciseId: exId,
      title: item.title,
      muscleGroup: item.muscleGroup,
      targetRestSeconds: 90,
      sets: [
        {
          index: 0,
          type: "normal",
          weightKg: "maxWeightKg" in item ? item.maxWeightKg || null : null,
          reps: 10,
          completed: false,
        },
        {
          index: 1,
          type: "normal",
          weightKg: "maxWeightKg" in item ? item.maxWeightKg || null : null,
          reps: 10,
          completed: false,
        },
        {
          index: 2,
          type: "normal",
          weightKg: "maxWeightKg" in item ? item.maxWeightKg || null : null,
          reps: 10,
          completed: false,
        },
      ],
    };

    const nextExercises = [...session.exercises, newEx];
    setSession((prev) => ({ ...prev, exercises: nextExercises }));
    queueAutoSync(nextExercises);
    setShowAddExerciseModal(false);
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    soundFx.click();
    startFinishTransition(async () => {
      const res = await finishWorkoutSessionAction({
        sessionId: session.id,
        durationSeconds: elapsedSeconds,
        exercises: session.exercises,
      });

      if (res.success && res.session) {
        setSummaryData({
          session: res.session,
          prs: res.prsAchieved || [],
        });
      }
    });
  };

  // Discard Workout
  const handleDiscardWorkout = () => {
    soundFx.click();
    startDiscardTransition(async () => {
      await discardActiveWorkoutSessionAction({ sessionId: session.id });
      onWorkoutDiscarded();
    });
  };

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Filter Catalog
  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === "all" || item.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const muscleKeys = Object.keys(MUSCLE_METADATA) as MuscleGroupId[];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Ribbon (Live Metrics & Action Buttons) */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-[#2A2723] bg-[#181715]/95 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#221D16] border border-[#D99B43]/40 text-[#D99B43]">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#7EA35A] animate-ping" />
              <span className="text-[11px] font-mono font-bold text-[#7EA35A] uppercase tracking-wider">
                Sesión en vivo
              </span>
            </div>
            <h2 className="text-lg font-bold font-serif text-[#F5F2EB]">
              {session.title}
            </h2>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
          <div className="flex items-center gap-1.5 text-[#DDD6C9]">
            <Clock className="h-4 w-4 text-[#4EAB9E]" />
            <span className="font-bold text-sm text-[#F5F2EB]">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[#DDD6C9]">
            <Dumbbell className="h-4 w-4 text-[#7EA35A]" />
            <span className="font-bold text-sm text-[#7EA35A]">
              {totalVolumeKg.toLocaleString("es-MX")} kg
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[#DDD6C9]">
            <Layers className="h-4 w-4 text-[#D99B43]" />
            <span className="font-bold text-sm text-[#F5F2EB]">
              {totalSetsCount} series
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDiscardConfirm(true)}
            disabled={isDiscarding || isFinishing}
            className="px-3.5 py-2 rounded-xl bg-[#22201D] border border-[#2A2723] hover:border-[#E05D52]/50 text-xs font-semibold text-[#8E867B] hover:text-[#E05D52] transition-all cursor-pointer"
          >
            Descartar
          </button>

          <button
            type="button"
            onClick={handleFinishWorkout}
            disabled={isFinishing || isDiscarding}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{isFinishing ? "Terminando..." : "Terminar entreno"}</span>
          </button>
        </div>
      </div>

      {/* 2. Floating Rest Timer */}
      {showRestTimer && (
        <RestTimerBar
          initialSeconds={restTimerSeconds}
          autoStartKey={restTimerKey}
          onClose={() => setShowRestTimer(false)}
        />
      )}

      {/* 3. Discard Confirmation Banner */}
      {showDiscardConfirm && (
        <div className="p-4 rounded-xl border border-[#E05D52]/40 bg-[#2A1715] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="text-[#E05D52] font-semibold">
            ¿Deseas descartar este entrenamiento? Los datos no se guardarán en tu historial.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-[#181715] text-[#DDD6C9] border border-[#2A2723] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDiscardWorkout}
              className="px-3 py-1.5 rounded-lg bg-[#E05D52] text-white font-bold cursor-pointer"
            >
              Sí, descartar
            </button>
          </div>
        </div>
      )}

      {/* 4. Exercise Cards List */}
      <div className="space-y-5">
        {session.exercises.map((ex, exIdx) => {
          const muscleMeta = MUSCLE_METADATA[ex.muscleGroup];

          return (
            <div
              key={exIdx}
              className="rounded-2xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm space-y-4"
            >
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2723]">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] text-xs font-bold font-mono">
                    {exIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#F5F2EB]">
                      {ex.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#8E867B] font-mono">
                      <span>{muscleMeta?.name || "Músculo"}</span>
                      <span>•</span>
                      <span>Descanso: {ex.targetRestSeconds || 90}s</span>
                    </div>
                  </div>
                </div>

                {/* Exercise Controls */}
                <div className="flex items-center gap-1.5 text-xs text-[#8E867B]">
                  <button
                    type="button"
                    onClick={() => moveExercise(exIdx, "up")}
                    disabled={exIdx === 0}
                    className="p-1.5 rounded-lg bg-[#121110] border border-[#2A2723] hover:text-[#F5F2EB] disabled:opacity-30 cursor-pointer"
                    title="Subir ejercicio"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveExercise(exIdx, "down")}
                    disabled={exIdx === session.exercises.length - 1}
                    className="p-1.5 rounded-lg bg-[#121110] border border-[#2A2723] hover:text-[#F5F2EB] disabled:opacity-30 cursor-pointer"
                    title="Bajar ejercicio"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeExercise(exIdx)}
                    className="p-1.5 rounded-lg bg-[#121110] border border-[#2A2723] hover:border-[#E05D52]/40 hover:text-[#E05D52] transition-all cursor-pointer ml-1"
                    title="Eliminar ejercicio"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Sets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[#8E867B] border-b border-[#2A2723]/60 pb-2">
                      <th className="py-2 px-2 w-12 text-center">SERIE</th>
                      <th className="py-2 px-2 w-20">TIPO</th>
                      <th className="py-2 px-2 text-[#8E867B]/70 hidden sm:table-cell">ANTERIOR</th>
                      <th className="py-2 px-2 w-24">KG</th>
                      <th className="py-2 px-2 w-20">REPS</th>
                      <th className="py-2 px-2 w-16 text-center">RPE</th>
                      <th className="py-2 px-2 w-14 text-center">LISTO</th>
                      <th className="py-2 px-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2723]/40">
                    {ex.sets.map((s, setIdx) => {
                      return (
                        <tr
                          key={setIdx}
                          className={`transition-colors ${
                            s.completed ? "bg-[#1C2219]/40" : "hover:bg-[#121110]/50"
                          }`}
                        >
                          {/* Set Index */}
                          <td className="py-2.5 px-2 text-center font-bold text-[#DDD6C9]">
                            {setIdx + 1}
                          </td>

                          {/* Set Type */}
                          <td className="py-2.5 px-2">
                            <select
                              value={s.type}
                              onChange={(e) =>
                                updateSet(exIdx, setIdx, {
                                  type: e.target.value as WorkoutSetType,
                                })
                              }
                              className="w-full bg-[#121110] border border-[#2A2723] rounded-md px-1.5 py-1 text-xs text-[#DDD6C9] focus:border-[#D99B43] outline-hidden cursor-pointer"
                            >
                              <option value="normal">Normal</option>
                              <option value="warmup">Calentamiento [W]</option>
                              <option value="drop">Drop set [D]</option>
                              <option value="failure">Fallo [F]</option>
                            </select>
                          </td>

                          {/* Previous Ghost Performance */}
                          <td className="py-2.5 px-2 text-[#8E867B] text-[11px] hidden sm:table-cell">
                            {s.prevWeightKg && s.prevReps
                              ? `${s.prevWeightKg} kg × ${s.prevReps}`
                              : "-"}
                          </td>

                          {/* Weight (Kg) */}
                          <td className="py-2.5 px-2">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="0"
                                value={s.weightKg !== null && s.weightKg !== undefined ? s.weightKg : ""}
                                onChange={(e) =>
                                  updateSet(exIdx, setIdx, {
                                    weightKg: e.target.value === "" ? null : parseFloat(e.target.value),
                                  })
                                }
                                className={`w-full bg-[#121110] border rounded-lg px-2.5 py-1 text-xs font-bold text-[#F5F2EB] focus:border-[#D99B43] outline-hidden ${
                                  s.completed ? "border-[#7EA35A]/50 bg-[#1C2219]/20" : "border-[#2A2723]"
                                }`}
                              />
                            </div>
                          </td>

                          {/* Reps */}
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0"
                              value={s.reps !== null && s.reps !== undefined ? s.reps : ""}
                              onChange={(e) =>
                                updateSet(exIdx, setIdx, {
                                  reps: e.target.value === "" ? null : parseInt(e.target.value, 10),
                                })
                              }
                              className={`w-full bg-[#121110] border rounded-lg px-2.5 py-1 text-xs font-bold text-[#F5F2EB] focus:border-[#D99B43] outline-hidden ${
                                s.completed ? "border-[#7EA35A]/50 bg-[#1C2219]/20" : "border-[#2A2723]"
                              }`}
                            />
                          </td>

                          {/* RPE (1-10) */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="1"
                              max="10"
                              placeholder="-"
                              value={s.rpe !== null && s.rpe !== undefined ? s.rpe : ""}
                              onChange={(e) =>
                                updateSet(exIdx, setIdx, {
                                  rpe: e.target.value === "" ? null : parseFloat(e.target.value),
                                })
                              }
                              className="w-12 text-center bg-[#121110] border border-[#2A2723] rounded-lg px-1 py-1 text-xs text-[#DDD6C9] focus:border-[#D99B43] outline-hidden"
                            />
                          </td>

                          {/* Complete Checkbox */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSetComplete(exIdx, setIdx)}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all mx-auto cursor-pointer ${
                                s.completed
                                  ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] shadow-sm font-bold scale-105"
                                  : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:border-[#D99B43]/50"
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </td>

                          {/* Delete Set */}
                          <td className="py-2.5 px-1 text-right">
                            <button
                              type="button"
                              onClick={() => removeSet(exIdx, setIdx)}
                              className="p-1 rounded-md text-[#8E867B] hover:text-[#E05D52] transition-all cursor-pointer"
                              title="Eliminar serie"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Set Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#121110] border border-[#2A2723] hover:border-[#D99B43]/50 text-xs font-semibold text-[#DDD6C9] hover:text-[#F5F2EB] transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-[#D99B43]" />
                  <span>Añadir serie</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Add Exercise Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setShowAddExerciseModal(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#221D16] border border-[#D99B43]/40 hover:bg-[#2A241C] text-sm font-bold text-[#D99B43] transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Añadir ejercicio</span>
        </button>
      </div>

      {/* 6. Exercise Picker Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-2xl text-[#F5F2EB] flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
              <h3 className="font-serif text-lg font-bold text-[#F5F2EB]">
                Seleccionar Ejercicio
              </h3>
              <button
                type="button"
                onClick={() => setShowAddExerciseModal(false)}
                className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search and Muscle Filters */}
            <div className="pt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
                <input
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121110] border border-[#2A2723] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] outline-hidden"
                />
              </div>

              {/* Muscle Chips Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMuscle("all")}
                  className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedMuscle === "all"
                      ? "bg-[#D99B43] text-[#121110] font-bold"
                      : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
                  }`}
                >
                  Todos
                </button>
                {muscleKeys.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMuscle(m)}
                    className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                      selectedMuscle === m
                        ? "bg-[#D99B43] text-[#121110] font-bold"
                        : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
                    }`}
                  >
                    {MUSCLE_METADATA[m]?.name.split("/")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-[#2A2723]/40">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectExerciseFromCatalog(item)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#22201D] transition-all cursor-pointer text-xs"
                >
                  <div>
                    <div className="font-bold text-[#F5F2EB]">{item.title}</div>
                    <div className="text-[11px] text-[#8E867B] font-mono mt-0.5">
                      {MUSCLE_METADATA[item.muscleGroup]?.name} • {item.equipmentType}
                    </div>
                  </div>
                  {item.maxWeightKg && (
                    <div className="text-right font-mono text-[11px] text-[#7EA35A]">
                      PR: {item.maxWeightKg} kg
                    </div>
                  )}
                </div>
              ))}

              {/* Option to create on the fly if not in catalog */}
              {searchQuery.trim() && filteredCatalog.length === 0 && (
                <div
                  onClick={() => {
                    const rule = identifyMusclesForExercise(searchQuery);
                    handleSelectExerciseFromCatalog({
                      title: searchQuery.trim(),
                      muscleGroup: (rule.primary[0] || "chest") as MuscleGroupId,
                    });
                  }}
                  className="p-4 rounded-xl border border-dashed border-[#D99B43]/40 bg-[#221D16]/50 text-center text-xs text-[#D99B43] hover:bg-[#221D16] transition-all cursor-pointer font-semibold"
                >
                  Añadir &quot;{searchQuery.trim()}&quot; como nuevo ejercicio
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Workout Summary Celebration Modal */}
      {summaryData && (
        <WorkoutSummaryModal
          session={summaryData.session}
          prsAchieved={summaryData.prs}
          onClose={() => {
            setSummaryData(null);
            onWorkoutFinished();
          }}
        />
      )}
    </div>
  );
}
