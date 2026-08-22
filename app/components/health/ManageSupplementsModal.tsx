"use client";

import {
  createSupplementAction,
  deleteSupplementAction,
  updateSupplementAction,
} from "@/app/actions/health";
import { UserSupplement } from "@/lib/types";
import {
  AlertCircle,
  Check,
  Clock,
  Edit2,
  Pill,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface ManageSupplementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplements: UserSupplement[];
  onSuccess?: () => void;
}

const COMMON_PRESETS = [
  { name: "Creatina", dosage: "5g", timing: "Post-entreno" },
  { name: "Citrato de Magnesio", dosage: "400mg", timing: "Noche" },
  { name: "Omega 3", dosage: "2 cápsulas", timing: "Con comida" },
  { name: "Vitamina D3 + K2", dosage: "5,000 UI", timing: "Mañana" },
  { name: "Multivitamínico", dosage: "1 cápsula", timing: "Mañana" },
  { name: "Proteína / Whey", dosage: "30g", timing: "Post-entreno" },
  { name: "Ashwagandha", dosage: "600mg", timing: "Noche" },
  { name: "Zinc", dosage: "15mg", timing: "Noche" },
];

const TIMING_OPTIONS = [
  { id: "Mañana", label: "Mañana ☀️" },
  { id: "Tarde", label: "Tarde 🌤️" },
  { id: "Noche", label: "Noche 🌙" },
  { id: "Pre-entreno", label: "Pre-entreno ⚡" },
  { id: "Post-entreno", label: "Post-entreno 🏋️" },
  { id: "Con comida", label: "Con comida 🍽️" },
];

export function ManageSupplementsModal({
  isOpen,
  onClose,
  supplements,
  onSuccess,
}: ManageSupplementsModalProps) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timing, setTiming] = useState("Mañana");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleStartEdit = (supp: UserSupplement) => {
    setEditingId(supp.id);
    setName(supp.name);
    setDosage(supp.dosage || "");
    setTiming(supp.timing || "Mañana");
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setDosage("");
    setTiming("Mañana");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor escribe el nombre del suplemento.");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (editingId) {
        const res = await updateSupplementAction(editingId, {
          name: name.trim(),
          dosage: dosage.trim() || undefined,
          timing: timing.trim() || undefined,
        });

        if (res.success) {
          handleCancelEdit();
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || "No se pudo actualizar el suplemento.");
        }
      } else {
        const res = await createSupplementAction({
          name: name.trim(),
          dosage: dosage.trim() || undefined,
          timing: timing.trim() || undefined,
        });

        if (res.success) {
          setName("");
          setDosage("");
          setTiming("Mañana");
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || "No se pudo agregar el suplemento.");
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteSupplementAction(id);
      if (res.success) {
        setDeletingId(null);
        if (editingId === id) handleCancelEdit();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo eliminar el suplemento.");
      }
    });
  };

  const handleAddPreset = (preset: { name: string; dosage: string; timing: string }) => {
    // Check if already exists
    const exists = supplements.some(
      (s) => s.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (exists) {
      setError(`"${preset.name}" ya se encuentra en tu lista.`);
      return;
    }

    startTransition(async () => {
      const res = await createSupplementAction(preset);
      if (res.success) {
        setError(null);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo agregar el preset.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Gestionar Suplementos Diarios
              </h2>
              <p className="text-xs text-neutral-400">
                Personaliza los suplementos y dosis que tomas a diario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form: Add or Edit */}
          <form onSubmit={handleSubmit} className="rounded-xl border border-white/8 bg-neutral-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-1.5">
                {editingId ? (
                  <>
                    <Edit2 className="h-3.5 w-3.5 text-amber-400" />
                    Editar Suplemento
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 text-violet-400" />
                    Nuevo Suplemento
                  </>
                )}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nombre del suplemento *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Citrato de Magnesio"
                  className="w-full rounded-xl border border-white/8 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Dosis recomendada (opcional)
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Ej. 400mg, 5g, 2 cápsulas"
                  className="w-full rounded-xl border border-white/8 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Momento de toma
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIMING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTiming(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      timing === opt.id
                        ? "border-violet-500/50 bg-violet-500/20 text-violet-200"
                        : "border-white/6 bg-neutral-900 text-neutral-400 hover:border-white/12"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {editingId ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {isPending ? "Guardando..." : "Actualizar Suplemento"}
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    {isPending ? "Agregando..." : "Agregar al Checklist"}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Presets */}
          {!editingId && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <h4 className="text-xs font-bold text-neutral-300 tracking-tight">
                  Agregar populares en 1 clic
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_PRESETS.map((preset) => {
                  const alreadyAdded = supplements.some(
                    (s) => s.name.toLowerCase() === preset.name.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={isPending || alreadyAdded}
                      onClick={() => handleAddPreset(preset)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                        alreadyAdded
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400/60 opacity-60 cursor-default"
                          : "border-white/8 bg-neutral-900/80 hover:border-violet-500/40 hover:bg-violet-500/10 text-neutral-300 hover:text-violet-200"
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {preset.dosage}
                      </span>
                      {alreadyAdded ? (
                        <Check className="h-3 w-3 text-emerald-400 ml-0.5" />
                      ) : (
                        <Plus className="h-3 w-3 text-neutral-400 ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Supplements List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-neutral-300 tracking-tight flex items-center gap-2">
                <span>Tus Suplementos Activos</span>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/20">
                  {supplements.length}
                </span>
              </h4>
            </div>

            {supplements.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-white/8 bg-neutral-950/30">
                <Pill className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">
                  Aún no tienes suplementos configurados. Agrega uno arriba o usa los presets rápidos.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {supplements.map((supp) => (
                  <div
                    key={supp.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      editingId === supp.id
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/6 bg-neutral-950/40 hover:border-white/12"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {supp.name}
                          </span>
                          {supp.dosage && (
                            <span className="rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] font-mono text-violet-300 border border-white/4">
                              {supp.dosage}
                            </span>
                          )}
                        </div>
                        {supp.timing && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-neutral-400">
                            <Clock className="h-2.5 w-2.5 text-neutral-500" />
                            <span>{supp.timing}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(supp)}
                        disabled={isPending}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {deletingId === supp.id ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg border border-rose-500/20">
                          <button
                            type="button"
                            onClick={() => handleDelete(supp.id)}
                            disabled={isPending}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-all"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="p-1 text-neutral-400 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(supp.id)}
                          disabled={isPending}
                          className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/8 bg-neutral-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
