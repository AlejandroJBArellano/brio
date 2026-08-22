"use server";

import { ensureDatabaseSchema, getDb } from "@/lib/db";
import { fetchHevyWorkoutsList, saveHevyWorkoutToDb } from "@/lib/hevy";
import {
  BodyCompositionLog,
  BodyCompositionSegmental,
  HealthDashboardData,
  HealthLog,
  HevyStats,
  HevyWorkout,
  SupplementItem,
  UserSupplement,
  WorkoutType,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

const INITIAL_SMART_FIT_LOG: BodyCompositionLog = {
  id: "smartfit-2025-11-12",
  date: "2025-11-12",
  weightKg: 78.6,
  bodyFatPercentage: 24.64,
  skeletalMuscleKg: 33.71,
  fatFreeMassKg: 54.58,
  visceralFatLevel: 8.0,
  bmi: 25.67,
  bmrKcal: 1872,
  waterLiters: 39.95,
  segmentalData: {
    muscle: {
      trunk: 27.88,
      leftArm: 3.63,
      rightArm: 3.57,
      leftLeg: 9.76,
      rightLeg: 9.74,
    },
    fat: {
      trunk: 13.79,
      leftArm: 0.72,
      rightArm: 0.77,
      leftLeg: 2.03,
      rightLeg: 2.06,
    },
  },
  notes: "Medición inicial Smart Fit Body (Noviembre 2025)",
};

const DEFAULT_USER_SUPPLEMENTS: UserSupplement[] = [
  { id: "creatine", name: "Creatina", dosage: "5g", timing: "Post-entreno", orderIndex: 0, isActive: true },
  { id: "multivitamin", name: "Multivitamínico", dosage: "1 cápsula", timing: "Mañana", orderIndex: 1, isActive: true },
  { id: "omega3", name: "Omega 3", dosage: "2 cápsulas", timing: "Con comida", orderIndex: 2, isActive: true },
  { id: "protein", name: "Proteína / Shake", dosage: "30g", timing: "Post-entreno", orderIndex: 3, isActive: true },
];

/**
 * Helper: Fetches and ensures the master supplements catalog from database.
 */
async function getOrSeedSupplementsCatalog(sql: any): Promise<UserSupplement[]> {
  const rows = await sql`
    SELECT * FROM user_supplements WHERE is_active = true ORDER BY order_index ASC, created_at ASC;
  `;

  if (rows.length > 0) {
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      dosage: r.dosage || undefined,
      timing: r.timing || undefined,
      orderIndex: Number(r.order_index) || 0,
      isActive: r.is_active ?? true,
      createdAt: r.created_at?.toString(),
    }));
  }

  // Seed default catalog if empty
  for (const s of DEFAULT_USER_SUPPLEMENTS) {
    await sql`
      INSERT INTO user_supplements (id, name, dosage, timing, order_index, is_active)
      VALUES (${s.id}, ${s.name}, ${s.dosage || null}, ${s.timing || null}, ${s.orderIndex || 0}, true)
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  return DEFAULT_USER_SUPPLEMENTS;
}

/**
 * Helper: Fetches and ensures the body composition logs (Smart Fit Body) from database.
 */
async function getOrSeedBodyCompositionLogs(sql: any): Promise<BodyCompositionLog[]> {
  const rows = await sql`
    SELECT * FROM body_composition_logs ORDER BY date DESC;
  `;

  if (rows.length > 0) {
    return rows.map((r: any) => ({
      id: r.id,
      date: typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toISOString().split("T")[0],
      weightKg: Number(r.weight_kg),
      bodyFatPercentage: r.body_fat_percentage !== null ? Number(r.body_fat_percentage) : undefined,
      skeletalMuscleKg: r.skeletal_muscle_kg !== null ? Number(r.skeletal_muscle_kg) : undefined,
      fatFreeMassKg: r.fat_free_mass_kg !== null ? Number(r.fat_free_mass_kg) : undefined,
      visceralFatLevel: r.visceral_fat_level !== null ? Number(r.visceral_fat_level) : undefined,
      bmi: r.bmi !== null ? Number(r.bmi) : undefined,
      bmrKcal: r.bmr_kcal !== null ? Number(r.bmr_kcal) : undefined,
      waterLiters: r.water_liters !== null ? Number(r.water_liters) : undefined,
      segmentalData: r.segmental_data || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at?.toString(),
    }));
  }

  // Seed initial Smart Fit scan
  await sql`
    INSERT INTO body_composition_logs (
      id, date, weight_kg, body_fat_percentage, skeletal_muscle_kg,
      fat_free_mass_kg, visceral_fat_level, bmi, bmr_kcal,
      water_liters, segmental_data, notes
    )
    VALUES (
      ${INITIAL_SMART_FIT_LOG.id},
      ${INITIAL_SMART_FIT_LOG.date},
      ${INITIAL_SMART_FIT_LOG.weightKg},
      ${INITIAL_SMART_FIT_LOG.bodyFatPercentage ?? null},
      ${INITIAL_SMART_FIT_LOG.skeletalMuscleKg ?? null},
      ${INITIAL_SMART_FIT_LOG.fatFreeMassKg ?? null},
      ${INITIAL_SMART_FIT_LOG.visceralFatLevel ?? null},
      ${INITIAL_SMART_FIT_LOG.bmi ?? null},
      ${INITIAL_SMART_FIT_LOG.bmrKcal ?? null},
      ${INITIAL_SMART_FIT_LOG.waterLiters ?? null},
      ${JSON.stringify(INITIAL_SMART_FIT_LOG.segmentalData)}::jsonb,
      ${INITIAL_SMART_FIT_LOG.notes ?? null}
    )
    ON CONFLICT (date) DO NOTHING;
  `;

  return [INITIAL_SMART_FIT_LOG];
}

/**
 * Server Action: Fetches physical health metrics, hydration, workouts, sleep, and body composition.
 */
export async function fetchHealthDashboardDataAction(): Promise<HealthDashboardData> {
  await ensureDatabaseSchema();
  const sql = getDb();
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Fetch master supplements catalog
  const catalog = await getOrSeedSupplementsCatalog(sql);

  // 2. Fetch body composition records (Smart Fit Body)
  const bodyCompositionLogs = await getOrSeedBodyCompositionLogs(sql);
  const latestBodyComposition = bodyCompositionLogs.length > 0 ? bodyCompositionLogs[0] : undefined;
  const previousBodyComposition = bodyCompositionLogs.length > 1 ? bodyCompositionLogs[1] : undefined;

  // 3. Fetch today's health record
  const todayRows = await sql`
    SELECT * FROM health_logs WHERE date = ${todayStr} LIMIT 1;
  `;

  let todayHealth: HealthLog;
  if (todayRows.length > 0) {
    const row = todayRows[0];
    const existingSupplements: SupplementItem[] = Array.isArray(row.supplements) ? row.supplements : [];

    // Sync today's supplements list with active catalog
    const syncedSupplements: SupplementItem[] = catalog.map((catItem) => {
      const match = existingSupplements.find((s) => s.id === catItem.id);
      return {
        id: catItem.id,
        name: catItem.dosage ? `${catItem.name} (${catItem.dosage})` : catItem.name,
        dosage: catItem.dosage,
        timing: catItem.timing,
        taken: match ? Boolean(match.taken) : false,
      };
    });

    todayHealth = {
      date: todayStr,
      workoutType: row.workout_type || undefined,
      workoutNotes: row.workout_notes || undefined,
      waterMl: Number(row.water_ml) || 0,
      supplements: syncedSupplements,
      sleepHours: Number(row.sleep_hours) || 7.5,
      sleepQuality: Number(row.sleep_quality) || 4,
      stepsCount: Number(row.steps_count) || 0,
    };

    // Keep DB in sync with active catalog
    await sql`
      UPDATE health_logs
      SET supplements = ${JSON.stringify(syncedSupplements)}::jsonb, updated_at = NOW()
      WHERE date = ${todayStr};
    `;
  } else {
    const initialSupplements: SupplementItem[] = catalog.map((catItem) => ({
      id: catItem.id,
      name: catItem.dosage ? `${catItem.name} (${catItem.dosage})` : catItem.name,
      dosage: catItem.dosage,
      timing: catItem.timing,
      taken: false,
    }));

    todayHealth = {
      date: todayStr,
      waterMl: 0,
      supplements: initialSupplements,
      sleepHours: 7.5,
      sleepQuality: 4,
      stepsCount: 0,
    };

    await sql`
      INSERT INTO health_logs (date, water_ml, supplements, sleep_hours, sleep_quality, steps_count)
      VALUES (${todayStr}, 0, ${JSON.stringify(initialSupplements)}::jsonb, 7.5, 4, 0)
      ON CONFLICT (date) DO NOTHING;
    `;
  }

  // 4. Fetch recent 14 days logs for streaks & averages
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

  // 5. Fetch recent Hevy workouts and aggregate stats
  const hevyRows = await sql`
    SELECT * FROM hevy_workouts ORDER BY date DESC, start_time DESC LIMIT 10;
  `;

  const recentHevyWorkouts: HevyWorkout[] = hevyRows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    startTime: r.start_time?.toISOString ? r.start_time.toISOString() : r.start_time?.toString(),
    endTime: r.end_time?.toISOString ? r.end_time.toISOString() : r.end_time?.toString(),
    date: typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toISOString().split("T")[0],
    durationSeconds: Number(r.duration_seconds) || 0,
    totalVolumeKg: Number(r.total_volume_kg) || 0,
    exercisesCount: Number(r.exercises_count) || 0,
    setsCount: Number(r.sets_count) || 0,
    exercises: r.exercises || [],
    createdAt: r.created_at?.toString(),
    updatedAt: r.hevy_updated_at?.toString(),
  }));

  const statsRows = await sql`
    SELECT COUNT(*)::int as count, COALESCE(SUM(total_volume_kg), 0)::float as volume, MAX(created_at) as last_sync
    FROM hevy_workouts;
  `;

  const hevyStats: HevyStats = {
    totalWorkouts: Number(statsRows[0]?.count || 0),
    totalVolumeKg: Number(statsRows[0]?.volume || 0),
    lastSyncedAt: statsRows[0]?.last_sync?.toString(),
  };

  return {
    todayHealth,
    waterPercent,
    weeklyWorkoutsCount,
    workoutStreak,
    averageSleepHours,
    recentLogs,
    supplementsCatalog: catalog,
    bodyCompositionLogs,
    latestBodyComposition,
    previousBodyComposition,
    recentHevyWorkouts,
    hevyStats,
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
 * Server Action: Fetches the master supplements catalog.
 */
export async function fetchUserSupplementsAction(): Promise<UserSupplement[]> {
  await ensureDatabaseSchema();
  const sql = getDb();
  return getOrSeedSupplementsCatalog(sql);
}

/**
 * Server Action: Creates a new supplement in the catalog and syncs it with today's log.
 */
export async function createSupplementAction(input: {
  name: string;
  dosage?: string;
  timing?: string;
}): Promise<{ success: boolean; supplement?: UserSupplement; error?: string }> {
  try {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "El nombre del suplemento es requerido." };
    }

    await ensureDatabaseSchema();
    const sql = getDb();
    const id = `supp-${Date.now()}`;
    const name = input.name.trim();
    const dosage = input.dosage?.trim() || null;
    const timing = input.timing?.trim() || null;

    // 1. Insert into catalog
    await sql`
      INSERT INTO user_supplements (id, name, dosage, timing, order_index, is_active)
      VALUES (${id}, ${name}, ${dosage}, ${timing}, 0, true);
    `;

    // 2. Add to today's log
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRows = await sql`
      SELECT supplements FROM health_logs WHERE date = ${todayStr} LIMIT 1;
    `;

    const displayName = dosage ? `${name} (${dosage})` : name;
    const newItem: SupplementItem = {
      id,
      name: displayName,
      dosage: dosage || undefined,
      timing: timing || undefined,
      taken: false,
    };

    if (todayRows.length > 0) {
      const currentList: SupplementItem[] = Array.isArray(todayRows[0].supplements)
        ? todayRows[0].supplements
        : [];
      const updatedList = [...currentList, newItem];
      await sql`
        UPDATE health_logs
        SET supplements = ${JSON.stringify(updatedList)}::jsonb, updated_at = NOW()
        WHERE date = ${todayStr};
      `;
    } else {
      await sql`
        INSERT INTO health_logs (date, supplements, updated_at)
        VALUES (${todayStr}, ${JSON.stringify([newItem])}::jsonb, NOW())
        ON CONFLICT (date) DO UPDATE
        SET supplements = ${JSON.stringify([newItem])}::jsonb, updated_at = NOW();
      `;
    }

    revalidatePath("/");
    return {
      success: true,
      supplement: {
        id,
        name,
        dosage: dosage || undefined,
        timing: timing || undefined,
        isActive: true,
      },
    };
  } catch (error) {
    console.error("[Create Supplement Error]:", error);
    return { success: false, error: "No se pudo crear el suplemento" };
  }
}

/**
 * Server Action: Updates an existing supplement in catalog and today's log.
 */
export async function updateSupplementAction(
  id: string,
  input: {
    name: string;
    dosage?: string;
    timing?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "El nombre del suplemento es requerido." };
    }

    await ensureDatabaseSchema();
    const sql = getDb();
    const name = input.name.trim();
    const dosage = input.dosage?.trim() || null;
    const timing = input.timing?.trim() || null;

    // 1. Update in catalog
    await sql`
      UPDATE user_supplements
      SET name = ${name},
          dosage = ${dosage},
          timing = ${timing}
      WHERE id = ${id};
    `;

    // 2. Update in today's log if present
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRows = await sql`
      SELECT supplements FROM health_logs WHERE date = ${todayStr} LIMIT 1;
    `;

    if (todayRows.length > 0 && Array.isArray(todayRows[0].supplements)) {
      const displayName = dosage ? `${name} (${dosage})` : name;
      const updatedList = todayRows[0].supplements.map((s: SupplementItem) =>
        s.id === id
          ? {
              ...s,
              name: displayName,
              dosage: dosage || undefined,
              timing: timing || undefined,
            }
          : s
      );
      await sql`
        UPDATE health_logs
        SET supplements = ${JSON.stringify(updatedList)}::jsonb, updated_at = NOW()
        WHERE date = ${todayStr};
      `;
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Supplement Error]:", error);
    return { success: false, error: "No se pudo actualizar el suplemento" };
  }
}

/**
 * Server Action: Deletes a supplement from catalog and today's log.
 */
export async function deleteSupplementAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    // 1. Delete from catalog
    await sql`
      DELETE FROM user_supplements WHERE id = ${id};
    `;

    // 2. Remove from today's log
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRows = await sql`
      SELECT supplements FROM health_logs WHERE date = ${todayStr} LIMIT 1;
    `;

    if (todayRows.length > 0 && Array.isArray(todayRows[0].supplements)) {
      const updatedList = todayRows[0].supplements.filter((s: SupplementItem) => s.id !== id);
      await sql`
        UPDATE health_logs
        SET supplements = ${JSON.stringify(updatedList)}::jsonb, updated_at = NOW()
        WHERE date = ${todayStr};
      `;
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Supplement Error]:", error);
    return { success: false, error: "No se pudo eliminar el suplemento" };
  }
}

/**
 * Server Action: Toggles supplement item taken status for today.
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
        : [];

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
 * Server Action: Batch toggles supplements by timing (e.g. 'Mañana', 'Tarde') or all.
 */
export async function batchToggleSupplementsByTimingAction(
  timing: string,
  completed: boolean = true
): Promise<{ success: boolean; modifiedCount: number; error?: string }> {
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
        : [];

    let modifiedCount = 0;
    const normalizedTiming = timing.toLowerCase().trim();

    supplements = supplements.map((s) => {
      const itemTiming = (s.timing || "").toLowerCase().trim();
      const matches =
        normalizedTiming === "all" ||
        itemTiming === normalizedTiming ||
        (normalizedTiming === "mañana" && (itemTiming.includes("mañana") || itemTiming.includes("morning") || itemTiming.includes("desayuno"))) ||
        (normalizedTiming === "tarde" && (itemTiming.includes("tarde") || itemTiming.includes("afternoon") || itemTiming.includes("comida")));

      if (matches) {
        modifiedCount++;
        return { ...s, taken: completed };
      }
      return s;
    });

    await sql`
      INSERT INTO health_logs (date, supplements, updated_at)
      VALUES (${todayStr}, ${JSON.stringify(supplements)}::jsonb, NOW())
      ON CONFLICT (date) DO UPDATE
      SET supplements = ${JSON.stringify(supplements)}::jsonb,
          updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true, modifiedCount };
  } catch (error) {
    console.error("[Batch Toggle Supplements Error]:", error);
    return { success: false, modifiedCount: 0, error: "Failed to batch toggle supplements" };
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

/**
 * Server Action: Fetches all body composition logs.
 */
export async function fetchBodyCompositionLogsAction(): Promise<BodyCompositionLog[]> {
  await ensureDatabaseSchema();
  const sql = getDb();
  return getOrSeedBodyCompositionLogs(sql);
}

/**
 * Server Action: Creates or updates a body composition log (Smart Fit Body scan).
 */
export async function createBodyCompositionLogAction(input: {
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  skeletalMuscleKg?: number;
  fatFreeMassKg?: number;
  visceralFatLevel?: number;
  bmi?: number;
  bmrKcal?: number;
  waterLiters?: number;
  segmentalData?: BodyCompositionSegmental;
  notes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!input.date || !input.weightKg) {
      return { success: false, error: "La fecha y el peso son requeridos." };
    }

    await ensureDatabaseSchema();
    const sql = getDb();
    const id = `smartfit-${input.date}`;

    await sql`
      INSERT INTO body_composition_logs (
        id, date, weight_kg, body_fat_percentage, skeletal_muscle_kg,
        fat_free_mass_kg, visceral_fat_level, bmi, bmr_kcal,
        water_liters, segmental_data, notes
      )
      VALUES (
        ${id},
        ${input.date},
        ${input.weightKg},
        ${input.bodyFatPercentage ?? null},
        ${input.skeletalMuscleKg ?? null},
        ${input.fatFreeMassKg ?? null},
        ${input.visceralFatLevel ?? null},
        ${input.bmi ?? null},
        ${input.bmrKcal ?? null},
        ${input.waterLiters ?? null},
        ${JSON.stringify(input.segmentalData || {})}::jsonb,
        ${input.notes?.trim() || null}
      )
      ON CONFLICT (date) DO UPDATE
      SET weight_kg = ${input.weightKg},
          body_fat_percentage = ${input.bodyFatPercentage ?? null},
          skeletal_muscle_kg = ${input.skeletalMuscleKg ?? null},
          fat_free_mass_kg = ${input.fatFreeMassKg ?? null},
          visceral_fat_level = ${input.visceralFatLevel ?? null},
          bmi = ${input.bmi ?? null},
          bmr_kcal = ${input.bmrKcal ?? null},
          water_liters = ${input.waterLiters ?? null},
          segmental_data = ${JSON.stringify(input.segmentalData || {})}::jsonb,
          notes = ${input.notes?.trim() || null};
    `;

    revalidatePath("/");
    return { success: true, id };
  } catch (error) {
    console.error("[Create Body Composition Error]:", error);
    return { success: false, error: "No se pudo guardar el registro de composición corporal" };
  }
}

