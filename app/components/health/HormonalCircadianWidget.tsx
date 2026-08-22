"use client";

import {
  fetchHormonalDashboardDataAction,
  saveHormonalScheduleConfigAction,
  toggleHormonalChecklistItemAction,
} from "@/app/actions/hormonal";
import {
  DEFAULT_HORMONAL_CHECKLIST,
  DEFAULT_HORMONAL_CONFIG,
  HORMONAL_PHASES_CATALOG,
  getHormonalStatus,
} from "@/lib/hormonal";
import {
  HormonalDailyChecklist,
  HormonalPhaseConfig,
  HormonalPhaseId,
  HormonalScheduleConfig,
} from "@/lib/types";
import {
  Award,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Moon,
  RotateCcw,
  Salad,
  Settings2,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface HormonalCircadianWidgetProps {
  onOpenHevy?: () => void;
  onOpenPantry?: () => void;
  onOpenFocus?: () => void;
  onOpenEveningReview?: () => void;
}

const CHECKLIST_ITEMS: {
  key: keyof HormonalDailyChecklist;
  label: string;
  sublabel: string;
  icon: string;
  phaseId: HormonalPhaseId;
}[] = [
  {
    key: "sleep10hLogged",
    label: "10 Horas de Sueño Profundo",
    sublabel: "21:30 - 07:30: Síntesis de Testosterona y Hormona de Crecimiento",
    icon: "💤",
    phaseId: "deep_sleep_10h",
  },
  {
    key: "morningSunlight",
    label: "Carga de Luz Solar & Hidratación",
    sublabel: "07:30 - 08:30: 10-15m sol directo + 500ml agua con electrolitos",
    icon: "☀️",
    phaseId: "wake_sunlight",
  },
  {
    key: "morningDeepWorkDone",
    label: "Deep Work Matutino (Must-Win)",
    sublabel: "08:30 - 12:00: Tareas de mayor dificultad en pico de dopamina",
    icon: "⚡",
    phaseId: "morning_deep_work",
  },
  {
    key: "gymSessionCompleted",
    label: "Entrenamiento de Fuerza en Gym",
    sublabel: "12:00 - 14:00: Sobrecarga progresiva y corte mental (Hevy)",
    icon: "🏋️",
    phaseId: "gym_power",
  },
  {
    key: "postGymNutrition",
    label: "Almuerzo Anabólico Post-Gym",
    sublabel: "14:00 - 15:00: Comida <15m densa en proteína/grasas sin somnolencia",
    icon: "🥗",
    phaseId: "anabolic_lunch",
  },
  {
    key: "hardStop7pmRespected",
    label: "Hard Stop a las 7:00 PM",
    sublabel: "19:00: Cierre absoluto del trabajo laboral (Work Shutdown ⌘E)",
    icon: "⛔",
    phaseId: "evening_hard_stop",
  },
  {
    key: "nightDimLightMagnesium",
    label: "Dim Light & Magnesio / Zinc",
    sublabel: "20:00 - 21:30: Luz cálida tenue y preparación para el sueño",
    icon: "🌙",
    phaseId: "evening_hard_stop",
  },
];

export function HormonalCircadianWidget({
  onOpenHevy,
  onOpenPantry,
  onOpenFocus,
  onOpenEveningReview,
}: HormonalCircadianWidgetProps) {
  const [config, setConfig] = useState<HormonalScheduleConfig>(DEFAULT_HORMONAL_CONFIG);
  const [checklist, setChecklist] = useState<HormonalDailyChecklist>(DEFAULT_HORMONAL_CHECKLIST);
  const [selectedPhaseId, setSelectedPhaseId] = useState<HormonalPhaseId | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();

  // Polling / live clock every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Initial fetch from DB
  useEffect(() => {
    fetchHormonalDashboardDataAction().then((res) => {
      if (res.config) setConfig(res.config);
      if (res.todayChecklist) setChecklist(res.todayChecklist);
    });
  }, []);

  const status = getHormonalStatus(currentTime, config);
  const activePhase = selectedPhaseId
    ? HORMONAL_PHASES_CATALOG[selectedPhaseId]
    : status.currentPhase;

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const checklistPercent = Math.round((completedChecklistCount / CHECKLIST_ITEMS.length) * 100);

  const handleToggleChecklist = (key: keyof HormonalDailyChecklist) => {
    // Optimistic update
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    startTransition(async () => {
      await toggleHormonalChecklistItemAction(key);
    });
  };

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated: Partial<HormonalScheduleConfig> = {
      sleepStart: String(formData.get("sleepStart") || config.sleepStart),
      sleepEnd: String(formData.get("sleepEnd") || config.sleepEnd),
      morningFocusStart: String(formData.get("morningFocusStart") || config.morningFocusStart),
      morningFocusEnd: String(formData.get("morningFocusEnd") || config.morningFocusEnd),
      gymStart: String(formData.get("gymStart") || config.gymStart),
      gymEnd: String(formData.get("gymEnd") || config.gymEnd),
      lunchStart: String(formData.get("lunchStart") || config.lunchStart),
      lunchEnd: String(formData.get("lunchEnd") || config.lunchEnd),
      workHardStop: String(formData.get("workHardStop") || config.workHardStop),
    };
    setConfig((prev) => ({ ...prev, ...updated }));
    setIsConfigOpen(false);
    startTransition(async () => {
      await saveHormonalScheduleConfigAction(updated);
    });
  };

  const allPhases: HormonalPhaseConfig[] = [
    HORMONAL_PHASES_CATALOG.wake_sunlight,
    HORMONAL_PHASES_CATALOG.morning_deep_work,
    HORMONAL_PHASES_CATALOG.gym_power,
    HORMONAL_PHASES_CATALOG.anabolic_lunch,
    HORMONAL_PHASES_CATALOG.afternoon_flow,
    HORMONAL_PHASES_CATALOG.evening_hard_stop,
    HORMONAL_PHASES_CATALOG.deep_sleep_10h,
  ];

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-white/8 bg-neutral-900/90 p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-20 transition-all duration-700"
        style={{ backgroundColor: activePhase.color }}
      />

      {/* 1. Header with Clock, Active Pill & Settings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/6 pb-5">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 hover:scale-105"
            style={{
              backgroundColor: `${activePhase.color}15`,
              borderColor: `${activePhase.color}35`,
              color: activePhase.color,
            }}
          >
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Ritmo Hormonal Masculino 24h
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                <Sparkles className="h-3 w-3" /> 10h Sueño • Gym 12-2PM • 7PM Hard Stop
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
              <span>Hora actual: <strong className="text-neutral-200">{status.timeFormatted}</strong></span>
              <span>•</span>
              <span className="text-neutral-300 font-medium">
                Fase actual: <span style={{ color: status.currentPhase.color }}>{status.currentPhase.name}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Hard Stop Badge Alert */}
          {status.isHardStopActive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-300 text-xs font-semibold animate-bounce">
              <ShieldAlert className="h-4 w-4" />
              <span>Hard Stop 7:00 PM Activo</span>
            </div>
          )}

          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Configurar Horarios</span>
          </button>
        </div>
      </div>

      {/* 2. 24-Hour Interactive Timeline Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
            <span>Mapa del Día de 24 Horas</span>
          </span>
          <span className="text-[11px] text-neutral-500">
            Haz clic en cualquier bloque para ver detalles y consejos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {allPhases.map((phase) => {
            const isCurrent = status.currentPhase.id === phase.id;
            const isSelected = selectedPhaseId === phase.id || (!selectedPhaseId && isCurrent);

            return (
              <button
                key={phase.id}
                onClick={() => setSelectedPhaseId(phase.id)}
                className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? "bg-neutral-800/90 border-white/25 shadow-lg scale-[1.02]"
                    : "bg-neutral-950/60 border-white/6 hover:bg-neutral-800/50 hover:border-white/12"
                }`}
                style={{
                  borderLeftColor: phase.color,
                  borderLeftWidth: "4px",
                }}
              >
                {isCurrent && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: phase.color }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: phase.color }}
                    />
                  </span>
                )}

                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <span>{phase.icon}</span>
                  <span className="truncate">{phase.shortName}</span>
                </div>

                <div className="text-[10px] text-neutral-400 font-mono mt-1">
                  {phase.startTime} - {phase.endTime}
                </div>

                {isCurrent && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-[9px] font-bold" style={{ color: phase.color }}>
                    <span>EN VIVO ({status.progressPercent}%)</span>
                    <span>{status.remainingFormatted}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Hero Active Phase Card with Action Triggers */}
      <div
        className="rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden"
        style={{
          backgroundColor: `${activePhase.color}08`,
          borderColor: `${activePhase.color}30`,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activePhase.icon}</span>
              <div>
                <span
                  className="text-[11px] font-bold tracking-wider uppercase"
                  style={{ color: activePhase.color }}
                >
                  {activePhase.hormoneFocus}
                </span>
                <h4 className="text-base font-bold text-white">
                  {activePhase.name} ({activePhase.startTime} - {activePhase.endTime})
                </h4>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {activePhase.description}
            </p>

            {/* Key tips bullets */}
            <div className="flex flex-wrap gap-2 mt-1">
              {activePhase.keyNutrientsOrTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg border border-white/6 bg-neutral-950/60 px-2.5 py-1 text-[11px] text-neutral-300"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual Action Button based on phase */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center">
            {activePhase.id === "morning_deep_work" && (
              <button
                onClick={onOpenFocus}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4" />
                <span>Iniciar Deep Work (⌘P)</span>
              </button>
            )}

            {activePhase.id === "gym_power" && (
              <button
                onClick={onOpenHevy}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
              >
                <Dumbbell className="h-4 w-4" />
                <span>Ver Hevy Workout (Gym)</span>
              </button>
            )}

            {activePhase.id === "anabolic_lunch" && (
              <button
                onClick={onOpenPantry}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <Salad className="h-4 w-4" />
                <span>Asistente &ldquo;Qué Cocinar&rdquo; (&lt;15m)</span>
              </button>
            )}

            {(activePhase.id === "evening_hard_stop" || status.isHardStopActive) && (
              <button
                onClick={onOpenEveningReview}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
              >
                <Moon className="h-4 w-4" />
                <span>Cierre Nocturno (⌘E)</span>
              </button>
            )}

            {selectedPhaseId && selectedPhaseId !== status.currentPhase.id && (
              <button
                onClick={() => setSelectedPhaseId(null)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[11px] text-neutral-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Volver a la Fase Actual</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Daily Hormonal Checklist (7 Pilares Masculinos) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-neutral-950/70 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Checklist Diario: 7 Pilares de Rendimiento Androgénico
            </h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {completedChecklistCount}/{CHECKLIST_ITEMS.length} ({checklistPercent}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
          {CHECKLIST_ITEMS.map((item) => {
            const isDone = Boolean(checklist[item.key]);
            return (
              <button
                key={item.key}
                onClick={() => handleToggleChecklist(item.key)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                  isDone
                    ? "bg-emerald-950/30 border-emerald-500/30 text-neutral-200"
                    : "bg-neutral-900/60 border-white/6 text-neutral-400 hover:border-white/12 hover:bg-neutral-900"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border mt-0.5 transition-colors ${
                    isDone
                      ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                      : "border-neutral-700 bg-neutral-800 text-transparent"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <span>{item.icon}</span>
                    <span className={isDone ? "line-through text-neutral-400" : ""}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                    {item.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Config Modal for Adjusting Schedule */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/12 bg-neutral-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Ajustar Horario Hormonal 24h
                </h3>
                <p className="text-xs text-neutral-400">
                  Personaliza tus horas de sueño, gimnasio y cortes de trabajo
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    💤 Inicio Sueño (10h)
                  </label>
                  <input
                    type="time"
                    name="sleepStart"
                    defaultValue={config.sleepStart}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    ☀️ Despertar
                  </label>
                  <input
                    type="time"
                    name="sleepEnd"
                    defaultValue={config.sleepEnd}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    ⚡ Inicio Deep Work
                  </label>
                  <input
                    type="time"
                    name="morningFocusStart"
                    defaultValue={config.morningFocusStart}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    🏋️ Inicio Gym (Hevy)
                  </label>
                  <input
                    type="time"
                    name="gymStart"
                    defaultValue={config.gymStart}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    🥗 Almuerzo Post-Gym
                  </label>
                  <input
                    type="time"
                    name="lunchStart"
                    defaultValue={config.lunchStart}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    ⛔ Hard Stop Laboral
                  </label>
                  <input
                    type="time"
                    name="workHardStop"
                    defaultValue={config.workHardStop}
                    className="px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-rose-400 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/6">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-neutral-300 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Guardar Horarios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
