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
    <div className="flex flex-col gap-6 rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm relative font-sans">
      {/* 1. Header with Clock, Active Pill & Settings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2723] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D99B43]/30 bg-[#221D16] text-[#D99B43] shadow-xs">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-[#F5F2EB] tracking-tight">
                Ritmo Hormonal Masculino 24h
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D99B43]/30 bg-[#221D16] px-2 py-0.5 text-[10px] font-mono font-bold text-[#D99B43]">
                <Sparkles className="h-3 w-3" /> 10h Sueño • Gym 12-2PM • 7PM Hard Stop
              </span>
            </div>
            <p className="text-xs text-[#8E867B] mt-1 flex flex-wrap items-center gap-2 font-mono">
              <span>Hora actual: <strong className="text-[#F5F2EB]">{status.timeFormatted}</strong></span>
              <span>•</span>
              <span className="text-[#DDD6C9]">
                Fase actual: <span className="text-[#D99B43] font-bold">{status.currentPhase.name}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono">
          {/* Hard Stop Badge Alert */}
          {status.isHardStopActive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E05D52]/40 bg-[#2A1715] text-[#E05D52] text-xs font-semibold">
              <ShieldAlert className="h-4 w-4" />
              <span>Hard Stop 7:00 PM Activo</span>
            </div>
          )}

          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2723] bg-[#121110] text-xs font-medium text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Configurar Horarios</span>
          </button>
        </div>
      </div>

      {/* 2. 24-Hour Interactive Timeline Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[#8E867B] px-1 font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#8E867B]" />
            <span>Mapa del Día de 24 Horas</span>
          </span>
          <span className="text-[11px] text-[#8E867B]">
            Haz clic en cualquier bloque para ver detalles
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
                className={`relative flex flex-col p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "bg-[#221D16] border-[#D99B43]/50 shadow-xs"
                    : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] hover:bg-[#181715]"
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D99B43]" />
                  </span>
                )}

                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F2EB]">
                  <span>{phase.icon}</span>
                  <span className="truncate">{phase.shortName}</span>
                </div>

                <div className="text-[10px] text-[#8E867B] font-mono mt-1">
                  {phase.startTime} - {phase.endTime}
                </div>

                {isCurrent && (
                  <div className="mt-2 flex items-center justify-between gap-1 text-[9px] font-mono font-bold text-[#D99B43]">
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
      <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-5 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activePhase.icon}</span>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#D99B43]">
                  {activePhase.hormoneFocus}
                </span>
                <h4 className="font-serif text-base font-bold text-[#F5F2EB]">
                  {activePhase.name} ({activePhase.startTime} - {activePhase.endTime})
                </h4>
              </div>
            </div>

            <p className="text-xs text-[#DDD6C9] leading-relaxed">
              {activePhase.description}
            </p>

            {/* Key tips bullets */}
            <div className="flex flex-wrap gap-2 mt-1">
              {activePhase.keyNutrientsOrTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-md border border-[#2A2723] bg-[#181715] px-2.5 py-1 text-[11px] text-[#DDD6C9]"
                >
                  <CheckCircle2 className="h-3 w-3 text-[#7EA35A] shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contextual Action Button based on phase */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center font-mono">
            {activePhase.id === "morning_deep_work" && (
              <button
                onClick={onOpenFocus}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold shadow-xs transition-all cursor-pointer font-sans"
              >
                <Zap className="h-4 w-4" />
                <span>Iniciar Deep Work (⌘P)</span>
              </button>
            )}

            {activePhase.id === "gym_power" && (
              <button
                onClick={onOpenHevy}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold shadow-xs transition-all cursor-pointer font-sans"
              >
                <Dumbbell className="h-4 w-4" />
                <span>Ver Hevy Workout (Gym)</span>
              </button>
            )}

            {activePhase.id === "anabolic_lunch" && (
              <button
                onClick={onOpenPantry}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110] text-xs font-bold shadow-xs transition-all cursor-pointer font-sans"
              >
                <Salad className="h-4 w-4" />
                <span>Asistente &ldquo;Qué Cocinar&rdquo; (&lt;15m)</span>
              </button>
            )}

            {(activePhase.id === "evening_hard_stop" || status.isHardStopActive) && (
              <button
                onClick={onOpenEveningReview}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold shadow-xs transition-all cursor-pointer font-sans"
              >
                <Moon className="h-4 w-4" />
                <span>Cierre Nocturno (⌘E)</span>
              </button>
            )}

            {selectedPhaseId && selectedPhaseId !== status.currentPhase.id && (
              <button
                onClick={() => setSelectedPhaseId(null)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2723] bg-[#181715] text-[11px] text-[#8E867B] hover:text-[#F5F2EB] transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Volver a la Fase Actual</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Daily Hormonal Checklist (7 Pilares Masculinos) */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#2A2723] bg-[#121110] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#D99B43]" />
            <h4 className="font-serif text-xs font-bold text-[#F5F2EB] uppercase tracking-wider">
              Checklist Diario: 7 Pilares de Rendimiento Androgénico
            </h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-1.5 rounded-full bg-[#181715] overflow-hidden border border-[#2A2723]">
              <div
                className="h-full bg-[#D99B43] transition-all duration-300"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#D99B43] font-mono">
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
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                  isDone
                    ? "bg-[#1C2219] border-[#7EA35A]/30 text-[#DDD6C9]"
                    : "bg-[#181715] border-[#2A2723] text-[#8E867B] hover:border-[#38332D]"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-0.5 transition-colors ${
                    isDone
                      ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                      : "border-[#2A2723] bg-[#121110] text-transparent"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F5F2EB]">
                    <span>{item.icon}</span>
                    <span className={isDone ? "line-through text-[#8E867B]" : ""}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8E867B] mt-0.5 leading-tight font-mono">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl relative font-sans">
            <button
              onClick={() => setIsConfigOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 border-b border-[#2A2723] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#F5F2EB]">
                  Ajustar Horario Hormonal 24h
                </h3>
                <p className="text-xs text-[#8E867B]">
                  Personaliza tus horas de sueño, gimnasio y cortes de trabajo
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4 font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-sans font-medium text-[#DDD6C9]">
                    💤 Inicio Sueño (10h)
                  </label>
                  <input
                    type="time"
                    name="sleepStart"
                    defaultValue={config.sleepStart}
                    className="px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[#F5F2EB] text-xs focus:border-[#D99B43] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-sans font-medium text-[#DDD6C9]">
                    ☀️ Despertar
                  </label>
                  <input
                    type="time"
                    name="sleepEnd"
                    defaultValue={config.sleepEnd}
                    className="px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[#F5F2EB] text-xs focus:border-[#D99B43] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-sans font-medium text-[#DDD6C9]">
                    ⚡ Inicio Deep Work
                  </label>
                  <input
                    type="time"
                    name="morningFocusStart"
                    defaultValue={config.morningFocusStart}
                    className="px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[#F5F2EB] text-xs focus:border-[#D99B43] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-sans font-medium text-[#DDD6C9]">
                    🏋️ Inicio Gym (Hevy)
                  </label>
                  <input
                    type="time"
                    name="gymStart"
                    defaultValue={config.gymStart}
                    className="px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[#F5F2EB] text-xs focus:border-[#D99B43] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-sans font-medium text-[#DDD6C9]">
                    🥗 Almuerzo Post-Gym
                  </label>
                  <input
                    type="time"
                    name="lunchStart"
                    defaultValue={config.lunchStart}
                    className="px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[#F5F2EB] text-xs focus:border-[#D99B43] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-sans font-medium text-[#DDD6C9]">
                    ⛔ Hard Stop Laboral
                  </label>
                  <input
                    type="time"
                    name="workHardStop"
                    defaultValue={config.workHardStop}
                    className="px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-[#E05D52] font-bold text-xs focus:border-[#E05D52] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#2A2723] font-sans">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs cursor-pointer"
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
