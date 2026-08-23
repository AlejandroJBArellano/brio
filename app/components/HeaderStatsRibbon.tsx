"use client";

import { toggleSleepAction } from "@/app/actions/tasks";
import { BrioLogo } from "@/app/components/BrioLogo";
import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { useSession } from "@/lib/auth-client";
import { HabiticaUser } from "@/lib/types";
import {
  calculateHabiticaMaxMp,
  calculateHabiticaToNextLevel,
  calculatePercentage,
  capitalize,
} from "@/lib/utils";
import {
  Activity,
  Bed,
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  Coins,
  Dumbbell,
  Edit3,
  Heart,
  LogOut,
  Moon,
  RotateCw,
  Search,
  Sparkles,
  Sun,
  Wallet,
  Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

interface HeaderStatsRibbonProps {
  user: HabiticaUser;
  isConfigured: boolean;
}

export function HeaderStatsRibbon({ user }: HeaderStatsRibbonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { openModal, refreshData } = useCommandCenter();

  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close actions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    if (isActionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActionsOpen]);

  const stats = user.stats;
  const isResting = Boolean(user.preferences?.sleep ?? user.flags?.rest ?? false);

  const maxHp = stats.maxHealth || 50;
  const maxMp = calculateHabiticaMaxMp(stats);
  const toNextLevel = calculateHabiticaToNextLevel(stats);

  const hpPercent = calculatePercentage(stats.hp, maxHp);
  const mpPercent = calculatePercentage(stats.mp, maxMp);
  const expPercent = calculatePercentage(stats.exp, toNextLevel);

  const isLowHp = stats.hp <= 15;

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

  // Keyboard navigation shortcuts: ⌘0 to ⌘6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      if ((e.metaKey || e.ctrlKey) && !isInputActive) {
        if (e.key === "0") {
          e.preventDefault();
          router.push("/today");
        } else if (e.key === "1") {
          e.preventDefault();
          router.push("/tasks");
        } else if (e.key === "2") {
          e.preventDefault();
          router.push("/finance");
        } else if (e.key === "3") {
          e.preventDefault();
          router.push("/analytics");
        } else if (e.key === "4") {
          e.preventDefault();
          router.push("/calendar");
        } else if (e.key === "5") {
          e.preventDefault();
          router.push("/health");
        } else if (e.key === "6") {
          e.preventDefault();
          router.push("/vault");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const isTabActive = (route: string) => {
    if (route === "/tasks") return pathname === "/tasks" || pathname === "/";
    return pathname.startsWith(route);
  };

  const NAV_ITEMS = [
    { href: "/today", label: "Hoy", icon: Sun, shortcut: "⌘0" },
    { href: "/tasks", label: "Tareas", icon: Zap, shortcut: "⌘1" },
    { href: "/finance", label: "Finanzas", icon: Wallet, shortcut: "⌘2" },
    { href: "/analytics", label: "Balance", icon: Activity, shortcut: "⌘3" },
    { href: "/calendar", label: "Agenda", icon: Calendar, shortcut: "⌘4" },
    { href: "/health", label: "Salud", icon: Dumbbell, shortcut: "⌘5" },
    { href: "/vault", label: "Bóveda", icon: BookOpen, shortcut: "⌘6" },
  ];

  return (
    <header className="rounded-lg border border-[#2A2723] bg-[#181715] p-3.5 sm:p-4 transition-all space-y-3 relative z-30">
      {/* Top Row: Character ID & Gauges */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Branding, Identity & Inn */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-3">
            <BrioLogo size="sm" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#F5F2EB]">
                  {session?.user?.name || user.profile.name || "Brio Commander"}
                </h1>
                <span className="rounded border border-[#38332D] bg-[#1C1A17] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#D99B43]">
                  Lvl {stats.lvl}
                </span>
                <span className="rounded border border-[#2A2723] bg-[#141312] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[#C2BAAD]">
                  {capitalize(stats.class || "warrior")}
                </span>

                {/* Rest at Inn */}
                <button
                  type="button"
                  onClick={handleToggleRest}
                  disabled={isPending}
                  title={isResting ? "Despertar de la Posada" : "Descansar en la Posada (pausar daño diario)"}
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold transition-all ${isResting
                      ? "border border-[#D99B43]/50 bg-[#D99B43]/15 text-[#E8AF59] animate-pulse"
                      : "border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] hover:border-[#38332D]"
                    }`}
                >
                  <Bed className="h-3 w-3" />
                  <span>{isResting ? "En Posada" : "Posada"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => openModal("commandPalette")}
              aria-label="Abrir paleta de comandos"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#F5F2EB] hover:border-[#38332D]"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: RPG Stat Gauges + System Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unified Telemetry Gauges Ribbon */}
          <div className="flex items-center rounded-md border border-[#2A2723] bg-[#121110] divide-x divide-[#2A2723] overflow-hidden">
            {/* Health Bar (HP) */}
            <div className="px-2.5 py-1 min-w-24">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-[#E05D52] text-[10px]">
                  <Heart
                    className={`h-2.5 w-2.5 fill-[#E05D52]/20 text-[#E05D52] ${isLowHp ? "animate-pulse" : ""}`}
                  />
                  HP
                </span>
                <span className="font-mono text-[9px] text-[#C2BAAD]">
                  {Math.round(stats.hp)}/{maxHp}
                </span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[#22201D]">
                <div
                  className="h-full bg-[#E05D52] transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Mana Bar (MP) */}
            <div className="px-2.5 py-1 min-w-24">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-[#4EAB9E] text-[10px]">
                  <Zap className="h-2.5 w-2.5 fill-[#4EAB9E]/20 text-[#4EAB9E]" />
                  MP
                </span>
                <span className="font-mono text-[9px] text-[#C2BAAD]">
                  {Math.round(stats.mp)}/{maxMp}
                </span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[#22201D]">
                <div
                  className="h-full bg-[#4EAB9E] transition-all duration-300"
                  style={{ width: `${mpPercent}%` }}
                />
              </div>
            </div>

            {/* EXP */}
            <div className="px-2.5 py-1 min-w-24">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-[#D99B43] text-[10px]">
                  <Sparkles className="h-2.5 w-2.5 text-[#D99B43]" />
                  EXP
                </span>
                <span className="font-mono text-[9px] text-[#C2BAAD]">
                  {Math.round(stats.exp)}/{toNextLevel}
                </span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[#22201D]">
                <div
                  className="h-full bg-[#D99B43] transition-all duration-300"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>

            {/* Gold (GP) */}
            <div className="px-2.5 py-1 flex items-center gap-1 bg-[#161513]">
              <Coins className="h-3 w-3 text-[#D99B43]" />
              <span className="font-mono text-[11px] font-bold text-[#E8AF59]">
                {stats.gp?.toFixed(1) || "0.0"} GP
              </span>
            </div>
          </div>

          {/* User Auth Badge (Shown when logged in) */}
          {session?.user && (
            <div className="flex items-center gap-1.5 rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-xs text-[#DDD6C9]">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D99B43]/20 text-[#D99B43] font-bold text-[9px]">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden sm:inline font-medium text-[11px]">{session.user.name}</span>
              <button
                type="button"
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="text-[#8E867B] hover:text-[#E05D52] ml-0.5 transition-colors cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Notification Settings Trigger */}
          <button
            type="button"
            onClick={() => openModal("notificationSettings")}
            title="Ajustes de Notificaciones"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#F5F2EB] hover:border-[#38332D] transition-all cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={() => openModal("commandPalette")}
            title="Abrir Command Palette (⌘K)"
            className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-xs font-medium text-[#8E867B] hover:border-[#38332D] hover:text-[#F5F2EB] transition-all cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <kbd className="rounded bg-[#181715] px-1 py-0.5 font-mono text-[9px] text-[#8E867B] border border-[#2A2723]">
              ⌘K
            </kbd>
          </button>

          {/* Sync */}
          <button
            onClick={refreshData}
            disabled={isPending}
            title="Sincronizar estado"
            className="hidden h-7 w-7 items-center justify-center rounded-md border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#F5F2EB] hover:border-[#38332D] sm:flex transition-all cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-[#D99B43]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bottom Row: Clean Unified Route Links + Dropdown Actions Launcher */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2A2723]">
        {/* Main Route Links */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center gap-1 p-0.5 rounded-md bg-[#121110] border border-[#2A2723] overflow-x-auto no-scrollbar flex-1 sm:flex-initial"
        >
          {NAV_ITEMS.map((item) => {
            const active = isTabActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0 ${active
                    ? "bg-[#22201D] text-[#F5F2EB] font-semibold border border-[#38332D]"
                    : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#181715] border border-transparent"
                  }`}
              >
                <Icon className={`h-3 w-3 ${active ? "text-[#D99B43]" : "text-[#8E867B]"}`} />
                <span>{item.label}</span>
                <kbd className="hidden md:inline-block rounded bg-[#181715] px-1 text-[9px] font-mono text-[#8E867B] border border-[#2A2723]">
                  {item.shortcut}
                </kbd>
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions & Rituals Dropdown */}
        <div className="relative shrink-0 z-50" ref={actionsRef}>
          <button
            type="button"
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border cursor-pointer ${isActionsOpen
                ? "bg-[#D99B43]/15 text-[#E8AF59] border-[#D99B43]/50"
                : "bg-[#121110] text-[#DDD6C9] border-[#2A2723] hover:text-[#F5F2EB] hover:border-[#38332D]"
              }`}
          >
            <Sparkles className="h-3 w-3 text-[#D99B43]" />
            <span className="hidden sm:inline">Acciones</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${isActionsOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {isActionsOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border border-[#2A2723] bg-[#181715] p-1 shadow-lg z-50 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  openModal("focus");
                  setIsActionsOpen(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-md text-xs font-medium text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-[#D99B43]" />
                  <span>Focus Zen</span>
                </span>
                <kbd className="font-mono text-[9px] text-[#8E867B]">⌘P</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  openModal("scratchpad");
                  setIsActionsOpen(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-md text-xs font-medium text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Edit3 className="h-3.5 w-3.5 text-[#4EAB9E]" />
                  <span>Scratchpad</span>
                </span>
                <kbd className="font-mono text-[9px] text-[#8E867B]">⌘J</kbd>
              </button>

              <div className="my-1 border-t border-[#2A2723]" />

              <button
                type="button"
                onClick={() => {
                  openModal("morningRitual");
                  setIsActionsOpen(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-md text-xs font-medium text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sun className="h-3.5 w-3.5 text-[#D99B43]" />
                  <span>Ritual Matutino</span>
                </span>
                <kbd className="font-mono text-[9px] text-[#8E867B]">⌘M</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  openModal("eveningReview");
                  setIsActionsOpen(false);
                }}
                className="w-full flex items-center justify-between p-1.5 rounded-md text-xs font-medium text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Moon className="h-3.5 w-3.5 text-[#D99B43]" />
                  <span>Cierre Nocturno</span>
                </span>
                <kbd className="font-mono text-[9px] text-[#8E867B]">⌘E</kbd>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
