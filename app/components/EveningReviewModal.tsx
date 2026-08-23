"use client";

import { saveEveningReviewAction } from "@/app/actions/rituals";
import { toggleSleepAction, toggleTaskAction } from "@/app/actions/tasks";
import { HabiticaTask, HabiticaUser } from "@/lib/types";
import {
  ArrowRight,
  Bed,
  Coffee,
  Coins,
  Heart,
  Moon,
  ShieldCheck,
  Sparkles,
  X,
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
  const [expensesConfirmed, _setExpensesConfirmed] = useState(true);
  const [isShutdownComplete, setIsShutdownComplete] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  // Pending dailies that would damage HP at midnight
  const pendingDailies = tasks.filter((t) => t.type === "daily" && t.isDue);
  const isResting = Boolean(user.preferences?.sleep ?? user.flags?.rest ?? false);

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
        className="w-full max-w-xl rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4EAB9E]/15 text-[#4EAB9E] border border-[#4EAB9E]/30">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
                <span>Cierre Nocturno & Shutdown Ritual</span>
                <span className="rounded bg-[#22201D] text-[#DDD6C9] font-mono text-[10px] px-2 py-0.5 border border-[#2A2723]">
                  Paso {step} de 4
                </span>
              </h2>
              <p className="text-xs text-[#8E867B]">
                Protege tu salud de Habitica, revisa tus victorias y desconéctate
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Health & Dailies Damage Audit */}
        {step === 1 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-4 rounded-lg border border-[#E05D52]/30 bg-[#221716]">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-[#E05D52]" />
                <div>
                  <h4 className="text-xs font-bold text-[#F5F2EB]">
                    Auditoría de Salud de Habitica (HP: {user.stats.hp}/{user.stats.maxHealth || 50})
                  </h4>
                  <p className="text-[11px] text-[#DDD6C9]">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isResting
                    ? "bg-[#3D3425] text-[#E8AF59] border border-[#D99B43]/40"
                    : "bg-[#121110] text-[#DDD6C9] hover:text-[#F5F2EB] border border-[#2A2723]"
                }`}
              >
                <Bed className="h-3.5 w-3.5" />
                <span>{isResting ? "Posada Activa 🛡️" : "Dormir en Posada"}</span>
              </button>
            </div>

            {/* Pending Dailies List */}
            {pendingDailies.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-[#8E867B] uppercase tracking-wider font-mono">
                  Dailies por completar hoy:
                </div>
                {pendingDailies.map((daily) => (
                  <div
                    key={daily.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#2A2723] bg-[#121110] text-xs"
                  >
                    <span className="text-[#F5F2EB] font-medium">{daily.text}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDaily(daily.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded bg-[#7EA35A]/15 text-[#7EA35A] border border-[#7EA35A]/30 hover:bg-[#7EA35A]/25 text-[11px] font-semibold"
                    >
                      ✓ Marcar Hecha
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs"
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
            <div className="rounded-lg border border-[#3D3425] bg-[#121110] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coffee className="h-4 w-4 text-[#D99B43]" />
                  <h4 className="text-xs font-bold text-[#F5F2EB] font-serif">
                    Gastos Hormiga & Antojos de Hoy
                  </h4>
                </div>
                <span className="font-mono text-xs font-bold text-[#D99B43]">
                  ${totalAntSpentToday.toFixed(2)} / ${dailyAntLimit.toFixed(2)} MXN
                </span>
              </div>
              <p className="text-xs text-[#8E867B]">
                {totalAntSpentToday <= dailyAntLimit
                  ? "✅ ¡Excelente! Te mantuviste dentro de tu límite diario de gastos antojo."
                  : "⚠️ Excediste tu límite diario por $" + (totalAntSpentToday - dailyAntLimit).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-[#2A2723] bg-[#121110]">
              <div className="text-xs text-[#DDD6C9]">
                ¿Registraste todos tus gastos del día?
              </div>
              {onOpenNewTransaction && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewTransaction();
                  }}
                  className="px-3 py-1 rounded border border-[#D99B43]/40 bg-[#221D16] text-xs font-semibold text-[#D99B43] hover:bg-[#3D3425]"
                >
                  + Registrar un Gasto
                </button>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#8E867B] hover:text-[#DDD6C9]"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs"
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
              <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
                <div className="text-[11px] text-[#8E867B]">Must-Wins Completadas</div>
                <div className="mt-1 text-lg font-bold font-mono text-[#7EA35A]">
                  {completedFocusCount} / {focusTasks.length || 3}
                </div>
              </div>
              <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
                <div className="text-[11px] text-[#8E867B]">Oro Acumulado</div>
                <div className="mt-1 text-lg font-bold font-mono text-[#E8AF59] flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  <span>{user.stats.gp.toFixed(1)} GP</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5F2EB] mb-1 font-serif">
                Victoria del Día: ¿Qué salió bien hoy?
              </label>
              <input
                type="text"
                placeholder="Ej. Terminé la entrega a tiempo y entrené con energía..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5F2EB] mb-1 font-serif">
                Agradecimiento: ¿Por qué te sientes agradecido hoy?
              </label>
              <input
                type="text"
                placeholder="Ej. Por la salud de mi familia, por una buena tarde..."
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-[#8E867B] hover:text-[#DDD6C9]"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs"
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
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7EA35A]/15 text-[#7EA35A] border border-[#7EA35A]/30 shadow-xl">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#F5F2EB]">
                  Shutdown de Trabajo Completo 🌙
                </h3>
                <p className="text-xs text-[#DDD6C9] max-w-sm">
                  Todos tus pendientes han sido guardados. Apaga la mente laboral, descansa y recarga energía para mañana.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#F5F2EB] mb-1.5 font-serif">
                    🧠 Brain Dump: Vacía pendientes para mañana
                  </label>
                  <p className="text-[11px] text-[#8E867B] mb-2">
                    Cada línea se convertirá automáticamente en una tarea de Habitica para tu día de mañana.
                  </p>
                  <textarea
                    rows={4}
                    placeholder={"Ej:\nTerminar pruebas de integración #trabajo !urgent\n* Rutina de estiramiento 15m #salud\nComprar despensa"}
                    value={tomorrowNotes}
                    onChange={(e) => setTomorrowNotes(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-3 font-mono text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#2A2723]">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs text-[#8E867B] hover:text-[#DDD6C9]"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-md disabled:opacity-50"
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
