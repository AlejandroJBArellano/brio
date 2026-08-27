"use client";

import { saveMorningRitualAction } from "@/app/actions/rituals";
import { CalendarDaySchedule, HabiticaTask, HabiticaUser } from "@/lib/types";
import {
  getTaskPriorityInfo,
  parseTaskPrefix,
} from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Clock,
  ListTodo,
  Calendar,
  Search,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

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
  const [filterType, setFilterType] = useState<"todo" | "daily" | "all">("todo");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredModalTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      if (filterType === "todo" && t.type !== "todo") return false;
      if (filterType === "daily" && t.type !== "daily") return false;
      if (filterType === "all" && t.type !== "todo" && t.type !== "daily")
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.text.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, filterType, searchQuery]);

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
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Agenda Preview */}
        {step === 1 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
            <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4">
              <div className="flex items-center justify-between text-xs text-[#8E867B] pb-2 border-b border-[#2A2723]">
                <span>
                  ¡Buenos días,{" "}
                  <strong className="text-[#F5F2EB]">
                    {user.profile.name || "Hero"}
                  </strong>
                  ! ⚔️
                </span>
                <span className="font-mono">
                  Lvl {user.stats.lvl} {user.stats.class}
                </span>
              </div>
              <p className="text-xs text-[#DDD6C9] mt-2">
                Revisa tus compromisos de hoy en Google Calendar antes de comprometer tu atención:
              </p>
            </div>

            {/* Calendar list */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {schedule.events && schedule.events.length > 0 ? (
                schedule.events.map((evt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#2A2723] bg-[#141311] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-6 items-center justify-center rounded bg-[#221D16] text-[#D99B43]">
                        <Clock className="size-3.5" />
                      </div>
                      <span className="font-medium text-[#F5F2EB]">
                        {evt.title}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[#8E867B]">
                      {evt.startTimeFormatted} - {evt.endTimeFormatted}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-[#2A2723] bg-[#121110] text-center text-xs text-[#8E867B]">
                  No hay reuniones programadas hoy. ¡Día libre para Deep Work! 🚀
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs cursor-pointer"
              >
                <span>Definir 3 Must-Wins</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select 3 Must-Wins */}
        {step === 2 && (
          <div className="mt-5 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Elige tus 3 tareas indispensables
                </h3>
                <p className="text-[11px] text-[#8E867B]">
                  Selecciona de tus To-Dos de proyectos lo que moverá la aguja hoy.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#D99B43] bg-[#221D16] border border-[#3D3425] px-2 py-0.5 rounded">
                {selectedTasks.length}/3 elegidas
              </span>
            </div>

            {/* Filter Tabs & Search in Modal */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center rounded-lg border border-[#2A2723] bg-[#121110] p-0.5">
                <button
                  type="button"
                  onClick={() => setFilterType("todo")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    filterType === "todo"
                      ? "bg-[#1E2825] text-[#4EAB9E] font-semibold border border-[#4EAB9E]/40"
                      : "text-[#8E867B] hover:text-[#DDD6C9]"
                  }`}
                >
                  <ListTodo className="size-3" />
                  <span>To-Dos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("daily")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    filterType === "daily"
                      ? "bg-[#3D3425] text-[#E8AF59] font-semibold border border-[#D99B43]/40"
                      : "text-[#8E867B] hover:text-[#DDD6C9]"
                  }`}
                >
                  <Calendar className="size-3" />
                  <span>Dailies</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    filterType === "all"
                      ? "bg-[#282622] text-[#F5F2EB] font-semibold border border-[#38332D]"
                      : "text-[#8E867B] hover:text-[#DDD6C9]"
                  }`}
                >
                  <span>Todas</span>
                </button>
              </div>

              <div className="relative flex-1 max-w-44">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-[#8E867B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-6 pr-2.5 py-1 rounded-lg border border-[#2A2723] bg-[#121110] text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
                />
              </div>
            </div>

            {/* Task Options List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredModalTasks.length > 0 ? (
                filteredModalTasks.map((task) => {
                  const isSelected = selectedTasks.includes(task.id);
                  const { prefix, cleanTitle } = parseTaskPrefix(task.text);
                  const prio = getTaskPriorityInfo(task.priority || 1);

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskSelection(task.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#D99B43] bg-[#221D16] text-[#F5F2EB] shadow-xs"
                          : "border-[#2A2723] bg-[#141311] text-[#DDD6C9] hover:border-[#38332D] hover:bg-[#1A1916]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all ${
                            isSelected
                              ? "bg-[#D99B43] border-[#D99B43] text-[#121110]"
                              : "border-[#3D3831] bg-[#121110]"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-3" />}
                        </div>

                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {prefix && (
                            <span className="shrink-0 rounded border border-[#38332D] bg-[#1C1A17] px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#C2BAAD]">
                              {prefix}
                            </span>
                          )}
                          <span className="text-xs font-medium truncate">
                            {cleanTitle}
                          </span>
                        </div>
                      </div>

                      {/* Right Meta: Priority Badge & Type */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {/* Priority Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[9px] font-semibold ${prio.badge}`}
                          title={`Prioridad: ${prio.label}`}
                        >
                          <span className={`size-1.5 rounded-full ${prio.dot}`} />
                          <span>{prio.shortLabel}</span>
                        </span>

                        <span
                          className={`text-[9px] uppercase font-mono px-1 py-0.2 rounded border ${
                            task.type === "daily"
                              ? "border-[#3D3425] text-[#E8AF59] bg-[#221D16]"
                              : "border-[#1E2825] text-[#4EAB9E] bg-[#141F1D]"
                          }`}
                        >
                          {task.type}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-[#8E867B] border border-dashed border-[#2A2723] rounded-lg">
                  No hay tareas disponibles con los filtros actuales.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={selectedTasks.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <span>Alinear Energía</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Energy & Day Intention */}
        {step === 3 && (
          <div className="mt-5 space-y-4 animate-in fade-in duration-200">
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
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                      energyLevel === lvl.level
                        ? "border-[#D99B43]/50 bg-[#221D16] text-[#F5F2EB]"
                        : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:border-[#38332D]"
                    }`}
                  >
                    <span className="text-xl">{lvl.icon}</span>
                    <span className="text-[10px] font-medium leading-tight">
                      {lvl.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5F2EB] mb-1.5 font-serif">
                Intención o Tema del Día (Opcional)
              </label>
              <input
                type="text"
                placeholder="p. ej. Foco implacable en el MVP, calma bajo presión..."
                value={dayIntention}
                onChange={(e) => setDayIntention(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isPending ? "Sellando..." : "Sellar Ritual Matutino"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
