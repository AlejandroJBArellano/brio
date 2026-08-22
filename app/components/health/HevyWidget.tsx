"use client";

import { syncHevyWorkoutsAction } from "@/app/actions/health";
import { HevyStats, HevyWorkout } from "@/lib/types";
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Dumbbell,
  ExternalLink,
  Flame,
  Layers,
  Radio,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Webhook,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";

interface HevyWidgetProps {
  recentWorkouts?: HevyWorkout[];
  stats?: HevyStats;
  onRefresh?: () => void;
}

export function HevyWidget({
  recentWorkouts = [],
  stats,
  onRefresh,
}: HevyWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(
    recentWorkouts[0]?.id || null
  );
  const [showWebhookInfo, setShowWebhookInfo] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const latestWorkout = recentWorkouts[0];
  const totalWorkouts = stats?.totalWorkouts || recentWorkouts.length;
  const totalVolume = stats?.totalVolumeKg || 0;

  const handleSync = () => {
    setSyncFeedback(null);
    startTransition(async () => {
      const res = await syncHevyWorkoutsAction({ maxPages: 3, pageSize: 10 });
      if (res.success) {
        setSyncFeedback({
          type: "success",
          message: `¡Sincronizados ${res.syncedCount} entrenamientos (${res.totalVolume.toLocaleString(
            "es-MX"
          )} kg)!`,
        });
        if (onRefresh) onRefresh();
        setTimeout(() => setSyncFeedback(null), 5000);
      } else {
        setSyncFeedback({
          type: "error",
          message: res.error || "Error al conectar con la API de Hevy",
        });
      }
    });
  };

  const copyWebhookUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://brio.app";
    const webhookUrl = `${origin}/api/webhooks/hevy`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-linear-to-b from-neutral-900/90 via-neutral-900/60 to-neutral-950/80 p-6 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
      {/* 1. Header with Hevy Branding & Quick Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Hevy Tracker Integrado
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  API PRO
                </span>
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Sincronización de fuerza, rutinas, series y volumen en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowWebhookInfo(!showWebhookInfo)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950/60 border border-white/8 text-xs font-semibold text-neutral-300 hover:text-white hover:border-white/15 transition-all"
            title="Configuración de Webhook en tiempo real"
          >
            <Webhook className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Webhook</span>
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
            />
            <span>{isPending ? "Sincronizando..." : "Sincronizar Hevy"}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div
          className={`mt-4 p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            syncFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === "success" ? (
              <Sparkles className="h-4 w-4 text-emerald-400" />
            ) : (
              <Zap className="h-4 w-4 text-rose-400" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-neutral-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Webhook Setup Banner (Collapsible) */}
      {showWebhookInfo && (
        <div className="mt-4 p-4 rounded-2xl border border-cyan-500/20 bg-neutral-950/80 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              Sincronización Automática con Webhook
            </span>
            <a
              href="https://hevy.com/settings?developer"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
            >
              Abrir Hevy Web <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Pega esta URL en tu panel de Desarrollador en Hevy (sección Webhooks). Cada vez que termines un entrenamiento en la app, Brio se actualizará automáticamente:
          </p>
          <div className="flex items-center gap-2 bg-neutral-900 border border-white/8 rounded-xl p-2.5 font-mono text-xs text-neutral-300">
            <span className="truncate flex-1">
              {typeof window !== "undefined" ? window.location.origin : "https://brio.app"}
              /api/webhooks/hevy
            </span>
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-sans font-semibold transition-all shrink-0"
            >
              {copiedWebhook ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Metrics Summary Ribbon */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/6 bg-neutral-950/60 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Total Sesiones</span>
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-white">
            {totalWorkouts > 0 ? `${totalWorkouts} entrenos` : "0"}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            Registrados en Hevy
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-neutral-950/60 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Volumen Última Sesión</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-emerald-400">
            {latestWorkout
              ? `${Math.round(latestWorkout.totalVolumeKg).toLocaleString("es-MX")} kg`
              : "0 kg"}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {latestWorkout ? `${latestWorkout.setsCount} series completadas` : "Sin datos"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-neutral-950/60 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Última Rutina</span>
            <Flame className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-white truncate">
            {latestWorkout ? latestWorkout.title : "Ninguna"}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {latestWorkout ? latestWorkout.date : "Pulsa Sincronizar"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-neutral-950/60 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Tiempo de Sesión</span>
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-indigo-400">
            {latestWorkout ? formatDuration(latestWorkout.durationSeconds) : "0 min"}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {latestWorkout ? `${latestWorkout.exercisesCount} ejercicios` : "-"}
          </div>
        </div>
      </div>

      {/* 4. Latest Workouts List & Detailed Exercise Breakdown */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Sesiones de Entrenamiento Recientes
          </h4>
          <span className="text-[11px] text-neutral-500 font-mono">
            {recentWorkouts.length} sincronizadas
          </span>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-white/8 bg-neutral-950/40">
            <Dumbbell className="h-8 w-8 text-cyan-500/40 mx-auto mb-2" />
            <p className="text-xs text-neutral-400 mb-3">
              Aún no hay entrenamientos de Hevy sincronizados localmente en Brio.
            </p>
            <button
              type="button"
              onClick={handleSync}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              <span>Realizar primera sincronización</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentWorkouts.map((workout) => {
              const isExpanded = expandedWorkoutId === workout.id;

              return (
                <div
                  key={workout.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? "border-cyan-500/30 bg-neutral-950/80 shadow-lg shadow-cyan-950/20"
                      : "border-white/6 bg-neutral-950/40 hover:border-white/12"
                  }`}
                >
                  {/* Workout Header Bar */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedWorkoutId(isExpanded ? null : workout.id)
                    }
                    className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-white/2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-xs shrink-0">
                        {workout.title.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white tracking-tight">
                            {workout.title}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400 bg-white/4 px-2 py-0.5 rounded-md">
                            {workout.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                          <span>{workout.exercisesCount} ejercicios</span>
                          <span>•</span>
                          <span>{workout.setsCount} series</span>
                          <span>•</span>
                          <span className="text-cyan-400 font-mono font-semibold">
                            {Math.round(workout.totalVolumeKg).toLocaleString("es-MX")} kg
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
                        {formatDuration(workout.durationSeconds)}
                      </span>
                      <div className="p-1 rounded-lg text-neutral-400 hover:text-white">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Exercise Breakdown */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-white/6 mt-1 space-y-3 animate-in fade-in duration-200">
                      {workout.description && (
                        <p className="text-xs text-neutral-400 italic bg-neutral-900/60 p-2.5 rounded-xl border border-white/4">
                          {workout.description}
                        </p>
                      )}

                      <div className="space-y-2.5">
                        {workout.exercises.map((exercise, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl border border-white/4 bg-neutral-900/40 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-neutral-200">
                                {exercise.title}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-500">
                                {exercise.sets.length} {exercise.sets.length === 1 ? "set" : "sets"}
                              </span>
                            </div>

                            {exercise.notes && (
                              <p className="text-[11px] text-cyan-300/80 italic">
                                💬 {exercise.notes}
                              </p>
                            )}

                            {/* Sets Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {exercise.sets.map((set, sIdx) => {
                                const isWarmup = set.type === "warmup";
                                const isFailure = set.type === "failure";
                                const isDrop = set.type === "drop";

                                const badgeColor = isWarmup
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                  : isFailure
                                  ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                                  : isDrop
                                  ? "bg-purple-500/10 border-purple-500/20 text-purple-300"
                                  : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300";

                                return (
                                  <span
                                    key={sIdx}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono font-medium ${badgeColor}`}
                                  >
                                    <span className="opacity-60">
                                      {isWarmup ? "W" : isFailure ? "F" : isDrop ? "D" : `${sIdx + 1}`}:
                                    </span>
                                    <span>
                                      {set.reps ? `${set.reps} reps` : ""}
                                      {set.weightKg ? ` @ ${Number(set.weightKg.toFixed(1))}kg` : ""}
                                      {set.durationSeconds ? ` (${set.durationSeconds}s)` : ""}
                                      {set.rpe ? ` • RPE ${set.rpe}` : ""}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
