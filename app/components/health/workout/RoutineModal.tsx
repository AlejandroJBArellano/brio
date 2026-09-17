"use client";

import { saveRoutineAction } from "@/app/actions/workouts";
import { soundFx } from "@/lib/soundFx";
import {
  ExerciseCatalogItem,
  MuscleGroupId,
  WorkoutRoutine,
  WorkoutRoutineExercise,
} from "@/lib/types";
import { identifyMusclesForExercise, MUSCLE_METADATA } from "@/lib/muscleRecovery";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Dumbbell,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface RoutineModalProps {
  routine?: WorkoutRoutine | null;
  catalog: ExerciseCatalogItem[];
  onClose: () => void;
  onSaved: () => void;
}

export function RoutineModal({
  routine,
  catalog,
  onClose,
  onSaved,
}: RoutineModalProps) {
  const [title, setTitle] = useState(routine?.title || "");
  const [description, setDescription] = useState(routine?.description || "");
  const [exercises, setExercises] = useState<WorkoutRoutineExercise[]>(
    routine?.exercises || []
  );

  const [isPending, startTransition] = useTransition();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");

  const handleAddExercise = (item: ExerciseCatalogItem | { title: string; muscleGroup: MuscleGroupId }) => {
    soundFx.click();
    const exId = "id" in item ? item.id : `ex-${exercises.length}`;
    const newEx: WorkoutRoutineExercise = {
      exerciseId: exId,
      title: item.title,
      muscleGroup: item.muscleGroup,
      targetSets: 3,
      targetReps: "8-12",
      targetRestSeconds: 90,
    };
    setExercises((prev) => [...prev, newEx]);
    setShowExercisePicker(false);
  };

  const updateExercise = (
    index: number,
    fields: Partial<WorkoutRoutineExercise>
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...fields } : ex))
    );
  };

  const removeExercise = (index: number) => {
    soundFx.click();
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    soundFx.click();
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= exercises.length) return;

    const list = [...exercises];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setExercises(list);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    soundFx.click();

    startTransition(async () => {
      const routineToSave: WorkoutRoutine = {
        id: routine?.id || `routine-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        exercises,
      };

      const res = await saveRoutineAction(routineToSave);
      if (res.success) {
        onSaved();
      }
    });
  };

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === "all" || item.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const muscleKeys = Object.keys(MUSCLE_METADATA) as MuscleGroupId[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl text-[#F5F2EB] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43]">
              <Dumbbell className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold font-serif text-[#F5F2EB]">
              {routine ? "Editar Rutina" : "Nueva Rutina"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-[#8E867B] uppercase font-mono mb-1.5">
              Nombre de la rutina
            </label>
            <input
              type="text"
              placeholder="Ej. Pecho y Tríceps, Pierna Hipertrofia..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121110] border border-[#2A2723] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D99B43] outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E867B] uppercase font-mono mb-1.5">
              Descripción o notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Foco en fuerza máxima e hipertrofia"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#121110] border border-[#2A2723] rounded-xl px-3.5 py-2 text-xs text-[#DDD6C9] focus:border-[#D99B43] outline-hidden"
            />
          </div>

          {/* Exercises List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8E867B] uppercase font-mono">
                Ejercicios ({exercises.length})
              </span>
            </div>

            {exercises.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2A2723] p-6 text-center text-xs text-[#8E867B]">
                No hay ejercicios en esta rutina. Haz clic en Añadir ejercicio para comenzar.
              </div>
            ) : (
              <div className="space-y-2.5">
                {exercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#2A2723] bg-[#121110] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#221D16] text-[#D99B43] font-bold text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-[#F5F2EB] font-sans text-sm">
                          {ex.title}
                        </div>
                        <div className="text-[11px] text-[#8E867B]">
                          {MUSCLE_METADATA[ex.muscleGroup]?.name || "Músculo"}
                        </div>
                      </div>
                    </div>

                    {/* Target Configuration */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#8E867B]">Series:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={ex.targetSets}
                          onChange={(e) =>
                            updateExercise(idx, {
                              targetSets: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-12 bg-[#181715] border border-[#2A2723] rounded-lg px-2 py-1 text-center font-bold text-[#F5F2EB] focus:border-[#D99B43] outline-hidden"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#8E867B]">Reps:</span>
                        <input
                          type="text"
                          value={ex.targetReps || ""}
                          placeholder="8-12"
                          onChange={(e) =>
                            updateExercise(idx, { targetReps: e.target.value })
                          }
                          className="w-16 bg-[#181715] border border-[#2A2723] rounded-lg px-2 py-1 text-center font-bold text-[#F5F2EB] focus:border-[#D99B43] outline-hidden"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-[#4EAB9E]" />
                        <input
                          type="number"
                          step="15"
                          min="0"
                          value={ex.targetRestSeconds || 90}
                          onChange={(e) =>
                            updateExercise(idx, {
                              targetRestSeconds: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-14 bg-[#181715] border border-[#2A2723] rounded-lg px-2 py-1 text-center font-bold text-[#4EAB9E] focus:border-[#D99B43] outline-hidden"
                        />
                        <span className="text-[10px] text-[#8E867B]">s</span>
                      </div>

                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => moveExercise(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 rounded bg-[#181715] border border-[#2A2723] hover:text-[#F5F2EB] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveExercise(idx, "down")}
                          disabled={idx === exercises.length - 1}
                          className="p-1 rounded bg-[#181715] border border-[#2A2723] hover:text-[#F5F2EB] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExercise(idx)}
                          className="p-1 rounded bg-[#181715] border border-[#2A2723] hover:text-[#E05D52] cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                soundFx.click();
                setShowExercisePicker(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#121110] border border-dashed border-[#D99B43]/40 hover:bg-[#221D16] text-xs font-bold text-[#D99B43] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Añadir ejercicio</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-[#2A2723] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#121110] border border-[#2A2723] text-xs font-semibold text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !title.trim()}
            className="px-5 py-2 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar rutina"}
          </button>
        </div>

        {/* Exercise Selector Drawer */}
        {showExercisePicker && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-[#181715] p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <h3 className="font-bold text-sm text-[#F5F2EB]">
                Seleccionar Ejercicio para la Rutina
              </h3>
              <button
                type="button"
                onClick={() => setShowExercisePicker(false)}
                className="p-1 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="pt-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E867B]" />
                <input
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121110] border border-[#2A2723] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#D99B43] outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMuscle("all")}
                  className={`px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer ${
                    selectedMuscle === "all"
                      ? "bg-[#D99B43] text-[#121110] font-bold"
                      : "bg-[#121110] text-[#8E867B] border border-[#2A2723]"
                  }`}
                >
                  Todos
                </button>
                {muscleKeys.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMuscle(m)}
                    className={`px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer ${
                      selectedMuscle === m
                        ? "bg-[#D99B43] text-[#121110] font-bold"
                        : "bg-[#121110] text-[#8E867B] border border-[#2A2723]"
                    }`}
                  >
                    {MUSCLE_METADATA[m]?.name.split("/")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#2A2723]/30 text-xs">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddExercise(item)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#22201D] transition-all cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-[#F5F2EB]">{item.title}</div>
                    <div className="text-[11px] text-[#8E867B]">
                      {MUSCLE_METADATA[item.muscleGroup]?.name}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-[#D99B43]" />
                </div>
              ))}

              {searchQuery.trim() && filteredCatalog.length === 0 && (
                <div
                  onClick={() => {
                    const rule = identifyMusclesForExercise(searchQuery);
                    handleAddExercise({
                      title: searchQuery.trim(),
                      muscleGroup: (rule.primary[0] || "chest") as MuscleGroupId,
                    });
                  }}
                  className="p-3 rounded-lg border border-dashed border-[#D99B43]/40 text-center text-xs text-[#D99B43] hover:bg-[#221D16] cursor-pointer"
                >
                  Añadir &quot;{searchQuery.trim()}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
