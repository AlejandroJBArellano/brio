"use client";

import { saveEveningReviewAction } from "@/app/actions/rituals";
import { toggleChecklistItemAction, toggleSleepAction, toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import { HabiticaTask, HabiticaUser } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Bed,
  Check,
  ChevronDown,
  Heart,
  Moon,
  Sparkles,
  X
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

interface EveningReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: HabiticaUser;
  tasks: HabiticaTask[];
  totalAntSpentToday: number;
  dailyAntLimit: number;
  onSuccess?: () => void;
  onOpenNewTransaction?: () => void;
}

const FATIGUE_LEVELS = [
  { value: 1, label: "Agotado", emoji: "🪫", color: "text-[#E05D52] border-[#E05D52]/40 bg-[#221716]" },
  { value: 2, label: "Cansado", emoji: "😴", color: "text-[#D99B43] border-[#D99B43]/40 bg-[#221D16]" },
  { value: 3, label: "Normal", emoji: "⚖️", color: "text-[#8E867B] border-[#8E867B]/40 bg-[#181715]" },
  { value: 4, label: "Con Energía", emoji: "⚡", color: "text-[#7EA35A] border-[#7EA35A]/40 bg-[#141813]" },
  { value: 5, label: "Muy Despierto", emoji: "🔋", color: "text-[#4EAB9E] border-[#4EAB9E]/40 bg-[#141C1A]" },
];

