"use server";

import { ensureDatabaseSchema, getDb } from "@/lib/db";
import { parseBatchInput } from "@/lib/parser";
import { habiticaClient } from "@/lib/habitica";
import { RitualLog } from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Fetches today's ritual log and Must-Win tasks.
 */
export async function fetchTodayRitualAction(): Promise<RitualLog | null> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const todayStr = new Date().toISOString().split("T")[0];

    const rows = await sql`
      SELECT * FROM ritual_logs WHERE date = ${todayStr} LIMIT 1;
    `;

    if (rows.length === 0) return null;

    const row = rows[0];
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
 * Server Action: Saves the Morning Kickoff ritual (Must-Wins & Energy).
 */
export async function saveMorningRitualAction(payload: {
  mustWinTasks: string[];
  energyLevel: number;
  dayIntention?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const todayStr = new Date().toISOString().split("T")[0];
    const tasksJson = JSON.stringify(payload.mustWinTasks);

    await sql`
      INSERT INTO ritual_logs (date, must_win_tasks, energy_level, day_intention)
      VALUES (${todayStr}, ${tasksJson}::jsonb, ${payload.energyLevel}, ${payload.dayIntention || null})
      ON CONFLICT (date) DO UPDATE
      SET must_win_tasks = ${tasksJson}::jsonb,
          energy_level = ${payload.energyLevel},
          day_intention = ${payload.dayIntention || null};
    `;

    // Activity tracking
    await sql`
      INSERT INTO daily_activity_logs (date, updated_at)
      VALUES (${todayStr}, NOW())
      ON CONFLICT (date) DO UPDATE SET updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Save Morning Ritual Error]:", error);
    return { success: false, error: "Failed to save morning ritual" };
  }
}

/**
 * Server Action: Saves the Evening Review (Reflection, Expenses check, and Brain dump).
 */
export async function saveEveningReviewAction(payload: {
  reflection?: string;
  expensesLogged?: boolean;
  tomorrowNotes?: string;
}): Promise<{ success: boolean; tasksCreated?: number; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const todayStr = new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO ritual_logs (date, reflection, expenses_logged)
      VALUES (${todayStr}, ${payload.reflection || null}, ${Boolean(payload.expensesLogged)})
      ON CONFLICT (date) DO UPDATE
      SET reflection = ${payload.reflection || null},
          expenses_logged = ${Boolean(payload.expensesLogged)};
    `;

    let tasksCreated = 0;
    // If tomorrow notes provided, parse & dispatch to Habitica
    if (payload.tomorrowNotes && payload.tomorrowNotes.trim()) {
      const parsed = parseBatchInput(payload.tomorrowNotes.trim());
      if (parsed.payloads.length > 0) {
        const batchResult = await habiticaClient.createTasksBatch(parsed.payloads);
        tasksCreated = batchResult.createdCount;
      }
    }

    revalidatePath("/");
    return { success: true, tasksCreated };
  } catch (error) {
    console.error("[Save Evening Review Error]:", error);
    return { success: false, error: "Failed to save evening review" };
  }
}
