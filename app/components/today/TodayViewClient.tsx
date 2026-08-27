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
  FinanceDashboardData,
  HabiticaTask,
  HabiticaUser,
  HealthDashboardData,
  RitualLog,
} from "@/lib/types";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplet,
  Flame,
  Moon,
  Pill,
  Plus,
  Sparkles,
  Sun,
  Trophy,
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
  todayRitual: RitualLog | null;
}

export function TodayViewClient({
  user: _user,
  tasks,
  healthData,
  financeData,
  todayRitual,
}: TodayViewClientProps) {
  const router = useRouter();
  const { openModal } = useCommandCenter();
  const [isPending, startTransition] = useTransition();

  // State for collapsible drawer of other tasks/habits
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSuppDetailsOpen, setIsSuppDetailsOpen] = useState(false);

  // Time of day detection
  const currentHour = new Date().getHours();
  const defaultTiming =
    currentHour < 13 ? "Mañana" : currentHour < 19 ? "Tarde" : "Noche";
  const [activeSuppTiming, setActiveSuppTiming] = useState<
    "Mañana" | "Tarde" | "Noche" | "Todos"
  >(defaultTiming);

  // Optimistic Tasks
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (state, taskId: string) =>
      state.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
  );

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
        return state.map((s) =>
          s.id === action.id ? { ...s, taken: !s.taken } : s
        );
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

  const rawWaterMl = todayHealth?.waterMl || 0;
  const [optimisticWater, setOptimisticWater] = useOptimistic(
    rawWaterMl,
    (state, added: number) => state + added
  );
  const waterTarget = 3000;
  const waterPercent = Math.min(
    100,
    Math.round((optimisticWater / waterTarget) * 100)
  );
  const isWaterComplete = optimisticWater >= waterTarget;

  // Finance Data (Ant Expenses)
  const antSpent = financeData.totalAntExpensesToday || 0;
  const antLimit = financeData.currentBudget?.dailyAntLimit || 150;
  const antRemaining =
    financeData.remainingDailyAntBudget ?? Math.max(0, antLimit - antSpent);
  const antPercent = Math.min(
    100,
    Math.round((antSpent / Math.max(1, antLimit)) * 100)
  );
  const isAntExceeded = antSpent > antLimit;

  // Must-Win Tasks
  const mustWinIds = useMemo(
    () => todayRitual?.mustWinTasks || [],
    [todayRitual]
  );
  const mustWinTasks = useMemo(
    () => optimisticTasks.filter((t) => mustWinIds.includes(t.id)),
    [optimisticTasks, mustWinIds]
  );
  const completedMustWins = mustWinTasks.filter((t) => t.completed).length;
  const totalMustWins = mustWinTasks.length;
  const allMustWinsCompleted =
    totalMustWins > 0 && completedMustWins === totalMustWins;

  // Find the current active sequential task
  const activeMustWin = useMemo(() => {
    return mustWinTasks.find((t) => !t.completed) || null;
  }, [mustWinTasks]);

  const activeMustWinIndex = activeMustWin
    ? mustWinTasks.findIndex((t) => t.id === activeMustWin.id)
    : -1;

  // Habitica Dailies for today (excluding must-wins)
  const dailyTasks = useMemo(
    () =>
      optimisticTasks.filter(
        (t) =>
          t.type === "daily" ||
          (t.type === "todo" && !mustWinIds.includes(t.id))
      ),
    [optimisticTasks, mustWinIds]
  );

  const pendingDailiesCount = dailyTasks.filter((t) => !t.completed).length;
  const totalOtherPending =
    (totalMustWins - completedMustWins > 1
      ? totalMustWins - completedMustWins - 1
      : 0) + pendingDailiesCount;

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
  const takenCountInActiveTiming =
    filteredSupplements.filter((s) => s.taken).length;
  const pendingInActiveTiming =
    filteredSupplements.length - takenCountInActiveTiming;

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
      setOptimisticWater(ml);
      await logWaterAction(ml);
      router.refresh();
    });
  };

  const handleToggleTask = (task: HabiticaTask) => {
    soundFx.taskComplete();
    startTransition(async () => {
      setOptimisticTasks(task.id);
      await toggleTaskAction(task.id, "up");
      router.refresh();
    });
  };

  const hasMorningRitual = Boolean(
    todayRitual?.mustWinTasks && todayRitual.mustWinTasks.length > 0
  );
  const hasEveningReview = Boolean(todayRitual?.reflection);

  const isMorningWindow = currentHour < 13;
  const isEveningWindow = currentHour >= 19;

  return (
    <div className="w-full space-y-5 pb-20 sm:pb-12 font-sans animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER CONTEXTUAL (Clean & Responsive)                                 */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs uppercase tracking-wider text-[#8E867B] capitalize">
                {todayFormatted}
              </span>
              <span className="h-1 w-1 rounded-full bg-[#38332D]" />
              <span className="font-mono text-xs text-[#D99B43]">
                Semana {Math.ceil(new Date().getDate() / 7)}
              </span>
            </div>
            <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#F5F2EB]">
              Comando del Día
            </h1>
          </div>

          {/* Circadian Badge & Quick Ritual Openers */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium"
              style={{
                backgroundColor: `${hormonalStatus.currentPhase.color}12`,
                borderColor: `${hormonalStatus.currentPhase.color}35`,
                color: hormonalStatus.currentPhase.color,
              }}
              title={`${hormonalStatus.currentPhase.name}: ${hormonalStatus.remainingFormatted} restantes`}
            >
              <span>{hormonalStatus.currentPhase.icon}</span>
              <span className="font-bold">
                {hormonalStatus.currentPhase.shortName}
              </span>
              <span className="text-[10px] opacity-75 hidden sm:inline">
                ({hormonalStatus.remainingFormatted})
              </span>
            </div>

            <button
              type="button"
              onClick={() => openModal("morningRitual")}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                hasMorningRitual
                  ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                  : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
              title="Ritual Matutino"
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Ritual AM</span>
              {hasMorningRitual && <Check className="h-3 w-3 stroke-3 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => openModal("eveningReview")}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                hasEveningReview
                  ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                  : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
              title="Cierre Nocturno"
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Cierre PM</span>
              {hasEveningReview && <Check className="h-3 w-3 stroke-3 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TIME-OF-DAY INTELLIGENT RITUAL BANNER (Contextual Prompts)             */}
      {/* ========================================================================= */}
      {isMorningWindow && !hasMorningRitual && (
        <div className="rounded-xl border border-[#D99B43]/40 bg-[#221D16] p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D99B43]/20 text-[#D99B43] border border-[#D99B43]/40">
              <Sun className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB] truncate">
                Inicia tu Ritual Matutino
              </h3>
              <p className="text-xs text-[#D99B43] font-mono truncate">
                Define tus 3 Victorias Clave de hoy para alinear tu energía dopaminérgica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal("morningRitual")}
            className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 font-mono"
          >
            <span>Iniciar Ritual</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {isEveningWindow && !hasEveningReview && (
        <div className="rounded-xl border border-[#4EAB9E]/40 bg-[#141C1A] p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4EAB9E]/20 text-[#4EAB9E] border border-[#4EAB9E]/40">
              <Moon className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB] truncate">
                Cierre & Reflexión del Día
              </h3>
              <p className="text-xs text-[#4EAB9E] font-mono truncate">
                Revisa tus victorias, anota reflexiones y despeja tu mente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal("eveningReview")}
            className="px-4 py-2 rounded-lg bg-[#4EAB9E] hover:bg-[#5BBDAF] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 font-mono"
          >
            <span>Hacer Cierre</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN RESPONSIVE GRID (Left: Sequential Tasks | Right: Bio & Finance)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN (7 COLS): MODO FOCO SECUENCIAL Y TAREAS                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#D99B43]" />
                <span className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                  Siguiente Victoria en Foco
                </span>
              </div>

              {totalMustWins > 0 && (
                <div className="flex items-center gap-1 font-mono text-xs text-[#D99B43] bg-[#221D16] px-2.5 py-1 rounded border border-[#D99B43]/30">
                  <Award className="h-3.5 w-3.5" />
                  <span>
                    {completedMustWins} de {totalMustWins} victorias
                  </span>
                </div>
              )}
            </div>

            {/* Case A: No Must-Wins configured yet */}
            {totalMustWins === 0 && (
              <div className="rounded-lg border border-dashed border-[#2A2723] bg-[#121110] p-6 sm:p-8 text-center space-y-3">
                <Sparkles className="h-8 w-8 text-[#D99B43] mx-auto opacity-80" />
                <div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                    Sin Victorias Must-Win definidas
                  </h4>
                  <p className="text-xs text-[#8E867B] max-w-md mx-auto mt-1 font-mono">
                    Selecciona tus 3 tareas críticas en el Ritual Matutino para enfocarte con claridad y sin saturación.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal("morningRitual")}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 font-mono"
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Definir en Ritual AM</span>
                </button>
              </div>
            )}

            {/* Case B: All Must-Wins Completed! */}
            {allMustWinsCompleted && (
              <div className="rounded-xl border border-[#7EA35A]/40 bg-[#141813] p-6 text-center space-y-3 animate-in zoom-in-95 duration-300">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#7EA35A]/20 text-[#7EA35A] border border-[#7EA35A]/40">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB]">
                    ¡Completaste tus {totalMustWins} Victorias de Hoy!
                  </h4>
                  <p className="text-xs sm:text-sm text-[#7EA35A] max-w-md mx-auto mt-1 font-mono">
                    Excelente ejecución y enfoque. Tu energía dopaminérgica está en su nivel óptimo.
                  </p>
                </div>
              </div>
            )}

            {/* Case C: Active Sequential Task Card */}
            {activeMustWin && (
              <div className="space-y-4">
                {/* Stepper Dots */}
                <div className="flex items-center gap-2">
                  {mustWinTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                        task.completed
                          ? "bg-[#7EA35A]"
                          : idx === activeMustWinIndex
                          ? "bg-[#D99B43]"
                          : "bg-[#2A2723]"
                      }`}
                    />
                  ))}
                </div>

                {/* Active Card Body */}
                <div className="rounded-xl border border-[#D99B43]/35 bg-[#121110] p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-[#D99B43] bg-[#221D16] px-2.5 py-1 rounded border border-[#D99B43]/30">
                      Victoria #{activeMustWinIndex + 1} de {totalMustWins}
                    </span>

                    <span className="font-mono text-xs text-[#8E867B] bg-[#181715] px-2.5 py-1 rounded border border-[#2A2723]">
                      +{activeMustWin.value ? Math.round(activeMustWin.value * 10) : 10} XP
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-base sm:text-xl font-bold text-[#F5F2EB] leading-snug">
                      {activeMustWin.text}
                    </h3>
                    {activeMustWin.notes && (
                      <p className="text-xs sm:text-sm text-[#8E867B] font-mono mt-2 leading-relaxed">
                        {activeMustWin.notes}
                      </p>
                    )}
                  </div>

                  {/* 1-Tap Big Complete Action Button */}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleTask(activeMustWin)}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] active:scale-[0.99] text-[#121110] font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm font-sans"
                  >
                    <Check className="h-4 w-4 stroke-3" />
                    <span>Completar Victoria y Avanzar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Drawer for other Must-Wins & Daily Habits */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="w-full py-2.5 px-3.5 rounded-lg border border-[#2A2723] bg-[#121110] hover:bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] font-mono text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>Otras tareas y hábitos diarios</span>
                  {totalOtherPending > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#221D16] text-[#D99B43] font-bold text-[10px] border border-[#D99B43]/30">
                      {totalOtherPending} pendientes
                    </span>
                  )}
                </span>
                {isDrawerOpen ? (
                  <ChevronUp className="h-4 w-4 text-[#8E867B]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#8E867B]" />
                )}
              </button>

              {isDrawerOpen && (
                <div className="mt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Other Must-Wins */}
                  {totalMustWins > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] text-[#8E867B] uppercase tracking-wider block px-1">
                        Victorias del Día ({completedMustWins}/{totalMustWins})
                      </span>
                      {mustWinTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task)}
                          className={`flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer select-none ${
                            task.completed
                              ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                              : "bg-[#121110] border-[#2A2723] hover:border-[#D99B43]/40 text-[#F5F2EB]"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                task.completed
                                  ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                                  : "border-[#38332D] bg-[#181715]"
                              }`}
                            >
                              {task.completed && (
                                <Check className="h-3.5 w-3.5 stroke-3" />
                              )}
                            </div>
                            <span
                              className={`text-xs sm:text-sm truncate ${
                                task.completed
                                  ? "line-through text-[#8E867B]"
                                  : "text-[#F5F2EB]"
                              }`}
                            >
                              #{idx + 1} {task.text}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#8E867B] shrink-0 ml-2">
                            +{task.value ? Math.round(task.value * 10) : 10} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Daily Habits (Dailies) */}
                  {dailyTasks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] text-[#8E867B] uppercase tracking-wider block px-1">
                        Hábitos Diarios ({dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length})
                      </span>
                      {dailyTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task)}
                          className={`flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer select-none ${
                            task.completed
                              ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                              : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#DDD6C9]"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                task.completed
                                  ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                                  : "border-[#38332D] bg-[#181715]"
                              }`}
                            >
                              {task.completed && (
                                <Check className="h-3.5 w-3.5 stroke-3" />
                              )}
                            </div>
                            <span
                              className={`text-xs sm:text-sm truncate ${
                                task.completed
                                  ? "line-through text-[#8E867B]"
                                  : "text-[#F5F2EB]"
                              }`}
                            >
                              {task.text}
                            </span>
                          </div>

                          {task.streak !== undefined && task.streak > 0 && (
                            <span className="font-mono text-xs text-[#D99B43] flex items-center gap-1 shrink-0 ml-2">
                              <Flame className="h-3.5 w-3.5" />
                              <span>{task.streak}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (5 COLS): BIO-CONTROL & MICRO-FINANZAS                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card A: Suplementación Inteligente */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-[#7EA35A]" />
                <span className="font-serif text-sm font-bold text-[#F5F2EB]">
                  Suplementos ({activeSuppTiming})
                </span>
              </div>

              <button
                type="button"
                onClick={() => openModal("manageSupplements")}
                className="text-[11px] font-mono text-[#D99B43] hover:text-[#E8AF59] transition-colors cursor-pointer"
              >
                Catálogo ⚙️
              </button>
            </div>

            {/* Quick Timing Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#121110] border border-[#2A2723] font-mono text-xs">
              {(["Mañana", "Tarde", "Noche"] as const).map((timing) => (
                <button
                  key={timing}
                  type="button"
                  onClick={() => {
                    setActiveSuppTiming(timing);
                    setIsSuppDetailsOpen(false);
                  }}
                  className={`flex-1 py-1.5 rounded-md text-center font-semibold transition-all cursor-pointer ${
                    activeSuppTiming === timing
                      ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-2xs"
                      : "text-[#8E867B] hover:text-[#DDD6C9]"
                  }`}
                >
                  {timing}
                </button>
              ))}
            </div>

            {/* If all taken in this timing: Minimized State */}
            {filteredSupplements.length > 0 && allTakenInActiveTiming && !isSuppDetailsOpen && (
              <div className="rounded-lg border border-[#7EA35A]/35 bg-[#141813] p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-[#7EA35A] font-semibold font-mono truncate">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">Pack {activeSuppTiming} completado ({takenCountInActiveTiming}/{filteredSupplements.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSuppDetailsOpen(true)}
                  className="text-[11px] font-mono text-[#8E867B] hover:text-[#DDD6C9] underline cursor-pointer shrink-0"
                >
                  Ver
                </button>
              </div>
            )}

            {/* If pending or user clicked 'Ver' */}
            {(pendingInActiveTiming > 0 || isSuppDetailsOpen || filteredSupplements.length === 0) && (
              <div className="space-y-2.5">
                {filteredSupplements.length > 0 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleBatchTakeSupplements}
                    className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs font-sans ${
                      allTakenInActiveTiming
                        ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40"
                        : "bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110]"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {allTakenInActiveTiming
                        ? `✓ Desmarcar Pack de la ${activeSuppTiming}`
                        : `Tomar Pack de la ${activeSuppTiming} (${pendingInActiveTiming})`}
                    </span>
                  </button>
                )}

                {filteredSupplements.length === 0 ? (
                  <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-center text-xs text-[#8E867B] font-mono">
                    Sin suplementos en la {activeSuppTiming}.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                    {filteredSupplements.map((supp) => (
                      <div
                        key={supp.id}
                        onClick={() => handleToggleSupplement(supp.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                          supp.taken
                            ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                            : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              supp.taken
                                ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                                : "border-[#38332D] bg-[#181715]"
                            }`}
                          >
                            {supp.taken && (
                              <Check className="h-2.5 w-2.5 stroke-3" />
                            )}
                          </div>
                          <span
                            className={`text-xs truncate ${
                              supp.taken
                                ? "line-through text-[#8E867B]"
                                : "text-[#F5F2EB]"
                            }`}
                          >
                            {supp.name}
                          </span>
                        </div>

                        {supp.dosage && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[#2A2723] bg-[#181715] text-[#DDD6C9] shrink-0 ml-1.5">
                            {supp.dosage}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card B: Control de Hidratación */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-[#4EAB9E]" />
                <span className="font-serif text-sm font-bold text-[#F5F2EB]">
                  Hidratación
                </span>
              </div>

              <span className="font-mono text-xs font-bold text-[#4EAB9E]">
                {waterPercent}%
              </span>
            </div>

            {/* Minimized or Active state */}
            {isWaterComplete ? (
              <div className="rounded-lg border border-[#4EAB9E]/35 bg-[#141C1A] p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-[#4EAB9E] font-semibold font-mono truncate">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">Meta alcanzada ({optimisticWater} / {waterTarget} ml)</span>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleQuickAddWater(250)}
                  className="px-2.5 py-1 rounded bg-[#121110] border border-[#4EAB9E]/30 text-[#4EAB9E] font-mono text-xs font-bold hover:bg-[#141C1A] cursor-pointer shrink-0"
                >
                  +250ml
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xl sm:text-2xl font-bold text-[#F5F2EB]">
                    {optimisticWater} ml
                  </span>
                  <span className="text-xs text-[#8E867B]">
                    Meta: {waterTarget} ml
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-[#121110] border border-[#2A2723] overflow-hidden">
                  <div
                    className="h-full bg-[#4EAB9E] transition-all duration-300"
                    style={{ width: `${waterPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5 font-mono">
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
                </div>
              </div>
            )}
          </div>

          {/* Card C: Micro-Finanzas (Gastos Hormiga) */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    isAntExceeded
                      ? "bg-[#221716] text-[#E05D52] border-[#E05D52]/30"
                      : "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xs font-bold text-[#F5F2EB]">
                      Gastos Hormiga
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        isAntExceeded
                          ? "bg-[#221716] text-[#E05D52] border-[#E05D52]/30"
                          : "bg-[#141813] text-[#7EA35A] border-[#7EA35A]/30"
                      }`}
                    >
                      {isAntExceeded
                        ? `+$${(antSpent - antLimit).toFixed(0)} exc.`
                        : `$${antRemaining.toFixed(0)} disp.`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E867B] font-mono truncate">
                    ${antSpent.toFixed(0)} de ${antLimit} MXN diarios ({antPercent}%)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal("finance")}
                className="px-3 py-1.5 rounded-lg bg-[#221716] hover:bg-[#2A1D1C] text-[#E05D52] border border-[#E05D52]/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 font-mono shrink-0 active:scale-95"
              >
                <Plus className="h-3 w-3" />
                <span>Gasto</span>
              </button>
            </div>

            {/* Minimal Progress Line */}
            <div className="h-1 w-full rounded-full bg-[#121110] mt-3 overflow-hidden">
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
  );
}

