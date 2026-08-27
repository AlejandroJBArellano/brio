import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates a percentage safely between 0 and 100.
 */
export function calculatePercentage(current: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / max) * 100)));
}

/**
 * Returns color classes based on Habitica task value (task health/difficulty).
 * Habitica uses red -> orange -> yellow -> green -> blue for task difficulty/goodness.
 */
export function getTaskValueColor(value: number = 0): {
  badge: string;
  dot: string;
  border: string;
  label: string;
  pillBg: string;
} {
  if (value < -10) {
    return {
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
      dot: "bg-red-500",
      border: "border-l-red-500",
      label: "Crítico",
      pillBg: "bg-red-950/40 text-red-300 border-red-800/40",
    };
  }
  if (value < 0) {
    return {
      badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      dot: "bg-orange-500",
      border: "border-l-orange-500",
      label: "Urgente",
      pillBg: "bg-orange-950/40 text-orange-300 border-orange-800/40",
    };
  }
  if (value < 5) {
    return {
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      dot: "bg-amber-400",
      border: "border-l-amber-400",
      label: "Regular",
      pillBg: "bg-amber-950/40 text-amber-300 border-amber-800/40",
    };
  }
  if (value < 10) {
    return {
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      dot: "bg-emerald-400",
      border: "border-l-emerald-400",
      label: "Saludable",
      pillBg: "bg-emerald-950/40 text-emerald-300 border-emerald-800/40",
    };
  }
  return {
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    dot: "bg-sky-400",
    border: "border-l-sky-400",
    label: "Excelente",
    pillBg: "bg-sky-950/40 text-sky-300 border-sky-800/40",
  };
}

/**
 * Extracts bracket prefixes like "[Brio]" or "[Salud]" from task titles
 * to render them cleanly as archival catalog tags.
 */
export function parseTaskPrefix(rawText: string): {
  prefix: string | null;
  cleanTitle: string;
} {
  if (!rawText) return { prefix: null, cleanTitle: "" };
  const match = rawText.match(/^\[(.*?)\]\s*(.*)$/);
  if (match && match[1]) {
    return {
      prefix: match[1].trim(),
      cleanTitle: match[2].trim() || match[1].trim(),
    };
  }
  return { prefix: null, cleanTitle: rawText };
}

/**
 * Capitalizes string nicely
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Calculates Habitica's official Max MP based on Intelligence (INT).
 * Formula: 2 * totalINT + 30 (or equipment adjusted)
 */
export function calculateHabiticaMaxMp(stats: {
  int?: number;
  buffs?: { int?: number };
  maxMP?: number;
  mp?: number;
}): number {
  if (stats.maxMP && stats.maxMP > 0) return stats.maxMP;
  const totalInt = (stats.int || 0) + (stats.buffs?.int || 0);
  const base = 2 * totalInt + 30;
  return Math.max(base, Math.round(stats.mp || 0), 100);
}

/**
 * Calculates Habitica's official XP required for next level (To Next Level / TNL).
 * Official Habitica formula:
 * Levels 1-4: 25 * lvl
 * Level 5: 150
 * Level >= 6: roundTo10(0.25 * lvl^2 + 10 * lvl + 139.75)
 */
export function calculateHabiticaToNextLevel(stats: {
  lvl?: number;
  toNextLevel?: number;
  exp?: number;
}): number {
  if (stats.toNextLevel && stats.toNextLevel > 0) return stats.toNextLevel;
  const lvl = stats.lvl || 1;
  if (lvl < 5) return 25 * lvl;
  if (lvl === 5) return 150;
  const raw = 0.25 * (lvl ** 2) + 10 * lvl + 139.75;
  const rounded = Math.round(raw / 10) * 10;
  return Math.max(rounded, Math.round(stats.exp || 0));
}

/**
 * Calculates how much work time (life energy) an expense represents.
 * @param amountInMxn Amount of the expense in MXN
 * @param monthlyIncome Monthly income in MXN (default: 25,000 MXN)
 * @param workHoursPerMonth Hours worked per month (default: 160 hrs)
 */
export function calculateWorkTimeForExpense(
  amountInMxn: number,
  monthlyIncome: number = 25000,
  workHoursPerMonth: number = 160
): {
  hourlyRate: number;
  totalHours: number;
  daysWorked: number;
  formattedTime: string;
  shortFormattedTime: string;
  severity: "low" | "medium" | "high" | "critical";
  badgeBg: string;
} {
  const safeIncome = Math.max(1000, monthlyIncome || 25000);
  const hourlyRate = safeIncome / Math.max(1, workHoursPerMonth);
  const safeAmount = Math.max(0, amountInMxn || 0);
  const totalHours = safeAmount / hourlyRate;
  const daysWorked = Number((totalHours / 8).toFixed(1));

  let severity: "low" | "medium" | "high" | "critical" = "low";
  let badgeBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

  if (totalHours > 24) {
    severity = "critical";
    badgeBg = "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (totalHours > 8) {
    severity = "high";
    badgeBg = "bg-orange-500/10 text-orange-400 border-orange-500/20";
  } else if (totalHours > 2) {
    severity = "medium";
    badgeBg = "bg-amber-500/10 text-amber-300 border-amber-500/20";
  }

  if (totalHours < 1 / 60) {
    return {
      hourlyRate,
      totalHours,
      daysWorked: 0,
      formattedTime: "< 1 min de trabajo",
      shortFormattedTime: "<1m",
      severity,
      badgeBg,
    };
  }

  if (totalHours < 1) {
    const mins = Math.round(totalHours * 60);
    return {
      hourlyRate,
      totalHours,
      daysWorked: 0,
      formattedTime: `${mins} min${mins === 1 ? "" : "s"} de trabajo`,
      shortFormattedTime: `${mins}m de vida`,
      severity,
      badgeBg,
    };
  }

  if (totalHours < 8) {
    const hours = Math.floor(totalHours);
    const mins = Math.round((totalHours - hours) * 60);
    return {
      hourlyRate,
      totalHours,
      daysWorked,
      formattedTime: mins > 0 ? `${hours}h ${mins}m de trabajo` : `${hours}h de trabajo`,
      shortFormattedTime: mins > 0 ? `${hours}h ${mins}m de vida` : `${hours}h de vida`,
      severity,
      badgeBg,
    };
  }

  return {
    hourlyRate,
    totalHours,
    daysWorked,
    formattedTime: `${daysWorked} días de trabajo (~${Math.round(totalHours)}h)`,
    shortFormattedTime: `${daysWorked} días de vida`,
    severity,
    badgeBg,
  };
}


