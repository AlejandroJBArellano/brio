"use client";

import { saveMorningRitualAction } from "@/app/actions/rituals";
import { toggleChecklistItemAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import { HabiticaTask, HabiticaUser } from "@/lib/types";
import {
  Check,
  Droplet,
  Moon,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useMemo, useOptimistic, useState, useTransition } from "react";

interface MorningRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: HabiticaUser;
  tasks: HabiticaTask[];
  onSuccess?: () => void;
}

const SLEEP_HOURS_OPTIONS = ["< 6h", "6h - 7h", "7h - 8h", "> 8h"];

const SLEEP_QUALITY_OPTIONS = [
  { id: "heavy", label: "Pesado / Inquieto", icon: "🌙" },
  { id: "normal", label: "Normal / Regular", icon: "☕" },
  { id: "restful", label: "Reparador / Profundo", icon: "✨" },
];

const ENERGY_LEVELS = [
  { level: 1, label: "Muy bajo", icon: "😴" },
  { level: 2, label: "Despertando", icon: "☕" },
  { level: 3, label: "Estable", icon: "⚡" },
  { level: 4, label: "Alto", icon: "🔥" },
  { level: 5, label: "Imparable", icon: "🚀" },
];

const DEFAULT_SELF_CARE_ITEMS = [
  { id: "water", text: "Tomar primer vaso de agua (500 ml)", icon: "💧" },
  { id: "smoothie", text: "Preparar y tomar licuado tranquilo", icon: "🥤" },
  { id: "hygiene", text: "Cepillarme los dientes y tender la cama", icon: "🛏️" },
  { id: "supplements", text: "Tomar suplementos matutinos", icon: "💊" },
];

