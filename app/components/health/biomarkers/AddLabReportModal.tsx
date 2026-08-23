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
  const [patientId, _setPatientId] = useState("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723] bg-[#121110] -mx-6 -mt-6 p-6 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#162121] text-[#4EAB9E] border border-[#4EAB9E]/30">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Registrar Estudio Clínico & Biomarcadores
              </h2>
              <p className="text-xs text-[#8E867B]">
                Química sanguínea, perfiles metabólicos, hematología y análisis clínicos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={handleLoadPreset}
              className="px-3 py-1.5 rounded-lg bg-[#121110] hover:bg-[#22201D] text-[11px] font-bold text-[#DDD6C9] border border-[#2A2723] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#4EAB9E]" />
              <span>Plantilla Chopo 45</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#221716] border border-[#E05D52]/40 p-3 text-xs text-[#E05D52] font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 py-4 pr-1 font-mono">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-[#121110] border border-[#2A2723]">
            <div>
              <label className="block text-[11px] font-sans font-medium text-[#8E867B] mb-1">
                Fecha del Estudio
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#4EAB9E] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-medium text-[#8E867B] mb-1">
                Laboratorio Clínico
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="Laboratorio Chopo"
                className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#4EAB9E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-medium text-[#8E867B] mb-1">
                Número de Orden / Folio
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="A01510965"
                className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#4EAB9E] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-sans font-medium text-[#8E867B] mb-1">
                Título del Estudio
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Química Integral 45 Elementos"
                className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#4EAB9E] focus:outline-none"
              />
            </div>
          </div>

          {/* Panel Category Filter Ribbon */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#F5F2EB] mb-2">
              Paneles de Biomarcadores ({biomarkers.length} elementos)
            </label>
            <div className="flex flex-wrap gap-1.5 pb-2 font-mono">
              {(Object.keys(BIOMARKER_CATEGORIES_META) as BiomarkerCategoryKey[]).map((catKey) => {
                const meta = BIOMARKER_CATEGORIES_META[catKey];
                const count = biomarkers.filter((b) => b.category === catKey).length;
                const isSelected = activeCategoryFilter === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setActiveCategoryFilter(catKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#4EAB9E] text-[#121110] font-bold shadow-xs"
                        : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
                    }`}
                  >
                    <span>{meta.shortLabel}</span>
                    <span className="rounded bg-[#181715] px-1.5 py-0.2 text-[9px] font-mono text-[#DDD6C9]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Biomarkers Table / Form for Active Category */}
          <div className="space-y-2 rounded-xl border border-[#2A2723] bg-[#121110] p-3 max-h-72 overflow-y-auto">
            <div className="grid grid-cols-12 text-[10px] font-bold text-[#8E867B] uppercase tracking-wider px-2 py-1">
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
                  className="grid grid-cols-12 items-center gap-2 rounded-lg bg-[#181715] p-2 text-xs border border-[#2A2723] hover:border-[#38332D] transition-all"
                >
                  <div className="col-span-5">
                    <div className="font-semibold text-[#F5F2EB]">{b.name}</div>
                    <div className="text-[10px] font-mono text-[#8E867B]">
                      {b.code || b.category} {b.unit ? `(${b.unit})` : ""}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={b.valueNumeric !== undefined ? b.valueNumeric : b.valueText || ""}
                      onChange={(e) => handleUpdateValue(idx, e.target.value)}
                      placeholder="Valor"
                      className="w-full rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-xs text-center font-mono font-bold text-[#4EAB9E] focus:border-[#4EAB9E] focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 text-center text-[10px] font-mono text-[#8E867B]">
                    {b.refText || (b.refMin !== undefined ? `${b.refMin}-${b.refMax}` : "—")}
                  </div>

                  <div className="col-span-2 text-right">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold border ${
                        b.status === "high"
                          ? "bg-[#221716] text-[#E05D52] border-[#E05D52]/30"
                          : b.status === "low"
                          ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30"
                          : "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/30"
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
            <label className="block text-xs font-sans font-medium text-[#8E867B] mb-1">
              Notas Clínicas & Observaciones Médicas
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Ej. Paciente masculino 22 años, excelente filtración renal, serie roja adaptada al entrenamiento y altitud..."
              rows={2}
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-xs text-[#F5F2EB] focus:border-[#4EAB9E] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2723] font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-[#8E867B] hover:text-[#DDD6C9] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-lg bg-[#4EAB9E] hover:bg-[#5CBFB2] text-[#121110] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-[#121110] border-t-transparent rounded-full animate-spin" />
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
