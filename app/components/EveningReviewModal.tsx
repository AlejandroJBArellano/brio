"use client";

import { saveEveningReviewAction } from "@/app/actions/rituals";
import { toggleSleepAction, toggleTaskAction } from "@/app/actions/tasks";
import { HabiticaTask, HabiticaUser } from "@/lib/types";
import {
  AlertTriangle,
  ArrowRight,
  Bed,
  CheckCircle2,
  Coffee,
  Coins,
  Heart,
  Moon,
  ShieldCheck,
  Smile,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";

interface EveningReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: HabiticaUser;
  tasks: HabiticaTask[];
  mustWinTaskIds: string[];
  totalAntSpentToday: number;
  dailyAntLimit: number;
  onSuccess?: () => void;
  onOpenNewTransaction?: () => void;
}

export function EveningReviewModal({
  isOpen,
  onClose,
  user,
  tasks,
  mustWinTaskIds,
  totalAntSpentToday,
  dailyAntLimit,
  onSuccess,
  onOpenNewTransaction,
}: EveningReviewModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [reflection, setReflection] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [tomorrowNotes, setTomorrowNotes] = useState("");
  const [expensesConfirmed, setExpensesConfirmed] = useState(true);
  const [isShutdownComplete, setIsShutdownComplete] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  // Pending dailies that would damage HP at midnight
  const pendingDailies = tasks.filter((t) => t.type === "daily" && t.isDue);
  const isResting = user.flags?.rest || false;

  const focusTasks = tasks.filter((t) => mustWinTaskIds.includes(t.id));
  const completedFocusCount = focusTasks.filter(
    (t) => t.completed || (t.type === "daily" && !t.isDue)
  ).length;

  const handleToggleDaily = (taskId: string) => {
    startTransition(async () => {
      await toggleTaskAction(taskId, "up");
    });
  };

  const handleToggleInn = () => {
    startTransition(async () => {
      await toggleSleepAction();
    });
  };

  const handleFinish = () => {
    startTransition(async () => {
      await saveEveningReviewAction({
        reflection: [
          reflection.trim() ? `Reflexión: ${reflection.trim()}` : "",
          gratitude.trim() ? `Agradecimiento: ${gratitude.trim()}` : "",
        ]
          .filter(Boolean)
          .join(" | ") || undefined,
        expensesLogged: expensesConfirmed,
        tomorrowNotes: tomorrowNotes.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-3xl border border-indigo-500/30 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Cierre Nocturno & Shutdown Ritual</span>
                <span className="rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-2 py-0.5">
                  Paso {step} de 4
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Protege tu salud de Habitica, revisa tus victorias y desconéctate
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Health & Dailies Damage Audit */}
        {step === 1 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-rose-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Auditoría de Salud de Habitica (HP: {user.stats.hp}/{user.stats.maxHealth || 50})
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    {pendingDailies.length > 0
                      ? `⚠️ Tienes ${pendingDailies.length} daily(s) pendientes. Recibirás daño a medianoche.`
                      : "🎉 ¡Todas tus dailies están hechas! Cero daño a medianoche."}
                  </p>
                </div>
              </div>

              {/* Quick Inn Button */}
              <button
                type="button"
                onClick={handleToggleInn}
                disabled={isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isResting
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
                }`}
              >
                <Bed className="h-3.5 w-3.5" />
                <span>{isResting ? "Posada Activa 🛡️" : "Dormir en Posada"}</span>
              </button>
            </div>

            {/* Pending Dailies List */}
            {pendingDailies.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Dailies por completar hoy:
                </div>
                {pendingDailies.map((daily) => (
                  <div
                    key={daily.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/6 bg-neutral-950/60 text-xs"
                  >
                    <span className="text-white font-medium">{daily.text}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDaily(daily.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 text-[11px] font-semibold"
                    >
                      ✓ Marcar Hecha
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
              >
                <span>Check-in Financiero</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Financial Check-in */}
        {step === 2 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-amber-500/20 bg-neutral-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coffee className="h-4 w-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white">
                    Gastos Hormiga & Antojos de Hoy
                  </h4>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400">
                  ${totalAntSpentToday.toFixed(2)} / ${dailyAntLimit.toFixed(2)} MXN
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {totalAntSpentToday <= dailyAntLimit
                  ? "✅ ¡Excelente! Te mantuviste dentro de tu límite diario de gastos antojo."
                  : "⚠️ Excediste tu límite diario por $" + (totalAntSpentToday - dailyAntLimit).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-white/6 bg-neutral-950/40">
              <div className="text-xs text-neutral-300">
                ¿Registraste todos tus gastos del día?
              </div>
              {onOpenNewTransaction && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewTransaction();
                  }}
                  className="px-3 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
                >
                  + Registrar un Gasto
                </button>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
              >
                <span>Revisar Victorias</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Wins & Gratitude */}
        {step === 3 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/6 bg-neutral-950/60 p-3.5">
                <div className="text-[11px] text-neutral-400">Must-Wins Completadas</div>
                <div className="mt-1 text-lg font-bold font-mono text-emerald-400">
                  {completedFocusCount} / {focusTasks.length || 3}
                </div>
              </div>
              <div className="rounded-2xl border border-white/6 bg-neutral-950/60 p-3.5">
                <div className="text-[11px] text-neutral-400">Oro Acumulado</div>
                <div className="mt-1 text-lg font-bold font-mono text-amber-400 flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span>{user.stats.gp.toFixed(1)} GP</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Victoria del Día: ¿Qué salió bien hoy?
              </label>
              <input
                type="text"
                placeholder="Ej. Terminé la entrega a tiempo y entrené con energía..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Agradecimiento: ¿Por qué te sientes agradecido hoy?
              </label>
              <input
                type="text"
                placeholder="Ej. Por la salud de mi familia, por una buena tarde..."
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
              >
                <span>Brain Dump & Shutdown</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Brain Dump & Work Shutdown */}
        {step === 4 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            {isShutdownComplete ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 animate-in zoom-in-90 duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Shutdown de Trabajo Completo 🌙
                </h3>
                <p className="text-xs text-neutral-300 max-w-sm">
                  Todos tus pendientes han sido guardados. Apaga la mente laboral, descansa y recarga energía para mañana.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    🧠 Brain Dump: Vacía pendientes para mañana
                  </label>
                  <p className="text-[11px] text-neutral-400 mb-2">
                    Cada línea se convertirá automáticamente en una tarea de Habitica para tu día de mañana.
                  </p>
                  <textarea
                    rows={4}
                    placeholder={"Ej:\nTerminar pruebas de integración #trabajo !urgent\n* Rutina de estiramiento 15m #salud\nComprar despensa"}
                    value={tomorrowNotes}
                    onChange={(e) => setTomorrowNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-neutral-950/80 p-3 font-mono text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/6">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 font-bold text-xs text-neutral-950 hover:brightness-110 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isPending ? "Cerrando jornada..." : "Work Shutdown Complete 🌙"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
