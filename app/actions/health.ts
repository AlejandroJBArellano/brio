"use server";

import { ensureDatabaseSchema, getDb } from "@/lib/db";
import {
  HealthDashboardData,
  HealthLog,
  SupplementItem,
  WorkoutType,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

const DEFAULT_SUPPLEMENTS: SupplementItem[] = [
  { id: "creatine", name: "Creatina (5g)", taken: false },
  { id: "multivitamin", name: "Multivitamínico", taken: false },
  { id: "omega3", name: "Omega 3", taken: false },
  { id: "protein", name: "Proteína / Shake", taken: false },
];

/**
 * Server Action: Fetches physical health metrics, hydration, workouts, and sleep.
 */
export async function fetchHealthDashboardDataAction(): Promise<HealthDashboardData> {
  await ensureDatabaseSchema();
  const sql = getDb();
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Fetch today's health record
  const todayRows = await sql`
    SELECT * FROM health_logs WHERE date = ${todayStr} LIMIT 1;
  `;

  let todayHealth: HealthLog;
  if (todayRows.length > 0) {
    const row = todayRows[0];
    todayHealth = {
      date: todayStr,
      workoutType: row.workout_type || undefined,
      workoutNotes: row.workout_notes || undefined,
      waterMl: Number(row.water_ml) || 0,
      supplements: Array.isArray(row.supplements) && row.supplements.length > 0 ? row.supplements : DEFAULT_SUPPLEMENTS,
      sleepHours: Number(row.sleep_hours) || 7.5,
      sleepQuality: Number(row.sleep_quality) || 4,
      stepsCount: Number(row.steps_count) || 0,
    };
  } else {
    todayHealth = {
      date: todayStr,
      waterMl: 0,
      supplements: DEFAULT_SUPPLEMENTS,
      sleepHours: 7.5,
      sleepQuality: 4,
      stepsCount: 0,
    };

    await sql`
      INSERT INTO health_logs (date, water_ml, supplements, sleep_hours, sleep_quality, steps_count)
      VALUES (${todayStr}, 0, ${JSON.stringify(DEFAULT_SUPPLEMENTS)}::jsonb, 7.5, 4, 0)
      ON CONFLICT (date) DO NOTHING;
    `;
  }

  // 2. Fetch recent 14 days logs for streaks & averages
  const recentRows = await sql`
    SELECT * FROM health_logs ORDER BY date DESC LIMIT 14;
  `;

  const recentLogs: HealthLog[] = recentRows.map((r) => ({
    date: typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toISOString().split("T")[0],
    workoutType: r.workout_type || undefined,
    workoutNotes: r.workout_notes || undefined,
    waterMl: Number(r.water_ml) || 0,
    supplements: Array.isArray(r.supplements) ? r.supplements : [],
    sleepHours: Number(r.sleep_hours) || 7.5,
    sleepQuality: Number(r.sleep_quality) || 4,
    stepsCount: Number(r.steps_count) || 0,
  }));

  const weeklyWorkoutsCount = recentLogs
    .slice(0, 7)
    .filter((l) => l.workoutType && l.workoutType !== "rest").length;

  let workoutStreak = 0;
  for (const log of recentLogs) {
    if (log.workoutType && log.workoutType !== "rest") {
      workoutStreak += 1;
    } else {
      break;
    }
  }

  const averageSleepHours =
    recentLogs.length > 0
      ? Number(
          (
            recentLogs.reduce((sum, l) => sum + l.sleepHours, 0) /
            recentLogs.length
          ).toFixed(1)
        )
      : 7.5;

  const waterPercent = Math.min(100, Math.round((todayHealth.waterMl / 3000) * 100));

  return {
    todayHealth,
    waterPercent,
    weeklyWorkoutsCount,
    workoutStreak,
    averageSleepHours,
    recentLogs,
  };
}

/**
 * Server Action: Logs or updates workout session for today.
 */
export async function logWorkoutAction(
  workoutType: WorkoutType,
  workoutNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const todayStr = new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO health_logs (date, workout_type, workout_notes, updated_at)
      VALUES (${todayStr}, ${workoutType}, ${workoutNotes || null}, NOW())
      ON CONFLICT (date) DO UPDATE
      SET workout_type = ${workoutType},
          workout_notes = ${workoutNotes || null},
          updated_at = NOW();
    `;

    // Activity tracking
    await sql`
      INSERT INTO daily_activity_logs (date, habits_count, updated_at)
      VALUES (${todayStr}, 1, NOW())
      ON CONFLICT (date) DO UPDATE
      SET habits_count = daily_activity_logs.habits_count + 1,
          updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Log Workout Error]:", error);
    return { success: false, error: "Failed to log workout" };
  }
}

