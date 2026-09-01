"use server";

import { getDb } from "@/lib/db";
import { fetchHevyWorkoutsList, saveHevyWorkoutToDb } from "@/lib/hevy";
import {
  BiomarkerCategoryKey,
  BiomarkerLog,
  BiomarkerStatus,
  BiomarkersDashboardData,
  BiometricsHealthData,
  BodyCompositionLog,
  BodyCompositionSegmental,
  DailyHealthData,
  DEFAULT_USER_SUPPLEMENTS,
  FoodGroupKey,
  HealthDashboardData,
  HealthLog,
  HevyExercise,
  HevyStats,
  HevyWorkout,
  LabTestReport,
  NutritionSummary,
  SupplementItem,
  TrainingHealthData,
  UserSupplement,
  WorkoutType,
} from "@/lib/types";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import { revalidatePath } from "next/cache";
import { fetchNutritionDashboardDataAction } from "./nutrition";
import { getTodayDateStr, toDateStr } from "@/lib/dateUtils";

interface LabTestReportDbRow {
  id: string;
  date: Date | string;
  lab_name: string;
  order_number?: string;
  patient_id?: string;
  title: string;
  doctor_notes?: string;
  file_url?: string;
  file_key?: string;
  total_biomarkers?: number | string;
  abnormal_count?: number | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

interface BiomarkerDbRow {
  id: string;
  report_id?: string;
  date: Date | string;
  category: string;
  name: string;
  canonical_name: string;
  code?: string;
  value_numeric?: number | string | null;
  value_text?: string | null;
  unit?: string | null;
  ref_min?: number | string | null;
  ref_max?: number | string | null;
  ref_text?: string | null;
  status: string;
  notes?: string | null;
  order_index?: number | string;
  interpretation?: string;
  created_at?: Date | string;
}

interface UserSupplementDbRow {
  id: string;
  name: string;
  dosage?: string | null;
  timing?: string | null;
  order_index?: number | string;
  is_active?: boolean;
  created_at?: Date | string;
}

interface BodyCompositionDbRow {
  id: string;
  date: Date | string;
  weight_kg: number | string;
  body_fat_percentage?: number | string | null;
  skeletal_muscle_kg?: number | string | null;
  fat_free_mass_kg?: number | string | null;
  visceral_fat_level?: number | string | null;
  bmi?: number | string | null;
  bmr_kcal?: number | string | null;
  water_liters?: number | string | null;
  segmental_data?: BodyCompositionSegmental | null;
  notes?: string | null;
  created_at?: Date | string;
}

interface HealthLogDbRow {
  date: Date | string;
  workout_type?: WorkoutType;
  workout_notes?: string;
  water_ml?: number | string;
  supplements?: SupplementItem[];
  sleep_hours?: number | string;
  sleep_quality?: number | string;
  steps_count?: number | string;
}

interface HevyDbRow {
  id: string;
  title: string;
  description?: string;
  start_time?: Date | string;
  end_time?: Date | string;
  date: Date | string;
  duration_seconds?: number | string;
  total_volume_kg?: number | string;
  exercises_count?: number | string;
  sets_count?: number | string;
  exercises?: unknown;
  created_at?: Date | string;
  hevy_updated_at?: Date | string;
}

interface WorkoutDbRow {
  id: string;
  date: Date | string;
  type: string;
  notes?: string;
  exercises?: unknown;
  created_at?: Date | string;
  hevy_updated_at?: Date | string;
}

type SqlClient = { (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> };

/**
 * Helper: Fetches the master supplements and habits catalog from database.
 */
async function getSupplementsCatalog(sql: SqlClient): Promise<UserSupplement[]> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_supplements (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        dosage TEXT,
        timing TEXT,
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const rows = await sql`
      SELECT * FROM user_supplements WHERE is_active = true ORDER BY order_index ASC, created_at ASC;
    `;

    if (rows.length > 0) {
      return (rows as unknown as UserSupplementDbRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        dosage: r.dosage || undefined,
        timing: r.timing || undefined,
        orderIndex: Number(r.order_index) || 0,
        isActive: r.is_active ?? true,
        createdAt: r.created_at?.toString(),
      }));
    }

