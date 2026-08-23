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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D99B43]/15 text-[#D99B43] border border-[#D99B43]/30">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
                <span>Ritual Matutino de Enfoque</span>
                <span className="rounded bg-[#3D3425] text-[#E8AF59] font-mono text-[10px] px-2 py-0.5 border border-[#D99B43]/30">
                  Paso {step} de 3
                </span>
              </h2>
              <p className="text-xs text-[#8E867B]">
                Alinea tu energía, agenda y prioridades del día en 60 segundos
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

        {/* Step 1: Agenda Preview */}
        {step === 1 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4">
              <div className="flex items-center justify-between text-xs text-[#8E867B] pb-2 border-b border-[#2A2723]">
                <span>¡Buenos días, <strong className="text-[#F5F2EB]">{user.profile.name || "Hero"}</strong>! ⚔️</span>
                <span className="font-mono">Lvl {user.stats.lvl} {user.stats.class}</span>
              </div>
              <p className="text-xs text-[#DDD6C9] mt-2">
                Revisa tus compromisos de hoy en Google Calendar antes de comprometer tu atención:
              </p>
            </div>

            {/* Calendar list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {schedule.events.length === 0 ? (
                <div className="p-4 rounded-lg border border-[#2A2723] bg-[#121110] text-center text-xs text-[#8E867B]">
                  Sin reuniones en el calendario. ¡Todo el día disponible para avanzar tareas clave!
                </div>
              ) : (
                schedule.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#2A2723] bg-[#121110] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#4EAB9E]" />
                      <span className="font-semibold text-[#F5F2EB]">{ev.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#8E867B]">
                      {ev.startTimeFormatted} ({ev.durationMinutes}m)
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs"
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
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Elige tus 3 tareas indispensables
                </h3>
                <p className="text-[11px] text-[#8E867B]">
                  Si solo pudieras completar 3 cosas hoy, ¿cuáles serían?
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#D99B43]">
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
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#D99B43]/50 bg-[#221D16] text-[#F5F2EB]"
                          : "border-[#2A2723] bg-[#121110] text-[#DDD6C9] hover:border-[#38332D]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            isSelected
                              ? "bg-[#D99B43] border-[#D99B43] text-[#121110]"
                              : "border-[#38332D] bg-[#181715]"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-3" />}
                        </div>
                        <span className="text-xs font-medium">{task.text}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-[#8E867B]">
                        {task.type}
                      </span>
                    </div>
                  );
                })}
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
                disabled={selectedTasks.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs disabled:opacity-50"
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
              <label className="block text-xs font-bold text-[#F5F2EB] mb-2 font-serif">
                ¿Cuál es tu nivel de energía física y mental hoy?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ENERGY_LEVELS.map((lvl) => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setEnergyLevel(lvl.level)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all ${
                      energyLevel === lvl.level
                        ? "border-[#D99B43]/50 bg-[#221D16] text-[#F5F2EB]"
                        : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:border-[#38332D]"
                    }`}
                  >
                    <span className="text-xl">{lvl.icon}</span>
                    <span className="text-[10px] font-mono font-bold mt-1">Lvl {lvl.level}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5F2EB] mb-1.5 font-serif">
                Intención / Mantram del Día (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Foco implacable en la mañana, cero multitarea..."
                value={dayIntention}
                onChange={(e) => setDayIntention(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
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
                onClick={handleFinish}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-md disabled:opacity-50"
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
