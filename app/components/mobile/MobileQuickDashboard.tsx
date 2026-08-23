"use client";

import {
  batchToggleSupplementsByTimingAction,
  logWaterAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import {
  CalendarDaySchedule,
  FinanceDashboardData,
  HabiticaTask,
  HabiticaUser,
  HealthDashboardData,
  RitualLog,
} from "@/lib/types";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Droplet,
  Pill,
  Plus,
  Sparkles,
  Sun,
  Wallet,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";

interface MobileQuickDashboardProps {
  user?: HabiticaUser;
  tasks: HabiticaTask[];
  healthData: HealthDashboardData;
  financeData: FinanceDashboardData;
  calendarSchedule: CalendarDaySchedule;
  todayRitual: RitualLog | null;
  onOpenBottomSheet: (tab?: "expense" | "task" | "water" | "nutrition") => void;
  onOpenNotificationSettings?: () => void;
  onOpenMorningRitual: () => void;
  onOpenEveningReview: () => void;
  onOpenManageSupplements: () => void;
}

export function MobileQuickDashboard({
  tasks,
  healthData,
  financeData,
  calendarSchedule,
  todayRitual,
  onOpenBottomSheet,
  onOpenMorningRitual,
  onOpenManageSupplements,
}: MobileQuickDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Current hour to determine automatic timing
  const currentHour = new Date().getHours();
  const defaultTiming = currentHour < 13 ? "Mañana" : "Tarde";
  const [activeSuppTiming, setActiveSuppTiming] = useState<"Mañana" | "Tarde" | "Todos">(defaultTiming);

  // Health Data
  const todayHealth = healthData.todayHealth;
  const rawSupplements = todayHealth?.supplements || [];

  type SupplementAction =
    | { type: "toggle"; id: string }
    | { type: "batch"; timing: string; taken: boolean };

  const [optimisticSupplements, setOptimisticSupplements] = useOptimistic(
    rawSupplements,
    (state, action: SupplementAction) => {
      if (action.type === "toggle") {
        return state.map((s) => (s.id === action.id ? { ...s, taken: !s.taken } : s));
      }
      if (action.type === "batch") {
        const term = action.timing.toLowerCase();
        return state.map((s) => {
          const itemTiming = (s.timing || "").toLowerCase();
          const matches =
            term === "todos" ||
            (term === "mañana" &&
              (itemTiming.includes("mañana") ||
                itemTiming.includes("morning") ||
                itemTiming.includes("desayuno"))) ||
            (term === "tarde" &&
              (itemTiming.includes("tarde") ||
                itemTiming.includes("afternoon") ||
                itemTiming.includes("comida")));
          return matches ? { ...s, taken: action.taken } : s;
        });
      }
      return state;
    }
  );

  const waterMl = todayHealth?.waterMl || 0;
  const waterPercent = Math.min(100, Math.round((waterMl / 3000) * 100));

  // Finance Data
  const antSpent = financeData.totalAntExpensesToday || 0;
  const antLimit = financeData.currentBudget?.dailyAntLimit || 150;
  const antRemaining = financeData.remainingDailyAntBudget ?? Math.max(0, antLimit - antSpent);
  const antPercent = Math.min(100, Math.round((antSpent / (antLimit || 1)) * 100));
  const isAntExceeded = antSpent > antLimit;

  // Filtered supplements
  const filteredSupplements = useMemo(() => {
    if (activeSuppTiming === "Todos") return optimisticSupplements;
    const term = activeSuppTiming.toLowerCase();
    return optimisticSupplements.filter((s) => {
      const itemTiming = (s.timing || "").toLowerCase();
      if (term === "mañana") {
        return itemTiming.includes("mañana") || itemTiming.includes("morning") || itemTiming.includes("desayuno");
      }
      if (term === "tarde") {
        return itemTiming.includes("tarde") || itemTiming.includes("afternoon") || itemTiming.includes("comida");
      }
      return true;
    });
  }, [optimisticSupplements, activeSuppTiming]);

  const allTakenInActiveTiming =
    filteredSupplements.length > 0 && filteredSupplements.every((s) => s.taken);
  const takenCountInActiveTiming = filteredSupplements.filter((s) => s.taken).length;

  // Must-Win Tasks
  const mustWinIds = todayRitual?.mustWinTasks || [];
  const mustWinTasks = tasks.filter((t) => mustWinIds.includes(t.id));

  // Next Calendar Event
  const nextEvent = calendarSchedule.nextEvent || calendarSchedule.events.find((e) => e.status === "upcoming" || e.status === "now");

  // Handlers
  const handleToggleSupplement = (id: string) => {
    soundFx.supplementChecked();
    startTransition(async () => {
      setOptimisticSupplements({ type: "toggle", id });
      await toggleSupplementAction(id);
      router.refresh();
    });
  };

  const handleBatchTakeSupplements = () => {
    soundFx.supplementChecked();
    const targetValue = !allTakenInActiveTiming;
    startTransition(async () => {
      setOptimisticSupplements({
        type: "batch",
        timing: activeSuppTiming,
        taken: targetValue,
      });
      await batchToggleSupplementsByTimingAction(
        activeSuppTiming === "Todos" ? "all" : activeSuppTiming,
        targetValue
      );
      router.refresh();
    });
  };

  const handleQuickAddWater = (ml: number) => {
    soundFx.waterLogged();
    startTransition(async () => {
      await logWaterAction(ml);
    });
  };

  const handleToggleTask = (task: HabiticaTask) => {
    soundFx.taskComplete();
    startTransition(async () => {
      await toggleTaskAction(task.id, "up");
    });
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* 1. Widget de Suplementos Inteligente por Horario */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#7EA35A]/15 text-[#7EA35A] border border-[#7EA35A]/30">
              <Pill className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">Suplementación</h3>
              <p className="text-[11px] text-[#8E867B]">
                {takenCountInActiveTiming}/{filteredSupplements.length} tomados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenManageSupplements}
            className="text-[11px] text-[#D99B43] hover:text-[#E8AF59] font-medium transition-colors"
          >
            Editar Catálogo
          </button>
        </div>

        {/* Filter Pills (Mañana / Tarde / Todos) */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#121110] border border-[#2A2723]">
          <button
            type="button"
            onClick={() => setActiveSuppTiming("Mañana")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeSuppTiming === "Mañana"
                ? "bg-[#3D3425] text-[#E8AF59] border border-[#D99B43]/40 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
          >
            <Sun className="size-3" />
            Mañana
          </button>
          <button
            type="button"
            onClick={() => setActiveSuppTiming("Tarde")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeSuppTiming === "Tarde"
                ? "bg-[#1D2619] text-[#7EA35A] border border-[#7EA35A]/40 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
          >
            <Pill className="size-3" />
            Tarde
          </button>
          <button
            type="button"
            onClick={() => setActiveSuppTiming("Todos")}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeSuppTiming === "Todos"
                ? "bg-[#282622] text-[#F5F2EB] border border-[#3D3831] shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
          >
            Todos
          </button>
        </div>

        {/* 1-Tap Batch Action Button */}
        {filteredSupplements.length > 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleBatchTakeSupplements}
            className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98 ${allTakenInActiveTiming
                ? "bg-[#7EA35A]/20 text-[#7EA35A] border border-[#7EA35A]/40"
                : "bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110]"
              }`}
          >
            <CheckCircle2 className="size-4" />
            {allTakenInActiveTiming
              ? `✓ Todos los de la ${activeSuppTiming} tomados (Desmarcar)`
              : `Tomar todos los de la ${activeSuppTiming} (${filteredSupplements.length})`}
          </button>
        )}

        {/* List of active supplements */}
        {filteredSupplements.length === 0 ? (
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-center text-xs text-[#8E867B]">
            No hay suplementos configurados para el turno de la {activeSuppTiming}.
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredSupplements.map((supp) => (
              <div
                key={supp.id}
                onClick={() => handleToggleSupplement(supp.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none active:scale-98 ${supp.taken
                    ? "bg-[#151814] border-[#7EA35A]/30 text-[#8E867B]"
                    : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${supp.taken
                        ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                        : "border-[#38332D] bg-[#181715]"
                      }`}
                  >
                    {supp.taken && <Check className="size-3.5 stroke-3" />}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-semibold ${supp.taken ? "line-through text-[#8E867B]" : "text-[#F5F2EB]"
                        }`}
                    >
                      {supp.name}
                    </span>
                    {supp.timing && (
                      <span className="block text-[10px] text-[#8E867B]">
                        {supp.timing}
                      </span>
                    )}
                  </div>
                </div>

                {supp.dosage && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-[#2A2723] bg-[#181715] text-[#C2BAAD]">
                    {supp.dosage}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Widget de Agenda & Tareas Must-Win */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#D99B43]/15 text-[#D99B43] border border-[#D99B43]/30">
              <Zap className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">Agenda & Foco Must-Win</h3>
              <p className="text-[11px] text-[#8E867B]">
                {mustWinTasks.filter((t) => t.completed).length}/{mustWinTasks.length} victorias de hoy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMorningRitual}
            className="text-[11px] text-[#D99B43] hover:text-[#E8AF59] font-medium transition-colors"
          >
            Ritual AM ⚡
          </button>
        </div>

        {/* Next Calendar Event Banner */}
        {nextEvent ? (
          <div className="rounded-lg border border-[#4EAB9E]/30 bg-[#141C1A] p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4EAB9E]/20 text-[#4EAB9E] border border-[#4EAB9E]/30">
                <Calendar className="size-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[#F5F2EB] truncate">
                  {nextEvent.title}
                </p>
                <p className="text-[10px] text-[#4EAB9E] font-mono">
                  {nextEvent.startTimeFormatted} {nextEvent.timeUntil ? `(${nextEvent.timeUntil})` : ""}
                </p>
              </div>
            </div>
            {nextEvent.location && (
              <span className="text-[10px] font-mono text-[#8E867B] truncate max-w-25">
                {nextEvent.location}
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-center text-[11px] text-[#8E867B] flex items-center justify-center gap-1.5">
            <Clock className="size-3.5 text-[#8E867B]" />
            Sin reuniones pendientes para hoy
          </div>
        )}

        {/* Must-Win Tasks List */}
        {mustWinTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#2A2723] p-3.5 text-center space-y-2">
            <p className="text-xs text-[#8E867B]">
              Aún no has definido tus 3 tareas Must-Win de hoy.
            </p>
            <button
              type="button"
              onClick={onOpenMorningRitual}
              className="px-3 py-1.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5" />
              Elegir Must-Wins en Ritual AM
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {mustWinTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none active:scale-98 ${task.completed
                    ? "bg-[#151814] border-[#7EA35A]/30 text-[#8E867B]"
                    : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${task.completed
                        ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                        : "border-[#38332D] bg-[#181715]"
                      }`}
                  >
                    {task.completed && <Check className="size-3.5 stroke-3" />}
                  </div>
                  <span
                    className={`text-xs font-semibold ${task.completed ? "line-through text-[#8E867B]" : "text-[#F5F2EB]"
                      }`}
                  >
                    {task.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Widget de Finanzas & Gastos Hormiga */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-lg border ${isAntExceeded
                  ? "bg-[#E05D52]/15 text-[#E05D52] border-[#E05D52]/30"
                  : "bg-[#D99B43]/15 text-[#D99B43] border-[#D99B43]/30"
                }`}
            >
              <Wallet className="size-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">Gastos Hormiga del Día</h3>
              <p className="text-[11px] text-[#8E867B]">
                Presupuesto diario: ${antLimit} MXN
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenBottomSheet("expense")}
            className="px-2.5 py-1 rounded-lg bg-[#E05D52]/15 hover:bg-[#E05D52]/25 text-[#E05D52] border border-[#E05D52]/30 text-[11px] font-semibold transition-all flex items-center gap-1"
          >
            <Plus className="size-3" />
            Gasto
          </button>
        </div>

        {/* Thermometer Status Card */}
        <div
          className={`rounded-lg border p-3.5 space-y-2.5 ${isAntExceeded
              ? "bg-[#221716] border-[#E05D52]/40"
              : antPercent >= 80
                ? "bg-[#221D16] border-[#D99B43]/40"
                : "bg-[#121110] border-[#2A2723]"
            }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-2xl font-extrabold text-[#F5F2EB]">
                ${antSpent.toFixed(0)}
              </span>
              <span className="font-mono text-xs text-[#8E867B] ml-1">/ ${antLimit} MXN</span>
            </div>

            <div className="text-right">
              <span
                className={`font-mono text-xs font-bold ${isAntExceeded
                    ? "text-[#E05D52]"
                    : antPercent >= 80
                      ? "text-[#D99B43]"
                      : "text-[#7EA35A]"
                  }`}
              >
                {isAntExceeded
                  ? `+$${(antSpent - antLimit).toFixed(0)} excedido`
                  : `$${antRemaining.toFixed(0)} disponible`}
              </span>
              <p className="text-[10px] font-mono text-[#8E867B]">{antPercent}% consumido</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[#22201D] overflow-hidden">
            <div
              className={`h-full transition-all ${isAntExceeded
                  ? "bg-[#E05D52]"
                  : antPercent >= 80
                    ? "bg-[#D99B43]"
                    : "bg-[#7EA35A]"
                }`}
              style={{ width: `${Math.min(100, antPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Widget de Hidratación Diaria */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#4EAB9E]/15 text-[#4EAB9E] border border-[#4EAB9E]/30 shadow-xs">
              <Droplet className="size-4" />
            </div>
            <div>
              <span className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">Hidratación Diaria</span>
              <p className="text-[10px] text-[#8E867B]">Meta recomendada: 3,000 ml</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-extrabold text-[#F5F2EB]">{waterMl}</span>
            <span className="font-mono text-xs text-[#8E867B]">/ 3000 ml</span>
            <span className="ml-1 rounded border border-[#4EAB9E]/30 bg-[#4EAB9E]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#4EAB9E]">
              {waterPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-[#22201D] overflow-hidden">
          <div
            className="h-full bg-[#4EAB9E] transition-all duration-300"
            style={{ width: `${Math.min(100, waterPercent)}%` }}
          />
        </div>

        {/* Quick Add Water Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-0.5">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuickAddWater(250)}
            className="flex items-center justify-center py-2 rounded-lg bg-[#141C1A] hover:bg-[#1E2B27] border border-[#4EAB9E]/25 text-[#4EAB9E] font-mono text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            +250 ml
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuickAddWater(500)}
            className="flex items-center justify-center py-2 rounded-lg bg-[#141C1A] hover:bg-[#1E2B27] border border-[#4EAB9E]/35 text-[#4EAB9E] font-mono text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            +500 ml
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleQuickAddWater(750)}
            className="flex items-center justify-center py-2 rounded-lg bg-[#141C1A] hover:bg-[#1E2B27] border border-[#4EAB9E]/50 text-[#F5F2EB] font-mono text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            +750 ml
          </button>
        </div>
      </div>
    </div>
  );
}