    // Seed defaults if empty
    for (const item of DEFAULT_USER_SUPPLEMENTS) {
      await sql`
        INSERT INTO user_supplements (id, name, dosage, timing, order_index, is_active)
        VALUES (${item.id}, ${item.name}, ${item.dosage || null}, ${item.timing || null}, ${item.orderIndex || 0}, true)
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    return DEFAULT_USER_SUPPLEMENTS;
  } catch (error) {
    console.error("[Get Supplements Catalog Error]:", error);
    return DEFAULT_USER_SUPPLEMENTS;
  }
}

/**
 * Server Action: Fetches active supplements and habits catalog.
 */
export async function fetchSupplementsCatalogAction(): Promise<UserSupplement[]> {
  const sql = getDb();
  return getSupplementsCatalog(sql);
}

/**
 * Helper: Fetches the body composition logs (Smart Fit Body) from database.
 */
async function getBodyCompositionLogs(sql: SqlClient): Promise<BodyCompositionLog[]> {
  const rows = await sql`
    SELECT * FROM body_composition_logs ORDER BY date DESC;
  `;

  if (rows.length > 0) {
    return (rows as unknown as BodyCompositionDbRow[]).map((r) => ({
      id: r.id,
      date: toDateStr(r.date),
      weightKg: Number(r.weight_kg),
      bodyFatPercentage: r.body_fat_percentage !== null && r.body_fat_percentage !== undefined ? Number(r.body_fat_percentage) : undefined,
      skeletalMuscleKg: r.skeletal_muscle_kg !== null && r.skeletal_muscle_kg !== undefined ? Number(r.skeletal_muscle_kg) : undefined,
      fatFreeMassKg: r.fat_free_mass_kg !== null && r.fat_free_mass_kg !== undefined ? Number(r.fat_free_mass_kg) : undefined,
      visceralFatLevel: r.visceral_fat_level !== null && r.visceral_fat_level !== undefined ? Number(r.visceral_fat_level) : undefined,
      bmi: r.bmi !== null && r.bmi !== undefined ? Number(r.bmi) : undefined,
      bmrKcal: r.bmr_kcal !== null && r.bmr_kcal !== undefined ? Number(r.bmr_kcal) : undefined,
      waterLiters: r.water_liters !== null && r.water_liters !== undefined ? Number(r.water_liters) : undefined,
      segmentalData: r.segmental_data || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at?.toString(),
    }));
  }

  return [];
}

/**
 * Helper: Fetches clinical lab reports and biomarker metrics from database.
 */
async function getBiomarkersDashboardData(sql: SqlClient): Promise<BiomarkersDashboardData> {
  const emptyCategorySummaries: Record<BiomarkerCategoryKey, { total: number; abnormal: number; optimal: number }> = {
    renal: { total: 0, abnormal: 0, optimal: 0 },
    cardio: { total: 0, abnormal: 0, optimal: 0 },
    hepatic: { total: 0, abnormal: 0, optimal: 0 },
    iron: { total: 0, abnormal: 0, optimal: 0 },
    immuno: { total: 0, abnormal: 0, optimal: 0 },
    hematology: { total: 0, abnormal: 0, optimal: 0 },
    urinalysis: { total: 0, abnormal: 0, optimal: 0 },
  };

  const emptyDashboardData: BiomarkersDashboardData = {
    latestReport: undefined,
    reportsHistory: [],
    totalBiomarkersTracked: 0,
    abnormalCount: 0,
    categorySummaries: emptyCategorySummaries,
    historicalTrends: {},
  };

  try {
    const reportRows = await sql`
      SELECT * FROM lab_test_reports ORDER BY date DESC, created_at DESC;
    `;

    if (reportRows.length > 0) {
      const biomarkerRows = await sql`
        SELECT * FROM biomarker_logs ORDER BY order_index ASC, created_at ASC;
      `;

      const allBiomarkers: BiomarkerLog[] = (biomarkerRows as unknown as BiomarkerDbRow[]).map((b) => ({
        id: b.id,
        reportId: b.report_id || undefined,
        date: toDateStr(b.date),
        category: b.category as BiomarkerCategoryKey,
        name: b.name,
        code: b.code || undefined,
        valueNumeric: b.value_numeric !== null && b.value_numeric !== undefined ? Number(b.value_numeric) : undefined,
        valueText: b.value_text || undefined,
        unit: b.unit || undefined,
        refMin: b.ref_min !== null && b.ref_min !== undefined ? Number(b.ref_min) : undefined,
        refMax: b.ref_max !== null && b.ref_max !== undefined ? Number(b.ref_max) : undefined,
        refText: b.ref_text || undefined,
        status: (b.status as BiomarkerStatus) || "normal",
        notes: b.notes || undefined,
        orderIndex: Number(b.order_index) || 0,
      }));

      const reportsHistory: LabTestReport[] = (reportRows as unknown as LabTestReportDbRow[]).map((r) => {
        const reportBiomarkers = allBiomarkers.filter((b) => b.reportId === r.id);
        const abnormalCount = reportBiomarkers.filter(
          (b) => b.status === "high" || b.status === "low" || b.status === "critical"
        ).length;

        return {
          id: r.id,
          date: toDateStr(r.date),
          labName: r.lab_name,
          orderNumber: r.order_number || undefined,
          patientId: r.patient_id || undefined,
          title: r.title,
          doctorNotes: r.doctor_notes || undefined,
          fileUrl: r.file_url || undefined,
          fileKey: r.file_key || undefined,
          totalBiomarkers: reportBiomarkers.length || Number(r.total_biomarkers) || 0,
          abnormalCount,
          biomarkers: reportBiomarkers,
          createdAt: r.created_at?.toString(),
          updatedAt: r.updated_at?.toString(),
        };
      });

      const latestReport = reportsHistory.length > 0 ? reportsHistory[0] : undefined;
      const latestBiomarkers = latestReport && latestReport.biomarkers.length > 0 ? latestReport.biomarkers : allBiomarkers;

      const categorySummaries: Record<BiomarkerCategoryKey, { total: number; abnormal: number; optimal: number }> = {
        renal: { total: 0, abnormal: 0, optimal: 0 },
        cardio: { total: 0, abnormal: 0, optimal: 0 },
        hepatic: { total: 0, abnormal: 0, optimal: 0 },
        iron: { total: 0, abnormal: 0, optimal: 0 },
        immuno: { total: 0, abnormal: 0, optimal: 0 },
        hematology: { total: 0, abnormal: 0, optimal: 0 },
        urinalysis: { total: 0, abnormal: 0, optimal: 0 },
      };

      for (const b of latestBiomarkers) {
        if (categorySummaries[b.category]) {
          categorySummaries[b.category].total++;
          if (b.status === "high" || b.status === "low" || b.status === "critical") {
            categorySummaries[b.category].abnormal++;
          } else if (b.status === "optimal") {
            categorySummaries[b.category].optimal++;
          }
        }
      }

      const historicalTrends: Record<string, Array<{ date: string; value: number; unit?: string }>> = {};
      for (const b of allBiomarkers) {
        if (b.valueNumeric !== undefined) {
          if (!historicalTrends[b.name]) {
            historicalTrends[b.name] = [];
          }
          historicalTrends[b.name].push({
            date: b.date,
            value: b.valueNumeric,
            unit: b.unit,
          });
        }
      }

      return {
        latestReport,
        reportsHistory,
        totalBiomarkersTracked: latestBiomarkers.length,
        abnormalCount: latestBiomarkers.filter(
          (b) => b.status === "high" || b.status === "low" || b.status === "critical"
        ).length,
        categorySummaries,
        historicalTrends,
      };
    }

    return emptyDashboardData;
  } catch (error) {
    console.error("[getBiomarkersDashboardData Error]:", error);
    return emptyDashboardData;
  }
}

/**
 * Server Action: Fetches daily health data (today's health log, supplements, water, sleep, streaks, and quick glances).
 * Fast, lightweight query optimized for the Daily tab and Today dashboard.
 */
export async function fetchDailyHealthDataAction(): Promise<DailyHealthData> {
  const sql = getDb();
  const todayStr = getTodayDateStr();

  const [
    catalog,
    todayRows,
    recentRows,
    latestHevyRow,
    nutritionData,
  ] = await Promise.all([
    getSupplementsCatalog(sql),
    sql`SELECT * FROM health_logs WHERE date = ${todayStr} LIMIT 1;`,
    sql`SELECT * FROM health_logs ORDER BY date DESC LIMIT 14;`,
    sql`SELECT title, start_time, date FROM hevy_workouts ORDER BY date DESC, start_time DESC LIMIT 1;`,
    fetchNutritionDashboardDataAction(todayStr).catch(() => null),
  ]);

  // Process today's health record
  let todayHealth: HealthLog;
  if (todayRows.length > 0) {
    const row = todayRows[0] as unknown as HealthLogDbRow;
    const existingSupplements: SupplementItem[] = Array.isArray(row.supplements) ? row.supplements : [];

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
  }

  // Process recent 14 days logs
  const recentLogs: HealthLog[] = (recentRows as unknown as HealthLogDbRow[]).map((r) => ({
    date: toDateStr(r.date),
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

  let nutritionSummary: NutritionSummary | undefined = undefined;
  if (nutritionData && nutritionData.todayLog) {
    const portions = nutritionData.todayLog.portions || {};
    const portionGoals = nutritionData.settings?.dailyPortionGoals || {};

    const totalPortionsConsumed = Object.values(portions).reduce(
      (sum: number, v: unknown) => sum + (Number(v) || 0),
      0
    );
    const totalPortionsTarget = Object.values(portionGoals).reduce(
      (sum: number, v: unknown) => sum + (Number(v) || 0),
      0
    );

    const groupsMetCount = Object.entries(portionGoals).filter(([key, target]) => {
      const consumed = portions[key as FoodGroupKey] || 0;
      return consumed >= Number(target) && Number(target) > 0;
    }).length;

    nutritionSummary = {
      kcal: nutritionData.todayLog.calculatedMacros.kcal,
      proteinGrams: nutritionData.todayLog.calculatedMacros.proteinGrams,
      carbsGrams: nutritionData.todayLog.calculatedMacros.carbsGrams,
      fatGrams: nutritionData.todayLog.calculatedMacros.fatGrams,
      nextMealTitle:
        nutritionData.scheduledMealsToday.length > 0
          ? (nutritionData.scheduledMealsToday[0].recipe?.title ||
            nutritionData.scheduledMealsToday[0].customTitle ||
            "Programada")
          : undefined,
      portions,
      portionGoals,
      totalPortionsConsumed: Number(totalPortionsConsumed.toFixed(1)),
      totalPortionsTarget: Number(totalPortionsTarget.toFixed(1)),
      groupsMetCount,
    };
  }

  let lastWorkoutSummary = undefined;
  if (latestHevyRow.length > 0) {
    const r = latestHevyRow[0] as unknown as { title: string; date: Date | string };
    lastWorkoutSummary = {
      title: r.title || "Entrenamiento",
      date: toDateStr(r.date),
    };
  }

  return {
    todayHealth,
    waterPercent,
    weeklyWorkoutsCount,
    workoutStreak,
    averageSleepHours,
    recentLogs,
    supplementsCatalog: catalog,
    nutritionSummary,
    lastWorkoutSummary,
  };
}

/**
 * Server Action: Fetches dedicated training & workouts data (Hevy history, stats, streaks).
 */
export async function fetchTrainingHealthDataAction(): Promise<TrainingHealthData> {
  const sql = getDb();

  const [
    recentRows,
    hevyRows,
    statsRows,
  ] = await Promise.all([
    sql`SELECT * FROM health_logs ORDER BY date DESC LIMIT 14;`,
    sql`SELECT * FROM hevy_workouts ORDER BY date DESC, start_time DESC LIMIT 20;`,
    sql`SELECT COUNT(*)::int as count, COALESCE(SUM(total_volume_kg), 0)::float as volume, MAX(created_at) as last_sync FROM hevy_workouts;`,
  ]);

  const recentLogs: HealthLog[] = (recentRows as unknown as HealthLogDbRow[]).map((r) => ({
    date: toDateStr(r.date),
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

  const recentHevyWorkouts: HevyWorkout[] = (hevyRows as unknown as HevyDbRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    startTime: r.start_time instanceof Date ? r.start_time.toISOString() : (r.start_time?.toString() || new Date().toISOString()),
    endTime: r.end_time instanceof Date ? r.end_time.toISOString() : (r.end_time?.toString() || new Date().toISOString()),
    date: toDateStr(r.date),
    durationSeconds: Number(r.duration_seconds) || 0,
    totalVolumeKg: Number(r.total_volume_kg) || 0,
    exercisesCount: Number(r.exercises_count) || 0,
    setsCount: Number(r.sets_count) || 0,
    exercises: Array.isArray(r.exercises) ? (r.exercises as HevyExercise[]) : [],
    createdAt: r.created_at?.toString(),
    updatedAt: r.hevy_updated_at?.toString(),
  }));

  const hevyStats: HevyStats = {
    totalWorkouts: Number(statsRows[0]?.count || 0),
    totalVolumeKg: Number(statsRows[0]?.volume || 0),
    lastSyncedAt: statsRows[0]?.last_sync?.toString(),
  };

  return {
    recentHevyWorkouts,
    hevyStats,
    workoutStreak,
    weeklyWorkoutsCount,
  };
}

/**
 * Server Action: Fetches dedicated biometrics data (clinical lab biomarkers & InBody scans).
 */
export async function fetchBiometricsHealthDataAction(): Promise<BiometricsHealthData> {
  const sql = getDb();

  const [
    bodyCompositionLogs,
    biomarkersData,
  ] = await Promise.all([
    getBodyCompositionLogs(sql),
    getBiomarkersDashboardData(sql),
  ]);

  const latestBodyComposition = bodyCompositionLogs.length > 0 ? bodyCompositionLogs[0] : undefined;
  const previousBodyComposition = bodyCompositionLogs.length > 1 ? bodyCompositionLogs[1] : undefined;

  return {
    biomarkersData,
    bodyCompositionLogs,
    latestBodyComposition,
    previousBodyComposition,
  };
}

/**
 * Server Action: Fetches physical health metrics, hydration, workouts, sleep, and body composition.
 * Uses Promise.all to fetch supplements, body composition, health logs, hevy workouts, nutrition, and biomarkers concurrently.
 */
export async function fetchHealthDashboardDataAction(): Promise<HealthDashboardData> {
  const sql = getDb();
  const todayStr = getTodayDateStr();

  // Parallel execution of all health domain queries
  const [
    catalog,
    bodyCompositionLogs,
    todayRows,
    recentRows,
    hevyRows,
    statsRows,
    nutritionData,
    biomarkersData,
  ] = await Promise.all([
    getSupplementsCatalog(sql),
    getBodyCompositionLogs(sql),
    sql`SELECT * FROM health_logs WHERE date = ${todayStr} LIMIT 1;`,
    sql`SELECT * FROM health_logs ORDER BY date DESC LIMIT 14;`,
    sql`SELECT * FROM hevy_workouts ORDER BY date DESC, start_time DESC LIMIT 10;`,
    sql`SELECT COUNT(*)::int as count, COALESCE(SUM(total_volume_kg), 0)::float as volume, MAX(created_at) as last_sync FROM hevy_workouts;`,
    fetchNutritionDashboardDataAction(todayStr),
    getBiomarkersDashboardData(sql),
  ]);

  const latestBodyComposition = bodyCompositionLogs.length > 0 ? bodyCompositionLogs[0] : undefined;
  const previousBodyComposition = bodyCompositionLogs.length > 1 ? bodyCompositionLogs[1] : undefined;

  // Process today's health record
  let todayHealth: HealthLog;
  if (todayRows.length > 0) {
    const row = todayRows[0] as unknown as HealthLogDbRow;
    const existingSupplements: SupplementItem[] = Array.isArray(row.supplements) ? row.supplements : [];

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
  }

  // Process recent 14 days logs
  const recentLogs: HealthLog[] = (recentRows as unknown as HealthLogDbRow[]).map((r) => ({
    date: toDateStr(r.date),
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

  // Process Hevy workouts
  const recentHevyWorkouts: HevyWorkout[] = (hevyRows as unknown as HevyDbRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    startTime: r.start_time instanceof Date ? r.start_time.toISOString() : (r.start_time?.toString() || new Date().toISOString()),
    endTime: r.end_time instanceof Date ? r.end_time.toISOString() : (r.end_time?.toString() || new Date().toISOString()),
    date: toDateStr(r.date),
    durationSeconds: Number(r.duration_seconds) || 0,
    totalVolumeKg: Number(r.total_volume_kg) || 0,
    exercisesCount: Number(r.exercises_count) || 0,
    setsCount: Number(r.sets_count) || 0,
    exercises: Array.isArray(r.exercises) ? (r.exercises as HevyExercise[]) : [],
    createdAt: r.created_at?.toString(),
    updatedAt: r.hevy_updated_at?.toString(),
  }));

  const hevyStats: HevyStats = {
    totalWorkouts: Number(statsRows[0]?.count || 0),
    totalVolumeKg: Number(statsRows[0]?.volume || 0),
    lastSyncedAt: statsRows[0]?.last_sync?.toString(),
  };

  if (nutritionData) {
    nutritionData.supplements = todayHealth.supplements;
    nutritionData.supplementsCatalog = catalog;
  }

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
    nutritionData,
    biomarkersData,
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
    const sql = getDb();
    const todayStr = getTodayDateStr();

    await sql`
      INSERT INTO health_logs (date, workout_type, workout_notes, updated_at)
      VALUES (${todayStr}, ${workoutType}, ${workoutNotes || null}, NOW())
      ON CONFLICT (date) DO UPDATE
      SET workout_type = ${workoutType},
          workout_notes = ${workoutNotes || null},
          updated_at = NOW();
    `;

    await sql`
      INSERT INTO daily_activity_logs (date, habits_count, updated_at)
      VALUES (${todayStr}, 1, NOW())
      ON CONFLICT (date) DO UPDATE
      SET habits_count = daily_activity_logs.habits_count + 1,
          updated_at = NOW();
    `;

    // Award Habitica XP for workout
    await awardHabiticaEvent("WORKOUT_COMPLETED", {
      customTitle: `[Brio] Entrenamiento: ${workoutType}`,
      customNotes: `Entrenamiento: ${workoutType}${workoutNotes ? ` • ${workoutNotes}` : ""}`,
    });

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
    const sql = getDb();
    const todayStr = getTodayDateStr();

    await sql`
      INSERT INTO health_logs (date, water_ml, updated_at)
      VALUES (${todayStr}, ${amountMl}, NOW())
      ON CONFLICT (date) DO UPDATE
      SET water_ml = health_logs.water_ml + ${amountMl},
          updated_at = NOW();
    `;

    // Award Habitica XP for hydration
    await awardHabiticaEvent("HYDRATION_LOGGED", {
      customTitle: `[Brio] Hidratación (+${amountMl}ml)`,
      customNotes: `Ingesta de agua: +${amountMl}ml registrados en Brio.`,
    });

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
  const sql = getDb();
  return getSupplementsCatalog(sql);
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

    const sql = getDb();
    const id = `supp-${Date.now()}`;
    const name = input.name.trim();
    const dosage = input.dosage?.trim() || null;
    const timing = input.timing?.trim() || null;

    await sql`
      INSERT INTO user_supplements (id, name, dosage, timing, order_index, is_active)
      VALUES (${id}, ${name}, ${dosage}, ${timing}, 0, true);
    `;

    const todayStr = getTodayDateStr();
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

    const sql = getDb();
    const name = input.name.trim();
    const dosage = input.dosage?.trim() || null;
    const timing = input.timing?.trim() || null;

    await sql`
      UPDATE user_supplements
      SET name = ${name},
          dosage = ${dosage},
          timing = ${timing}
      WHERE id = ${id};
    `;

    const todayStr = getTodayDateStr();
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
    const sql = getDb();

    await sql`
      DELETE FROM user_supplements WHERE id = ${id};
    `;

    const todayStr = getTodayDateStr();
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
    const sql = getDb();
    const todayStr = getTodayDateStr();

    const [catalog, current] = await Promise.all([
      getSupplementsCatalog(sql),
      sql`SELECT supplements FROM health_logs WHERE date = ${todayStr} LIMIT 1;`,
    ]);

    const existingSupplements: SupplementItem[] =
      current.length > 0 && Array.isArray(current[0].supplements)
        ? current[0].supplements
        : [];

    const updatedSupplements: SupplementItem[] = catalog.map((catItem) => {
      const match = existingSupplements.find((s) => s.id === catItem.id);
      const wasTaken = match ? Boolean(match.taken) : false;
      const isTarget = catItem.id === supplementId;
      return {
        id: catItem.id,
        name: catItem.dosage ? `${catItem.name} (${catItem.dosage})` : catItem.name,
        dosage: catItem.dosage,
        timing: catItem.timing,
        taken: isTarget ? !wasTaken : wasTaken,
      };
    });

    await sql`
      INSERT INTO health_logs (date, supplements, updated_at)
      VALUES (${todayStr}, ${JSON.stringify(updatedSupplements)}::jsonb, NOW())
      ON CONFLICT (date) DO UPDATE
      SET supplements = ${JSON.stringify(updatedSupplements)}::jsonb,
          updated_at = NOW();
    `;

    // Award Habitica XP safely without blocking
    try {
      const toggledItem = updatedSupplements.find((s) => s.id === supplementId);
      if (toggledItem && toggledItem.taken) {
        await awardHabiticaEvent("SUPPLEMENTS_COMPLETED", {
          customTitle: `[Brio] Suplemento: ${toggledItem.name}`,
          customNotes: `Suplemento diario tomado: ${toggledItem.name}${toggledItem.dosage ? ` (${toggledItem.dosage})` : ""}.`,
        });
      }
    } catch (gamifyErr) {
      console.warn("[Habitica Gamify Non-blocking Warning]:", gamifyErr);
    }

    try {
      revalidatePath("/");
    } catch {
      // Ignored in non-request test contexts
    }
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
    const sql = getDb();
    const todayStr = getTodayDateStr();

    const [catalog, current] = await Promise.all([
      getSupplementsCatalog(sql),
      sql`SELECT supplements FROM health_logs WHERE date = ${todayStr} LIMIT 1;`,
    ]);

    const existingSupplements: SupplementItem[] =
      current.length > 0 && Array.isArray(current[0].supplements)
        ? current[0].supplements
        : [];

    let modifiedCount = 0;
    const normalizedTiming = timing.toLowerCase().trim();

    const updatedSupplements: SupplementItem[] = catalog.map((catItem) => {
      const match = existingSupplements.find((s) => s.id === catItem.id);
      const wasTaken = match ? Boolean(match.taken) : false;
      const itemTiming = (catItem.timing || "").toLowerCase().trim();
      const matches =
        normalizedTiming === "all" ||
        itemTiming === normalizedTiming ||
        (normalizedTiming === "mañana" &&
          (itemTiming.includes("mañana") ||
            itemTiming.includes("morning") ||
            itemTiming.includes("desayuno"))) ||
        (normalizedTiming === "tarde" &&
          (itemTiming.includes("tarde") ||
            itemTiming.includes("afternoon") ||
            itemTiming.includes("comida")));

      if (matches) {
        modifiedCount++;
        return {
          id: catItem.id,
          name: catItem.dosage ? `${catItem.name} (${catItem.dosage})` : catItem.name,
          dosage: catItem.dosage,
          timing: catItem.timing,
          taken: completed,
        };
      }
      return {
        id: catItem.id,
        name: catItem.dosage ? `${catItem.name} (${catItem.dosage})` : catItem.name,
        dosage: catItem.dosage,
        timing: catItem.timing,
        taken: wasTaken,
      };
    });

    await sql`
      INSERT INTO health_logs (date, supplements, updated_at)
      VALUES (${todayStr}, ${JSON.stringify(updatedSupplements)}::jsonb, NOW())
      ON CONFLICT (date) DO UPDATE
      SET supplements = ${JSON.stringify(updatedSupplements)}::jsonb,
          updated_at = NOW();
    `;

    if (completed && modifiedCount > 0) {
      try {
        await awardHabiticaEvent("SUPPLEMENTS_COMPLETED", {
          customTitle: `[Brio] Suplementación: ${timing}`,
          customNotes: `Tanda de suplementación completada (${timing}): ${modifiedCount} suplementos tomados.`,
        });
      } catch (gamifyErr) {
        console.warn("[Habitica Gamify Non-blocking Warning]:", gamifyErr);
      }
    }

    try {
      revalidatePath("/");
    } catch {
      // Ignored in non-request test contexts
    }
    return { success: true, modifiedCount };
  } catch (error) {
    console.error("[Batch Toggle Supplements Error]:", error);
    return {
      success: false,
      modifiedCount: 0,
      error: "Failed to batch toggle supplements",
    };
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
    const sql = getDb();
    const todayStr = getTodayDateStr();

    await sql`
      INSERT INTO health_logs (date, sleep_hours, sleep_quality, updated_at)
      VALUES (${todayStr}, ${sleepHours}, ${sleepQuality}, NOW())
      ON CONFLICT (date) DO UPDATE
      SET sleep_hours = ${sleepHours},
          sleep_quality = ${sleepQuality},
          updated_at = NOW();
    `;

    // Award Habitica XP for sleep log
    await awardHabiticaEvent("SLEEP_LOGGED", {
      customTitle: `[Brio] Descanso & Sueño (${sleepHours}h)`,
      customNotes: `Registro de sueño y recuperación: ${sleepHours}h (Calidad ${sleepQuality}/5).`,
    });

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
    const sql = getDb();
    const data = JSON.parse(jsonDataString);

    let count = 0;
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.date) {
          const dateStr = toDateStr(item.date);
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
  const sql = getDb();
  return getBodyCompositionLogs(sql);
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

    // Award Habitica XP for body composition tracking
    await awardHabiticaEvent("BODY_COMPOSITION_LOGGED", {
      customTitle: "[Brio] InBody / Composición Corporal",
      customNotes: `Peso: ${input.weightKg} kg${input.bodyFatPercentage ? ` • Grasa: ${input.bodyFatPercentage}%` : ""}${input.skeletalMuscleKg ? ` • Músculo: ${input.skeletalMuscleKg} kg` : ""}`,
    });

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
  const dateStr = toDateStr(input.date);
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
    const sql = getDb();
    const maxPages = options?.maxPages || 3;
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

    if (totalSynced > 0) {
      await awardHabiticaEvent("WORKOUT_COMPLETED", {
        customTitle: `[Brio] Hevy: ${totalSynced} Entrenamientos Sincronizados`,
        customNotes: `Sincronización de Hevy: ${totalSynced} sesiones y ${Math.round(totalVolume)} kg de volumen total levantados.`,
      });
    }

    revalidatePath("/");
    return {
      success: true,
      syncedCount: totalSynced,
      totalVolume: Math.round(totalVolume),
    };
  } catch (error) {
    console.error("[Hevy Sync Action Error]:", error);
    return {
      success: false,
      syncedCount: 0,
      totalVolume: 0,
      error: error instanceof Error ? error.message : "Failed to sync Hevy workouts",
    };
  }
}

/**
 * Server Action: Fetches recent Hevy workouts from DB.
 */
export async function fetchRecentHevyWorkoutsAction(limit = 10): Promise<HevyWorkout[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM hevy_workouts ORDER BY date DESC, start_time DESC LIMIT ${limit};
  `;

  return (rows as unknown as HevyDbRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    startTime: r.start_time instanceof Date ? r.start_time.toISOString() : (r.start_time?.toString() || new Date().toISOString()),
    endTime: r.end_time instanceof Date ? r.end_time.toISOString() : (r.end_time?.toString() || new Date().toISOString()),
    date: toDateStr(r.date),
    durationSeconds: Number(r.duration_seconds) || 0,
    totalVolumeKg: Number(r.total_volume_kg) || 0,
    exercisesCount: Number(r.exercises_count) || 0,
    setsCount: Number(r.sets_count) || 0,
    exercises: Array.isArray(r.exercises) ? (r.exercises as HevyExercise[]) : [],
    createdAt: r.created_at?.toString(),
    updatedAt: r.hevy_updated_at?.toString(),
  }));
}

