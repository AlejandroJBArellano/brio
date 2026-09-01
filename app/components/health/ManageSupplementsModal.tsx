"use client";

import {
  createSupplementAction,
  deleteSupplementAction,
  fetchSupplementsCatalogAction,
  updateSupplementAction,
} from "@/app/actions/health";
import { DEFAULT_USER_SUPPLEMENTS, UserSupplement } from "@/lib/types";
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
import { useEffect, useState, useTransition } from "react";

interface ManageSupplementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplements?: UserSupplement[];
  onSuccess?: () => void;
}

const COMMON_PRESETS = [
  { name: "Ensalada Diaria", dosage: "Con semillas", timing: "Comida" },
  { name: "Cero Ultraprocesados", dosage: "Sin fritos", timing: "Todo el día" },
  { name: "Vitamina B12", dosage: "2000mcg", timing: "Mañana" },
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
  { id: "Comida", label: "Comida 🥗" },
  { id: "Todo el día", label: "Todo el día 🛡️" },
];

export function ManageSupplementsModal({
  isOpen,
  onClose,
  supplements = [],
  onSuccess,
}: ManageSupplementsModalProps) {
  const [dbSupplements, setDbSupplements] = useState<UserSupplement[]>(supplements);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timing, setTiming] = useState("Mañana");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reloadSupplements = async () => {
    try {
      const items = await fetchSupplementsCatalogAction();
      if (items && items.length > 0) setDbSupplements(items);
    } catch (err) {
      console.error("[ManageSupplementsModal] Failed to reload catalog:", err);
    }
  };

  useEffect(() => {
    if (supplements.length > 0) setDbSupplements(supplements);
    if (isOpen && supplements.length === 0) {
      reloadSupplements();
    }
  }, [isOpen, supplements]);

  const effectiveSupplements =
    dbSupplements.length > 0 ? dbSupplements : DEFAULT_USER_SUPPLEMENTS;

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
          await reloadSupplements();
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
          await reloadSupplements();
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
        await reloadSupplements();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo eliminar el suplemento.");
      }
    });
  };

  const handleAddPreset = (preset: { name: string; dosage: string; timing: string }) => {
    // Check if already exists
    const exists = effectiveSupplements.some(
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
        await reloadSupplements();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo agregar el preset.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#2A2723] bg-[#121110]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Gestionar Suplementos Diarios
              </h2>
              <p className="text-xs text-[#8E867B]">
                Personaliza los suplementos y dosis que tomas a diario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[#E05D52]/40 bg-[#221716] p-3 text-xs text-[#E05D52] font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form: Add or Edit */}
          <form onSubmit={handleSubmit} className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#F5F2EB] tracking-wider uppercase flex items-center gap-1.5 font-mono">
                {editingId ? (
                  <>
                    <Edit2 className="h-3.5 w-3.5 text-[#D99B43]" />
                    <span>Editar Suplemento</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 text-[#D99B43]" />
                    <span>Nuevo Suplemento</span>
                  </>
                )}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-[#8E867B] hover:text-[#DDD6C9] underline transition-colors cursor-pointer"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Nombre del suplemento *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Citrato de Magnesio"
                  className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Dosis recomendada (opcional)
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Ej. 400mg, 5g, 2 cápsulas"
                  className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Momento de toma
              </label>
              <div className="flex flex-wrap gap-1.5 font-sans">
                {TIMING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTiming(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      timing === opt.id
                        ? "border-[#D99B43]/40 bg-[#221D16] text-[#D99B43] font-bold"
                        : "border-[#2A2723] bg-[#181715] text-[#8E867B] hover:border-[#38332D] hover:text-[#DDD6C9]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1 font-sans">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {editingId ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{isPending ? "Guardando..." : "Actualizar Suplemento"}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isPending ? "Agregando..." : "Agregar al Checklist"}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Presets */}
          {!editingId && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-[#D99B43]" />
                <h4 className="text-xs font-serif font-bold text-[#F5F2EB] tracking-tight">
                  Agregar populares en 1 clic
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 font-mono">
                {COMMON_PRESETS.map((preset) => {
                  const alreadyAdded = effectiveSupplements.some(
                    (s) => s.name.toLowerCase() === preset.name.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={isPending || alreadyAdded}
                      onClick={() => handleAddPreset(preset)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        alreadyAdded
                          ? "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A] opacity-60 cursor-default"
                          : "border-[#2A2723] bg-[#121110] hover:border-[#D99B43]/40 hover:bg-[#221D16] text-[#DDD6C9] hover:text-[#D99B43]"
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="text-[10px] font-mono text-[#8E867B]">
                        {preset.dosage}
                      </span>
                      {alreadyAdded ? (
                        <Check className="h-3 w-3 text-[#7EA35A] ml-0.5" />
                      ) : (
                        <Plus className="h-3 w-3 text-[#8E867B] ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Supplements List */}
          <div>
            <div className="flex items-center justify-between mb-3 font-mono">
              <h4 className="text-xs font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
                <span>Tus Suplementos & Hábitos Activos</span>
                <span className="rounded-full bg-[#221D16] px-2 py-0.5 text-[10px] font-bold text-[#D99B43] border border-[#D99B43]/30">
                  {effectiveSupplements.length}
                </span>
              </h4>
            </div>

            {effectiveSupplements.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-dashed border-[#2A2723] bg-[#121110]">
                <Pill className="h-8 w-8 text-[#8E867B] mx-auto mb-2" />
                <p className="text-xs text-[#8E867B]">
                  Aún no tienes suplementos o hábitos configurados. Agrega uno arriba o usa los presets rápidos.
                </p>
              </div>
            ) : (
              <div className="space-y-2 font-mono">
                {effectiveSupplements.map((supp) => (
                  <div
                    key={supp.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      editingId === supp.id
                        ? "border-[#D99B43]/40 bg-[#221D16]"
                        : "border-[#2A2723] bg-[#121110] hover:border-[#38332D]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F5F2EB]">
                            {supp.name}
                          </span>
                          {supp.dosage && (
                            <span className="rounded bg-[#181715] px-1.5 py-0.5 text-[10px] font-mono text-[#D99B43] border border-[#2A2723]">
                              {supp.dosage}
                            </span>
                          )}
                        </div>
                        {supp.timing && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#8E867B]">
                            <Clock className="h-2.5 w-2.5 text-[#8E867B]" />
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
                        className="p-2 rounded-lg text-[#8E867B] hover:text-[#D99B43] hover:bg-[#181715] transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {deletingId === supp.id ? (
                        <div className="flex items-center gap-1 bg-[#221716] p-1 rounded-lg border border-[#E05D52]/30">
                          <button
                            type="button"
                            onClick={() => handleDelete(supp.id)}
                            disabled={isPending}
                            className="px-2 py-1 bg-[#E05D52] hover:bg-[#E8736A] text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="p-1 text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(supp.id)}
                          disabled={isPending}
                          className="p-2 rounded-lg text-[#8E867B] hover:text-[#E05D52] hover:bg-[#221716] transition-colors cursor-pointer"
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
        <div className="p-4 border-t border-[#2A2723] bg-[#121110] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#181715] hover:bg-[#22201D] text-[#DDD6C9] hover:text-[#F5F2EB] text-xs font-semibold transition-colors cursor-pointer border border-[#2A2723]"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
