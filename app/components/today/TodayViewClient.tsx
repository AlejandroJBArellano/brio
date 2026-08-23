"use client";

import {
  batchToggleSupplementsByTimingAction,
  logWaterAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { toggleTaskAction } from "@/app/actions/tasks";
import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { getHormonalStatus } from "@/lib/hormonal";
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
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Droplet,
  Flame,
  Moon,
  Pill,
  Plus,
  Sparkles,
  Sun,
  Wallet,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";

interface TodayViewClientProps {
  user: HabiticaUser;
  tasks: HabiticaTask[];
  healthData: HealthDashboardData;
  financeData: FinanceDashboardData;
  calendarSchedule: CalendarDaySchedule;
  todayRitual: RitualLog | null;
}

export function TodayViewClient({
  user: _user,
  tasks,
  healthData,
  financeData,
  calendarSchedule,
  todayRitual,
}: TodayViewClientProps) {
  const router = useRouter();
  const { openModal } = useCommandCenter();
  const [isPending, startTransition] = useTransition();

  // Determine automatic timing based on current hour in Mexico City
  const currentHour = new Date().getHours();
  const defaultTiming =
    currentHour < 13 ? "Mañana" : currentHour < 19 ? "Tarde" : "Noche";
  const [activeSuppTiming, setActiveSuppTiming] = useState<
    "Mañana" | "Tarde" | "Noche" | "Todos"
  >(defaultTiming);

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
                itemTiming.includes("comida") ||
                itemTiming.includes("entreno"))) ||
            (term === "noche" &&
              (itemTiming.includes("noche") ||
                itemTiming.includes("night") ||
                itemTiming.includes("cena") ||
                itemTiming.includes("dormir")));
          return matches ? { ...s, taken: action.taken } : s;
        });
      }
      return state;
    }
  );

  const waterMl = todayHealth?.waterMl || 0;
  const waterTarget = 3000;
  const waterPercent = Math.min(100, Math.round((waterMl / waterTarget) * 100));

  // Finance Data
  const antSpent = financeData.totalAntExpensesToday || 0;
  const antLimit = financeData.currentBudget?.dailyAntLimit || 150;
  const antRemaining =
    financeData.remainingDailyAntBudget ?? Math.max(0, antLimit - antSpent);
  const antPercent = Math.min(
    100,
    Math.round((antSpent / Math.max(1, antLimit)) * 100)
  );
  const isAntExceeded = antSpent > antLimit;

  // Filtered supplements by timing
  const filteredSupplements = useMemo(() => {
    if (activeSuppTiming === "Todos") return optimisticSupplements;
    const term = activeSuppTiming.toLowerCase();
    return optimisticSupplements.filter((s) => {
      const itemTiming = (s.timing || "").toLowerCase();
      if (term === "mañana") {
        return (
          itemTiming.includes("mañana") ||
          itemTiming.includes("morning") ||
          itemTiming.includes("desayuno")
        );
      }
      if (term === "tarde") {
        return (
          itemTiming.includes("tarde") ||
          itemTiming.includes("afternoon") ||
          itemTiming.includes("comida") ||
          itemTiming.includes("entreno")
        );
      }
      if (term === "noche") {
        return (
          itemTiming.includes("noche") ||
          itemTiming.includes("night") ||
          itemTiming.includes("cena") ||
          itemTiming.includes("dormir")
        );
      }
      return true;
    });
  }, [optimisticSupplements, activeSuppTiming]);

  const allTakenInActiveTiming =
    filteredSupplements.length > 0 &&
    filteredSupplements.every((s) => s.taken);
  const takenCountInActiveTiming = filteredSupplements.filter((s) => s.taken).length;
  const totalSupplementsTaken = optimisticSupplements.filter((s) => s.taken).length;

  // Must-Win Tasks
  const mustWinIds = useMemo(
    () => todayRitual?.mustWinTasks || [],
    [todayRitual]
  );
  const mustWinTasks = tasks.filter((t) => mustWinIds.includes(t.id));
  const completedMustWins = mustWinTasks.filter((t) => t.completed).length;
  const mustWinPercent =
    mustWinTasks.length > 0
      ? Math.round((completedMustWins / mustWinTasks.length) * 100)
      : 0;

  // Habitica Dailies for today
  const dailyTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.type === "daily" ||
          (t.type === "todo" && !mustWinIds.includes(t.id))
      ),
    [tasks, mustWinIds]
  );

  // Calendar Events
  const nextEvent =
    calendarSchedule.nextEvent ||
    calendarSchedule.events.find(
      (e) => e.status === "upcoming" || e.status === "now"
    );

  // Circadian Hormonal Status
  const hormonalStatus = getHormonalStatus();

  // Date String in Spanish
  const todayFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

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

  const hasMorningRitual = Boolean(
    todayRitual?.mustWinTasks && todayRitual.mustWinTasks.length > 0
  );
  const hasEveningReview = Boolean(todayRitual?.reflection);

  return (
    <div className="space-y-6 pb-20 sm:pb-12 font-sans animate-in fade-in duration-300">
      {/* 1. HERO HEADER: Greeting & Hormonal State */}
      <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs uppercase tracking-wider text-[#8E867B] capitalize">
                {todayFormatted}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#38332D]" />
              <span className="font-mono text-xs text-[#D99B43]">
                Semana {Math.ceil(new Date().getDate() / 7)}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#F5F2EB]">
              Comando del Día
            </h1>
          </div>

          {/* Circadian & Hormonal Badge + Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium"
              style={{
                backgroundColor: `${hormonalStatus.currentPhase.color}12`,
                borderColor: `${hormonalStatus.currentPhase.color}35`,
                color: hormonalStatus.currentPhase.color,
              }}
            >
              <span>{hormonalStatus.currentPhase.icon}</span>
              <span className="font-bold">{hormonalStatus.currentPhase.shortName}</span>
              <span className="text-[10px] opacity-75">
                ({hormonalStatus.remainingFormatted} restantes)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openModal("morningRitual")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  hasMorningRitual
                    ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                    : "border-[#D99B43]/40 bg-[#221D16] text-[#D99B43] hover:bg-[#2A2319]"
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Ritual AM</span>
                {hasMorningRitual && <Check className="h-3 w-3 ml-0.5 stroke-3" />}
              </button>

              <button
                type="button"
                onClick={() => openModal("eveningReview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  hasEveningReview
                    ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                    : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Cierre PM</span>
                {hasEveningReview && <Check className="h-3 w-3 ml-0.5 stroke-3" />}
              </button>

              <button
                type="button"
                onClick={() => openModal("focus")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#38332D] bg-[#121110] text-[#DDD6C9] hover:border-[#D99B43]/40 hover:text-[#D99B43] text-xs font-semibold transition-all cursor-pointer"
                title="Modo Focus Zen (⌘P)"
              >
                <Zap className="h-3.5 w-3.5 text-[#D99B43]" />
                <span>Focus Zen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE METRICS RIBBON (Responsive Grid: 1 col on mobile, 2 col on tablet, 4 col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Must-Win Priorities */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xs font-bold text-[#F5F2EB] flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#D99B43]" />
              <span>Victorias Must-Win</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-[#D99B43] bg-[#221D16] px-1.5 py-0.5 rounded border border-[#D99B43]/30">
              {mustWinPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[#F5F2EB]">
              {completedMustWins}
            </span>
            <span className="font-mono text-xs text-[#8E867B]">
              / {mustWinTasks.length || 3} tareas clave
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#121110] border border-[#2A2723] overflow-hidden">
            <div
              className="h-full bg-[#D99B43] transition-all duration-300"
              style={{ width: `${mustWinPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Daily Hydration */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xs font-bold text-[#F5F2EB] flex items-center gap-1.5">
              <Droplet className="h-3.5 w-3.5 text-[#4EAB9E]" />
              <span>Hidratación</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-[#4EAB9E] bg-[#141C1A] px-1.5 py-0.5 rounded border border-[#4EAB9E]/30">
              {waterPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[#F5F2EB]">
              {waterMl}
            </span>
            <span className="font-mono text-xs text-[#8E867B]">
              / {waterTarget} ml
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#121110] border border-[#2A2723] overflow-hidden">
            <div
              className="h-full bg-[#4EAB9E] transition-all duration-300"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Ant Expenses */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xs font-bold text-[#F5F2EB] flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-[#E05D52]" />
              <span>Gastos Hormiga</span>
            </span>
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isAntExceeded
                  ? "bg-[#221716] text-[#E05D52] border-[#E05D52]/30"
                  : "bg-[#141813] text-[#7EA35A] border-[#7EA35A]/30"
              }`}
            >
              {isAntExceeded ? "Excedido" : `$${antRemaining.toFixed(0)} disp.`}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[#F5F2EB]">
              ${antSpent.toFixed(0)}
            </span>
            <span className="font-mono text-xs text-[#8E867B]">
              / ${antLimit} MXN
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#121110] border border-[#2A2723] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isAntExceeded
                  ? "bg-[#E05D52]"
                  : antPercent >= 80
                  ? "bg-[#D99B43]"
                  : "bg-[#7EA35A]"
              }`}
              style={{ width: `${antPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Supplements Progress */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xs font-bold text-[#F5F2EB] flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-[#7EA35A]" />
              <span>Suplementación</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-[#7EA35A] bg-[#1C2219] px-1.5 py-0.5 rounded border border-[#7EA35A]/30">
              {activeSuppTiming}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[#F5F2EB]">
              {totalSupplementsTaken}
            </span>
            <span className="font-mono text-xs text-[#8E867B]">
              / {optimisticSupplements.length} totales hoy
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#121110] border border-[#2A2723] overflow-hidden">
            <div
              className="h-full bg-[#7EA35A] transition-all duration-300"
              style={{
                width: `${
                  optimisticSupplements.length > 0
                    ? (totalSupplementsTaken / optimisticSupplements.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID: Left (Focus & Agenda) vs Right (Biometrics & Finances) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 7 Columns on Desktop */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Must-Win Priorities */}
          <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">
                    Prioridades Must-Win de Hoy
                  </h3>
                  <p className="text-[11px] text-[#8E867B] font-mono">
                    {completedMustWins} de {mustWinTasks.length} victorias conseguidas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal("morningRitual")}
                className="text-xs font-semibold text-[#D99B43] hover:text-[#E8AF59] transition-colors cursor-pointer"
              >
                Definir en Ritual AM →
              </button>
            </div>

            {mustWinTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#2A2723] bg-[#121110] p-6 text-center space-y-3">
                <Sparkles className="h-8 w-8 text-[#D99B43] mx-auto opacity-80" />
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#F5F2EB]">
                    Aún no defines tus 3 Victorias Diarias
                  </h4>
                  <p className="text-xs text-[#8E867B] max-w-sm mx-auto mt-1 font-mono">
                    Elige las 3 tareas de mayor impacto en tu Ritual Matutino para alinear tu energía dopaminérgica.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal("morningRitual")}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Iniciar Ritual Matutino</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {mustWinTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`flex items-start justify-between p-3.5 rounded-lg border transition-all cursor-pointer select-none ${
                      task.completed
                        ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                        : "bg-[#121110] border-[#2A2723] hover:border-[#D99B43]/40 text-[#F5F2EB]"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-0.5 transition-colors ${
                          task.completed
                            ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                            : "border-[#38332D] bg-[#181715]"
                        }`}
                      >
                        {task.completed && <Check className="h-3.5 w-3.5 stroke-3" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[#D99B43]">
                            #{idx + 1}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              task.completed
                                ? "line-through text-[#8E867B]"
                                : "text-[#F5F2EB]"
                            }`}
                          >
                            {task.text}
                          </span>
                        </div>
                        {task.notes && (
                          <p className="text-[11px] text-[#8E867B] mt-0.5 line-clamp-1 font-mono">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8E867B] shrink-0 ml-2">
                      <span className="rounded bg-[#181715] px-1.5 py-0.5 border border-[#2A2723]">
                        +{task.value ? Math.round(task.value * 10) : 10} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card B: Agenda & Próximos Eventos de Hoy */}
          <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141C1A] text-[#4EAB9E] border border-[#4EAB9E]/30">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">
                    Agenda de Hoy & Reuniones
                  </h3>
                  <p className="text-[11px] text-[#8E867B] font-mono">
                    {calendarSchedule.events.length} compromisos programados
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs text-[#8E867B]">
                {calendarSchedule.date}
              </span>
            </div>

            {/* Next Meeting Banner */}
            {nextEvent ? (
              <div className="rounded-lg border border-[#4EAB9E]/30 bg-[#141C1A] p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4EAB9E]/20 text-[#4EAB9E] border border-[#4EAB9E]/40 font-mono text-xs font-bold">
                    {nextEvent.startTimeFormatted.split(":")[0]}h
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-xs text-[#F5F2EB] block truncate">
                      {nextEvent.title}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-[#4EAB9E]">
                      <Clock className="h-3 w-3" />
                      <span>
                        {nextEvent.startTimeFormatted} - {nextEvent.endTimeFormatted}
                      </span>
                      {nextEvent.timeUntil && (
                        <span className="rounded bg-[#4EAB9E]/15 px-1.5 py-0.2 text-[10px]">
                          en {nextEvent.timeUntil}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {nextEvent.location && (
                  <span className="text-[11px] font-mono text-[#8E867B] truncate max-w-36 shrink-0 hidden sm:inline">
                    {nextEvent.location}
                  </span>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-center text-xs text-[#8E867B] flex items-center justify-center gap-2 font-mono">
                <Clock className="h-3.5 w-3.5" />
                <span>Sin reuniones urgentes o pendientes para hoy</span>
              </div>
            )}

            {/* Event Timeline List */}
            {calendarSchedule.events.length > 0 && (
              <div className="space-y-1.5 font-mono text-xs">
                {calendarSchedule.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#2A2723] bg-[#121110] hover:border-[#38332D] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[11px] font-bold text-[#8E867B] w-12 shrink-0">
                        {ev.startTimeFormatted}
                      </span>
                      <span className="text-[#DDD6C9] truncate font-sans text-xs">
                        {ev.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border capitalize shrink-0 ${
                        ev.status === "now"
                          ? "bg-[#141C1A] text-[#4EAB9E] border-[#4EAB9E]/30 font-bold"
                          : ev.status === "upcoming"
                          ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30"
                          : "text-[#8E867B] border-transparent"
                      }`}
                    >
                      {ev.status === "now"
                        ? "En curso"
                        : ev.status === "upcoming"
                        ? "Próximo"
                        : "Pasado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card C: Hábitos Clave del Día (Dailies) */}
          {dailyTasks.length > 0 && (
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">
                      Hábitos Diarios & Tareas
                    </h3>
                    <p className="text-[11px] text-[#8E867B] font-mono">
                      {dailyTasks.filter((t) => t.completed).length} de {dailyTasks.length} completados
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {dailyTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                      task.completed
                        ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                        : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#DDD6C9]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                          task.completed
                            ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                            : "border-[#38332D] bg-[#181715]"
                        }`}
                      >
                        {task.completed && <Check className="h-3 w-3 stroke-3" />}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          task.completed
                            ? "line-through text-[#8E867B]"
                            : "text-[#F5F2EB]"
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>

                    {task.streak !== undefined && task.streak > 0 && (
                      <span className="font-mono text-[10px] text-[#D99B43] flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        <span>{task.streak}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 5 Columns on Desktop */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card D: Suplementación Inteligente */}
          <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">
                    Suplementación
                  </h3>
                  <p className="text-[11px] text-[#8E867B] font-mono">
                    {takenCountInActiveTiming} de {filteredSupplements.length} tomados
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal("manageSupplements")}
                className="text-xs font-mono text-[#D99B43] hover:text-[#E8AF59] transition-colors cursor-pointer"
              >
                Catálogo ⚙️
              </button>
            </div>

            {/* Timing Pills Filter */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121110] border border-[#2A2723] font-mono text-xs">
              {(["Mañana", "Tarde", "Noche", "Todos"] as const).map((timing) => (
                <button
                  key={timing}
                  type="button"
                  onClick={() => setActiveSuppTiming(timing)}
                  className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer ${
                    activeSuppTiming === timing
                      ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                      : "text-[#8E867B] hover:text-[#DDD6C9]"
                  }`}
                >
                  {timing}
                </button>
              ))}
            </div>

            {/* 1-Tap Batch Toggle Button */}
            {filteredSupplements.length > 0 && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleBatchTakeSupplements}
                className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  allTakenInActiveTiming
                    ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40"
                    : "bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110]"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {allTakenInActiveTiming
                    ? `✓ Todos los de la ${activeSuppTiming} tomados (Desmarcar)`
                    : `Tomar todos los de la ${activeSuppTiming} (${filteredSupplements.length})`}
                </span>
              </button>
            )}

            {/* Supplements List */}
            {filteredSupplements.length === 0 ? (
              <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-4 text-center text-xs text-[#8E867B] font-mono">
                No hay suplementos registrados para el turno de la {activeSuppTiming}.
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredSupplements.map((supp) => (
                  <div
                    key={supp.id}
                    onClick={() => handleToggleSupplement(supp.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                      supp.taken
                        ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                        : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                          supp.taken
                            ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                            : "border-[#38332D] bg-[#181715]"
                        }`}
                      >
                        {supp.taken && <Check className="h-3 w-3 stroke-3" />}
                      </div>
                      <div>
                        <span
                          className={`text-xs font-semibold ${
                            supp.taken ? "line-through text-[#8E867B]" : "text-[#F5F2EB]"
                          }`}
                        >
                          {supp.name}
                        </span>
                        {supp.timing && (
                          <span className="block text-[10px] text-[#8E867B] font-mono">
                            {supp.timing}
                          </span>
                        )}
                      </div>
                    </div>

                    {supp.dosage && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#2A2723] bg-[#181715] text-[#DDD6C9]">
                        {supp.dosage}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card E: Control Rápido de Hidratación */}
          <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141C1A] text-[#4EAB9E] border border-[#4EAB9E]/30">
                  <Droplet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">
                    Control de Hidratación
                  </h3>
                  <p className="text-[11px] text-[#8E867B] font-mono">
                    Meta óptima: {waterTarget} ml / día
                  </p>
                </div>
              </div>

              <span className="font-mono text-sm font-bold text-[#4EAB9E]">
                {waterPercent}%
              </span>
            </div>

            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-[#F5F2EB]">
                {waterMl} ml
              </span>
              <span className="text-xs text-[#8E867B]">
                Restan: {Math.max(0, waterTarget - waterMl)} ml
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-[#121110] border border-[#2A2723] overflow-hidden">
              <div
                className="h-full bg-[#4EAB9E] transition-all duration-300"
                style={{ width: `${waterPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickAddWater(250)}
                className="py-2 rounded-lg bg-[#121110] hover:bg-[#141C1A] border border-[#2A2723] hover:border-[#4EAB9E]/40 text-[#4EAB9E] font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                +250 ml
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickAddWater(500)}
                className="py-2 rounded-lg bg-[#121110] hover:bg-[#141C1A] border border-[#2A2723] hover:border-[#4EAB9E]/40 text-[#4EAB9E] font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                +500 ml
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleQuickAddWater(750)}
                className="py-2 rounded-lg bg-[#121110] hover:bg-[#141C1A] border border-[#2A2723] hover:border-[#4EAB9E]/40 text-[#F5F2EB] font-bold text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                +750 ml
              </button>
            </div>
          </div>

          {/* Card F: Termómetro de Gastos Hormiga */}
          <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    isAntExceeded
                      ? "bg-[#221716] text-[#E05D52] border-[#E05D52]/30"
                      : "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB]">
                    Gastos Hormiga
                  </h3>
                  <p className="text-[11px] text-[#8E867B] font-mono">
                    Presupuesto diario: ${antLimit} MXN
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal("finance")}
                className="px-2.5 py-1 rounded-lg bg-[#221716] hover:bg-[#2A1D1C] text-[#E05D52] border border-[#E05D52]/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 font-mono"
              >
                <Plus className="h-3 w-3" />
                <span>Gasto</span>
              </button>
            </div>

            <div
              className={`rounded-lg border p-4 space-y-3 ${
                isAntExceeded
                  ? "bg-[#221716] border-[#E05D52]/40"
                  : antPercent >= 80
                  ? "bg-[#221D16] border-[#D99B43]/40"
                  : "bg-[#121110] border-[#2A2723]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-2xl font-bold text-[#F5F2EB]">
                    ${antSpent.toFixed(0)}
                  </span>
                  <span className="font-mono text-xs text-[#8E867B] ml-1">
                    / ${antLimit} MXN
                  </span>
                </div>

                <div className="text-right font-mono text-xs">
                  <span
                    className={`font-bold ${
                      isAntExceeded
                        ? "text-[#E05D52]"
                        : antPercent >= 80
                        ? "text-[#D99B43]"
                        : "text-[#7EA35A]"
                    }`}
                  >
                    {isAntExceeded
                      ? `+$${(antSpent - antLimit).toFixed(0)} excedido`
                      : `$${antRemaining.toFixed(0)} restante`}
                  </span>
                  <p className="text-[10px] text-[#8E867B]">{antPercent}% del límite</p>
                </div>
              </div>

              <div className="h-1.5 w-full rounded-full bg-[#181715] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAntExceeded
                      ? "bg-[#E05D52]"
                      : antPercent >= 80
                      ? "bg-[#D99B43]"
                      : "bg-[#7EA35A]"
                  }`}
                  style={{ width: `${antPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
