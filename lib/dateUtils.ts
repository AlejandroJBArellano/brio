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
 * Returns date string for N days ago in the configured timezone.
 */
export function getDaysAgoDateStr(days: number, timeZone: string = APP_TIMEZONE): string {
  const today = getTodayDateStr(timeZone);
  const [y, m, d] = today.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  target.setUTCDate(target.getUTCDate() - days);
  return target.toISOString().split("T")[0];
}
