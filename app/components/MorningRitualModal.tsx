"use client";

import { saveMorningRitualAction } from "@/app/actions/rituals";
import { CalendarDaySchedule, HabiticaTask, HabiticaUser } from "@/lib/types";
import {
  ArrowRight,
  Check,
  Clock,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface MorningRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: HabiticaUser;
  tasks: HabiticaTask[];
  schedule: CalendarDaySchedule;
  currentMustWins?: string[];
  onSuccess?: (mustWins: string[]) => void;
}

const ENERGY_LEVELS = [
  { level: 1, label: "Bajo / Cansado", icon: "😴" },
  { level: 2, label: "Tranquilo", icon: "☕" },
  { level: 3, label: "Estable", icon: "⚡" },
  { level: 4, label: "Alto Rendimiento", icon: "🔥" },
  { level: 5, label: "Foco Imparable", icon: "🚀" },
];

export function MorningRitualModal({
  isOpen,
  onClose,
  user,
  tasks,
  schedule,
  currentMustWins = [],
  onSuccess,
}: MorningRitualModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(currentMustWins);
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [dayIntention, setDayIntention] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const toggleTaskSelection = (id: string) => {
    if (selectedTasks.includes(id)) {
      setSelectedTasks(selectedTasks.filter((tId) => tId !== id));
    } else {
      if (selectedTasks.length < 3) {
        setSelectedTasks([...selectedTasks, id]);
      }
    }
  };

  const handleFinish = () => {
    startTransition(async () => {
      await saveMorningRitualAction({
        mustWinTasks: selectedTasks,
        energyLevel,
        dayIntention: dayIntention.trim() || undefined,
      });

      if (onSuccess) onSuccess(selectedTasks);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-3xl border border-amber-500/20 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/10">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Ritual Matutino de Enfoque</span>
                <span className="rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] px-2 py-0.5">
                  Paso {step} de 3
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Alinea tu energía, agenda y prioridades del día en 60 segundos
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

        {/* Step 1: Agenda Preview */}
        {step === 1 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-white/6 bg-neutral-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-white/4">
                <span>¡Buenos días, <strong>{user.profile.name || "Hero"}</strong>! ⚔️</span>
                <span>Lvl {user.stats.lvl} {user.stats.class}</span>
              </div>
              <p className="text-xs text-neutral-300 mt-2">
                Revisa tus compromisos de hoy en Google Calendar antes de comprometer tu atención:
              </p>
            </div>

            {/* Calendar list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {schedule.events.length === 0 ? (
                <div className="p-4 rounded-xl border border-white/4 bg-neutral-950/40 text-center text-xs text-neutral-500">
                  Sin reuniones en el calendario. ¡Todo el día disponible para avanzar tareas clave!
                </div>
              ) : (
                schedule.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/6 bg-neutral-950/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span className="font-semibold text-white">{ev.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {ev.startTimeFormatted} ({ev.durationMinutes}m)
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 font-bold text-xs text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20"
              >
                <span>Definir 3 Must-Wins</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select 3 Must-Wins */}
        {step === 2 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Elige tus 3 tareas indispensables
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Si solo pudieras completar 3 cosas hoy, ¿cuáles serían?
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">
                {selectedTasks.length}/3 elegidas
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {tasks
                .filter((t) => !t.completed && (t.type === "todo" || t.type === "daily"))
                .map((task) => {
                  const isSelected = selectedTasks.includes(task.id);

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-amber-500/50 bg-amber-500/10 text-white shadow-sm"
                          : "border-white/6 bg-neutral-950/60 text-neutral-300 hover:border-white/12"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            isSelected
                              ? "bg-amber-500 border-amber-400 text-neutral-950"
                              : "border-neutral-700 bg-neutral-900"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-3" />}
                        </div>
                        <span className="text-xs font-medium">{task.text}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-neutral-500">
                        {task.type}
                      </span>
                    </div>
                  );
                })}
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
                disabled={selectedTasks.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 font-bold text-xs text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <span>Alinear Energía</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Energy & Day Intention */}
        {step === 3 && (
          <div className="mt-5 space-y-5 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-white mb-2">
                ¿Cuál es tu nivel de energía física y mental hoy?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ENERGY_LEVELS.map((lvl) => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setEnergyLevel(lvl.level)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                      energyLevel === lvl.level
                        ? "border-amber-500/50 bg-amber-500/20 text-white shadow-lg"
                        : "border-white/6 bg-neutral-950/60 text-neutral-400 hover:border-white/12"
                    }`}
                  >
                    <span className="text-xl">{lvl.icon}</span>
                    <span className="text-[10px] font-bold mt-1">Lvl {lvl.level}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Intención / Mantram del Día (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Foco implacable en la mañana, cero multitarea..."
                value={dayIntention}
                onChange={(e) => setDayIntention(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500/50 focus:outline-none"
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
                onClick={handleFinish}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 font-bold text-xs text-neutral-950 hover:brightness-110 shadow-xl shadow-amber-500/30 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isPending ? "Activando Brio..." : "¡Iniciar el Día! 🚀"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
