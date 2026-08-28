"use client";

import { toggleSleepAction } from "@/app/actions/tasks";
import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { useSession } from "@/lib/auth-client";
import { HabiticaUser } from "@/lib/types";
import { capitalize } from "@/lib/utils";
import {
  Activity,
  Bed,
  BookOpen,
  Calendar,
  ChevronDown,
  Dumbbell,
  Edit3,
  FolderGit2,
  LogOut,
  Moon,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Sun,
  Wallet,
  Zap,
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const actionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isActionsOpen || isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isActionsOpen, isProfileOpen]);

  const stats = user.stats;
  const isResting = Boolean(user.preferences?.sleep ?? user.flags?.rest ?? false);

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
        switch (e.key) {
          case "0":
            e.preventDefault();
            router.push("/today");
            break;
          case "1":
            e.preventDefault();
            router.push("/tasks");
            break;
          case "2":
            e.preventDefault();
            router.push("/projects");
            break;
          case "3":
            e.preventDefault();
            router.push("/finance");
            break;
          case "4":
            e.preventDefault();
            router.push("/analytics");
            break;
          case "5":
            e.preventDefault();
            router.push("/calendar");
            break;
          case "6":
            e.preventDefault();
            router.push("/health");
            break;
          case "7":
            e.preventDefault();
            router.push("/vault");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const isTabActive = (route: string) => {
    if (route === "/today") return pathname === "/today" || pathname === "/";
    return pathname.startsWith(route);
  };

  const NAV_ITEMS = [
    { href: "/today", label: "Hoy", icon: Sun, shortcut: "⌘0" },
    { href: "/tasks", label: "Tareas", icon: Zap, shortcut: "⌘1" },
    { href: "/projects", label: "Proyectos", icon: FolderGit2, shortcut: "⌘2" },
    { href: "/finance", label: "Finanzas", icon: Wallet, shortcut: "⌘3" },
    { href: "/analytics", label: "Balance", icon: Activity, shortcut: "⌘4" },
    { href: "/calendar", label: "Agenda", icon: Calendar, shortcut: "⌘5" },
    { href: "/health", label: "Salud", icon: Dumbbell, shortcut: "⌘6" },
    { href: "/vault", label: "Bóveda", icon: BookOpen, shortcut: "⌘7" },
  ];

  const userName = session?.user?.name || user.profile.name || "Alejandro";
  const firstName = userName.split(" ")[0];

  return (
    <header className="rounded-xl border border-[#2A2723] bg-[#181715] px-3.5 py-2.5 transition-all relative z-30 flex items-center justify-between gap-3 shadow-xs">
      {/* Left: Branding + Nav Tabs (Single Row) */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Horizontal Navigation Pills */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isTabActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all font-sans shrink-0 cursor-pointer ${
                  active
                    ? "border border-[#3D3425] bg-[#221D16] text-[#D99B43] font-bold shadow-xs"
                    : "border border-transparent text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#1D1B18]"
                }`}
              >
                <Icon
                  className={`size-3.5 transition-colors ${
                    active ? "text-[#D99B43]" : "text-[#8E867B] group-hover:text-[#DDD6C9]"
                  }`}
                />
                <span>{item.label}</span>
                <kbd
                  className={`hidden lg:inline-block rounded px-1 py-0.2 font-mono text-[9px] transition-colors ${
                    active
                      ? "bg-[#2E2419] text-[#D99B43] border border-[#4A3B25]"
                      : "bg-[#141312] text-[#736B60] border border-[#22201D]"
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Command Bar Trigger + Quick Capture + Actions + Profile Popover */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search & Omnibar Trigger (⌘K) */}
        <button
          type="button"
          onClick={() => openModal("commandPalette")}
          className="hidden md:inline-flex items-center gap-2 rounded-lg border border-[#2A2723] bg-[#121110] px-2.5 py-1 text-xs text-[#8E867B] hover:text-[#DDD6C9] hover:border-[#38332D] transition-all cursor-pointer font-mono"
        >
          <Search className="size-3 text-[#8E867B]" />
          <span className="text-[11px]">Buscar...</span>
          <kbd className="rounded bg-[#1C1A18] px-1 py-0.2 text-[9px] text-[#DDD6C9] border border-[#2A2723]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Batch/Single Capture Button */}
        <button
          type="button"
          onClick={() => openModal("batch")}
          className="inline-flex items-center gap-1 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] px-2.5 py-1 text-xs font-bold text-[#121110] transition-all cursor-pointer shadow-xs"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Capturar</span>
        </button>

        {/* Actions Dropdown */}
        <div className="relative" ref={actionsRef}>
          <button
            type="button"
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-[#2A2723] bg-[#121110] px-2.5 py-1 text-xs font-mono font-medium text-[#DDD6C9] hover:border-[#38332D] hover:text-[#F5F2EB] transition-all cursor-pointer"
          >
            <Sparkles className="size-3 text-[#D99B43]" />
            <span className="hidden sm:inline">Acciones</span>
            <ChevronDown className={`size-3 text-[#8E867B] transition-transform ${isActionsOpen ? "rotate-180" : ""}`} />
          </button>

          {isActionsOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-[#2A2723] bg-[#181715] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsActionsOpen(false);
                  openModal("morningRitual");
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sun className="size-3.5 text-[#D99B43]" />
                  <span>Ritual Matutino</span>
                </div>
                <kbd className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-1 rounded border border-[#2A2723]">⌘M</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActionsOpen(false);
                  openModal("eveningReview");
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Moon className="size-3.5 text-[#8b5cf6]" />
                  <span>Cierre Nocturno</span>
                </div>
                <kbd className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-1 rounded border border-[#2A2723]">⌘E</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActionsOpen(false);
                  openModal("focus");
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Zap className="size-3.5 text-[#4EAB9E]" />
                  <span>Modo Enfoque</span>
                </div>
                <kbd className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-1 rounded border border-[#2A2723]">⌘P</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsActionsOpen(false);
                  openModal("scratchpad");
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="size-3.5 text-[#06b6d4]" />
                  <span>Scratchpad Rápido</span>
                </div>
                <kbd className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-1 rounded border border-[#2A2723]">⌘J</kbd>
              </button>

              {/* Habitica Inn / Sleep Button in Actions Menu */}
              <button
                type="button"
                onClick={() => {
                  setIsActionsOpen(false);
                  handleToggleRest();
                }}
                disabled={isPending}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                  isResting
                    ? "bg-[#D99B43]/15 text-[#E8AF59] hover:bg-[#D99B43]/25"
                    : "text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bed className={`size-3.5 shrink-0 ${isResting ? "text-[#E8AF59]" : "text-[#D99B43]"}`} />
                  <span className="truncate">{isResting ? "Descansando" : "Descanso"}</span>
                </div>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${
                  isResting
                    ? "border-[#D99B43]/40 bg-[#221D16] text-[#E8AF59] font-bold"
                    : "border-[#2A2723] bg-[#121110] text-[#8E867B]"
                }`}>
                  {isResting ? "DESCANSANDO" : "ACTIVO"}
                </span>
              </button>

              <div className="my-1 h-px bg-[#2A2723]" />

              <button
                type="button"
                onClick={() => {
                  setIsActionsOpen(false);
                  refreshData();
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer font-mono"
              >
                <div className="flex items-center gap-2">
                  <RotateCw className="size-3.5 text-[#8E867B]" />
                  <span>Sincronizar Datos</span>
                </div>
                <kbd className="text-[10px] text-[#8E867B] bg-[#121110] px-1 rounded border border-[#2A2723]">⌘R</kbd>
              </button>
            </div>
          )}
        </div>

        {/* Profile Popover (Sleek Avatar Pill with Level, Rest & Sign Out) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-lg border border-[#2A2723] bg-[#121110] px-2.5 py-1 text-xs font-mono text-[#DDD6C9] hover:border-[#38332D] hover:text-[#F5F2EB] transition-all cursor-pointer"
          >
            <div className="size-4.5 rounded-full bg-[#221D16] border border-[#3D3425] text-[#D99B43] flex items-center justify-center text-[10px] font-bold">
              ⚡
            </div>
            <span className="font-semibold text-[#F5F2EB] hidden sm:inline">
              {firstName}
            </span>
            <span className="text-[10px] text-[#D99B43] font-bold">
              Lvl {stats.lvl}
            </span>
            {isResting && (
              <span className="flex size-1.5 rounded-full bg-[#D99B43] animate-pulse" title="Descansando" />
            )}
            <ChevronDown className={`size-3 text-[#8E867B] transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#2A2723] bg-[#181715] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs space-y-3">
              {/* Header inside popover */}
              <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
                <div>
                  <div className="font-serif font-bold text-sm text-[#F5F2EB]">
                    {userName}
                  </div>
                  <div className="font-mono text-[10px] text-[#8E867B]">
                    {capitalize(stats.class || "warrior")}
                  </div>
                </div>
                <div className="rounded-md border border-[#3D3425] bg-[#221D16] px-2 py-0.5 font-mono text-xs font-bold text-[#D99B43]">
                  Nivel {stats.lvl}
                </div>
              </div>

              {/* Rest toggle */}
              <div>
                <button
                  type="button"
                  onClick={handleToggleRest}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${isResting
                      ? "border-[#D99B43]/50 bg-[#D99B43]/15 text-[#E8AF59]"
                      : "border-[#2A2723] bg-[#121110] text-[#DDD6C9] hover:border-[#38332D]"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Bed className="size-4" />
                    <span>Descanso</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40">
                    {isResting ? "DESCANSANDO" : "ACTIVO"}
                  </span>
                </button>
              </div>

              {/* Sign out */}
              <div className="pt-1 border-t border-[#2A2723]">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-[#E05D52] hover:bg-[#261515] transition-colors cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
