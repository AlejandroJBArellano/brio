"use client";

import { createBodyCompositionLogAction } from "@/app/actions/health";
import { BodyCompositionLog, BodyCompositionSegmental } from "@/lib/types";
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Flame,
  Scale,
  User,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface SmartFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestLog?: BodyCompositionLog;
  onSuccess?: () => void;
}

export function SmartFitModal({
  isOpen,
  onClose,
  latestLog,
  onSuccess,
}: SmartFitModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weightKg, setWeightKg] = useState(latestLog ? String(latestLog.weightKg) : "");
  const [bodyFat, setBodyFat] = useState(
    latestLog?.bodyFatPercentage ? String(latestLog.bodyFatPercentage) : ""
  );
  const [skeletalMuscle, setSkeletalMuscle] = useState(
    latestLog?.skeletalMuscleKg ? String(latestLog.skeletalMuscleKg) : ""
  );
  const [fatFreeMass, setFatFreeMass] = useState(
    latestLog?.fatFreeMassKg ? String(latestLog.fatFreeMassKg) : ""
  );
  const [visceralFat, setVisceralFat] = useState(
    latestLog?.visceralFatLevel ? String(latestLog.visceralFatLevel) : ""
  );
  const [bmi, setBmi] = useState(latestLog?.bmi ? String(latestLog.bmi) : "");
  const [bmr, setBmr] = useState(latestLog?.bmrKcal ? String(latestLog.bmrKcal) : "");
  const [water, setWater] = useState(
    latestLog?.waterLiters ? String(latestLog.waterLiters) : ""
  );
  const [notes, setNotes] = useState("");
  const [showSegmental, setShowSegmental] = useState(false);

  // Segmental states
  const [trunkMuscle, setTrunkMuscle] = useState(
    latestLog?.segmentalData?.muscle?.trunk ? String(latestLog.segmentalData.muscle.trunk) : ""
  );
  const [armLMuscle, setArmLMuscle] = useState(
    latestLog?.segmentalData?.muscle?.leftArm ? String(latestLog.segmentalData.muscle.leftArm) : ""
  );
  const [armRMuscle, setArmRMuscle] = useState(
    latestLog?.segmentalData?.muscle?.rightArm ? String(latestLog.segmentalData.muscle.rightArm) : ""
  );
  const [legLMuscle, setLegLMuscle] = useState(
    latestLog?.segmentalData?.muscle?.leftLeg ? String(latestLog.segmentalData.muscle.leftLeg) : ""
  );
  const [legRMuscle, setLegRMuscle] = useState(
    latestLog?.segmentalData?.muscle?.rightLeg ? String(latestLog.segmentalData.muscle.rightLeg) : ""
  );

  const [trunkFat, setTrunkFat] = useState(
    latestLog?.segmentalData?.fat?.trunk ? String(latestLog.segmentalData.fat.trunk) : ""
  );
  const [armLFat, setArmLFat] = useState(
    latestLog?.segmentalData?.fat?.leftArm ? String(latestLog.segmentalData.fat.leftArm) : ""
  );
  const [armRFat, setArmRFat] = useState(
    latestLog?.segmentalData?.fat?.rightArm ? String(latestLog.segmentalData.fat.rightArm) : ""
  );
  const [legLFat, setLegLFat] = useState(
    latestLog?.segmentalData?.fat?.leftLeg ? String(latestLog.segmentalData.fat.leftLeg) : ""
  );
  const [legRFat, setLegRFat] = useState(
    latestLog?.segmentalData?.fat?.rightLeg ? String(latestLog.segmentalData.fat.rightLeg) : ""
  );

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseFloat(weightKg);
    if (isNaN(numWeight) || numWeight <= 0) {
      setError("Por favor ingresa un peso válido (kg).");
      return;
    }

    if (!date) {
      setError("Por favor selecciona una fecha.");
      return;
    }

    const segmentalData: BodyCompositionSegmental = {};
    if (trunkMuscle || armLMuscle || armRMuscle || legLMuscle || legRMuscle) {
      segmentalData.muscle = {
        trunk: parseFloat(trunkMuscle) || 0,
        leftArm: parseFloat(armLMuscle) || 0,
        rightArm: parseFloat(armRMuscle) || 0,
        leftLeg: parseFloat(legLMuscle) || 0,
        rightLeg: parseFloat(legRMuscle) || 0,
      };
    }
    if (trunkFat || armLFat || armRFat || legLFat || legRFat) {
      segmentalData.fat = {
        trunk: parseFloat(trunkFat) || 0,
        leftArm: parseFloat(armLFat) || 0,
        rightArm: parseFloat(armRFat) || 0,
        leftLeg: parseFloat(legLFat) || 0,
        rightLeg: parseFloat(legRFat) || 0,
      };
    }

    setError(null);
    startTransition(async () => {
      const res = await createBodyCompositionLogAction({
        date,
        weightKg: numWeight,
        bodyFatPercentage: bodyFat ? parseFloat(bodyFat) : undefined,
        skeletalMuscleKg: skeletalMuscle ? parseFloat(skeletalMuscle) : undefined,
        fatFreeMassKg: fatFreeMass ? parseFloat(fatFreeMass) : undefined,
        visceralFatLevel: visceralFat ? parseFloat(visceralFat) : undefined,
        bmi: bmi ? parseFloat(bmi) : undefined,
        bmrKcal: bmr ? parseInt(bmr) : undefined,
        waterLiters: water ? parseFloat(water) : undefined,
        segmentalData: Object.keys(segmentalData).length > 0 ? segmentalData : undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo guardar la medición.");
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Registrar Smart Fit Body</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono">
                  Bioimpedancia
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Captura tu pesaje y métricas de composición corporal mensual
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Row: Date & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                Fecha de medición *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-emerald-400" />
                Peso Total (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Ej. 78.6"
                className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Core Bioimpedance Metrics */}
          <div>
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-3">
              Métricas Clave de Composición
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  % Grasa Corporal (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="Ej. 24.64"
                  className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Músculo Esquelético (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={skeletalMuscle}
                  onChange={(e) => setSkeletalMuscle(e.target.value)}
                  placeholder="Ej. 33.71"
                  className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Masa Libre de Grasa (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fatFreeMass}
                  onChange={(e) => setFatFreeMass(e.target.value)}
                  placeholder="Ej. 54.58"
                  className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Grasa Visceral (Nivel)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={visceralFat}
                  onChange={(e) => setVisceralFat(e.target.value)}
                  placeholder="Ej. 8.0"
                  className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  TMB / Gasto Basal (kcal)
                </label>
                <input
                  type="number"
                  value={bmr}
                  onChange={(e) => setBmr(e.target.value)}
                  placeholder="Ej. 1872"
                  className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Agua Corporal (L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                  placeholder="Ej. 39.95"
                  className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Segmental Data Accordion */}
          <div className="rounded-xl border border-white/8 bg-neutral-950/40 p-4">
            <button
              type="button"
              onClick={() => setShowSegmental(!showSegmental)}
              className="w-full flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-violet-400" />
                <span>Desglose Segmentario Opcional (Brazos, Tronco, Piernas)</span>
              </div>
              {showSegmental ? (
                <ChevronUp className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              )}
            </button>

            {showSegmental && (
              <div className="mt-4 space-y-4 pt-3 border-t border-white/6 animate-in fade-in duration-150">
                <div>
                  <h4 className="text-[11px] font-bold text-violet-300 mb-2 flex items-center gap-1.5">
                    <Dumbbell className="h-3 w-3" /> Músculo Segmentario (kg)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Tronco</label>
                      <input
                        type="number"
                        step="0.01"
                        value={trunkMuscle}
                        onChange={(e) => setTrunkMuscle(e.target.value)}
                        placeholder="27.88"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Brazo Izq.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={armLMuscle}
                        onChange={(e) => setArmLMuscle(e.target.value)}
                        placeholder="3.63"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Brazo Der.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={armRMuscle}
                        onChange={(e) => setArmRMuscle(e.target.value)}
                        placeholder="3.57"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Pierna Izq.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={legLMuscle}
                        onChange={(e) => setLegLMuscle(e.target.value)}
                        placeholder="9.76"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Pierna Der.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={legRMuscle}
                        onChange={(e) => setLegRMuscle(e.target.value)}
                        placeholder="9.74"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                    <Flame className="h-3 w-3" /> Grasa Segmentaria (kg)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Tronco</label>
                      <input
                        type="number"
                        step="0.01"
                        value={trunkFat}
                        onChange={(e) => setTrunkFat(e.target.value)}
                        placeholder="13.79"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Brazo Izq.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={armLFat}
                        onChange={(e) => setArmLFat(e.target.value)}
                        placeholder="0.72"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Brazo Der.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={armRFat}
                        onChange={(e) => setArmRFat(e.target.value)}
                        placeholder="0.77"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Pierna Izq.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={legLFat}
                        onChange={(e) => setLegLFat(e.target.value)}
                        placeholder="2.03"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Pierna Der.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={legRFat}
                        onChange={(e) => setLegRFat(e.target.value)}
                        placeholder="2.06"
                        className="w-full rounded-lg border border-white/8 bg-neutral-900 p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Notas / Observaciones
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Medición en ayunas, post-entreno o comentarios"
              className="w-full rounded-xl border border-white/8 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>{isPending ? "Guardando..." : "Guardar Medición"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
