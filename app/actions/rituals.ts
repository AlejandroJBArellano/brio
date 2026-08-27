"use server";

import { getDb } from "@/lib/db";
import { parseBatchInput } from "@/lib/parser";
import { habiticaClient } from "@/lib/habitica";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import { RitualLog } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getTodayDateStr } from "@/lib/dateUtils";

interface RitualDbRow {
  date: Date | string;
  must_win_tasks?: string[];
  energy_level?: number | string;
  day_intention?: string;
  reflection?: string;
  expenses_logged?: boolean;
}

/**
 * Server Action: Fetches today's ritual log and Must-Win tasks.
 */
export async function fetchTodayRitualAction(): Promise<RitualLog | null> {
  try {
    const sql = getDb();
    const todayStr = getTodayDateStr();

    const rows = await sql`
      SELECT * FROM ritual_logs WHERE date = ${todayStr} LIMIT 1;
    `;

    if (rows.length === 0) return null;

    const row = rows[0] as unknown as RitualDbRow;
    return {
      date: todayStr,
      mustWinTasks: Array.isArray(row.must_win_tasks) ? row.must_win_tasks : [],
      energyLevel: row.energy_level ? Number(row.energy_level) : undefined,
      dayIntention: row.day_intention || undefined,
      reflection: row.reflection || undefined,
      expensesLogged: Boolean(row.expenses_logged),
    };
  } catch (error) {
    console.error("[Fetch Ritual Error]:", error);
    return null;
  }
}

/**
 * Server Action: Saves the Morning Kickoff ritual (Sleep, Energy & Autocuidado).
 */
export async function saveMorningRitualAction(payload: {
  energyLevel: number;
  sleepHours?: string;
  sleepQuality?: string;
  mustWinTasks?: string[];
  dayIntention?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const todayStr = getTodayDateStr();
    const tasksJson = JSON.stringify(payload.mustWinTasks || []);

    await sql`
      INSERT INTO ritual_logs (date, must_win_tasks, energy_level, day_intention)
      VALUES (${todayStr}, ${tasksJson}::jsonb, ${payload.energyLevel}, ${payload.dayIntention || null})
      ON CONFLICT (date) DO UPDATE
      SET energy_level = ${payload.energyLevel},
          day_intention = ${payload.dayIntention || null};
    `;

    // Activity tracking
    await sql`
      INSERT INTO daily_activity_logs (date, updated_at)
      VALUES (${todayStr}, NOW())
      ON CONFLICT (date) DO UPDATE SET updated_at = NOW();
    `;

    // Award Habitica XP for completing Morning Kickoff
    const notesParts: string[] = [`Nivel de energía: ${payload.energyLevel}/5`];
    if (payload.sleepHours) notesParts.push(`Sueño: ${payload.sleepHours}`);
    if (payload.sleepQuality) notesParts.push(`Calidad: ${payload.sleepQuality}`);

    await awardHabiticaEvent("MORNING_KICKOFF", {
      customNotes: notesParts.join(" • "),
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Save Morning Ritual Error]:", error);
    return { success: false, error: "Failed to save morning ritual" };
  }
}

/**
 * Server Action: Directly sets the Must-Win tasks from Today view.
 */
export async function setMustWinTasksAction(
  taskIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const todayStr = getTodayDateStr();
    const tasksJson = JSON.stringify(taskIds);

    await sql`
      INSERT INTO ritual_logs (date, must_win_tasks)
      VALUES (${todayStr}, ${tasksJson}::jsonb)
      ON CONFLICT (date) DO UPDATE
      SET must_win_tasks = ${tasksJson}::jsonb;
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Set Must-Win Tasks Error]:", error);
    return { success: false, error: "Failed to set must-win tasks" };
  }
}


/**
 * Server Action: Saves the Evening Review (Reflection, Expenses check, and Brain dump).
 */
export async function saveEveningReviewAction(payload: {
  reflection?: string;
  expensesLogged?: boolean;
  tomorrowNotes?: string;
  energyLevel?: number;
  nightRoutineCompleted?: boolean;
}): Promise<{ success: boolean; tasksCreated?: number; error?: string }> {
  try {
    const sql = getDb();
    const todayStr = getTodayDateStr();

    await sql`
      INSERT INTO ritual_logs (date, reflection, expenses_logged, energy_level)
      VALUES (${todayStr}, ${payload.reflection || null}, ${Boolean(payload.expensesLogged)}, ${payload.energyLevel || null})
      ON CONFLICT (date) DO UPDATE
      SET reflection = COALESCE(${payload.reflection || null}, ritual_logs.reflection),
          expenses_logged = ${Boolean(payload.expensesLogged)},
          energy_level = COALESCE(${payload.energyLevel || null}, ritual_logs.energy_level);
    `;

    let tasksCreated = 0;
    // If tomorrow notes provided, parse & dispatch to Habitica if any tasks formatted
    if (payload.tomorrowNotes && payload.tomorrowNotes.trim()) {
      const parsed = parseBatchInput(payload.tomorrowNotes.trim());
      if (parsed.payloads.length > 0) {
        const batchResult = await habiticaClient.createTasksBatch(parsed.payloads);
        tasksCreated = batchResult.createdCount;
      }
    }

    // Award Habitica XP for completing Evening Review
    await awardHabiticaEvent("EVENING_REVIEW", {
      customNotes: payload.reflection ? `Reflexión: ${payload.reflection}` : undefined,
    });

    revalidatePath("/");
    revalidatePath("/today");
    return { success: true, tasksCreated };
  } catch (error) {
    console.error("[Save Evening Review Error]:", error);
    return { success: false, error: "Failed to save evening review" };
  }
}
