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
