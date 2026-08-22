"use client";

import {
  addWaterAction,
  importSamsungHealthDataAction,
  logSleepAction,
  logWorkoutAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { HealthDashboardData, WorkoutType } from "@/lib/types";
import {
  Activity,
  Bed,
  Check,
  CheckCircle2,
  Droplet,
  Dumbbell,
  FileSpreadsheet,
  Flame,
  Heart,
  Moon,
  Plus,
  Pill,
  Settings2,
  Sparkles,
  Star,
  Upload,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";
import { ManageSupplementsModal } from "./ManageSupplementsModal";

interface HealthViewProps {
  data: HealthDashboardData;
  onRefresh?: () => void;
}

const WORKOUT_TYPES: { id: WorkoutType; label: string; icon: string }[] = [
  { id: "gym", label: "Gym / Fuerza 🏋️", icon: "🏋️" },
  { id: "cardio", label: "Running / Cardio 🏃", icon: "🏃" },
  { id: "mobility", label: "Movilidad / Yoga 🧘", icon: "🧘" },
  { id: "sports", label: "Deportes / Fútbol ⚽", icon: "⚽" },
  { id: "rest", label: "Descanso Activo 🛌", icon: "🛌" },
];

export function HealthView({ data, onRefresh }: HealthViewProps) {
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManageSupplementsOpen, setIsManageSupplementsOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [sleepHours, setSleepHours] = useState(data.todayHealth.sleepHours || 7.5);
  const [sleepQuality, setSleepQuality] = useState(data.todayHealth.sleepQuality || 4);
  const [isPending, startTransition] = useTransition();

  const handleWorkoutCheckin = (type: WorkoutType) => {
    startTransition(async () => {
      await logWorkoutAction(type, workoutNotes.trim() || undefined);
      if (onRefresh) onRefresh();
    });
  };

  const handleAddWater = (amount: number) => {
    startTransition(async () => {
      await addWaterAction(amount);
      if (onRefresh) onRefresh();
    });
  };

  const handleToggleSupplement = (id: string) => {
    startTransition(async () => {
      await toggleSupplementAction(id);
      if (onRefresh) onRefresh();
    });
  };

  const handleSaveSleep = () => {
    startTransition(async () => {
      await logSleepAction(sleepHours, sleepQuality);
      if (onRefresh) onRefresh();
    });
  };

  const handleImportSamsungHealth = () => {
    if (!importJson.trim()) return;
    startTransition(async () => {
      await importSamsungHealthDataAction(importJson.trim());
      setIsImportModalOpen(false);
      setImportJson("");
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workout Streak */}
        <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Racha de Entrenamiento</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {data.workoutStreak} días seguidos
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {data.weeklyWorkoutsCount} sesiones esta semana
          </div>
        </div>

        {/* Hydration */}
        <div className="rounded-2xl border border-sky-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Hidratación Hoy</span>
            <Droplet className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-400">
            {data.todayHealth.waterMl} / 3000 ml
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {data.waterPercent}% de tu meta diaria de 3L
          </div>
        </div>

        {/* Sleep Average */}
        <div className="rounded-2xl border border-indigo-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Sueño & Recuperación</span>
            <Moon className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-400">
            {data.todayHealth.sleepHours} hrs
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Calidad: {data.todayHealth.sleepQuality} de 5 ⭐ (Promedio: {data.averageSleepHours}h)
          </div>
        </div>

        {/* Daily Steps */}
        <div className="rounded-2xl border border-violet-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Pasos / Movimiento</span>
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-violet-400">
            {data.todayHealth.stepsCount > 0
              ? `${data.todayHealth.stepsCount.toLocaleString()} pasos`
              : "Samsung Sync"}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="text-violet-300 hover:underline font-semibold"
            >
              Importar Samsung Health ↗
            </button>
          </div>
        </div>
      </div>

      {/* 2. Workout Logger Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Check-in de Entrenamiento de Hoy
              </h3>
              <p className="text-xs text-neutral-400">
                1 clic para registrar tu sesión y mantener la racha activa
              </p>
            </div>
          </div>

          {data.todayHealth.workoutType && (
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Registrado: {data.todayHealth.workoutType.toUpperCase()}</span>
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {WORKOUT_TYPES.map((w) => {
            const isSelected = data.todayHealth.workoutType === w.id;

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => handleWorkoutCheckin(w.id)}
                disabled={isPending}
                className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10"
                    : "bg-neutral-950/60 border-white/[0.06] text-neutral-300 hover:border-white/[0.12] hover:bg-neutral-900"
                }`}
              >
                <span className="text-xl">{w.icon}</span>
                <span>{w.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Side by Side: Water Gauge & Supplements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hydration Tracker */}
        <div className="rounded-2xl border border-sky-500/20 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Medidor de Hidratación (Meta 3L)
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-sky-400">
              {data.todayHealth.waterMl} ml ({data.waterPercent}%)
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Progress bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-neutral-950 border border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${data.waterPercent}%` }}
              />
            </div>

            {/* Quick add buttons */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAddWater(250)}
                disabled={isPending}
                className="flex-1 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all font-mono"
              >
                +250 ml (Vaso)
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(500)}
                disabled={isPending}
                className="flex-1 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all font-mono"
              >
                +500 ml (Botella)
              </button>
              <button
                type="button"
                onClick={() => handleAddWater(1000)}
                disabled={isPending}
                className="flex-1 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all font-mono"
              >
                +1,000 ml (Termo)
              </button>
            </div>
          </div>
        </div>

        {/* Supplements Checklist */}
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Checklist de Suplementos Diarios
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">
                {data.todayHealth.supplements.filter((s) => s.taken).length}/
                {data.todayHealth.supplements.length} tomados
              </span>
              <button
                type="button"
                onClick={() => setIsManageSupplementsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-xs font-semibold transition-all shadow-sm"
                title="Configurar y gestionar suplementos"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Configurar</span>
              </button>
            </div>
          </div>

          {data.todayHealth.supplements.length === 0 ? (
            <div className="mt-4 p-6 text-center rounded-xl border border-dashed border-white/[0.08] bg-neutral-950/30">
              <Pill className="h-7 w-7 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 mb-3">
                No tienes suplementos configurados en tu checklist diario.
              </p>
              <button
                type="button"
                onClick={() => setIsManageSupplementsOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Configurar Suplementos</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.todayHealth.supplements.map((supp) => (
                <button
                  key={supp.id}
                  type="button"
                  onClick={() => handleToggleSupplement(supp.id)}
                  disabled={isPending}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-semibold ${
                    supp.taken
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-white/[0.06] bg-neutral-950/60 text-neutral-300 hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span>{supp.name}</span>
                    {supp.timing && (
                      <span className="text-[10px] font-normal text-neutral-400 mt-0.5">
                        {supp.timing}
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ml-2 ${
                      supp.taken
                        ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                        : "border-neutral-700 bg-neutral-900"
                    }`}
                  >
                    {supp.taken && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Sleep & Recovery Editor */}
      <div className="rounded-2xl border border-indigo-500/20 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Registro de Sueño & Recuperación
              </h3>
              <p className="text-xs text-neutral-400">
                Ajusta las horas de sueño y calidad de tu última noche
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSleep}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            {isPending ? "Guardando..." : "Guardar Registro"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Horas dormidas: <strong className="text-white font-mono">{sleepHours} hrs</strong>
            </label>
            <input
              type="range"
              min="4"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1">
              <span>4h (Insomnio)</span>
              <span>8h (Ideal)</span>
              <span>12h</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Calidad de descanso: <strong className="text-white">{sleepQuality} / 5 ⭐</strong>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSleepQuality(q)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                    sleepQuality === q
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-neutral-950/60 border-white/[0.06] text-neutral-400 hover:text-white"
                  }`}
                >
                  {q} ⭐
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Samsung Health Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.1] bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Importar Datos de Samsung Health
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Pega el contenido JSON o registros exportados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                rows={6}
                placeholder={'[{"date": "2026-08-22", "steps": 8500, "sleep_hours": 7.8}]'}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-neutral-950/80 p-3 font-mono text-xs text-white placeholder:text-neutral-600 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImportSamsungHealth}
                  disabled={isPending || !importJson.trim()}
                  className="px-4 py-2 rounded-xl bg-violet-600 font-bold text-xs text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {isPending ? "Importando..." : "Importar a Neon DB"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Supplements Modal */}
      <ManageSupplementsModal
        isOpen={isManageSupplementsOpen}
        onClose={() => setIsManageSupplementsOpen(false)}
        supplements={data.supplementsCatalog || []}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
