"use server";

import { getMockCalendarSchedule, parseICalFeed } from "@/lib/calendar";
import { CalendarDaySchedule } from "@/lib/types";

/**
 * Server Action: Fetches and parses today's Google Calendar events.
 */
export async function fetchCalendarScheduleAction(
  customIcalUrl?: string
): Promise<{ schedule: CalendarDaySchedule; isConfigured: boolean; error?: string }> {
  const icalUrl =
    customIcalUrl?.trim() ||
    process.env.GOOGLE_CALENDAR_ICAL_URL?.trim() ||
    "";

  if (!icalUrl) {
    return {
      schedule: getMockCalendarSchedule(),
      isConfigured: false,
    };
  }

  try {
    const response = await fetch(icalUrl, {
      next: { revalidate: 300 }, // Cache 5 minutes
      headers: {
        "User-Agent": "Brio-Life-OS/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Google Calendar request failed: ${response.statusText}`);
    }

    const icsContent = await response.text();
    const schedule = parseICalFeed(icsContent, new Date());

    return {
      schedule,
      isConfigured: true,
    };
  } catch (error) {
    console.error("[Calendar Action Error]:", error);
    return {
      schedule: getMockCalendarSchedule(),
      isConfigured: false,
      error: error instanceof Error ? error.message : "Failed to fetch calendar",
    };
  }
}
