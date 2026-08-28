"use client";

import { syncHevyWorkoutsAction } from "@/app/actions/health";
import { HevyStats, HevyWorkout } from "@/lib/types";
import {
  Check,
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
  const [showWebhookInfo, setShowWebhookInfo] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const latestWorkout = recentWorkouts[0];
  const totalWorkouts = stats?.totalWorkouts || recentWorkouts.length;

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
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm font-sans">
      {/* 1. Header with Hevy Branding & Quick Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2723]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] shadow-xs">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
                Hevy Tracker Integrado
              </h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          <button
            type="button"
            onClick={() => setShowWebhookInfo(!showWebhookInfo)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs font-semibold text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-all cursor-pointer"
            title="Configuración de Webhook en tiempo real"
          >
            <Webhook className="h-3.5 w-3.5 text-[#D99B43]" />
            <span className="hidden sm:inline">Webhook</span>
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] font-bold text-xs text-[#121110] transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer font-sans"
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
          className={`mt-4 p-3 rounded-lg border text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${syncFeedback.type === "success"
            ? "bg-[#1C2219] border-[#7EA35A]/30 text-[#7EA35A]"
            : "bg-[#2A1715] border-[#E05D52]/30 text-[#E05D52]"
            }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === "success" ? (
              <Sparkles className="h-4 w-4 text-[#7EA35A]" />
            ) : (
              <Zap className="h-4 w-4 text-[#E05D52]" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Webhook Setup Banner (Collapsible) */}
      {showWebhookInfo && (
        <div className="mt-4 p-4 rounded-lg border border-[#2A2723] bg-[#121110] space-y-3 animate-in fade-in duration-200 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D99B43] flex items-center gap-1.5 font-sans">
              <Radio className="h-3.5 w-3.5 text-[#D99B43]" />
              Sincronización Automática con Webhook
            </span>
            <a
              href="https://hevy.com/settings?developer"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#D99B43] hover:underline inline-flex items-center gap-1 font-sans"
            >
              Abrir Hevy Web <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-[#8E867B] leading-relaxed font-sans">
            Pega esta URL en tu panel de Desarrollador en Hevy (sección Webhooks). Cada vez que termines un entrenamiento en la app, Brio se actualizará automáticamente:
          </p>
          <div className="flex items-center gap-2 bg-[#181715] border border-[#2A2723] rounded-lg p-2.5 font-mono text-xs text-[#DDD6C9]">
            <span className="truncate flex-1">
              {typeof window !== "undefined" ? window.location.origin : "https://brio.app"}
              /api/webhooks/hevy
            </span>
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 hover:bg-[#2A241C] text-xs font-sans font-semibold transition-all shrink-0 cursor-pointer"
            >
              {copiedWebhook ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#7EA35A]" />
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
        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
            <span>Total Sesiones</span>
            <Layers className="h-3.5 w-3.5 text-[#D99B43]" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-[#F5F2EB]">
            {totalWorkouts > 0 ? `${totalWorkouts} entrenos` : "0"}
          </div>
          <div className="text-[10px] text-[#8E867B] mt-0.5 font-mono">
            Registrados en Hevy
          </div>
        </div>

        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
            <span>Volumen Última Sesión</span>
            <TrendingUp className="h-3.5 w-3.5 text-[#7EA35A]" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-[#7EA35A]">
            {latestWorkout
              ? `${Math.round(latestWorkout.totalVolumeKg).toLocaleString("es-MX")} kg`
              : "0 kg"}
          </div>
          <div className="text-[10px] text-[#8E867B] mt-0.5 font-mono">
            {latestWorkout ? `${latestWorkout.setsCount} series completadas` : "Sin datos"}
          </div>
        </div>

        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
            <span>Última Rutina</span>
            <Flame className="h-3.5 w-3.5 text-[#D99B43]" />
          </div>
          <div className="mt-1.5 text-xl font-bold text-[#F5F2EB] truncate font-serif">
            {latestWorkout ? latestWorkout.title : "Ninguna"}
          </div>
          <div className="text-[10px] text-[#8E867B] mt-0.5 font-mono">
            {latestWorkout ? latestWorkout.date : "Pulsa Sincronizar"}
          </div>
        </div>

        <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
            <span>Tiempo de Sesión</span>
            <Clock className="h-3.5 w-3.5 text-[#4EAB9E]" />
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-[#4EAB9E]">
            {latestWorkout ? formatDuration(latestWorkout.durationSeconds) : "0 min"}
          </div>
          <div className="text-[10px] text-[#8E867B] mt-0.5 font-mono">
            {latestWorkout ? `${latestWorkout.exercisesCount} ejercicios` : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
