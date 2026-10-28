/**
 * Date and Timezone Utilities for Brio OS.
 * Standardizes all date generation, formatting, and range calculations to CDMX timezone (America/Mexico_City).
 */

export const APP_TIMEZONE = "America/Mexico_City";

/**
 * Returns today's date in YYYY-MM-DD format according to the configured timezone (America/Mexico_City).
 */
export function getTodayDateStr(timeZone: string = APP_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Normalizes any Date instance, ISO string, or timestamp into YYYY-MM-DD in the configured timezone.
 * If no date is passed, defaults to today in America/Mexico_City.
 */
export function toDateStr(date?: Date | string | null, timeZone: string = APP_TIMEZONE): string {
  if (!date) {
    return getTodayDateStr(timeZone);
  }

  if (typeof date === "string") {
    // If it is already a pure YYYY-MM-DD format, return it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return getTodayDateStr(timeZone);
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  }

  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return getTodayDateStr(timeZone);
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  }

  return getTodayDateStr(timeZone);
}

/**
 * Calculates Monday and Sunday (start and end of the week) for a given date in the configured timezone.
 */
export function getWeekDateRange(
  targetDateStr?: string | Date | null,
  timeZone: string = APP_TIMEZONE
): {
  mondayStr: string;
  sundayStr: string;
  monday: Date;
  sunday: Date;
} {
  const dateStr = toDateStr(targetDateStr, timeZone);
  const [y, m, d] = dateStr.split("-").map(Number);
  // Use noon UTC to avoid daylight saving boundary issues
  const curr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = curr.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(curr);
  monday.setUTCDate(monday.getUTCDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  return {
    mondayStr: monday.toISOString().split("T")[0],
    sundayStr: sunday.toISOString().split("T")[0],
    monday,
    sunday,
  };
}

/**
 * Returns today's Habitica-style weekday key (su, m, t, w, th, f, s) in the configured timezone.
 */
export function getTodayDayKey(timeZone: string = APP_TIMEZONE): "su" | "m" | "t" | "w" | "th" | "f" | "s" {
  const dayKeys = ["su", "m", "t", "w", "th", "f", "s"] as const;
  const today = getTodayDateStr(timeZone);
  return dayKeys[new Date(`${today}T12:00:00Z`).getUTCDay()];
}

/**
 * Returns the UTC instant (ISO string) at which today started in the configured timezone.
 */
export function getStartOfTodayISO(timeZone: string = APP_TIMEZONE): string {
  const [y, m, d] = getTodayDateStr(timeZone).split("-").map(Number);
  const utcMidnight = new Date(Date.UTC(y, m - 1, d));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(utcMidnight);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const zonedAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offsetMs = zonedAsUtc - utcMidnight.getTime();
  return new Date(utcMidnight.getTime() - offsetMs).toISOString();
}

/**
 * Returns date string for N days ago in the configured timezone.
 */
export function getDaysAgoDateStr(days: number, timeZone: string = APP_TIMEZONE): string {
  const today = getTodayDateStr(timeZone);
  const [y, m, d] = today.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  target.setUTCDate(target.getUTCDate() - days);
  return target.toISOString().split("T")[0];
}

/**
 * Calendar-accurate month addition/subtraction on a 'YYYY-MM-DD' date string.
 * Clamps days to target month length (e.g. 2026-01-31 + 1 month -> 2026-02-28).
 * Pure calendar math without UTC/local timezone shifts.
 */
export function addMonthsToDateStr(dateStr: string, monthsToAdd: number): string {
  const cleanDate = toDateStr(dateStr);
  const [y, m, d] = cleanDate.split("-").map(Number);
  const totalMonths = y * 12 + (m - 1) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12 + 1;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const targetDay = Math.min(d, daysInTargetMonth);

  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(targetDay).padStart(2, "0");
  return `${targetYear}-${mm}-${dd}`;
}

/**
 * Calendar-accurate day addition/subtraction on a 'YYYY-MM-DD' date string.
 */
export function addDaysToDateStr(dateStr: string, daysToAdd: number): string {
  const cleanDate = toDateStr(dateStr);
  const [y, m, d] = cleanDate.split("-").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + daysToAdd, 12, 0, 0));
  return utcDate.toISOString().split("T")[0];
}

/**
 * Calendar-accurate year addition/subtraction on a 'YYYY-MM-DD' date string.
 * Clamps leap year Feb 29 to Feb 28 on non-leap years.
 */
export function addYearsToDateStr(dateStr: string, yearsToAdd: number): string {
  const cleanDate = toDateStr(dateStr);
  const [y, m, d] = cleanDate.split("-").map(Number);
  const targetYear = y + yearsToAdd;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, m, 0)).getUTCDate();
  const targetDay = Math.min(d, daysInTargetMonth);

  const mm = String(m).padStart(2, "0");
  const dd = String(targetDay).padStart(2, "0");
  return `${targetYear}-${mm}-${dd}`;
}

