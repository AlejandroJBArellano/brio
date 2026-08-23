"use server";

import { getDb } from "@/lib/db";
import {
  DEFAULT_HORMONAL_CHECKLIST,
  DEFAULT_HORMONAL_CONFIG,
} from "@/lib/hormonal";
import {
  HormonalDailyChecklist,
  HormonalScheduleConfig,
} from "@/lib/types";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import { revalidatePath } from "next/cache";
import { getTodayDateStr } from "@/lib/dateUtils";

/**
 * Ensures tables for hormonal tracking exist in Neon Postgres.
 */
async function ensureHormonalTablesExist() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS hormonal_settings (
      id VARCHAR(64) PRIMARY KEY,
      config JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS hormonal_daily_logs (
      date DATE PRIMARY KEY,
      checklist JSONB NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
}

/**
 * Server Action: Fetches hormonal schedule config and today's checklist.
 */
export async function fetchHormonalDashboardDataAction(): Promise<{
  config: HormonalScheduleConfig;
  todayChecklist: HormonalDailyChecklist;
}> {
  try {
    const sql = getDb();
    await ensureHormonalTablesExist();
    const todayStr = getTodayDateStr();

    const [settingsRow, logRow] = await Promise.all([
      sql`SELECT config FROM hormonal_settings WHERE id = 'default' LIMIT 1;`,
      sql`SELECT checklist FROM hormonal_daily_logs WHERE date = ${todayStr} LIMIT 1;`,
    ]);

    const config: HormonalScheduleConfig =
      settingsRow.length > 0 && settingsRow[0].config
        ? { ...DEFAULT_HORMONAL_CONFIG, ...settingsRow[0].config }
        : DEFAULT_HORMONAL_CONFIG;

    const todayChecklist: HormonalDailyChecklist =
      logRow.length > 0 && logRow[0].checklist
        ? { ...DEFAULT_HORMONAL_CHECKLIST, ...logRow[0].checklist }
        : DEFAULT_HORMONAL_CHECKLIST;

    return { config, todayChecklist };
  } catch (error) {
    console.error("[Fetch Hormonal Data Error]:", error);
    return {
      config: DEFAULT_HORMONAL_CONFIG,
      todayChecklist: DEFAULT_HORMONAL_CHECKLIST,
    };
  }
}

/**
 * Server Action: Updates hormonal schedule configuration.
 */
export async function saveHormonalScheduleConfigAction(
  newConfig: Partial<HormonalScheduleConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureHormonalTablesExist();

    const currentData = await fetchHormonalDashboardDataAction();
    const merged = { ...currentData.config, ...newConfig };

    await sql`
      INSERT INTO hormonal_settings (id, config, updated_at)
      VALUES ('default', ${JSON.stringify(merged)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET config = ${JSON.stringify(merged)}::jsonb,
          updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Save Hormonal Config Error]:", error);
    return { success: false, error: "No se pudo guardar la configuración hormonal." };
  }
}

/**
 * Server Action: Toggles an item in today's hormonal checklist.
 */
export async function toggleHormonalChecklistItemAction(
  key: keyof HormonalDailyChecklist
): Promise<{ success: boolean; checklist?: HormonalDailyChecklist; error?: string }> {
  try {
    const sql = getDb();
    await ensureHormonalTablesExist();
    const todayStr = getTodayDateStr();

    const currentData = await fetchHormonalDashboardDataAction();
    const updatedChecklist: HormonalDailyChecklist = {
      ...currentData.todayChecklist,
      [key]: !currentData.todayChecklist[key],
    };

    await sql`
      INSERT INTO hormonal_daily_logs (date, checklist, updated_at)
      VALUES (${todayStr}, ${JSON.stringify(updatedChecklist)}::jsonb, NOW())
      ON CONFLICT (date) DO UPDATE
      SET checklist = ${JSON.stringify(updatedChecklist)}::jsonb,
          updated_at = NOW();
    `;

    if (updatedChecklist[key]) {
      await awardHabiticaEvent("CIRCADIAN_HABIT_COMPLETED", {
        customNotes: `Hábito circadiano cumplido: ${key}`,
      });
    }

    revalidatePath("/");
    return { success: true, checklist: updatedChecklist };
  } catch (error) {
    console.error("[Toggle Hormonal Checklist Error]:", error);
    return { success: false, error: "No se pudo actualizar el checklist hormonal." };
  }
}
