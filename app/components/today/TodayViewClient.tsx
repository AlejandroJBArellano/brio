"use client";

import {
  batchToggleSupplementsByTimingAction,
  logWaterAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { soundFx } from "@/lib/soundFx";
import {
  ContextualNote,
  DailyHealthData,
  FinanceDashboardData,
  FoodGroupKey,
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
  ChefHat,
  ChevronDown,
  ChevronUp,
  Droplet,
  FolderGit2,
  LayoutGrid,
  Moon,
  Pill,
  Plus,
  RotateCcw,
  Salad,
  Sun,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { ProjectFocusCard } from "./ProjectFocusCard";

export type WidgetKey = "project" | "supplements" | "water" | "nutrition";
export type PresetMode = "all" | "focus" | "bio";

interface TodayViewPreferences {
  visible: Record<WidgetKey, boolean>;
  collapsed: Record<WidgetKey, boolean>;
  isFocusMode: boolean;
  isControlsOpen: boolean;
}

const DEFAULT_PREFERENCES: TodayViewPreferences = {
  visible: {
    project: true,
    supplements: true,
    water: true,
    nutrition: true,
  },
  collapsed: {
    project: true,
    supplements: false,
    water: false,
    nutrition: false,
  },
  isFocusMode: false,
  isControlsOpen: true,
};

const ALL_FOOD_GROUPS: {
  key: FoodGroupKey;
  icon: string;
  label: string;
  defaultTarget: number;
}[] = [
    { key: "vegetables", icon: "🥦", label: "Verduras", defaultTarget: 4.5 },
    { key: "legumes", icon: "🫘", label: "Legumbres", defaultTarget: 3 },
    { key: "cereals", icon: "🌾", label: "Cereales", defaultTarget: 5 },
    { key: "fats_seeds", icon: "🥑", label: "Semillas", defaultTarget: 3.5 },
    { key: "fruits", icon: "🍎", label: "Frutas", defaultTarget: 3.5 },
    { key: "leafy_greens", icon: "🥬", label: "Hojas", defaultTarget: 2 },
    { key: "tubers", icon: "🍠", label: "Tubérculos", defaultTarget: 1 },
  ];

interface TodayViewClientProps {
  user: HabiticaUser;
  tasks: HabiticaTask[];
  tags?: HabiticaTag[];
  healthData: DailyHealthData | HealthDashboardData;
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
  financeData: _financeData,
  todayRitual,
  projects = [],
  contextualNotes = [],
}: TodayViewClientProps) {
  const router = useRouter();
  const { openModal } = useCommandCenter();
  const [isPending, startTransition] = useTransition();

  // Live Time clock (hours and minutes)
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Preferences with lazy localStorage initialization (Mobile vs Desktop independent)
  const [prefs, setPrefs] = useState<TodayViewPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const saved = localStorage.getItem("brio_today_preferences_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          visible: { ...DEFAULT_PREFERENCES.visible, ...(parsed.visible || {}) },
          collapsed: { ...DEFAULT_PREFERENCES.collapsed, ...(parsed.collapsed || {}) },
          isControlsOpen: parsed.isControlsOpen ?? DEFAULT_PREFERENCES.isControlsOpen,
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  const savePrefs = (newPrefs: TodayViewPreferences) => {
    setPrefs(newPrefs);
    try {
      localStorage.setItem(
        "brio_today_preferences_v1",
        JSON.stringify(newPrefs)
      );
    } catch (e) {
      console.error("Failed to save today view preferences", e);
    }
  };

  const toggleWidget = (key: WidgetKey) => {
    soundFx.click();
    const nextVisible = {
      ...prefs.visible,
      [key]: !prefs.visible[key],
    };
    const nextFocus = key === "project" && !nextVisible.project ? false : prefs.isFocusMode;
    savePrefs({
      ...prefs,
      visible: nextVisible,
      isFocusMode: nextFocus,
    });
  };

  const toggleCollapse = (key: WidgetKey) => {
    soundFx.click();
    savePrefs({
      ...prefs,
      collapsed: {
        ...prefs.collapsed,
        [key]: !prefs.collapsed[key],
      },
    });
  };

  const setPreset = (mode: PresetMode) => {
    if (mode === "focus") {
      soundFx.focusStart();
      savePrefs({
        ...prefs,
        visible: {
          project: true,
          supplements: false,
          water: false,
          nutrition: false,
        },
        isFocusMode: true,
      });
    } else if (mode === "bio") {
      soundFx.click();
      savePrefs({
        ...prefs,
        visible: {
          project: false,
          supplements: true,
          water: true,
          nutrition: true,
        },
        isFocusMode: false,
      });
    } else {
      soundFx.click();
      savePrefs({
        ...prefs,
        visible: {
          project: true,
          supplements: true,
          water: true,
          nutrition: true,
        },
        isFocusMode: false,
      });
    }
  };

  const toggleFocusMode = () => {
    if (prefs.isFocusMode) {
      soundFx.click();
      savePrefs({
        ...prefs,
        isFocusMode: false,
        visible: {
          project: true,
          supplements: true,
          water: true,
          nutrition: true,
        },
      });
    } else {
      soundFx.focusStart();
      savePrefs({
        ...prefs,
        isFocusMode: true,
        visible: {
          project: true,
          supplements: false,
          water: false,
          nutrition: false,
        },
      });
    }
  };

  const resetPreferences = () => {
    soundFx.click();
    savePrefs(DEFAULT_PREFERENCES);
  };

  // State for supplement details list inside expanded supplement card
  const [isSuppDetailsOpen, setIsSuppDetailsOpen] = useState(false);

  // Time of day detection
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

  // Nutrition Data & Portions
  const nutritionSummary = healthData.nutritionSummary;
  const portions = nutritionSummary?.portions || {};
  const portionGoals = nutritionSummary?.portionGoals || {
    vegetables: 4.5,
    legumes: 3,
    cereals: 5,
    fats_seeds: 3.5,
    fruits: 3.5,
  };
  const totalPortionsConsumed =
    nutritionSummary?.totalPortionsConsumed ??
    Object.values(portions).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const totalPortionsTarget =
    nutritionSummary?.totalPortionsTarget ??
    Object.values(portionGoals).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const portionPercent = Math.min(
    100,
    Math.round((totalPortionsConsumed / Math.max(1, totalPortionsTarget)) * 100)
  );

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

  const hasMorningRitual = Boolean(
    todayRitual?.energyLevel ||
    todayRitual?.dayIntention ||
    (todayRitual?.mustWinTasks && todayRitual.mustWinTasks.length > 0)
  );
  const hasEveningReview = Boolean(
    todayRitual?.expensesLogged || todayRitual?.reflection
  );

  const isMorningWindow = currentHour < 13;
  const isEveningWindow = currentHour >= 19;

  // Layout calculation
  const hasVisibleHealth =
    prefs.visible.supplements || prefs.visible.water || prefs.visible.nutrition;
  const anyWidgetVisible = prefs.visible.project || hasVisibleHealth;

  const pendingProjectTasksCount = useMemo(() => {
    return tasks.filter((t) => t.type === "todo" && !t.completed).length;
  }, [tasks]);

  return (
    <div className="w-full space-y-4 pb-24 sm:pb-16 font-sans animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER                          */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-3 sm:p-4 shadow-xs space-y-2.5">
        {/* Main Row: Date + Time + Rituals + Views Switcher */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Date & Time */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="font-serif text-base sm:text-xl font-bold tracking-tight text-[#F5F2EB] flex items-center gap-2 flex-wrap">
              <span className="capitalize">{todayFormatted}</span>
              {currentTime && (
                <span className="font-mono text-xs sm:text-sm font-semibold text-[#D99B43] bg-[#221D16] px-2 py-0.5 rounded-md border border-[#D99B43]/30 tracking-wider">
                  {currentTime}
                </span>
              )}
            </h1>
          </div>

          {/* Quick Ritual Buttons & Collapsible Controls Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => openModal("morningRitual")}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${hasMorningRitual
                ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              title="Ritual Matutino de Despegue"
            >
              <Sun className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Ritual AM</span>
              {hasMorningRitual && <Check className="h-3 w-3 stroke-3 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => openModal("eveningReview")}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${hasEveningReview
                ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              title="Cierre Nocturno"
            >
              <Moon className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Cierre PM</span>
              {hasEveningReview && <Check className="h-3 w-3 stroke-3 ml-0.5" />}
            </button>

            {/* Toggle Modular Controls Button */}
            <button
              type="button"
              onClick={() => {
                soundFx.click();
                savePrefs({
                  ...prefs,
                  isControlsOpen: !prefs.isControlsOpen,
                });
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${prefs.isControlsOpen
                ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/40"
                : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border-[#2A2723]"
                }`}
              title={
                prefs.isControlsOpen
                  ? "Ocultar panel de modos y módulos"
                  : "Mostrar panel de modos y módulos"
              }
            >
              <span className="hidden sm:inline">Vistas</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${prefs.isControlsOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Slim Controls Bar */}
        {prefs.isControlsOpen && (
          <div className="pt-2 border-t border-[#2A2723] flex flex-wrap items-center justify-between gap-2 text-xs font-mono animate-in fade-in duration-150">
            {/* Presets & Module Chips combined into a sleek unified row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Presets Segmented Bar */}
              <div className="flex items-center p-0.5 rounded-lg bg-[#121110] border border-[#2A2723]">
                <button
                  type="button"
                  onClick={() => setPreset(prefs.isFocusMode ? "all" : "focus")}
                  className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${prefs.isFocusMode
                    ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-2xs font-bold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  title="Modo Focus (Deep Work 12 columnas)"
                >
                  <Zap className="h-3 w-3" />
                  <span>Focus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreset("bio")}
                  className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${!prefs.visible.project &&
                    (prefs.visible.supplements ||
                      prefs.visible.water ||
                      prefs.visible.nutrition)
                    ? "bg-[#141813] text-[#7EA35A] border border-[#7EA35A]/30 shadow-2xs font-bold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  title="Modo Bio / Salud"
                >
                  <Droplet className="h-3 w-3" />
                  <span>Bio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreset("all")}
                  className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${prefs.visible.project &&
                    prefs.visible.supplements &&
                    prefs.visible.water &&
                    prefs.visible.nutrition &&
                    !prefs.isFocusMode
                    ? "bg-[#141C1A] text-[#4EAB9E] border border-[#4EAB9E]/30 shadow-2xs font-bold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  title="Vista Completa"
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span>Todo</span>
                </button>
              </div>

              <div className="h-4 w-px bg-[#2A2723] mx-0.5 hidden xs:block" />

              {/* Modular Chips */}
              <button
                type="button"
                onClick={() => toggleWidget("project")}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${prefs.visible.project
                  ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/40 font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] opacity-60 hover:opacity-100"
                  }`}
                title="Activar/Ocultar Proyecto"
              >
                <FolderGit2 className="h-3 w-3" />
                <span>Proyecto</span>
                {pendingProjectTasksCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#D99B43] text-[#121110]">
                    {pendingProjectTasksCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleWidget("supplements")}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${prefs.visible.supplements
                  ? "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/40 font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] opacity-60 hover:opacity-100"
                  }`}
                title="Activar/Ocultar Suplementos"
              >
                <Pill className="h-3 w-3" />
                <span>Suplementos</span>
                <span className="text-[10px] opacity-80">
                  ({takenCountInActiveTiming}/{filteredSupplements.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleWidget("water")}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${prefs.visible.water
                  ? "bg-[#141C1A] text-[#4EAB9E] border-[#4EAB9E]/40 font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] opacity-60 hover:opacity-100"
                  }`}
                title="Activar/Ocultar Agua"
              >
                <Droplet className="h-3 w-3" />
                <span>Agua</span>
                <span className="text-[10px] opacity-80">({waterPercent}%)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWidget("nutrition")}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${prefs.visible.nutrition
                  ? "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/40 font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] opacity-60 hover:opacity-100"
                  }`}
                title="Activar/Ocultar Porciones"
              >
                <Salad className="h-3 w-3" />
                <span>Porciones</span>
                <span className="text-[10px] opacity-80">({portionPercent}%)</span>
              </button>
            </div>
          </div>
        )}
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
      {/* 3. MAIN RESPONSIVE GRID (Adaptable: 12 Cols Zen | 7/5 Dual Column)       */}
      {/* ========================================================================= */}
      {!anyWidgetVisible ? (
        <div className="rounded-2xl border border-dashed border-[#2A2723] bg-[#181715] p-10 text-center space-y-3 font-sans">
          <FolderGit2 className="h-10 w-10 text-[#8E867B] mx-auto opacity-70" />
          <h3 className="font-serif text-base font-bold text-[#F5F2EB]">
            Todos los módulos están ocultos
          </h3>
          <p className="text-xs text-[#8E867B] font-mono max-w-md mx-auto">
            Activa los módulos que deseas ver usando el panel superior o haz
            clic en el botón de abajo para restaurar la vista completa.
          </p>
          <button
            type="button"
            onClick={resetPreferences}
            className="px-4 py-2 rounded-lg bg-[#221D16] hover:bg-[#2F271E] border border-[#D99B43]/40 text-[#D99B43] font-mono text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Vista Completa</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ===================================================================== */}
          {/* PROJECT FOCUS CARD                                                    */}
          {/* ===================================================================== */}
          {prefs.visible.project && (
            <div
              className={`${hasVisibleHealth && !prefs.isFocusMode
                ? "lg:col-span-7"
                : "lg:col-span-12"
                } space-y-4`}
            >
              <ProjectFocusCard
                projects={projects}
                tasks={tasks}
                tags={tags}
                contextualNotes={contextualNotes}
                onRefreshData={() => router.refresh()}
                isFocusMode={prefs.isFocusMode}
                onToggleFocusMode={toggleFocusMode}
                isCollapsed={prefs.collapsed.project}
                onToggleCollapse={() => toggleCollapse("project")}
              />
            </div>
          )}

          {/* ===================================================================== */}
          {/* BIO-CONTROL & SALUD (Suplementos, Agua, Porciones)                    */}
          {/* ===================================================================== */}
          {hasVisibleHealth && !prefs.isFocusMode && (
            <div
              className={`${prefs.visible.project ? "lg:col-span-5" : "lg:col-span-12"
                } space-y-5`}
            >
              {/* ----------------------------------------------------------------- */}
              {/* SUPLEMENTOS CONTEXTUALES (Colapsable / Expandido)                 */}
              {/* ----------------------------------------------------------------- */}
              {prefs.visible.supplements && (
                <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm space-y-4 transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-[#7EA35A]" />
                      <span className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                        Suplementos
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!prefs.collapsed.supplements && (
                        /* Timing Selector Tabs */
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
                                className={`px-2 py-1 rounded-md text-center font-semibold transition-all cursor-pointer ${activeSuppTiming === timing
                                  ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-2xs"
                                  : "text-[#8E867B] hover:text-[#DDD6C9]"
                                  }`}
                              >
                                {timing}
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {/* Collapse Button */}
                      <button
                        type="button"
                        onClick={() => toggleCollapse("supplements")}
                        className="p-1 rounded-md text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#121110] transition-colors cursor-pointer"
                        title={
                          prefs.collapsed.supplements
                            ? "Expandir suplementos"
                            : "Minimizar suplementos"
                        }
                      >
                        {prefs.collapsed.supplements ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body: Collapsed vs Expanded */}
                  {prefs.collapsed.supplements ? (
                    <div className="flex items-center justify-between gap-3 text-xs font-mono">
                      <span
                        className={
                          allTakenInActiveTiming
                            ? "text-[#7EA35A] font-bold"
                            : "text-[#D99B43]"
                        }
                      >
                        {takenCountInActiveTiming} de {filteredSupplements.length}{" "}
                        tomados ({activeSuppTiming})
                      </span>

                      <button
                        type="button"
                        disabled={isPending || filteredSupplements.length === 0}
                        onClick={handleBatchTakeSupplements}
                        className={`py-1.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs font-sans ${allTakenInActiveTiming
                          ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40"
                          : "bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110]"
                          }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {allTakenInActiveTiming ? "Completado" : "Tomar Pack"}
                        </span>
                      </button>
                    </div>
                  ) : filteredSupplements.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span
                          className={
                            allTakenInActiveTiming
                              ? "text-[#7EA35A] font-bold"
                              : "text-[#D99B43]"
                          }
                        >
                          {takenCountInActiveTiming} de{" "}
                          {filteredSupplements.length} tomados
                        </span>
                      </div>

                      {/* 1-Tap Complete Pack Button */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleBatchTakeSupplements}
                        className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs font-sans ${allTakenInActiveTiming
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
                          onClick={() =>
                            setIsSuppDetailsOpen(!isSuppDetailsOpen)
                          }
                          className="text-[11px] font-mono text-[#8E867B] hover:text-[#DDD6C9] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>
                            {isSuppDetailsOpen
                              ? "Ocultar lista individual"
                              : "Ver / marcar individuales"}
                          </span>
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${isSuppDetailsOpen ? "rotate-180" : ""
                              }`}
                          />
                        </button>

                        {isSuppDetailsOpen && (
                          <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-200">
                            {filteredSupplements.map((supp) => (
                              <div
                                key={supp.id}
                                onClick={() => handleToggleSupplement(supp.id)}
                                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${supp.taken
                                  ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                                  : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${supp.taken
                                      ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                                      : "border-[#38332D] bg-[#181715]"
                                      }`}
                                  >
                                    {supp.taken && (
                                      <Check className="h-2.5 w-2.5 stroke-3" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs truncate ${supp.taken
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
              )}

              {/* ----------------------------------------------------------------- */}
              {/* HIDRATACIÓN INTELIGENTE (Colapsable / Expandido)                  */}
              {/* ----------------------------------------------------------------- */}
              {prefs.visible.water && (
                <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm space-y-3 transition-all">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-[#4EAB9E]" />
                      <span className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                        Hidratación
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#4EAB9E] font-bold">
                        {optimisticWater} / {waterTarget} ml
                      </span>
                      {isWaterComplete && (
                        <span className="font-mono text-[10px] text-[#7EA35A] bg-[#141813] px-1.5 py-0.5 rounded border border-[#7EA35A]/30">
                          ✓
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleCollapse("water")}
                        className="p-1 rounded-md text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#121110] transition-colors cursor-pointer"
                        title={
                          prefs.collapsed.water
                            ? "Expandir hidratación"
                            : "Minimizar hidratación"
                        }
                      >
                        {prefs.collapsed.water ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body: Quick 1-Tap Log Buttons */}
                  <div className="space-y-3 pt-1">
                    <div
                      className={`grid ${prefs.collapsed.water ? "grid-cols-1" : "grid-cols-2"
                        } gap-2`}
                    >
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleQuickAddWater(250)}
                        className="py-2 px-3 rounded-lg border border-[#2A2723] bg-[#121110] hover:bg-[#1C2219] hover:border-[#4EAB9E]/40 text-[#DDD6C9] hover:text-[#4EAB9E] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>+250 ml</span>
                      </button>

                      {!prefs.collapsed.water && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleQuickAddWater(500)}
                          className="py-2 px-3 rounded-lg border border-[#2A2723] bg-[#121110] hover:bg-[#1C2219] hover:border-[#4EAB9E]/40 text-[#DDD6C9] hover:text-[#4EAB9E] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>+500 ml</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* PORCIONES DEL DÍA & NUTRICIÓN (Colapsable / Expandido)             */}
              {/* ----------------------------------------------------------------- */}
              {prefs.visible.nutrition && (
                <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm space-y-4 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
                    <div className="flex items-center gap-2">
                      <Salad className="h-4 w-4 text-[#7EA35A]" />
                      <span className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                        Porciones del Día
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#7EA35A]">
                        {totalPortionsConsumed} / {totalPortionsTarget} (
                        {portionPercent}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCollapse("nutrition")}
                        className="p-1 rounded-md text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#121110] transition-colors cursor-pointer"
                        title={
                          prefs.collapsed.nutrition
                            ? "Expandir porciones"
                            : "Minimizar porciones"
                        }
                      >
                        {prefs.collapsed.nutrition ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body: Collapsed vs Expanded */}
                  {prefs.collapsed.nutrition ? (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="h-1.5 flex-1 rounded-full bg-[#121110] overflow-hidden">
                        <div
                          className="h-full bg-[#7EA35A] transition-all duration-300 rounded-full"
                          style={{ width: `${portionPercent}%` }}
                        />
                      </div>
                      <Link
                        href="/health/nutrition"
                        className="px-2.5 py-1 rounded-lg bg-[#1C2219] hover:bg-[#252E21] border border-[#7EA35A]/40 text-[#7EA35A] text-xs font-mono font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <ChefHat className="h-3 w-3" />
                        <span>Cocinar ↗</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Micro-pills por todos los 7 grupos alimenticios + card de balance */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono">
                        {ALL_FOOD_GROUPS.map((group) => {
                          const current = portions[group.key] ?? 0;
                          const target =
                            portionGoals[group.key] ?? group.defaultTarget;
                          const isMet = current >= target && target > 0;

                          return (
                            <div
                              key={group.key}
                              className={`p-2 rounded-lg border transition-all ${isMet
                                ? "bg-[#141813] border-[#7EA35A]/40 text-[#7EA35A]"
                                : "bg-[#121110] border-[#2A2723] text-[#DDD6C9]"
                                }`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                                <span className="truncate text-[#8E867B] flex items-center gap-1">
                                  <span>{group.icon}</span>
                                  <span className="truncate">{group.label}</span>
                                </span>
                                {isMet && (
                                  <Check className="h-2.5 w-2.5 stroke-3 text-[#7EA35A]" />
                                )}
                              </div>
                              <div className="font-bold text-xs mt-1">
                                <span
                                  className={
                                    isMet ? "text-[#7EA35A]" : "text-[#F5F2EB]"
                                  }
                                >
                                  {current}
                                </span>
                                <span className="text-[10px] font-normal text-[#8E867B]">
                                  /{target}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* 8th Slot: Balance del Plan / Kcal */}
                        <div className="p-2 rounded-lg bg-[#121110] border border-[#2A2723] flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#8E867B]">
                            <span>🔥 Energía</span>
                            <span className="text-[#D99B43] font-bold">Kcal</span>
                          </div>
                          <div className="font-mono text-xs font-bold text-[#F5F2EB] mt-1 truncate">
                            {nutritionSummary?.kcal
                              ? `${nutritionSummary.kcal} kcal`
                              : "0 kcal"}
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso de porciones */}
                      <div className="h-1.5 w-full rounded-full bg-[#121110] overflow-hidden">
                        <div
                          className="h-full bg-[#7EA35A] transition-all duration-300 rounded-full"
                          style={{ width: `${portionPercent}%` }}
                        />
                      </div>

                      {/* Próxima comida o Kcal y botón de ¿Qué cocino hoy? */}
                      <div className="pt-1 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-[#8E867B] truncate">
                            {nutritionSummary?.nextMealTitle
                              ? `Próxima: ${nutritionSummary.nextMealTitle}`
                              : `${nutritionSummary?.kcal
                                ? `${nutritionSummary.kcal} kcal hoy`
                                : "Plan Mariana Mont"
                              }`}
                          </p>
                        </div>

                        <Link
                          href="/health/nutrition"
                          className="px-3 py-1.5 rounded-lg bg-[#1C2219] hover:bg-[#252E21] border border-[#7EA35A]/40 text-[#7EA35A] text-xs font-mono font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs hover:border-[#7EA35A]/70"
                        >
                          <ChefHat className="h-3.5 w-3.5 text-[#7EA35A]" />
                          <span>¿Qué cocino hoy? ↗</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
