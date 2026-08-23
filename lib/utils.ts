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
} {
  if (value < -10) {
    return {
      badge: "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "bg-red-500",
      border: "border-l-red-500",
    };
  }
  if (value < 0) {
    return {
      badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      dot: "bg-orange-500",
      border: "border-l-orange-500",
    };
  }
  if (value < 5) {
    return {
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      dot: "bg-amber-400",
      border: "border-l-amber-400",
    };
  }
  if (value < 10) {
    return {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-400",
      border: "border-l-emerald-400",
    };
  }
  return {
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    dot: "bg-sky-400",
    border: "border-l-sky-400",
  };
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