/**
 * Server Action: Deletes a body composition log.
 */
export async function deleteBodyCompositionLogAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    await sql`
      DELETE FROM body_composition_logs WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Body Composition Error]:", error);
    return { success: false, error: "No se pudo eliminar el registro" };
  }
}

/**
 * Convenience aliases for mobile and quick loggers
 */
export const logWaterAction = addWaterAction;

export async function createBodyCompositionAction(input: {
  weightKg: number;
  date?: string;
  bodyFatPercentage?: number;
  skeletalMuscleKg?: number;
  notes?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const dateStr = input.date || new Date().toISOString().split("T")[0];
  return createBodyCompositionLogAction({
    date: dateStr,
    weightKg: input.weightKg,
    bodyFatPercentage: input.bodyFatPercentage,
    skeletalMuscleKg: input.skeletalMuscleKg,
    notes: input.notes,
  });
}

/**
 * Server Action: Synchronizes workouts from Hevy API into Neon DB.
 */
export async function syncHevyWorkoutsAction(options?: {
  maxPages?: number;
  pageSize?: number;
}): Promise<{
  success: boolean;
  syncedCount: number;
  totalVolume: number;
  error?: string;
}> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const maxPages = options?.maxPages || 3; // Default fetches up to 30 workouts
    const pageSize = options?.pageSize || 10;

    let totalSynced = 0;
    let totalVolume = 0;

    for (let p = 1; p <= maxPages; p++) {
      const result = await fetchHevyWorkoutsList(p, pageSize);
      if (!result.workouts || result.workouts.length === 0) break;

      for (const workout of result.workouts) {
        await saveHevyWorkoutToDb(sql, workout);
        totalSynced++;
        totalVolume += workout.totalVolumeKg;
      }

      if (p >= result.pageCount) break;
    }

    revalidatePath("/");
    return {
      success: true,
      syncedCount: totalSynced,
      totalVolume: Math.round(totalVolume),
    };
  } catch (error: any) {
    console.error("[Hevy Sync Action Error]:", error);
    return {
      success: false,
      syncedCount: 0,
      totalVolume: 0,
      error: error.message || "Failed to sync Hevy workouts",
    };
  }
}

/**
 * Server Action: Fetches recent Hevy workouts from DB.
 */
export async function fetchRecentHevyWorkoutsAction(limit = 10): Promise<HevyWorkout[]> {
  await ensureDatabaseSchema();
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM hevy_workouts ORDER BY date DESC, start_time DESC LIMIT ${limit};
  `;

  return rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    startTime: r.start_time?.toISOString ? r.start_time.toISOString() : r.start_time?.toString(),
    endTime: r.end_time?.toISOString ? r.end_time.toISOString() : r.end_time?.toString(),
    date: typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toISOString().split("T")[0],
    durationSeconds: Number(r.duration_seconds) || 0,
    totalVolumeKg: Number(r.total_volume_kg) || 0,
    exercisesCount: Number(r.exercises_count) || 0,
    setsCount: Number(r.sets_count) || 0,
    exercises: r.exercises || [],
    createdAt: r.created_at?.toString(),
    updatedAt: r.hevy_updated_at?.toString(),
  }));
}

