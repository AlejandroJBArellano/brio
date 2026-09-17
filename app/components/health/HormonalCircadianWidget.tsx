"use client";

import {
  fetchHormonalDashboardDataAction,
  saveHormonalScheduleConfigAction,
} from "@/app/actions/hormonal";
import {
  DEFAULT_HORMONAL_CONFIG,
  HORMONAL_PHASES_CATALOG,
  getHormonalStatus,
} from "@/lib/hormonal";
import {
  HormonalPhaseConfig,
  HormonalPhaseId,
  HormonalScheduleConfig,
} from "@/lib/types";
import {
  Briefcase,
  Clock,
  Dumbbell,
  Moon,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Sun,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface HormonalCircadianWidgetProps {
  onOpenTraining?: () => void;
  onOpenPantry?: () => void;
  onOpenFocus?: () => void;
  onOpenEveningReview?: () => void;
}

function getPhaseIcon(iconName: string, className = "h-4 w-4") {
  switch (iconName) {
    case "Sun":
      return <Sun className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Dumbbell":
      return <Dumbbell className={className} />;
    case "Utensils":
      return <Utensils className={className} />;
    case "Briefcase":
      return <Briefcase className={className} />;
    case "Moon":
      return <Moon className={className} />;
    default:
      return <Clock className={className} />;
  }
}

export function HormonalCircadianWidget({
  onOpenTraining,
  onOpenPantry,
  onOpenFocus,
  onOpenEveningReview,
}: HormonalCircadianWidgetProps) {
  const [config, setConfig] = useState<HormonalScheduleConfig>(DEFAULT_HORMONAL_CONFIG);
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
    });
  }, []);

  const status = getHormonalStatus(currentTime, config);
  const activePhase = selectedPhaseId
    ? HORMONAL_PHASES_CATALOG[selectedPhaseId]
    : status.currentPhase;

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
    <div className="flex flex-col gap-4 rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm relative font-sans">
      {/* 1. Header with Clock, Current Phase & Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2723] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#F5F2EB]">
              Ritmo 24h
            </h3>
            <p className="text-xs text-[#8E867B] font-mono flex items-center gap-2 mt-0.5">
              <span>Hora: <strong className="text-[#F5F2EB]">{status.timeFormatted}</strong></span>
              <span>•</span>
              <span>Fase: <strong className="text-[#D99B43]">{status.currentPhase.name}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.isHardStopActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E05D52]/40 bg-[#2A1715] text-[#E05D52] text-xs font-mono font-medium">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Hard Stop Activo</span>
            </div>
          )}

          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2723] bg-[#121110] text-xs font-medium text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5 text-[#8E867B]" />
            <span>Configurar</span>
          </button>
        </div>
      </div>

      {/* 2. 24-Hour Interactive Timeline Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {allPhases.map((phase) => {
          const isCurrent = status.currentPhase.id === phase.id;
          const isSelected = selectedPhaseId === phase.id || (!selectedPhaseId && isCurrent);

          return (
            <button
              key={phase.id}
              onClick={() => setSelectedPhaseId(phase.id)}
              className={`relative flex flex-col p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
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
                <span className={isSelected ? "text-[#D99B43]" : "text-[#8E867B]"}>
                  {getPhaseIcon(phase.icon, "h-3.5 w-3.5")}
                </span>
                <span className="truncate">{phase.shortName}</span>
              </div>

              <div className="text-[10px] text-[#8E867B] font-mono mt-1">
                {phase.startTime} - {phase.endTime}
              </div>

              {isCurrent && (
                <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono font-semibold text-[#D99B43]">
                  <span>En vivo</span>
                  <span>{status.remainingFormatted}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Condensed Active Phase Card */}
      <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2A2723] bg-[#181715] text-[#D99B43]">
            {getPhaseIcon(activePhase.icon, "h-5 w-5")}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">
                {activePhase.name}
              </h4>
              <span className="text-[11px] font-mono text-[#8E867B]">
                ({activePhase.startTime} - {activePhase.endTime})
              </span>
            </div>
            <p className="text-xs text-[#DDD6C9]">
              {activePhase.description}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {activePhase.id === "morning_deep_work" && (
            <button
              onClick={onOpenFocus}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold transition-colors cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Iniciar Deep Work (⌘P)</span>
            </button>
          )}

          {activePhase.id === "gym_power" && (
            <button
              onClick={onOpenTraining}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold transition-colors cursor-pointer"
            >
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Ver Entrenamiento</span>
            </button>
          )}

          {activePhase.id === "anabolic_lunch" && (
            <button
              onClick={onOpenPantry}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110] text-xs font-bold transition-colors cursor-pointer"
            >
              <Utensils className="h-3.5 w-3.5" />
              <span>Asistente de Cocina</span>
            </button>
          )}

          {(activePhase.id === "evening_hard_stop" || status.isHardStopActive) && (
            <button
              onClick={onOpenEveningReview}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold transition-colors cursor-pointer"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Cierre Nocturno (⌘E)</span>
            </button>
          )}

          {selectedPhaseId && selectedPhaseId !== status.currentPhase.id && (
            <button
              onClick={() => setSelectedPhaseId(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2723] bg-[#181715] text-xs text-[#8E867B] hover:text-[#F5F2EB] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Fase actual</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Config Modal for Adjusting Schedule */}
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
                  Ajustar Horarios 24h
                </h3>
                <p className="text-xs text-[#8E867B]">
                  Personaliza tus horas de sueño, gimnasio y corte laboral
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4 font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-sans font-medium text-[#DDD6C9]">
                    Inicio Sueño (10h)
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
                    Despertar
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
                    Inicio Deep Work
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
                    Inicio Gimnasio
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
                    Almuerzo
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
                    Corte Laboral (Hard Stop)
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