/**
 * Server Action: Fetches clinical lab reports and biomarker dashboard data.
 */
export async function fetchBiomarkersDashboardDataAction(): Promise<BiomarkersDashboardData> {
  const sql = getDb();
  return getBiomarkersDashboardData(sql);
}

/**
 * Server Action: Creates or saves a new clinical lab report with its biomarkers.
 */
export async function createLabReportAction(input: {
  date: string;
  labName: string;
  orderNumber?: string;
  patientId?: string;
  title: string;
  doctorNotes?: string;
  fileUrl?: string;
  fileKey?: string;
  biomarkers: Array<{
    category: BiomarkerCategoryKey;
    name: string;
    code?: string;
    valueNumeric?: number;
    valueText?: string;
    unit?: string;
    refMin?: number;
    refMax?: number;
    refText?: string;
    status: BiomarkerStatus;
    notes?: string;
    orderIndex?: number;
  }>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!input.date || !input.title) {
      return { success: false, error: "La fecha y el título del estudio son obligatorios." };
    }

    const sql = getDb();
    const reportId = `report-${Date.now()}`;
    const abnormalCount = input.biomarkers.filter(
      (b) => b.status === "high" || b.status === "low" || b.status === "critical"
    ).length;

    // 1. Ensure tables exist (resilient DDL)
    await sql`
      CREATE TABLE IF NOT EXISTS lab_test_reports (
        id VARCHAR(64) PRIMARY KEY,
        date DATE NOT NULL,
        lab_name VARCHAR(100) NOT NULL DEFAULT 'Laboratorio Chopo',
        order_number VARCHAR(50),
        patient_id VARCHAR(50),
        title VARCHAR(150) NOT NULL,
        doctor_notes TEXT,
        file_url TEXT,
        file_key TEXT,
        total_biomarkers INT DEFAULT 0,
        abnormal_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS biomarker_logs (
        id VARCHAR(64) PRIMARY KEY,
        report_id VARCHAR(64) REFERENCES lab_test_reports(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        category VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50),
        value_numeric NUMERIC,
        value_text VARCHAR(100),
        unit VARCHAR(30),
        ref_min NUMERIC,
        ref_max NUMERIC,
        ref_text VARCHAR(150),
        status VARCHAR(20) NOT NULL DEFAULT 'normal',
        notes TEXT,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 2. Insert report header
    await sql`
      INSERT INTO lab_test_reports (
        id, date, lab_name, order_number, patient_id, title,
        doctor_notes, file_url, file_key, total_biomarkers, abnormal_count
      )
      VALUES (
        ${reportId},
        ${input.date},
        ${input.labName || "Laboratorio Chopo"},
        ${input.orderNumber || null},
        ${input.patientId || null},
        ${input.title},
        ${input.doctorNotes || null},
        ${input.fileUrl || null},
        ${input.fileKey || null},
        ${input.biomarkers.length},
        ${abnormalCount}
      );
    `;

    // 3. Insert individual biomarkers
    for (let i = 0; i < input.biomarkers.length; i++) {
      const b = input.biomarkers[i];
      const bioId = `bio-${reportId}-${i + 1}`;
      await sql`
        INSERT INTO biomarker_logs (
          id, report_id, date, category, name, code,
          value_numeric, value_text, unit, ref_min, ref_max, ref_text,
          status, notes, order_index
        )
        VALUES (
          ${bioId},
          ${reportId},
          ${input.date},
          ${b.category},
          ${b.name},
          ${b.code || null},
          ${b.valueNumeric !== undefined ? b.valueNumeric : null},
          ${b.valueText || null},
          ${b.unit || null},
          ${b.refMin !== undefined ? b.refMin : null},
          ${b.refMax !== undefined ? b.refMax : null},
          ${b.refText || null},
          ${b.status || "normal"},
          ${b.notes || null},
          ${b.orderIndex ?? i + 1}
        );
      `;
    }

    // Award Habitica XP for lab checkup
    await awardHabiticaEvent("LAB_REPORT_LOGGED", {
      customTitle: `Estudio Clínico: ${input.title} (${input.labName})`,
      customNotes: `${input.biomarkers.length} biomarcadores analizados (${abnormalCount} fuera de rango)`,
    });

    revalidatePath("/");
    return { success: true, id: reportId };
  } catch (error) {
    console.error("[Create Lab Report Error]:", error);
    return { success: false, error: "No se pudo guardar el reporte de laboratorio." };
  }
}

/**
 * Server Action: Deletes a clinical lab report and its associated biomarkers.
 */
export async function deleteLabReportAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`
      DELETE FROM lab_test_reports WHERE id = ${id};
    `;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Lab Report Error]:", error);
    return { success: false, error: "No se pudo eliminar el reporte de laboratorio." };
  }
}

