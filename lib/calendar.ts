import { CalendarDaySchedule, CalendarEvent } from "./types";
import { toDateStr } from "./dateUtils";

/**
 * Native lightweight iCal parser for Google Calendar feeds.
 */
export function parseICalFeed(icsContent: string, targetDate: Date = new Date()): CalendarDaySchedule {
  const lines = icsContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  
  // Unfold folded lines (lines starting with whitespace)
  const unfoldedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(" ") || line.startsWith("\t")) {
      if (unfoldedLines.length > 0) {
        unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
      }
    } else {
      unfoldedLines.push(line);
    }
  }

  const events: CalendarEvent[] = [];
  let inEvent = false;
  let currentEvent: Record<string, string> = {};

  for (const line of unfoldedLines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (line.startsWith("END:VEVENT")) {
      if (inEvent && currentEvent.SUMMARY) {
        const parsed = parseVEvent(currentEvent, targetDate);
        if (parsed) events.push(parsed);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (inEvent) {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const keyWithParams = line.slice(0, colonIdx);
        const value = line.slice(colonIdx + 1);
        const key = keyWithParams.split(";")[0].toUpperCase();
        currentEvent[key] = value;

        // If DTSTART has TZID or VALUE=DATE params, preserve them
        if (keyWithParams.startsWith("DTSTART")) {
          currentEvent["_DTSTART_RAW"] = line;
        }
        if (keyWithParams.startsWith("DTEND")) {
          currentEvent["_DTEND_RAW"] = line;
        }
      }
    }
  }

  // Sort chronologically by start time
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const _now = new Date();
  const nextEvent = events.find((e) => e.status === "now" || e.status === "upcoming");
  const totalMeetingMinutes = events.reduce((sum, e) => (e.isAllDay ? sum : sum + e.durationMinutes), 0);

  return {
    date: toDateStr(targetDate),
    events,
    nextEvent,
    totalMeetingMinutes,
  };
}

function parseVEvent(raw: Record<string, string>, targetDate: Date): CalendarEvent | null {
  const summary = raw.SUMMARY || "Untitled Event";
  const dtStartRaw = raw._DTSTART_RAW || raw.DTSTART || "";
  const dtEndRaw = raw._DTEND_RAW || raw.DTEND || "";

  const startDate = parseICalDate(dtStartRaw, raw.DTSTART);
  if (!startDate) return null;

  let endDate = parseICalDate(dtEndRaw, raw.DTEND);
  if (!endDate) {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default
  }

  // Check if event touches target date (Today)
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  const isToday =
    (startDate.getFullYear() === targetYear &&
      startDate.getMonth() === targetMonth &&
      startDate.getDate() === targetDay) ||
    (endDate.getFullYear() === targetYear &&
      endDate.getMonth() === targetMonth &&
      endDate.getDate() === targetDay);

  if (!isToday) return null;

  const isAllDay = (raw.DTSTART && raw.DTSTART.length === 8) || dtStartRaw.includes("VALUE=DATE");

  const durationMinutes = Math.max(
    15,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
  );

  const now = new Date();
  let status: "past" | "now" | "upcoming" = "upcoming";
  let timeUntil: string | undefined;

  if (now > endDate) {
    status = "past";
  } else if (now >= startDate && now <= endDate) {
    status = "now";
    timeUntil = "En curso ahora";
  } else {
    status = "upcoming";
    const diffMs = startDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) {
      timeUntil = `En ${diffMins} min`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      const remMins = diffMins % 60;
      timeUntil = remMins > 0 ? `En ${diffHours}h ${remMins}m` : `En ${diffHours}h`;
    }
  }

  return {
    id: raw.UID || `event-${startDate.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    title: cleanICalText(summary),
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    startTimeFormatted: isAllDay ? "Todo el día" : formatTime(startDate),
    endTimeFormatted: isAllDay ? "" : formatTime(endDate),
    durationMinutes,
    isAllDay,
    location: raw.LOCATION ? cleanICalText(raw.LOCATION) : undefined,
    description: raw.DESCRIPTION ? cleanICalText(raw.DESCRIPTION) : undefined,
    status,
    timeUntil,
  };
}

function parseICalDate(rawLine: string, valueOnly?: string): Date | null {
  const val = (valueOnly || "").trim();
  if (!val && !rawLine) return null;

  const match = (val || rawLine).match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
  if (!match) return null;

  const [, y, m, d, hh = "00", mm = "00", ss = "00", isUtc] = match;

  if (isUtc) {
    return new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm), parseInt(ss)));
  }

  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm), parseInt(ss));
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function cleanICalText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * High quality demo events when Google Calendar is not yet configured.
 */
export function getMockCalendarSchedule(): CalendarDaySchedule {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const events: CalendarEvent[] = [
    {
      id: "mock-cal-1",
      title: "Daily Standup & Sprint Sync ⚡",
      start: new Date(year, month, day, 9, 30).toISOString(),
      end: new Date(year, month, day, 10, 0).toISOString(),
      startTimeFormatted: "09:30 AM",
      endTimeFormatted: "10:00 AM",
      durationMinutes: 30,
      isAllDay: false,
      location: "Google Meet",
      description: "Revisión rápida de blockers y avance de Brio OS",
      status: "past",
    },
    {
      id: "mock-cal-2",
      title: "Deep Work: Arquitectura & Neon DB 🧠",
      start: new Date(year, month, day, 11, 0).toISOString(),
      end: new Date(year, month, day, 12, 30).toISOString(),
      startTimeFormatted: "11:00 AM",
      endTimeFormatted: "12:30 PM",
      durationMinutes: 90,
      isAllDay: false,
      location: "Foco sin interrupciones",
      status: "upcoming",
      timeUntil: "Próxima sesión",
    },
    {
      id: "mock-cal-3",
      title: "1:1 Sync de Producto & Estrategia 🚀",
      start: new Date(year, month, day, 16, 0).toISOString(),
      end: new Date(year, month, day, 16, 45).toISOString(),
      startTimeFormatted: "04:00 PM",
      endTimeFormatted: "04:45 PM",
      durationMinutes: 45,
      isAllDay: false,
      location: "Google Meet",
      status: "upcoming",
      timeUntil: "En la tarde",
    },
  ];

  return {
    date: toDateStr(now),
    events,
    nextEvent: events[1],
    totalMeetingMinutes: 165,
  };
}
