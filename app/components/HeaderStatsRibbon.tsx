"use client";

import { toggleSleepAction } from "@/app/actions/tasks";
import { useSession } from "@/lib/auth-client";
import { HabiticaUser } from "@/lib/types";
import { calculatePercentage, capitalize } from "@/lib/utils";
import {
  Activity,
  Bed,
  BookOpen,
  Calendar,
  Coins,
  Dumbbell,
  Edit3,
  Heart,
  LogOut,
  Moon,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet,
  Zap,
  Bell,
  Smartphone
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type DashboardMainTab =
  | "quick"
  | "tasks"
  | "finance"
  | "analytics"
  | "calendar"
  | "health"
  | "projects";

interface HeaderStatsRibbonProps {
  user: HabiticaUser;
  isConfigured: boolean;
  activeMainTab: DashboardMainTab;
  onTabChange: (tab: DashboardMainTab) => void;
  onOpenCommandPalette: () => void;
  onOpenMorningRitual: () => void;
  onOpenEveningReview: () => void;
  onOpenAuthModal: () => void;
  onOpenFocusModal: () => void;
  onOpenScratchpad: () => void;
  onOpenNotificationSettings: () => void;
}

export function HeaderStatsRibbon({
  user,
  isConfigured,
  activeMainTab,
  onTabChange,
  onOpenCommandPalette,
  onOpenMorningRitual,
  onOpenEveningReview,
  onOpenAuthModal,
  onOpenFocusModal,
  onOpenScratchpad,
  onOpenNotificationSettings,
}: HeaderStatsRibbonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  const stats = user.stats;
  const isResting = user.flags?.rest || false;
  const hpPercent = calculatePercentage(stats.hp, stats.maxHealth || 50);
  const mpPercent = calculatePercentage(stats.mp, stats.maxMP || 100);
  const expPercent = calculatePercentage(stats.exp, stats.toNextLevel || 100);

  const isLowHp = stats.hp <= 15;

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleToggleRest = () => {
    startTransition(async () => {
      await toggleSleepAction();
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      const { logoutOwnerAction } = await import("@/app/actions/auth");
      await logoutOwnerAction();
      window.location.reload();
    });
  };

  return (
    <header className="rounded-3xl border border-white/8 bg-neutral-900/70 p-4 sm:p-5 backdrop-blur-xl shadow-2xl transition-all space-y-4">
      {/* Top Row: Character ID & Gauges */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Branding, Identity & Inn */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-500 font-mono font-bold text-white shadow-lg shadow-indigo-500/20">
              <span className="text-xl">B</span>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-neutral-900 ${isResting ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                  }`}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  {session?.user?.name || user.profile.name || "Brio Commander"}
                </h1>
                <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400">
                  Lvl {stats.lvl}
                </span>
                <span className="rounded-md border border-neutral-700 bg-neutral-800/80 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                  {capitalize(stats.class || "warrior")}
                </span>

                {/* Rest at Inn */}
                <button
                  type="button"
                  onClick={handleToggleRest}
                  disabled={isPending}
                  title={isResting ? "Wake from Inn" : "Rest at Inn (pause daily damage)"}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${isResting
                    ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 animate-pulse"
                    : "border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200"
                    }`}
                >
                  <Bed className="h-3 w-3" />
                  <span>{isResting ? "En la Posada" : "Posada"}</span>
                </button>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Personal Command Center & Life OS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={onOpenCommandPalette}
              aria-label="Open command palette"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: RPG Stat Gauges + Auth Status */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Health Bar (HP) */}
          <div className="min-w-28.75 flex-1 rounded-xl border border-white/6 bg-neutral-950/60 px-3 py-1.5 sm:flex-initial">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-rose-400 text-[11px]">
                <Heart
                  className={`h-3 w-3 fill-rose-500/20 text-rose-500 ${isLowHp ? "animate-pulse text-rose-400" : ""
                    }`}
                />
                HP
              </span>
              <span className="font-mono text-[10px] text-neutral-300">
                {Math.round(stats.hp)}/{stats.maxHealth || 50}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full transition-all duration-500 ${isLowHp ? "bg-rose-500" : "bg-linear-to-r from-rose-500 to-red-400"
                  }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana Bar (MP) */}
          <div className="min-w-28.75 flex-1 rounded-xl border border-white/6 bg-neutral-950/60 px-3 py-1.5 sm:flex-initial">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-sky-400 text-[11px]">
                <Zap className="h-3 w-3 fill-sky-500/20 text-sky-400" />
                MP
              </span>
              <span className="font-mono text-[10px] text-neutral-300">
                {Math.round(stats.mp)}/{stats.maxMP || 100}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-linear-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${mpPercent}%` }}
              />
            </div>
          </div>

          {/* EXP */}
          <div className="min-w-28.75 flex-1 rounded-xl border border-white/6 bg-neutral-950/60 px-3 py-1.5 sm:flex-initial">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-amber-400 text-[11px]">
                <Sparkles className="h-3 w-3 text-amber-400" />
                EXP
              </span>
              <span className="font-mono text-[10px] text-neutral-300">
                {Math.round(stats.exp)}/{stats.toNextLevel || 100}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>

          {/* Gold (GP) */}
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Coins className="h-3 w-3" />
            </div>
            <span className="font-mono text-xs font-bold text-amber-300">
              {stats.gp?.toFixed(1) || "0.0"} GP
            </span>
          </div>

          {/* Neon Auth User Badge */}
          {session?.user ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-[10px]">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden sm:inline font-semibold">{session.user.name}</span>
              <button
                type="button"
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="text-neutral-400 hover:text-rose-400 ml-1 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Neon Auth</span>
            </button>
          )}

          {/* Notification Settings Trigger */}
          <button
            type="button"
            onClick={onOpenNotificationSettings}
            title="Ajustes de Notificaciones & Recordatorios"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-neutral-800/80 text-neutral-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            title="Open Command Palette (⌘K)"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-neutral-800/80 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all"
          >
            <Search className="h-3.5 w-3.5 text-neutral-400" />
            <kbd className="rounded bg-neutral-900 px-1 py-0.5 font-mono text-[10px] text-neutral-400 border border-white/5">
              ⌘K
            </kbd>
          </button>

          {/* Sync */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            title="Sync State"
            className="hidden h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-neutral-800/80 text-neutral-300 hover:text-white sm:flex"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bottom Row: 7 Master Tabs + Ritual & Focus Launchers */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-3 pt-3 border-t border-white/6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-neutral-950/80 border border-white/8 w-full xl:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onTabChange("quick")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${activeMainTab === "quick"
              ? "bg-linear-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>📱 Hoy (Móvil)</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("tasks")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${activeMainTab === "tasks"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>⚡ Tareas</span>
            <kbd className="hidden md:inline-block rounded bg-black/30 px-1 text-[10px] font-mono opacity-60">
              ⌘1
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("finance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeMainTab === "finance"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>💰 Finanzas</span>
            <kbd className="hidden md:inline-block rounded bg-black/30 px-1 text-[10px] font-mono opacity-60">
              ⌘2
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("analytics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeMainTab === "analytics"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>📊 Balance</span>
            <kbd className="hidden md:inline-block rounded bg-black/30 px-1 text-[10px] font-mono opacity-60">
              ⌘3
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeMainTab === "calendar"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>📅 Agenda</span>
            <kbd className="hidden md:inline-block rounded bg-black/30 px-1 text-[10px] font-mono opacity-60">
              ⌘4
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("health")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeMainTab === "health"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>🏋️ Salud</span>
            <kbd className="hidden md:inline-block rounded bg-black/30 px-1 text-[10px] font-mono opacity-60">
              ⌘5
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("projects")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeMainTab === "projects"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>🏛️ Bóveda</span>
            <kbd className="hidden md:inline-block rounded bg-black/30 px-1 text-[10px] font-mono opacity-60">
              ⌘6
            </kbd>
          </button>
        </div>

        {/* Action Triggers: Focus Mode, Scratchpad & Rituals */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenFocusModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-sm"
          >
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
            <span>Focus Zen</span>
            <kbd className="hidden md:inline-block text-[10px] font-mono opacity-60">⌘P</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenScratchpad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5 text-neutral-400" />
            <span>Scratchpad</span>
            <kbd className="hidden md:inline-block text-[10px] font-mono opacity-60">⌘J</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenMorningRitual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span>Ritual AM</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono opacity-60">⌘M</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenEveningReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-sm"
          >
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Cierre PM</span>
            <kbd className="hidden lg:inline-block text-[10px] font-mono opacity-60">⌘E</kbd>
          </button>
        </div>
      </div>
    </header>
  );
}
