"use client";

import {
  batchToggleSupplementsByTimingAction,
  logWaterAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { toggleTaskAction } from "@/app/actions/tasks";
import {
  CalendarDaySchedule,
  FinanceDashboardData,
  HabiticaTask,
  HabiticaUser,
  HealthDashboardData,
  RitualLog,
} from "@/lib/types";
import { calculatePercentage } from "@/lib/utils";
import {
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Droplet,
  Heart,
  Pill,
  Plus,
  Scale,
  Sparkles,
  Sun,
  Wallet,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

interface MobileQuickDashboardProps {
  user: HabiticaUser;
  tasks: HabiticaTask[];
  healthData: HealthDashboardData;
  financeData: FinanceDashboardData;
  calendarSchedule: CalendarDaySchedule;
  todayRitual: RitualLog | null;
  onOpenBottomSheet: (tab?: "expense" | "task" | "water" | "weight") => void;
  onOpenSmartFitModal: () => void;
  onOpenNotificationSettings: () => void;
  onOpenMorningRitual: () => void;
  onOpenEveningReview: () => void;
  onOpenManageSupplements: () => void;
}

export function MobileQuickDashboard({
  user,
  tasks,
  healthData,
  financeData,
  calendarSchedule,
  todayRitual,
  onOpenBottomSheet,
  onOpenSmartFitModal,
  onOpenNotificationSettings,
  onOpenMorningRitual,
  onOpenEveningReview,
  onOpenManageSupplements,
}: MobileQuickDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Current hour to determine automatic timing
  const currentHour = new Date().getHours();
  const defaultTiming = currentHour < 13 ? "Mañana" : "Tarde";
  const [activeSuppTiming, setActiveSuppTiming] = useState<"Mañana" | "Tarde" | "Todos">(defaultTiming);

  // RPG User stats
  const stats = user.stats;
  const hpPercent = calculatePercentage(stats.hp, stats.maxHealth || 50);
  const mpPercent = calculatePercentage(stats.mp, stats.maxMP || 100);

  // Health Data
  const todayHealth = healthData.todayHealth;
  const supplements = todayHealth?.supplements || [];
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
    if (activeSuppTiming === "Todos") return supplements;
    const term = activeSuppTiming.toLowerCase();
    return supplements.filter((s) => {
      const itemTiming = (s.timing || "").toLowerCase();
      if (term === "mañana") {
        return itemTiming.includes("mañana") || itemTiming.includes("morning") || itemTiming.includes("desayuno");
      }
      if (term === "tarde") {
        return itemTiming.includes("tarde") || itemTiming.includes("afternoon") || itemTiming.includes("comida");
      }
      return true;
    });
  }, [supplements, activeSuppTiming]);

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
    startTransition(async () => {
      await toggleSupplementAction(id);
    });
  };

  const handleBatchTakeSupplements = () => {
    startTransition(async () => {
      await batchToggleSupplementsByTimingAction(
        activeSuppTiming === "Todos" ? "all" : activeSuppTiming,
        !allTakenInActiveTiming
      );
    });
  };

  const handleQuickAddWater = (ml: number) => {
    startTransition(async () => {
      await logWaterAction(ml);
    });
  };

  const handleToggleTask = (task: HabiticaTask) => {
    startTransition(async () => {
      await toggleTaskAction(task.id, "up");
    });
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* 1. Header Compact RPG Bar */}
      <div className="rounded-3xl border border-white/8 bg-neutral-900/80 p-4 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 font-bold text-white shadow-md text-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">
                  {user.profile?.name || "Brio Commander"}
                </span>
                <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 font-mono">
                  Lv.{stats.lvl}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {currentHour < 12 ? "🌅 Buenos días" : currentHour < 19 ? "☀️ Buenas tardes" : "🌙 Buenas noches"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNotificationSettings}
              className="flex size-8 items-center justify-center rounded-xl bg-white/5 border border-white/8 text-neutral-400 hover:text-white transition-colors"
              title="Notificaciones & Recordatorios"
            >
              <Bell className="size-4" />
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Coins className="size-3.5 text-amber-400" />
              <span>{Math.floor(stats.gp)}</span>
            </div>
          </div>
        </div>

        {/* Mini Gauges: HP & MP */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/6 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="size-3" /> HP
              </span>
              <span className="text-neutral-400">{Math.round(stats.hp)}/{stats.maxHealth || 50}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-950 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-rose-600 to-rose-400 transition-all"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-indigo-400">
                <Zap className="size-3" /> MP
              </span>
              <span className="text-neutral-400">{Math.round(stats.mp)}/{stats.maxMP || 100}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-950 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-600 to-indigo-400 transition-all"
                style={{ width: `${mpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Widget de Suplementos Inteligente por Horario */}
      <div className="rounded-3xl border border-white/8 bg-neutral-900/80 p-4.5 backdrop-blur-xl shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Pill className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Suplementación</h3>
              <p className="text-[11px] text-neutral-400">
                {takenCountInActiveTiming}/{filteredSupplements.length} tomados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenManageSupplements}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Editar Catálogo
          </button>
        </div>

        {/* Filter Pills (Mañana / Tarde / Todos) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-950/80 border border-white/6">
          <button
            type="button"
            onClick={() => setActiveSuppTiming("Mañana")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSuppTiming === "Mañana"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sun className="size-3" />
            Mañana
          </button>
          <button
            type="button"
            onClick={() => setActiveSuppTiming("Tarde")}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSuppTiming === "Tarde"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Pill className="size-3" />
            Tarde
          </button>
          <button
            type="button"
            onClick={() => setActiveSuppTiming("Todos")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSuppTiming === "Todos"
                ? "bg-white/15 text-white border border-white/20 shadow-sm"
                : "text-neutral-400 hover:text-white"
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
            className={`w-full py-2.5 px-3 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-98 ${
              allTakenInActiveTiming
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30"
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
          <div className="rounded-2xl border border-white/5 bg-white/2 p-3 text-center text-xs text-neutral-500">
            No hay suplementos configurados para el turno de la {activeSuppTiming}.
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredSupplements.map((supp) => (
              <div
                key={supp.id}
                onClick={() => handleToggleSupplement(supp.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-98 ${
                  supp.taken
                    ? "bg-emerald-950/20 border-emerald-500/30 text-neutral-400"
                    : "bg-neutral-800/40 border-white/6 hover:border-white/15 text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      supp.taken
                        ? "bg-emerald-500 border-emerald-400 text-neutral-950 font-bold"
                        : "border-neutral-500 bg-neutral-900"
                    }`}
                  >
                    {supp.taken && <Check className="size-3.5 stroke-3" />}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-semibold ${
                        supp.taken ? "line-through text-neutral-400" : "text-white"
                      }`}
                    >
                      {supp.name}
                    </span>
                    {supp.timing && (
                      <span className="block text-[10px] text-neutral-500">
                        {supp.timing}
                      </span>
                    )}
                  </div>
                </div>

                {supp.dosage && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/6 text-neutral-400">
                    {supp.dosage}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Widget de Agenda & Tareas Must-Win */}
      <div className="rounded-3xl border border-white/8 bg-neutral-900/80 p-4.5 backdrop-blur-xl shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Zap className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Agenda & Foco Must-Win</h3>
              <p className="text-[11px] text-neutral-400">
                {mustWinTasks.filter((t) => t.completed).length}/{mustWinTasks.length} victorias de hoy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMorningRitual}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Ritual AM ⚡
          </button>
        </div>

        {/* Next Calendar Event Banner */}
        {nextEvent ? (
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Calendar className="size-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {nextEvent.title}
                </p>
                <p className="text-[10px] text-sky-300">
                  {nextEvent.startTimeFormatted} {nextEvent.timeUntil ? `(${nextEvent.timeUntil})` : ""}
                </p>
              </div>
            </div>
            {nextEvent.location && (
              <span className="text-[10px] font-mono text-neutral-400 truncate max-w-25">
                {nextEvent.location}
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/2 p-2.5 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
            <Clock className="size-3.5 text-neutral-500" />
            Sin reuniones pendientes para hoy
          </div>
        )}

        {/* Must-Win Tasks List */}
        {mustWinTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-3.5 text-center space-y-2">
            <p className="text-xs text-neutral-400">
              Aún no has definido tus 3 tareas Must-Win de hoy.
            </p>
            <button
              type="button"
              onClick={onOpenMorningRitual}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors inline-flex items-center gap-1.5"
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
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-98 ${
                  task.completed
                    ? "bg-indigo-950/20 border-indigo-500/30 text-neutral-400"
                    : "bg-neutral-800/40 border-white/6 hover:border-white/15 text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      task.completed
                        ? "bg-indigo-500 border-indigo-400 text-white font-bold"
                        : "border-neutral-500 bg-neutral-900"
                    }`}
                  >
                    {task.completed && <Check className="size-3.5 stroke-3" />}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      task.completed ? "line-through text-neutral-400" : "text-white"
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
      <div className="rounded-3xl border border-white/8 bg-neutral-900/80 p-4.5 backdrop-blur-xl shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-xl border ${
                isAntExceeded
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}
            >
              <Wallet className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Gastos Hormiga del Día</h3>
              <p className="text-[11px] text-neutral-400">
                Presupuesto diario: ${antLimit} MXN
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenBottomSheet("expense")}
            className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition-all flex items-center gap-1"
          >
            <Plus className="size-3" />
            Gasto
          </button>
        </div>

        {/* Thermometer Status Card */}
        <div
          className={`rounded-2xl border p-3.5 space-y-2.5 ${
            isAntExceeded
              ? "bg-rose-950/20 border-rose-500/40"
              : antPercent >= 80
              ? "bg-amber-950/20 border-amber-500/40"
              : "bg-neutral-950/60 border-white/6"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold text-white">
                ${antSpent.toFixed(0)}
              </span>
              <span className="text-xs text-neutral-400 ml-1">/ ${antLimit} MXN</span>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-bold ${
                  isAntExceeded
                    ? "text-rose-400"
                    : antPercent >= 80
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {isAntExceeded
                  ? `+$${(antSpent - antLimit).toFixed(0)} excedido`
                  : `$${antRemaining.toFixed(0)} disponible`}
              </span>
              <p className="text-[10px] text-neutral-500">{antPercent}% consumido</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
            <div
              className={`h-full transition-all ${
                isAntExceeded
                  ? "bg-rose-500"
                  : antPercent >= 80
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, antPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Widget de Hidratación & Composición Corporal */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hidratación Card */}
        <div className="rounded-3xl border border-white/8 bg-neutral-900/80 p-4 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Droplet className="size-4 text-sky-400" />
              <span className="text-xs font-semibold text-white">Agua</span>
            </div>
            <span className="text-[10px] font-bold text-sky-300">{waterPercent}%</span>
          </div>

          <div>
            <div className="text-xl font-extrabold text-white">
              {waterMl}
              <span className="text-xs font-normal text-neutral-400">/3000ml</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-950 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-sky-500 to-cyan-400 transition-all"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleQuickAddWater(250)}
              className="py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              +250ml
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleQuickAddWater(500)}
              className="py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-200 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              +500ml
            </button>
          </div>
        </div>

        {/* Composición Corporal Card */}
        <div
          onClick={onOpenSmartFitModal}
          className="rounded-3xl border border-white/8 bg-neutral-900/80 p-4 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-3 cursor-pointer hover:border-white/15 transition-all active:scale-98"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">SmartFit</span>
            </div>
            <ChevronRight className="size-3.5 text-neutral-500" />
          </div>

          <div>
            <div className="text-xl font-extrabold text-white">
              {healthData.latestBodyComposition?.weightKg || 78.6}
              <span className="text-xs font-normal text-neutral-400"> kg</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
              <span>Grasa: <strong className="text-neutral-200">{healthData.latestBodyComposition?.bodyFatPercentage || 24.6}%</strong></span>
              <span>Músculo: <strong className="text-neutral-200">{healthData.latestBodyComposition?.skeletalMuscleKg || 33.7}kg</strong></span>
            </div>
          </div>

          <div className="py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold text-center">
            Ver Bioimpedancia
          </div>
        </div>
      </div>
    </div>
  );
}
