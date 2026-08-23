"use client";

import { createLabReportAction } from "@/app/actions/health";
import { BIOMARKER_CATEGORIES_META, DEFAULT_BIOMARKER_TEMPLATES } from "@/lib/labPresets";
import { BiomarkerCategoryKey, BiomarkerStatus } from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import {
  AlertCircle,
  Check,
  FlaskConical,
  Sparkles,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface AddLabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddLabReportModal({
  isOpen,
  onClose,
  onSuccess,
}: AddLabReportModalProps) {
  const [date, setDate] = useState(getTodayDateStr());
  const [labName, setLabName] = useState("Laboratorio Chopo");
  const [orderNumber, setOrderNumber] = useState("");
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("Química Sanguínea y Biometría Hemática");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [biomarkers, setBiomarkers] = useState<
    Array<{
      category: BiomarkerCategoryKey;
      name: string;
      code?: string;
      valueNumeric?: number;
      valueText?: string;
      unit?: string;
      refMin?: number;
      refMax?: number;
      refText?: string;
      status: BiomarkerStatus;
      notes?: string;
    }>
  >(() =>
    DEFAULT_BIOMARKER_TEMPLATES.map((b) => ({
      category: b.category,
      name: b.name,
      code: b.code,
      valueNumeric: undefined,
      valueText: undefined,
      unit: b.unit,
      refMin: b.refMin,
      refMax: b.refMax,
      refText: b.refText,
      status: "optimal" as BiomarkerStatus,
      notes: b.notes,
    }))
  );

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<BiomarkerCategoryKey>("renal");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleLoadPreset = () => {
    setBiomarkers(
      DEFAULT_BIOMARKER_TEMPLATES.map((b) => ({
        category: b.category,
        name: b.name,
        code: b.code,
        valueNumeric: undefined,
        valueText: undefined,
        unit: b.unit,
        refMin: b.refMin,
        refMax: b.refMax,
        refText: b.refText,
        status: "optimal" as BiomarkerStatus,
        notes: b.notes,
      }))
    );
  };

  const handleUpdateValue = (index: number, val: string) => {
    setBiomarkers((prev) => {
      const copy = [...prev];
      const num = parseFloat(val);
      copy[index] = {
        ...copy[index],
        valueNumeric: isNaN(num) ? undefined : num,
        valueText: isNaN(num) ? val : undefined,
      };

      // Auto compute status if refMin and refMax exist
      if (!isNaN(num) && copy[index].refMin !== undefined && copy[index].refMax !== undefined) {
        if (num < copy[index].refMin!) {
          copy[index].status = "low";
        } else if (num > copy[index].refMax!) {
          copy[index].status = "high";
        } else {
          copy[index].status = "optimal";
        }
      }
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Por favor selecciona la fecha del estudio.");
      return;
    }
    if (!title.trim()) {
      setError("Por favor ingresa un título descriptivo para el estudio.");
      return;
    }

    startTransition(async () => {
      const res = await createLabReportAction({
        date,
        labName: labName.trim(),
        orderNumber: orderNumber.trim() || undefined,
        patientId: patientId.trim() || undefined,
        title: title.trim(),
        doctorNotes: doctorNotes.trim() || undefined,
        biomarkers,
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "Ocurrió un error al guardar el estudio.");
      }
    });
  };

  const filteredBiomarkers = biomarkers
    .map((b, originalIndex) => ({ ...b, originalIndex }))
    .filter((b) => b.category === activeCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-cyan-500/20 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Registrar Estudio Clínico & Biomarcadores
              </h2>
              <p className="text-xs text-neutral-400">
                Química sanguínea, perfiles metabólicos, hematología y análisis clínicos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadPreset}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-neutral-200 border border-white/8 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Plantilla Chopo 45</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-neutral-950/60 border border-white/6">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Fecha del Estudio
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-white/8 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Laboratorio Clínico
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="Laboratorio Chopo"
                className="w-full rounded-lg border border-white/8 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Número de Orden / Folio
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="A01510965"
                className="w-full rounded-lg border border-white/8 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Título del Estudio
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Química Integral 45 Elementos"
                className="w-full rounded-lg border border-white/8 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Panel Category Filter Ribbon */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-2">
              Paneles de Biomarcadores ({biomarkers.length} elementos)
            </label>
            <div className="flex flex-wrap gap-1.5 pb-2">
              {(Object.keys(BIOMARKER_CATEGORIES_META) as BiomarkerCategoryKey[]).map((catKey) => {
                const meta = BIOMARKER_CATEGORIES_META[catKey];
                const count = biomarkers.filter((b) => b.category === catKey).length;
                const isSelected = activeCategoryFilter === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setActiveCategoryFilter(catKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                        : "bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/6"
                    }`}
                  >
                    <span>{meta.shortLabel}</span>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-neutral-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Biomarkers Table / Form for Active Category */}
          <div className="space-y-2 rounded-xl border border-white/6 bg-neutral-950/60 p-3 max-h-72 overflow-y-auto">
            <div className="grid grid-cols-12 text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-2 py-1">
              <div className="col-span-5">Biomarcador</div>
              <div className="col-span-3 text-center">Valor Obtenido</div>
              <div className="col-span-2 text-center">Rango Ref.</div>
              <div className="col-span-2 text-right">Estado</div>
            </div>

            {filteredBiomarkers.map((b) => {
              const idx = b.originalIndex;
              return (
                <div
                  key={b.name + idx}
                  className="grid grid-cols-12 items-center gap-2 rounded-lg bg-neutral-900/60 p-2 text-xs border border-white/4 hover:border-white/10 transition-all"
                >
                  <div className="col-span-5">
                    <div className="font-semibold text-neutral-200">{b.name}</div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      {b.code || b.category} {b.unit ? `(${b.unit})` : ""}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={b.valueNumeric !== undefined ? b.valueNumeric : b.valueText || ""}
                      onChange={(e) => handleUpdateValue(idx, e.target.value)}
                      placeholder="Valor"
                      className="w-full rounded-md border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-center font-mono font-bold text-cyan-400 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 text-center text-[10px] font-mono text-neutral-400">
                    {b.refText || (b.refMin !== undefined ? `${b.refMin}-${b.refMax}` : "—")}
                  </div>

                  <div className="col-span-2 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                        b.status === "high"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : b.status === "low"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {b.status === "high" ? "Alto" : b.status === "low" ? "Bajo" : "Óptimo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Notas Clínicas & Observaciones Médicas
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Ej. Paciente masculino 22 años, excelente filtración renal, serie roja adaptada al entrenamiento y altitud..."
              rows={2}
              className="w-full rounded-xl border border-white/8 bg-neutral-950 p-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Guardar Estudio ({biomarkers.length} biomarcadores)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
