"use client";

import { createCustomExerciseAction } from "@/app/actions/workouts";
import { soundFx } from "@/lib/soundFx";
import { EquipmentType, ExerciseCatalogItem, MuscleGroupId } from "@/lib/types";
import { MUSCLE_METADATA } from "@/lib/muscleRecovery";
import { Dumbbell, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";

interface CustomExerciseModalProps {
  onClose: () => void;
  onCreated: (exercise: ExerciseCatalogItem) => void;
}

export function CustomExerciseModal({
  onClose,
  onCreated,
}: CustomExerciseModalProps) {
  const [title, setTitle] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroupId>("chest");
  const [equipmentType, setEquipmentType] = useState<EquipmentType>("barbell");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!title.trim()) {
      setError("El nombre del ejercicio es obligatorio");
      return;
    }
    setError(null);
    soundFx.click();

    startTransition(async () => {
      const res = await createCustomExerciseAction({
        title: title.trim(),
        muscleGroup,
        equipmentType,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.exercise) {
        onCreated(res.exercise);
      } else {
        setError(res.error || "Error al crear ejercicio");
      }
    });
  };

  const muscleKeys = Object.keys(MUSCLE_METADATA) as MuscleGroupId[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-md rounded-2xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl text-[#F5F2EB]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43]">
              <Dumbbell className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold font-serif text-[#F5F2EB]">
              Nuevo Ejercicio Personalizado
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
        <div className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#2A1715] border border-[#E05D52]/30 text-[#E05D52] text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#8E867B] uppercase font-mono mb-1.5">
              Nombre del ejercicio
            </label>
            <input
              type="text"
              placeholder="Ej. Press inclinado con mancuernas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121110] border border-[#2A2723] rounded-xl px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D99B43] outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E867B] uppercase font-mono mb-1.5">
              Grupo muscular principal
            </label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroupId)}
              className="w-full bg-[#121110] border border-[#2A2723] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F2EB] focus:border-[#D99B43] outline-hidden cursor-pointer"
            >
              {muscleKeys.map((m) => (
                <option key={m} value={m}>
                  {MUSCLE_METADATA[m]?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E867B] uppercase font-mono mb-1.5">
              Tipo de equipamiento
            </label>
            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
              className="w-full bg-[#121110] border border-[#2A2723] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F2EB] focus:border-[#D99B43] outline-hidden cursor-pointer"
            >
              <option value="barbell">Barra (Barbell)</option>
              <option value="dumbbell">Mancuerna (Dumbbell)</option>
              <option value="cable">Polea / Cable</option>
              <option value="machine">Máquina</option>
              <option value="smith_machine">Multipower / Smith</option>
              <option value="bodyweight">Peso corporal</option>
              <option value="kettlebell">Pesa rusa (Kettlebell)</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E867B] uppercase font-mono mb-1.5">
              Notas técnicas (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Banco a 30 grados, agarre medio"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#121110] border border-[#2A2723] rounded-xl px-3.5 py-2 text-xs text-[#DDD6C9] focus:border-[#D99B43] outline-hidden resize-none"
            />
          </div>
        </div>

        {/* Footer */}
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
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{isPending ? "Guardando..." : "Crear ejercicio"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