/**
 * Server Action: Adds water intake (e.g. +250ml, +500ml).
 */
export async function addWaterAction(
  amountMl: number
): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const todayStr = new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO health_logs (date, water_ml, updated_at)
      VALUES (${todayStr}, ${amountMl}, NOW())
      ON CONFLICT (date) DO UPDATE
      SET water_ml = health_logs.water_ml + ${amountMl},
          updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Add Water Error]:", error);
    return { success: false, error: "Failed to add water" };
  }
}

/**
 * Server Action: Toggles supplement item.
 */
export async function toggleSupplementAction(
  supplementId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const todayStr = new Date().toISOString().split("T")[0];

    const current = await sql`
      SELECT supplements FROM health_logs WHERE date = ${todayStr} LIMIT 1;
    `;

    let supplements: SupplementItem[] =
      current.length > 0 && Array.isArray(current[0].supplements)
        ? current[0].supplements
        : DEFAULT_SUPPLEMENTS;

    supplements = supplements.map((s) =>
      s.id === supplementId ? { ...s, taken: !s.taken } : s
    );

    await sql`
      INSERT INTO health_logs (date, supplements, updated_at)
      VALUES (${todayStr}, ${JSON.stringify(supplements)}::jsonb, NOW())
      ON CONFLICT (date) DO UPDATE
      SET supplements = ${JSON.stringify(supplements)}::jsonb,
          updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Toggle Supplement Error]:", error);
    return { success: false, error: "Failed to toggle supplement" };
  }
}

/**
 * Server Action: Logs sleep hours and recovery rating.
 */
export async function logSleepAction(
  sleepHours: number,
  sleepQuality: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const todayStr = new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO health_logs (date, sleep_hours, sleep_quality, updated_at)
      VALUES (${todayStr}, ${sleepHours}, ${sleepQuality}, NOW())
      ON CONFLICT (date) DO UPDATE
      SET sleep_hours = ${sleepHours},
          sleep_quality = ${sleepQuality},
          updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Log Sleep Error]:", error);
    return { success: false, error: "Failed to log sleep" };
  }
}

/**
 * Server Action: Imports Samsung Health JSON export data.
 */
export async function importSamsungHealthDataAction(
  jsonDataString: string
): Promise<{ success: boolean; importedCount: number; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const data = JSON.parse(jsonDataString);

    let count = 0;
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.date) {
          const dateStr = item.date.split("T")[0];
          const steps = Number(item.steps || item.step_count) || 0;
          const sleep = Number(item.sleep_hours || item.sleepDuration) || 7.5;

          await sql`
            INSERT INTO health_logs (date, steps_count, sleep_hours, updated_at)
            VALUES (${dateStr}, ${steps}, ${sleep}, NOW())
            ON CONFLICT (date) DO UPDATE
            SET steps_count = ${steps},
                sleep_hours = ${sleep},
                updated_at = NOW();
          `;
          count++;
        }
      }
    }

    revalidatePath("/");
    return { success: true, importedCount: count };
  } catch (error) {
    console.error("[Samsung Health Import Error]:", error);
    return { success: false, importedCount: 0, error: "Failed to parse Samsung Health data" };
  }
}