export function MorningRitualModal({
  isOpen,
  onClose,
  user,
  tasks,
  onSuccess,
}: MorningRitualModalProps) {
  const [isPending, startTransition] = useTransition();

  // Bloque 1: Bio-Check de Sueño y Energía
  const [sleepHours, setSleepHours] = useState<string>("7h - 8h");
  const [sleepQuality, setSleepQuality] = useState<string>("normal");
  const [energyLevel, setEnergyLevel] = useState<number>(3);

  // Bloque 2: Habitica Morning Daily & Checklist
  const dailyTasks = useMemo(
    () => tasks.filter((t) => t.type === "daily"),
    [tasks]
  );

  // Auto-detect a Morning Daily or fallback
  const autoMorningDaily = useMemo(() => {
    return (
      dailyTasks.find((t) =>
        /matutina|mañana|morning|despertar|rutina/i.test(t.text)
      ) ||
      dailyTasks[0] ||
      null
    );
  }, [dailyTasks]);

  const [selectedDailyId, setSelectedDailyId] = useState<string | null>(
    autoMorningDaily?.id || null
  );

  const activeDaily = useMemo(() => {
    return dailyTasks.find((t) => t.id === selectedDailyId) || autoMorningDaily;
  }, [dailyTasks, selectedDailyId, autoMorningDaily]);

  // Optimistic checklist items for the active daily
  const rawChecklist = useMemo(() => {
    return activeDaily?.checklist || [];
  }, [activeDaily]);

  const [optimisticChecklist, setOptimisticChecklist] = useOptimistic(
    rawChecklist,
    (state, itemId: string) =>
      state.map((item) =>
        item.id === itemId
          ? { ...item, completed: !item.completed }
          : item
      )
  );

  // Fallback local items if no checklist on the Habitica daily
  const [localFallbackChecks, setLocalFallbackChecks] = useState<
    Record<string, boolean>
  >({});

  if (!isOpen) return null;

  const handleToggleHabiticaChecklist = (itemId?: string) => {
    if (!itemId || !activeDaily) return;
    soundFx.taskComplete();
    startTransition(async () => {
      setOptimisticChecklist(itemId);
      await toggleChecklistItemAction(activeDaily.id, itemId);
    });
  };

  const handleToggleFallbackCheck = (id: string) => {
    soundFx.taskComplete();
    setLocalFallbackChecks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFinish = () => {
    soundFx.taskComplete();
    startTransition(async () => {
      await saveMorningRitualAction({
        energyLevel,
        sleepHours,
        sleepQuality,
      });

      if (onSuccess) onSuccess();
      onClose();
    });
  };

  const hasHabiticaChecklist =
    optimisticChecklist && optimisticChecklist.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-5"
        role="dialog"
      >
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7EA35A]/15 text-[#7EA35A] border border-[#7EA35A]/30">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB] tracking-tight">
                Despegue Suave & Autocuidado 🌿
              </h2>
              <p className="text-xs text-[#8E867B] font-mono">
                Tómate tu tiempo para despertar el cuerpo antes de abrir Slack.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 1: BIO-CHECK DE SUEÑO & NIVEL DE ENERGÍA                           */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-[#D99B43]" />
            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB]">
              1. ¿Cómo dormiste y cómo está tu energía hoy?
            </h3>
          </div>

          {/* Horas de sueño */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono text-[#8E867B]">
              Horas de sueño aproximadas:
            </label>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {SLEEP_HOURS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSleepHours(opt)}
                  className={`py-1.5 rounded-lg border text-center font-semibold transition-all cursor-pointer ${
                    sleepHours === opt
                      ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/50 shadow-xs"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Calidad de descanso */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono text-[#8E867B]">
              Sensación de descanso al despertar:
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {SLEEP_QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSleepQuality(opt.id)}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    sleepQuality === opt.id
                      ? "bg-[#141813] text-[#7EA35A] border-[#7EA35A]/50 shadow-xs font-semibold"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span className="text-[10px] leading-tight font-sans">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nivel de Energía */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono text-[#8E867B]">
              Nivel de energía física y mental actual:
            </label>
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              {ENERGY_LEVELS.map((lvl) => (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setEnergyLevel(lvl.level)}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    energyLevel === lvl.level
                      ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/50 shadow-xs font-bold"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <span className="text-lg">{lvl.icon}</span>
                  <span className="text-[9px] font-mono leading-tight">
                    {lvl.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BLOQUE 2: CHECKLIST FÍSICO DE AUTOCUIDADO (Habitica Sync)                 */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-[#4EAB9E]" />
              <h3 className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB]">
                2. Rutina Física de Autocuidado
              </h3>
            </div>

            {/* Daily Selector / Badge */}
            {activeDaily && (
              <span className="font-mono text-[10px] text-[#4EAB9E] bg-[#141C1A] px-2 py-0.5 rounded border border-[#4EAB9E]/30 truncate max-w-40">
                ⚡ Habitica: {activeDaily.text}
              </span>
            )}
          </div>

          {/* Case A: Synced Habitica Checklist */}
          {hasHabiticaChecklist ? (
            <div className="space-y-1.5">
              {optimisticChecklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleHabiticaChecklist(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                    item.completed
                      ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                      : "bg-[#181715] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                        item.completed
                          ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                          : "border-[#38332D] bg-[#121110]"
                      }`}
                    >
                      {item.completed && (
                        <Check className="h-3 w-3 stroke-3" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        item.completed
                          ? "line-through text-[#8E867B]"
                          : "text-[#F5F2EB]"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-[#8E867B]">
                    {item.completed ? "Listo ✓" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Case B: Fallback Standard Self-care items */
            <div className="space-y-1.5">
              {DEFAULT_SELF_CARE_ITEMS.map((item) => {
                const isChecked = Boolean(localFallbackChecks[item.id]);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleFallbackCheck(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      isChecked
                        ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                        : "bg-[#181715] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                            : "border-[#38332D] bg-[#121110]"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-3" />}
                      </div>
                      <span className="text-xs">{item.icon}</span>
                      <span
                        className={`text-xs ${
                          isChecked
                            ? "line-through text-[#8E867B]"
                            : "text-[#F5F2EB]"
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-[#8E867B]">
                      {isChecked ? "Listo ✓" : "Pendiente"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ACTION BUTTON (Complete & Sellar)                                         */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleFinish}
            className="w-full py-3.5 px-4 rounded-xl bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110] font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 font-sans active:scale-[0.99]"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {isPending ? "Despegando..." : "🌿 Despegar Mi Mañana (+30 XP)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
