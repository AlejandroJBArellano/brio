"use client";

import { deleteBodyCompositionLogAction } from "@/app/actions/health";
import { BodyCompositionLog } from "@/lib/types";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  Dumbbell,
  Flame,
  Minus,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";

interface BodyCompositionWidgetProps {
  logs: BodyCompositionLog[];
  latest?: BodyCompositionLog;
  previous?: BodyCompositionLog;
  onOpenModal: () => void;
  onRefresh?: () => void;
}

export function BodyCompositionWidget({
  logs,
  latest,
  previous,
  onOpenModal,
  onRefresh,
}: BodyCompositionWidgetProps) {
  const [selectedLog, setSelectedLog] = useState<BodyCompositionLog | undefined>(
    latest || (logs.length > 0 ? logs[0] : undefined)
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = selectedLog || latest;

  // Calculate deltas between current and previous log
  const weightDelta =
    current && previous ? Number((current.weightKg - previous.weightKg).toFixed(2)) : null;

  const fatDelta =
    current?.bodyFatPercentage !== undefined && previous?.bodyFatPercentage !== undefined
      ? Number((current.bodyFatPercentage - previous.bodyFatPercentage).toFixed(2))
      : null;

  const muscleDelta =
    current?.skeletalMuscleKg !== undefined && previous?.skeletalMuscleKg !== undefined
      ? Number((current.skeletalMuscleKg - previous.skeletalMuscleKg).toFixed(2))
      : null;

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteBodyCompositionLogAction(id);
      if (res.success) {
        setDeletingId(null);
        if (onRefresh) onRefresh();
      }
    });
  };

  if (!current) {
    return (
      <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-6 backdrop-blur-xl shadow-xl text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto mb-3">
          <Activity className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">
          Registro de Smart Fit Body (Bioimpedancia)
        </h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto mb-4">
          Lleva el control mensual de tu composición corporal: peso, porcentaje de grasa, masa muscular y grasa visceral.
        </p>
        <button
          type="button"
          onClick={onOpenModal}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Primera Medición</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Composición Corporal & Evolución
              </h3>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                Smart Fit Body
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Última medición:{" "}
              <strong className="text-neutral-200">
                {new Date(current.date + "T00:00:00").toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenModal}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Nueva Medición</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards with Deltas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Peso Total */}
        <div className="rounded-xl border border-white/6 bg-neutral-950/60 p-4 transition-all hover:border-white/12">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-emerald-400" />
              Peso Total
            </span>
            {weightDelta !== null && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                  weightDelta <= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {weightDelta > 0 ? `+${weightDelta} kg` : `${weightDelta} kg`}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {current.weightKg}
            </span>
            <span className="text-xs text-neutral-400 font-mono">kg</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">
            IMC: {current.bmi || "25.6"}
          </span>
        </div>

        {/* Grasa Corporal */}
        <div className="rounded-xl border border-white/6 bg-neutral-950/60 p-4 transition-all hover:border-white/12">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              % Grasa
            </span>
            {fatDelta !== null && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                  fatDelta <= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {fatDelta <= 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3" />
                    {fatDelta}%
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    +{fatDelta}%
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {current.bodyFatPercentage ?? "--"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">%</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">
            Masa Grasa:{" "}
            {current.bodyFatPercentage
              ? ((current.weightKg * current.bodyFatPercentage) / 100).toFixed(1) + " kg"
              : "--"}
          </span>
        </div>

        {/* Masa Muscular Esquelética */}
        <div className="rounded-xl border border-white/6 bg-neutral-950/60 p-4 transition-all hover:border-white/12">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-indigo-400" />
              Músculo Esquelético
            </span>
            {muscleDelta !== null && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                  muscleDelta >= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {muscleDelta >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    +{muscleDelta} kg
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3" />
                    {muscleDelta} kg
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {current.skeletalMuscleKg ?? "--"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">kg</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">
            Masa Libre Grasa: {current.fatFreeMassKg ? `${current.fatFreeMassKg} kg` : "--"}
          </span>
        </div>

        {/* Grasa Visceral & TMB */}
        <div className="rounded-xl border border-white/6 bg-neutral-950/60 p-4 transition-all hover:border-white/12">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              TMB / Visceral
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              Nivel {current.visceralFatLevel ?? "8.0"}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {current.bmrKcal ?? "--"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">kcal</span>
          </div>
          <span className="text-[10px] text-neutral-500 block mt-1">
            Agua corporal: {current.waterLiters ? `${current.waterLiters} L` : "--"}
          </span>
        </div>
      </div>

      {/* 3. Segmental Muscle & Fat Map */}
      {current.segmentalData && (
        <div className="rounded-xl border border-white/6 bg-neutral-950/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-violet-400" />
              <span>Desglose Segmentario (Músculo vs Grasa)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tronco */}
            <div className="p-3 rounded-lg bg-neutral-900/80 border border-white/4">
              <span className="text-xs font-semibold text-neutral-200 block mb-1.5">
                🏛️ Tronco (Core & Espalda)
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-300">
                  Músculo:{" "}
                  <strong>{current.segmentalData.muscle?.trunk ?? 27.88} kg</strong>
                </span>
                <span className="text-amber-400">
                  Grasa:{" "}
                  <strong>{current.segmentalData.fat?.trunk ?? 13.79} kg</strong>
                </span>
              </div>
            </div>

            {/* Brazos */}
            <div className="p-3 rounded-lg bg-neutral-900/80 border border-white/4">
              <span className="text-xs font-semibold text-neutral-200 block mb-1.5">
                💪 Brazos (Izq / Der)
              </span>
              <div className="flex flex-col gap-1 text-[11px] font-mono">
                <div className="flex justify-between text-indigo-300">
                  <span>Músculo:</span>
                  <span>
                    {current.segmentalData.muscle?.leftArm ?? 3.63}kg /{" "}
                    {current.segmentalData.muscle?.rightArm ?? 3.57}kg
                  </span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Grasa:</span>
                  <span>
                    {current.segmentalData.fat?.leftArm ?? 0.72}kg /{" "}
                    {current.segmentalData.fat?.rightArm ?? 0.77}kg
                  </span>
                </div>
              </div>
            </div>

            {/* Piernas */}
            <div className="p-3 rounded-lg bg-neutral-900/80 border border-white/4">
              <span className="text-xs font-semibold text-neutral-200 block mb-1.5">
                🦵 Piernas (Izq / Der)
              </span>
              <div className="flex flex-col gap-1 text-[11px] font-mono">
                <div className="flex justify-between text-indigo-300">
                  <span>Músculo:</span>
                  <span>
                    {current.segmentalData.muscle?.leftLeg ?? 9.76}kg /{" "}
                    {current.segmentalData.muscle?.rightLeg ?? 9.74}kg
                  </span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Grasa:</span>
                  <span>
                    {current.segmentalData.fat?.leftLeg ?? 2.03}kg /{" "}
                    {current.segmentalData.fat?.rightLeg ?? 2.06}kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Timeline / Historical Log List */}
      {logs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-neutral-300 tracking-tight flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              <span>Historial de Mediciones Mensuales</span>
              <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] text-neutral-400 font-mono ml-1">
                {logs.length}
              </span>
            </h4>
          </div>

          <div className="space-y-1.5">
            {logs.map((log) => {
              const isSelected = (selectedLog?.id || latest?.id) === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-500/40 bg-amber-500/10 text-white"
                      : "border-white/4 bg-neutral-950/40 text-neutral-300 hover:border-white/10 hover:bg-neutral-950/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/6 text-neutral-300 text-xs font-mono">
                      📅
                    </div>
                    <div>
                      <span className="text-xs font-semibold block">
                        {new Date(log.date + "T00:00:00").toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {log.notes && (
                        <span className="text-[10px] text-neutral-500 block truncate max-w-50">
                          {log.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-white font-bold">{log.weightKg} kg</span>
                      {log.bodyFatPercentage && (
                        <span className="text-rose-400">{log.bodyFatPercentage}% grasa</span>
                      )}
                      {log.skeletalMuscleKg && (
                        <span className="text-indigo-400 hidden sm:inline">
                          {log.skeletalMuscleKg} kg músculo
                        </span>
                      )}
                    </div>

                    {deletingId === log.id ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(log.id);
                        }}
                        disabled={isPending}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(log.id);
                        }}
                        disabled={isPending}
                        className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
