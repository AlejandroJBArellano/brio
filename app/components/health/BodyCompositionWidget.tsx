"use client";

import { deleteBodyCompositionLogAction } from "@/app/actions/health";
import { BodyCompositionLog } from "@/lib/types";
import {
  Activity,
  Calendar,
  Dumbbell,
  Flame,
  Plus,
  Scale,
  Target,
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
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-sm text-center font-sans">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 mx-auto mb-3">
          <Activity className="h-5 w-5" />
        </div>
        <h3 className="font-serif text-sm font-bold text-[#F5F2EB] mb-1">
          Registro de Smart Fit Body (Bioimpedancia)
        </h3>
        <p className="text-xs text-[#8E867B] max-w-md mx-auto mb-4 font-mono">
          Lleva el control mensual de tu composición corporal: peso, porcentaje de grasa, masa muscular y grasa visceral.
        </p>
        <button
          type="button"
          onClick={onOpenModal}
          className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer font-sans"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Primera Medición</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm space-y-6 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2723]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Composición Corporal & Evolución
              </h3>
              <span className="rounded-md bg-[#221D16] px-2 py-0.5 text-[10px] font-mono font-bold text-[#D99B43] border border-[#D99B43]/30">
                Smart Fit Body
              </span>
            </div>
            <p className="text-xs text-[#8E867B] mt-0.5 font-mono">
              Última medición:{" "}
              <strong className="text-[#F5F2EB]">
                {new Date(current.date + "T00:00:00").toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            onClick={onOpenModal}
            className="px-3.5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Nueva Medición</span>
          </button>
        </div>
      </div>

      {/* 1.5 Active Cutting Goal / Target Card */}
      <div className="relative overflow-hidden rounded-xl border border-[#D99B43]/30 bg-linear-to-br from-[#1C1A17] via-[#161513] to-[#121110] p-4 sm:p-5 shadow-md">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#D99B43]/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A2318] text-[#D99B43] border border-[#D99B43]/40 shadow-xs">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Meta Activa: Fase de Definición Gradual
                </h4>
                <span className="rounded-full bg-[#D99B43]/15 px-2 py-0.5 text-[9px] font-mono font-bold text-[#D99B43] border border-[#D99B43]/30">
                  18 Semanas (~0.38 kg/sem)
                </span>
              </div>
              <p className="text-[11px] text-[#8E867B] font-mono">
                Reducción de grasa corporal preservando 33.7 kg de masa muscular esquelética
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="rounded-lg bg-[#121110] px-3 py-1 text-[#DDD6C9] border border-[#2A2723]">
              Meta: <strong className="text-[#4EAB9E]">71.0 kg</strong> (~14% Grasa)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {(() => {
          const startWeight = 78.6;
          const targetWeight = 71.0;
          const currentWeight = current.weightKg || startWeight;
          const totalToLose = startWeight - targetWeight;
          const lostSoFar = Math.max(0, startWeight - currentWeight);
          const progressPercent = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));
          const remainingKg = Math.max(0, currentWeight - targetWeight).toFixed(1);

          return (
            <div className="space-y-2 mb-3.5 bg-[#121110]/90 p-3 rounded-lg border border-[#2A2723]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E867B] flex items-center gap-1.5">
                  <span className="text-[#DDD6C9] font-bold">{startWeight} kg</span>
                  <span className="text-[10px] text-[#6A6359]">(24.6% BF)</span>
                  <span>➔</span>
                  <strong className="text-[#D99B43]">{currentWeight} kg</strong>
                  <span className="text-[10px] text-[#6A6359]">(Actual)</span>
                </span>
                <span className="text-[#4EAB9E] font-bold">
                  {progressPercent}% completado ({remainingKg} kg restantes)
                </span>
              </div>

              {/* Visual Track */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#22201D]">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#4EAB9E] transition-all duration-500"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Quick Protocol Targets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          <div className="rounded-lg bg-[#121110] p-2.5 border border-[#2A2723]/80">
            <span className="text-[10px] text-[#8E867B] block font-sans">🔥 Déficit Calórico</span>
            <span className="font-bold text-[#F5F2EB] text-xs">~2,050 kcal/d</span>
            <span className="text-[9px] text-[#7EA35A] block">-400 kcal vs TDEE</span>
          </div>
          <div className="rounded-lg bg-[#121110] p-2.5 border border-[#2A2723]/80">
            <span className="text-[10px] text-[#8E867B] block font-sans">🥩 Proteína Diaria</span>
            <span className="font-bold text-[#F5F2EB] text-xs">160 g / día</span>
            <span className="text-[9px] text-[#8E867B] block">2.1g/kg masa magra</span>
          </div>
          <div className="rounded-lg bg-[#121110] p-2.5 border border-[#2A2723]/80">
            <span className="text-[10px] text-[#8E867B] block font-sans">💧 Hidratación Meta</span>
            <span className="font-bold text-[#F5F2EB] text-xs">3,000 ml / día</span>
            <span className="text-[9px] text-[#4EAB9E] block">40L Agua corporal</span>
          </div>
          <div className="rounded-lg bg-[#121110] p-2.5 border border-[#2A2723]/80">
            <span className="text-[10px] text-[#8E867B] block font-sans">👟 Actividad NEAT</span>
            <span className="font-bold text-[#F5F2EB] text-xs">+10,000 pasos</span>
            <span className="text-[9px] text-[#D99B43] block">Gym Fuerza Hevy</span>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Cards with Deltas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Peso Total */}
        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4 transition-all hover:border-[#38332D]">
          <div className="flex items-center justify-between text-xs text-[#8E867B] mb-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-[#7EA35A]" />
              Peso Total
            </span>
            {weightDelta !== null && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                  weightDelta <= 0 ? "text-[#7EA35A]" : "text-[#D99B43]"
                }`}
              >
                {weightDelta > 0 ? `+${weightDelta} kg` : `${weightDelta} kg`}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#F5F2EB] font-mono tracking-tight">
              {current.weightKg}
            </span>
            <span className="text-xs text-[#8E867B] font-mono">kg</span>
          </div>
          <span className="text-[10px] text-[#8E867B] block mt-1 font-mono">
            IMC: {current.bmi || "25.6"}
          </span>
        </div>

        {/* Grasa Corporal */}
        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4 transition-all hover:border-[#38332D]">
          <div className="flex items-center justify-between text-xs text-[#8E867B] mb-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-[#E05D52]" />
              % Grasa
            </span>
            {fatDelta !== null && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                  fatDelta <= 0 ? "text-[#7EA35A]" : "text-[#E05D52]"
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
            <span className="text-2xl font-bold text-[#F5F2EB] font-mono tracking-tight">
              {current.bodyFatPercentage ?? "--"}
            </span>
            <span className="text-xs text-[#8E867B] font-mono">%</span>
          </div>
          <span className="text-[10px] text-[#8E867B] block mt-1 font-mono">
            Masa Grasa:{" "}
            {current.bodyFatPercentage
              ? ((current.weightKg * current.bodyFatPercentage) / 100).toFixed(1) + " kg"
              : "--"}
          </span>
        </div>

        {/* Masa Muscular Esquelética */}
        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4 transition-all hover:border-[#38332D]">
          <div className="flex items-center justify-between text-xs text-[#8E867B] mb-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-[#4EAB9E]" />
              Músculo Esquelético
            </span>
            {muscleDelta !== null && (
              <span
                className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                  muscleDelta >= 0 ? "text-[#7EA35A]" : "text-[#D99B43]"
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
            <span className="text-2xl font-bold text-[#F5F2EB] font-mono tracking-tight">
              {current.skeletalMuscleKg ?? "--"}
            </span>
            <span className="text-xs text-[#8E867B] font-mono">kg</span>
          </div>
          <span className="text-[10px] text-[#8E867B] block mt-1 font-mono">
            Masa Libre Grasa: {current.fatFreeMassKg ? `${current.fatFreeMassKg} kg` : "--"}
          </span>
        </div>

        {/* Grasa Visceral & TMB */}
        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4 transition-all hover:border-[#38332D]">
          <div className="flex items-center justify-between text-xs text-[#8E867B] mb-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#D99B43]" />
              TMB / Visceral
            </span>
            <span className="text-[10px] font-mono text-[#8E867B]">
              Nivel {current.visceralFatLevel ?? "8.0"}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#F5F2EB] font-mono tracking-tight">
              {current.bmrKcal ?? "--"}
            </span>
            <span className="text-xs text-[#8E867B] font-mono">kcal</span>
          </div>
          <span className="text-[10px] text-[#8E867B] block mt-1 font-mono">
            Agua corporal: {current.waterLiters ? `${current.waterLiters} L` : "--"}
          </span>
        </div>
      </div>

      {/* 3. Segmental Muscle & Fat Map */}
      {current.segmentalData && (
        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-serif text-xs font-bold text-[#DDD6C9] uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-[#D99B43]" />
              <span>Desglose Segmentario (Músculo vs Grasa)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tronco */}
            <div className="p-3 rounded-lg bg-[#181715] border border-[#2A2723]">
              <span className="text-xs font-semibold text-[#F5F2EB] block mb-1.5 font-serif">
                🏛️ Tronco (Core & Espalda)
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#4EAB9E]">
                  Músculo:{" "}
                  <strong>{current.segmentalData.muscle?.trunk ?? 27.88} kg</strong>
                </span>
                <span className="text-[#D99B43]">
                  Grasa:{" "}
                  <strong>{current.segmentalData.fat?.trunk ?? 13.79} kg</strong>
                </span>
              </div>
            </div>

            {/* Brazos */}
            <div className="p-3 rounded-lg bg-[#181715] border border-[#2A2723]">
              <span className="text-xs font-semibold text-[#F5F2EB] block mb-1.5 font-serif">
                💪 Brazos (Izq / Der)
              </span>
              <div className="flex flex-col gap-1 text-[11px] font-mono">
                <div className="flex justify-between text-[#4EAB9E]">
                  <span>Músculo:</span>
                  <span>
                    {current.segmentalData.muscle?.leftArm ?? 3.63}kg /{" "}
                    {current.segmentalData.muscle?.rightArm ?? 3.57}kg
                  </span>
                </div>
                <div className="flex justify-between text-[#D99B43]">
                  <span>Grasa:</span>
                  <span>
                    {current.segmentalData.fat?.leftArm ?? 0.72}kg /{" "}
                    {current.segmentalData.fat?.rightArm ?? 0.77}kg
                  </span>
                </div>
              </div>
            </div>

            {/* Piernas */}
            <div className="p-3 rounded-lg bg-[#181715] border border-[#2A2723]">
              <span className="text-xs font-semibold text-[#F5F2EB] block mb-1.5 font-serif">
                🦵 Piernas (Izq / Der)
              </span>
              <div className="flex flex-col gap-1 text-[11px] font-mono">
                <div className="flex justify-between text-[#4EAB9E]">
                  <span>Músculo:</span>
                  <span>
                    {current.segmentalData.muscle?.leftLeg ?? 9.76}kg /{" "}
                    {current.segmentalData.muscle?.rightLeg ?? 9.74}kg
                  </span>
                </div>
                <div className="flex justify-between text-[#D99B43]">
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
            <h4 className="font-serif text-xs font-bold text-[#DDD6C9] tracking-tight flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#8E867B]" />
              <span>Historial de Mediciones Mensuales</span>
              <span className="rounded bg-[#181715] px-2 py-0.5 text-[10px] text-[#8E867B] font-mono ml-1 border border-[#2A2723]">
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
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#D99B43]/40 bg-[#221D16] text-[#F5F2EB]"
                      : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:border-[#38332D] hover:bg-[#181715]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#181715] text-[#8E867B] text-xs font-mono border border-[#2A2723]">
                      📅
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-[#F5F2EB]">
                        {new Date(log.date + "T00:00:00").toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {log.notes && (
                        <span className="text-[10px] text-[#8E867B] block truncate max-w-50 font-mono">
                          {log.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-[#F5F2EB] font-bold">{log.weightKg} kg</span>
                      {log.bodyFatPercentage && (
                        <span className="text-[#E05D52]">{log.bodyFatPercentage}% grasa</span>
                      )}
                      {log.skeletalMuscleKg && (
                        <span className="text-[#4EAB9E] hidden sm:inline">
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
                        className="px-2 py-1 bg-[#E05D52] hover:bg-[#EB7369] text-white rounded text-[10px] font-bold cursor-pointer"
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
                        className="p-1 text-[#8E867B] hover:text-[#E05D52] transition-colors cursor-pointer"
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