export function EveningReviewModal({
  isOpen,
  onClose,
  user,
  tasks,
  totalAntSpentToday: _totalAntSpentToday,
  dailyAntLimit: _dailyAntLimit,
  onSuccess,
  onOpenNewTransaction: _onOpenNewTransaction,
}: EveningReviewModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();

  // Step 1: Dailies optimistic completed state & subtasks checklist optimistic state
  const [optimisticCompletedDailyIds, setOptimisticCompletedDailyIds] = useState<Set<string>>(new Set());
  const [optimisticChecklists, setOptimisticChecklists] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedDailyIds, setExpandedDailyIds] = useState<Record<string, boolean>>({});

  const toggleExpandDaily = (dailyId: string) => {
    setExpandedDailyIds((prev) => ({
      ...prev,
      [dailyId]: prev[dailyId] === undefined ? false : !prev[dailyId],
    }));
  };

  const handleToggleSubtask = (dailyId: string, itemId: string, currentCompleted: boolean) => {
    soundFx.taskComplete();
    setOptimisticChecklists((prev) => ({
      ...prev,
      [dailyId]: {
        ...(prev[dailyId] || {}),
        [itemId]: !(prev[dailyId]?.[itemId] ?? currentCompleted),
      },
    }));

    startTransition(async () => {
      await toggleChecklistItemAction(dailyId, itemId);
    });
  };

  // Step 2: Freeform Brain Dump / Reflection
  const [brainDump, setBrainDump] = useState("");

  // Step 3: Fatigue / Energy Level (1 to 5)
  const [energyLevel, setEnergyLevel] = useState<number>(2);

  // Completion State
  const [isShutdownComplete, setIsShutdownComplete] = useState(false);

  // Filter pending dailies: ONLY normal user dailies (no bracket prefix like [Brio], [Salud], etc.)
  const pendingDailies = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.type === "daily" &&
        t.isDue &&
        !t.text.trim().startsWith("[") &&
        !optimisticCompletedDailyIds.has(t.id)
    );
  }, [tasks, optimisticCompletedDailyIds]);

  const isResting = Boolean(user.preferences?.sleep ?? user.flags?.rest ?? false);

  if (!isOpen) return null;

  const handleToggleDaily = (taskId: string) => {
    soundFx.taskComplete();
    setOptimisticCompletedDailyIds((prev) => new Set(prev).add(taskId));
    startTransition(async () => {
      await toggleTaskAction(taskId, "up");
    });
  };

  const handleToggleInn = () => {
    soundFx.click();
    startTransition(async () => {
      await toggleSleepAction();
    });
  };


  const handleFinishShutdown = () => {
    soundFx.taskComplete();
    startTransition(async () => {
      await saveEveningReviewAction({
        reflection: brainDump.trim() || undefined,
        expensesLogged: true,
        energyLevel,
      });

      setIsShutdownComplete(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setIsShutdownComplete(false);
        setStep(1);
      }, 2200);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div
        className="w-full max-w-xl rounded-2xl border border-[#2A2723] bg-[#181715] p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative"
        role="dialog"
      >
        {/* ========================================================================= */}
        {/* SUCCESSFUL SHUTDOWN SCREEN                                                */}
        {/* ========================================================================= */}
        {isShutdownComplete ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#4EAB9E]/20 text-[#4EAB9E] border border-[#4EAB9E]/30 animate-pulse">
              <Moon className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#F5F2EB]">
                Día Cerrado con Éxito
              </h3>
              <p className="text-xs sm:text-sm text-[#8E867B] font-mono">
                Has protegido tu salud y vaciado tu mente. ¡Que descanses!
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#221D16] border border-[#D99B43]/30 text-xs font-mono text-[#D99B43]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>+XP Ganada en Habitica</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4EAB9E]/15 text-[#4EAB9E] border border-[#4EAB9E]/30">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB] tracking-tight">
                      Cierre Nocturno & Desconexión
                    </h2>
                  </div>
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
            {/* BLOQUE 1: CIERRE OPERATIVO & FINANZAS                                      */}
            {/* ========================================================================= */}
            {step === 1 && (
              <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                {/* Habitica Health & Dailies Audit Card */}
                <div className="p-4 rounded-xl border border-[#2A2723] bg-[#121110] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Heart className="h-4.5 w-4.5 text-[#E05D52]" />
                      <div>
                        <h4 className="text-xs font-bold text-[#F5F2EB] font-serif">
                          Salud de Habitica (HP: {user.stats.hp}/{user.stats.maxHealth || 50})
                        </h4>
                        <p className="text-[11px] text-[#8E867B] font-mono">
                          {pendingDailies.length > 0
                            ? `Tienes ${pendingDailies.length} daily(s) pendientes,`
                            : "Dailies completas"}
                        </p>
                      </div>
                    </div>

                    {/* Rest / Sleep Button */}
                    <button
                      type="button"
                      onClick={handleToggleInn}
                      disabled={isPending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${isResting
                        ? "bg-[#3D3425] text-[#E8AF59] border border-[#D99B43]/40 shadow-xs"
                        : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
                        }`}
                    >
                      <Bed className="h-3.5 w-3.5" />
                      <span>{isResting ? "Descansando" : "Descanso"}</span>
                    </button>
                  </div>

                  {/* Pending Dailies Quick Checklist with Subtasks Breakdown */}
                  {pendingDailies.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#2A2723] max-h-60 overflow-y-auto pr-1">
                      {pendingDailies.map((daily) => {
                        const hasChecklist = Boolean(daily.checklist && daily.checklist.length > 0);
                        const isExpanded = expandedDailyIds[daily.id] ?? true;
                        const checklist = daily.checklist || [];
                        const completedCount = checklist.filter((item) => {
                          const itemId = item.id || "";
                          return itemId && optimisticChecklists[daily.id]?.[itemId] !== undefined
                            ? optimisticChecklists[daily.id][itemId]
                            : Boolean(item.completed);
                        }).length;

                        return (
                          <div
                            key={daily.id}
                            className="rounded-xl border border-[#2A2723] bg-[#181715] p-2.5 space-y-2 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {hasChecklist && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandDaily(daily.id)}
                                    className="p-1 rounded text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
                                  >
                                    <ChevronDown
                                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "" : "-rotate-90"
                                        }`}
                                    />
                                  </button>
                                )}
                                <span className="text-[#F5F2EB] font-medium text-xs truncate">
                                  {daily.text}
                                </span>
                                {hasChecklist && (
                                  <span className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-1.5 py-0.5 rounded border border-[#2A2723] shrink-0">
                                    {completedCount}/{checklist.length}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleDaily(daily.id)}
                                disabled={isPending}
                                className="px-2.5 py-1 rounded-md bg-[#7EA35A]/15 text-[#7EA35A] border border-[#7EA35A]/30 hover:bg-[#7EA35A]/25 text-[11px] font-mono font-bold transition-colors cursor-pointer shrink-0 active:scale-95"
                              >
                                ✓ Marcar Hecha
                              </button>
                            </div>

                            {/* Subtasks breakdown */}
                            {hasChecklist && isExpanded && (
                              <div className="space-y-1 pl-4 sm:pl-6 pt-1.5 border-t border-[#22201D]">
                                {checklist.map((item, idx) => {
                                  const itemId = item.id || `chk-${idx}`;
                                  const isChecked = Boolean(
                                    optimisticChecklists[daily.id]?.[itemId] !== undefined
                                      ? optimisticChecklists[daily.id][itemId]
                                      : item.completed
                                  );
                                  return (
                                    <div
                                      key={itemId}
                                      onClick={() => {
                                        if (item.id) {
                                          handleToggleSubtask(daily.id, item.id, Boolean(item.completed));
                                        }
                                      }}
                                      className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${isChecked
                                        ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                                        : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#DDD6C9]"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div
                                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isChecked
                                            ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                                            : "border-[#38332D] bg-[#181715]"
                                            }`}
                                        >
                                          {isChecked && <Check className="h-2.5 w-2.5 stroke-3" />}
                                        </div>
                                        <span className={`text-[11px] truncate ${isChecked ? "line-through text-[#8E867B]" : ""}`}>
                                          {item.text}
                                        </span>
                                      </div>
                                      <span className="font-mono text-[9px] text-[#8E867B]">
                                        {isChecked ? "Listo ✓" : "Pendiente"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>



                {/* Navigation Button */}
                <div className="flex justify-end pt-3 border-t border-[#2A2723]">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D99B43] font-bold font-mono text-xs text-[#121110] hover:bg-[#E8AF59] transition-all cursor-pointer shadow-xs"
                  >
                    <span>Vaciado Mental</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* BLOQUE 2: VACIADO MENTAL LIBRE (BRAIN DUMP)                               */}
            {/* ========================================================================= */}
            {step === 2 && (
              <div className="mt-5 space-y-4 animate-in fade-in duration-200">
                <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 sm:p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">
                      Brain Dump
                    </h3>
                  </div>

                  <textarea
                    rows={6}
                    value={brainDump}
                    onChange={(e) => setBrainDump(e.target.value)}
                    placeholder="Ej. Mañana empezar directo con el fix de reportes. No olvidar revisar la reunión de las 11am... (Queda guardado en tu bitácora personal)"
                    className="w-full rounded-xl border border-[#2A2723] bg-[#181715] p-3.5 text-xs sm:text-sm text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none resize-none font-sans leading-relaxed transition-all"
                    autoFocus
                  />
                </div>

                {/* Fatigue / Energy Selector */}
                <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-2.5">
                  <span className="text-xs font-bold text-[#F5F2EB] font-serif block">
                    Nivel de cansancio al terminar el día:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                    {FATIGUE_LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => {
                          setEnergyLevel(lvl.value);
                          soundFx.click();
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${energyLevel === lvl.value
                          ? `${lvl.color} font-bold shadow-xs`
                          : "bg-[#181715] border-[#2A2723] text-[#8E867B] hover:text-[#DDD6C9]"
                          }`}
                      >
                        <span className="text-base">{lvl.emoji}</span>
                        <span className="text-[10px] leading-tight">{lvl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation & Final Shutdown Action */}
                <div className="flex justify-between items-center pt-3 border-t border-[#2A2723]">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.click();
                      setStep(1);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleFinishShutdown}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7EA35A] hover:bg-[#8FB866] font-bold font-mono text-xs sm:text-sm text-[#121110] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Moon className="h-4 w-4" />
                    <span>{isPending ? "Cerrando..." : "Listo"}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
