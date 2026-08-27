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
  ContextualNote,
  FinanceDashboardData,
  HabiticaTag,
  HabiticaTask,
  HabiticaUser,
  HealthDashboardData,
  ProjectItem,
  RitualLog,
} from "@/lib/types";
import {
  ArrowRight,
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
  Wallet,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { ProjectFocusCard } from "./ProjectFocusCard";

interface TodayViewClientProps {
  user: HabiticaUser;
  tasks: HabiticaTask[];
  tags?: HabiticaTag[];
  healthData: HealthDashboardData;
  financeData: FinanceDashboardData;
  todayRitual: RitualLog | null;
  projects?: ProjectItem[];
  contextualNotes?: ContextualNote[];
}

export function TodayViewClient({
  user: _user,
  tasks,
  tags = [],
  healthData,
  financeData,
  todayRitual,
  projects = [],
  contextualNotes = [],
}: TodayViewClientProps) {
  const router = useRouter();
  const { openModal } = useCommandCenter();
  const [isPending, startTransition] = useTransition();

  // State for collapsible drawer of general habits
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
        if (action.timing === "Todos") {
          return state.map((s) => ({ ...s, taken: action.taken }));
        }
        return state.map((s) => {
          const sTiming = (s.timing || "").toLowerCase();
          const targetTiming = action.timing.toLowerCase();
          if (sTiming.includes(targetTiming)) {
            return { ...s, taken: action.taken };
          }
          return s;
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

  // General Habitica Dailies
  const generalDailyTasks = useMemo(
    () => optimisticTasks.filter((t) => t.type === "daily"),
    [optimisticTasks]
  );
  const pendingDailiesCount = generalDailyTasks.filter((t) => !t.completed).length;

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
    todayRitual?.energyLevel ||
      todayRitual?.dayIntention ||
      (todayRitual?.mustWinTasks && todayRitual.mustWinTasks.length > 0)
  );
  const hasEveningReview = Boolean(todayRitual?.reflection);

  const isMorningWindow = currentHour < 13;
  const isEveningWindow = currentHour >= 19;

  return (
    <div className="w-full space-y-5 pb-24 sm:pb-16 font-sans animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER CONTEXTUAL                                                      */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs uppercase tracking-wider text-[#8E867B]">
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
              title="Ritual Matutino de Despegue"
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
      {/* 2. TIME-OF-DAY RITUAL BANNER                                              */}
      {/* ========================================================================= */}
      {isMorningWindow && !hasMorningRitual && (
        <div className="rounded-xl border border-[#7EA35A]/35 bg-[#141813] p-4 sm:p-4.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7EA35A]/20 text-[#7EA35A] border border-[#7EA35A]/40">
              <Sun className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB] truncate">
                Despegue Suave & Autocuidado
              </h3>
              <p className="text-xs text-[#7EA35A] font-mono truncate">
                Despeja el cuerpo, revisa tu energía y completa tu rutina física
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openModal("morningRitual")}
            className="px-4 py-2 rounded-lg bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 font-mono"
          >
            <span>Iniciar AM</span>
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
                Revisa el avance del proyecto, anota reflexiones y despeja tu mente
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
      {/* 3. MAIN RESPONSIVE GRID (Left: Project Zen Focus | Right: Bio & Finance)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN (7 COLS): PROYECTO EN FOCO & TAREAS                         */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <ProjectFocusCard
            projects={projects}
            tasks={optimisticTasks}
            tags={tags}
            contextualNotes={contextualNotes}
            onRefreshData={() => router.refresh()}
          />

          {/* Collapsible Drawer for general habits / dailies */}
          {generalDailyTasks.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="w-full py-2.5 px-3.5 rounded-lg border border-[#2A2723] bg-[#181715] hover:bg-[#22201D] text-[#8E867B] hover:text-[#DDD6C9] font-mono text-xs flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>Hábitos Diarios de Habitica</span>
                  {pendingDailiesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#221D16] text-[#D99B43] font-bold text-[10px] border border-[#D99B43]/30">
                      {pendingDailiesCount} pendientes
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
                <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  {generalDailyTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                        task.completed
                          ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                          : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#DDD6C9]"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                            task.completed
                              ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                              : "border-[#38332D] bg-[#181715]"
                          }`}
                        >
                          {task.completed && (
                            <Check className="h-3 w-3 stroke-3" />
                          )}
                        </div>
                        <span
                          className={`text-xs truncate ${
                            task.completed
                              ? "line-through text-[#8E867B]"
                              : "text-[#F5F2EB]"
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#8E867B]">
                        Daily
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (5 COLS): BIO-CONTROL & FINANZAS HORMIGA                   */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {/* Suplementos Contextuales */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-[#7EA35A]" />
                <span className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                  Suplementos
                </span>
              </div>

              {/* Timing Selector Tabs */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#121110] border border-[#2A2723] font-mono text-[11px]">
                {(["Mañana", "Tarde", "Noche", "Todos"] as const).map(
                  (timing) => (
                    <button
                      key={timing}
                      type="button"
                      onClick={() => {
                        setActiveSuppTiming(timing);
                        setIsSuppDetailsOpen(false);
                      }}
                      className={`px-2 py-1 rounded-md text-center font-semibold transition-all cursor-pointer ${
                        activeSuppTiming === timing
                          ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-2xs"
                          : "text-[#8E867B] hover:text-[#DDD6C9]"
                      }`}
                    >
                      {timing}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Smart Summary / 1-Tap Take Action */}
            {filteredSupplements.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8E867B]">
                    Turno {activeSuppTiming}:
                  </span>
                  <span
                    className={
                      allTakenInActiveTiming
                        ? "text-[#7EA35A] font-bold"
                        : "text-[#D99B43]"
                    }
                  >
                    {takenCountInActiveTiming} de {filteredSupplements.length}{" "}
                    tomados
                  </span>
                </div>

                {/* 1-Tap Complete Pack Button */}
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
                      ? `✓ Pack ${activeSuppTiming} Completado`
                      : `Tomar Pack ${activeSuppTiming} (${pendingInActiveTiming} pendientes)`}
                  </span>
                </button>

                {/* Toggle details list */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSuppDetailsOpen(!isSuppDetailsOpen)}
                    className="text-[11px] font-mono text-[#8E867B] hover:text-[#DDD6C9] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>
                      {isSuppDetailsOpen
                        ? "Ocultar lista individual"
                        : "Ver / marcar individuales"}
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${
                        isSuppDetailsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isSuppDetailsOpen && (
                    <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-200">
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
                          <span className="font-mono text-[10px] text-[#8E867B]">
                            {supp.dosage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8E867B] font-mono italic">
                Sin suplementos programados para este turno.
              </p>
            )}
          </div>

          {/* Hidratación Inteligente */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-[#4EAB9E]" />
                <span className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                  Hidratación
                </span>
              </div>
              <span className="font-mono text-xs text-[#4EAB9E] font-bold">
                {optimisticWater} / {waterTarget} ml ({waterPercent}%)
              </span>
            </div>

            {/* Quick 1-Tap Log Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleQuickAddWater(250)}
                  className="py-2 px-3 rounded-lg border border-[#2A2723] bg-[#121110] hover:bg-[#1C2219] hover:border-[#4EAB9E]/40 text-[#DDD6C9] hover:text-[#4EAB9E] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+250 ml (Vaso)</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleQuickAddWater(500)}
                  className="py-2 px-3 rounded-lg border border-[#2A2723] bg-[#121110] hover:bg-[#1C2219] hover:border-[#4EAB9E]/40 text-[#DDD6C9] hover:text-[#4EAB9E] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>+500 ml (Botella)</span>
                </button>
              </div>

              {/* Minimal Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-[#121110] overflow-hidden">
                <div
                  className="h-full bg-[#4EAB9E] transition-all duration-300 rounded-full"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>

              {isWaterComplete && (
                <p className="text-[11px] text-[#7EA35A] font-mono text-center font-semibold">
                  ✓ Meta de hidratación óptima alcanzada hoy.
                </p>
              )}
            </div>
          </div>

          {/* Micro-Barra de Gastos Hormiga */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm space-y-3">
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
                    <span className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB]">
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
                  <p className="font-mono text-[11px] text-[#8E867B] truncate">
                    Gastado: ${antSpent.toFixed(0)} / ${antLimit.toFixed(0)} meta
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal("finance")}
                className="px-3 py-1.5 rounded-lg bg-[#221D16] hover:bg-[#2F271D] text-[#D99B43] border border-[#D99B43]/30 text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1"
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
