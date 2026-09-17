"use server";

import { getDb } from "@/lib/db";
import { toDateStr } from "@/lib/dateUtils";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import {
  EquipmentType,
  ExerciseCatalogItem,
  MuscleGroupId,
  PRRecord,
  WorkoutExercise,
  WorkoutRoutine,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";
import {
  calculateWorkoutVolume,
  detectWorkoutPRs,
  extractCatalogFromWorkouts,
  getPreviousPerformanceForExercise,
  normalizeExerciseTitle,
} from "@/lib/workouts";
import { identifyMusclesForExercise } from "@/lib/muscleRecovery";
import { revalidatePath } from "next/cache";

interface NeonSql {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
}

/**
 * Ensures all required workout tables and indexes exist in Neon DB.
 * Automatically seeds the exercise catalog from historical workouts if empty.
 */
export async function ensureWorkoutTables(sql: NeonSql) {
  // 1. Table for custom user workout routines
  await sql`
    CREATE TABLE IF NOT EXISTS workout_routines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 2. Table for exercise catalog
  await sql`
    CREATE TABLE IF NOT EXISTS exercise_catalog (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      muscle_group TEXT NOT NULL,
      secondary_muscles JSONB DEFAULT '[]'::jsonb,
      equipment_type TEXT NOT NULL DEFAULT 'other',
      notes TEXT,
      is_custom BOOLEAN DEFAULT false,
      max_weight_kg FLOAT,
      max_estimated_1rm FLOAT,
      last_trained_at TEXT,
      total_sessions_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 3. Table for workout sessions (live tracking & completed workouts)
  await sql`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      routine_id TEXT REFERENCES workout_routines(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ,
      date TEXT NOT NULL,
      duration_seconds INT NOT NULL DEFAULT 0,
      total_volume_kg INT NOT NULL DEFAULT 0,
      exercises_count INT NOT NULL DEFAULT 0,
      sets_count INT NOT NULL DEFAULT 0,
      exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
      prs_achieved JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Indexes for high performance querying
  await sql`CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date DESC, start_time DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exercise_catalog_muscle ON exercise_catalog(muscle_group);`;

  // Seed exercise_catalog from historical workouts if empty
  const countRes = (await sql`SELECT COUNT(*)::int as count FROM exercise_catalog;`) as { count: number }[];
  if (countRes[0]?.count === 0) {
    try {
      const historyRows = (await sql`SELECT * FROM workout_sessions WHERE status = 'completed' ORDER BY date DESC LIMIT 100;`) as Record<string, unknown>[];
      if (historyRows.length > 0) {
        const parsedSessions: WorkoutSession[] = historyRows.map((r) => ({
          id: String(r.id),
          title: String(r.title),
          status: "completed",
          startTime: String(r.start_time),
          endTime: r.end_time ? String(r.end_time) : null,
          date: String(r.date),
          durationSeconds: Number(r.duration_seconds || 0),
          totalVolumeKg: Number(r.total_volume_kg || 0),
          exercisesCount: Number(r.exercises_count || 0),
          setsCount: Number(r.sets_count || 0),
          exercises: Array.isArray(r.exercises) ? (r.exercises as WorkoutExercise[]) : [],
        }));

        const seededCatalog = extractCatalogFromWorkouts(parsedSessions);
        for (const item of seededCatalog) {
          await sql`
            INSERT INTO exercise_catalog (
              id, title, muscle_group, secondary_muscles, equipment_type,
              notes, is_custom, max_weight_kg, max_estimated_1rm,
              last_trained_at, total_sessions_count, created_at, updated_at
            ) VALUES (
              ${item.id},
              ${item.title},
              ${item.muscleGroup},
              ${JSON.stringify(item.secondaryMuscles || [])}::jsonb,
              ${item.equipmentType},
              ${item.notes || null},
              ${item.isCustom},
              ${item.maxWeightKg || null},
              ${item.maxEstimated1rm || null},
              ${item.lastTrainedAt || null},
              ${item.totalSessionsCount || 0},
              NOW(),
              NOW()
            )
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      }
    } catch {
      // Silently continue if tables were just initialized
    }
  }
}

/**
 * Server Action: Fetches the current active in-progress workout session if one exists.
 */
export async function fetchActiveWorkoutSessionAction(): Promise<WorkoutSession | null> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    const rows = (await sql`
      SELECT * FROM workout_sessions 
      WHERE status = 'in_progress' 
      ORDER BY start_time DESC 
      LIMIT 1;
    `) as Record<string, unknown>[];

    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: String(r.id),
      title: String(r.title),
      description: r.description ? String(r.description) : undefined,
      routineId: r.routine_id ? String(r.routine_id) : null,
      status: "in_progress",
      startTime: new Date(r.start_time as string).toISOString(),
      endTime: r.end_time ? new Date(r.end_time as string).toISOString() : null,
      date: String(r.date),
      durationSeconds: Number(r.duration_seconds || 0),
      totalVolumeKg: Number(r.total_volume_kg || 0),
      exercisesCount: Number(r.exercises_count || 0),
      setsCount: Number(r.sets_count || 0),
      exercises: Array.isArray(r.exercises) ? (r.exercises as WorkoutExercise[]) : [],
      prsAchieved: Array.isArray(r.prs_achieved) ? (r.prs_achieved as PRRecord[]) : [],
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : undefined,
    };
  } catch (error) {
    console.error("[fetchActiveWorkoutSessionAction Error]:", error);
    return null;
  }
}

/**
 * Server Action: Starts a new workout session (from scratch or from a saved routine).
 */
export async function startWorkoutSessionAction(params: {
  routineId?: string;
  title?: string;
}): Promise<{ success: boolean; session?: WorkoutSession; error?: string }> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    // Cancel any existing dangling in-progress session
    await sql`
      UPDATE workout_sessions
      SET status = 'discarded', updated_at = NOW()
      WHERE status = 'in_progress';
    `;

    const now = new Date();
    const sessionId = `ws-${Date.now()}`;
    const dateStr = toDateStr(now);
    let sessionTitle = params.title || "Entrenamiento libre";
    let initialExercises: WorkoutExercise[] = [];

    // Fetch past workouts to retrieve previous ghost values (weights/reps)
    const history = await fetchAllHistoricalWorkouts(sql);

    if (params.routineId) {
      const routineRows = (await sql`
        SELECT * FROM workout_routines WHERE id = ${params.routineId} LIMIT 1;
      `) as Record<string, unknown>[];

      if (routineRows.length > 0) {
        const routine = routineRows[0];
        sessionTitle = String(routine.title);
        const routineExercises = (Array.isArray(routine.exercises) ? routine.exercises : []) as unknown as WorkoutRoutineExercise[];

        initialExercises = routineExercises.map((re, exIdx: number) => {
          const prevPerformance = getPreviousPerformanceForExercise(re.title, history);
          const targetSetsCount = Number(re.targetSets || 3);
          const sets: WorkoutSet[] = [];

          for (let i = 0; i < targetSetsCount; i++) {
            const prevSet = prevPerformance && prevPerformance[i];
            sets.push({
              index: i,
              type: "normal",
              weightKg: prevSet?.weightKg || re.targetWeightKg || null,
              reps: prevSet?.reps || (re.targetReps ? parseInt(re.targetReps, 10) : null) || null,
              rpe: re.targetRpe || null,
              completed: false,
              prevWeightKg: prevSet?.weightKg || null,
              prevReps: prevSet?.reps || null,
            });
          }

          return {
            index: exIdx,
            exerciseId: re.exerciseId || `ex-${exIdx}`,
            title: re.title,
            muscleGroup: re.muscleGroup || (identifyMusclesForExercise(re.title).primary[0] as MuscleGroupId),
            notes: re.notes || null,
            targetRestSeconds: re.targetRestSeconds || 90,
            sets,
          };
        });
      }
    }

    const { totalVolumeKg, totalSetsCount } = calculateWorkoutVolume(initialExercises);

    await sql`
      INSERT INTO workout_sessions (
        id, title, routine_id, status, start_time, date,
        duration_seconds, total_volume_kg, exercises_count, sets_count,
        exercises, prs_achieved, created_at, updated_at
      ) VALUES (
        ${sessionId},
        ${sessionTitle},
        ${params.routineId || null},
        'in_progress',
        ${now.toISOString()},
        ${dateStr},
        0,
        ${totalVolumeKg},
        ${initialExercises.length},
        ${totalSetsCount},
        ${JSON.stringify(initialExercises)}::jsonb,
        '[]'::jsonb,
        NOW(),
        NOW()
      );
    `;

    const newSession: WorkoutSession = {
      id: sessionId,
      title: sessionTitle,
      routineId: params.routineId || null,
      status: "in_progress",
      startTime: now.toISOString(),
      date: dateStr,
      durationSeconds: 0,
      totalVolumeKg,
      exercisesCount: initialExercises.length,
      setsCount: totalSetsCount,
      exercises: initialExercises,
      prsAchieved: [],
      createdAt: now.toISOString(),
    };

    revalidatePath("/health/training");
    return { success: true, session: newSession };
  } catch (error) {
    console.error("[startWorkoutSessionAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al iniciar entreno",
    };
  }
}

/**
 * Server Action: Updates active in-progress workout session in real-time.
 */
export async function updateActiveWorkoutSessionAction(params: {
  sessionId: string;
  title?: string;
  notes?: string;
  durationSeconds?: number;
  exercises: WorkoutExercise[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const { totalVolumeKg, totalSetsCount } = calculateWorkoutVolume(params.exercises);

    await sql`
      UPDATE workout_sessions
      SET exercises = ${JSON.stringify(params.exercises)}::jsonb,
          title = COALESCE(${params.title || null}, title),
          description = COALESCE(${params.notes || null}, description),
          duration_seconds = COALESCE(${params.durationSeconds ?? null}, duration_seconds),
          total_volume_kg = ${totalVolumeKg},
          exercises_count = ${params.exercises.length},
          sets_count = ${totalSetsCount},
          updated_at = NOW()
      WHERE id = ${params.sessionId} AND status = 'in_progress';
    `;

    return { success: true };
  } catch (error) {
    console.error("[updateActiveWorkoutSessionAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al guardar progreso",
    };
  }
}

/**
 * Server Action: Finishes and completes an active workout session.
 * Calculates PRs, updates streaks, health logs, and awards Habitica XP.
 */
export async function finishWorkoutSessionAction(params: {
  sessionId: string;
  durationSeconds: number;
  notes?: string;
  exercises: WorkoutExercise[];
}): Promise<{
  success: boolean;
  prsAchieved?: PRRecord[];
  session?: WorkoutSession;
  error?: string;
}> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    const now = new Date();
    const history = await fetchAllHistoricalWorkouts(sql);
    const { totalVolumeKg, totalSetsCount } = calculateWorkoutVolume(params.exercises);

    // Build temporary session model to evaluate PRs
    const sessionDraft: WorkoutSession = {
      id: params.sessionId,
      title: "Entrenamiento",
      status: "completed",
      startTime: now.toISOString(),
      endTime: now.toISOString(),
      date: toDateStr(now),
      durationSeconds: params.durationSeconds,
      totalVolumeKg,
      exercisesCount: params.exercises.length,
      setsCount: totalSetsCount,
      exercises: params.exercises,
    };

    const prsAchieved = detectWorkoutPRs(sessionDraft, history);

    // 1. Mark sets with isPr if achieved
    if (prsAchieved.length > 0) {
      const prTitles = new Set(prsAchieved.map((p) => normalizeExerciseTitle(p.exerciseTitle)));
      params.exercises.forEach((ex) => {
        if (prTitles.has(normalizeExerciseTitle(ex.title))) {
          ex.sets.forEach((s) => {
            if (s.completed && (s.weightKg || 0) > 0) {
              s.isPr = true;
            }
          });
        }
      });
    }

    // 2. Update session in workout_sessions table
    await sql`
      UPDATE workout_sessions
      SET status = 'completed',
          end_time = ${now.toISOString()},
          duration_seconds = ${params.durationSeconds},
          total_volume_kg = ${totalVolumeKg},
          exercises_count = ${params.exercises.length},
          sets_count = ${totalSetsCount},
          exercises = ${JSON.stringify(params.exercises)}::jsonb,
          prs_achieved = ${JSON.stringify(prsAchieved)}::jsonb,
          description = COALESCE(${params.notes || null}, description),
          updated_at = NOW()
      WHERE id = ${params.sessionId};
    `;

    // 3. Update exercise_catalog with updated max weights and PRs
    for (const ex of params.exercises) {
      const normTitle = ex.title.trim();
      let maxW = 0;
      ex.sets.forEach((s) => {
        if (s.completed && s.weightKg && s.weightKg > maxW) maxW = s.weightKg;
      });

      if (maxW > 0) {
        await sql`
          UPDATE exercise_catalog
          SET max_weight_kg = GREATEST(COALESCE(max_weight_kg, 0), ${maxW}),
              last_trained_at = ${sessionDraft.date},
              total_sessions_count = total_sessions_count + 1,
              updated_at = NOW()
          WHERE LOWER(title) = LOWER(${normTitle});
        `;
      }
    }

    // 4. Sync workout in health_logs
    const mins = Math.round(params.durationSeconds / 60);
    const workoutSummaryNote = `Entreno Brio (${mins} min, ${totalVolumeKg.toLocaleString("es-MX")} kg)`;
    await sql`
      INSERT INTO health_logs (date, workout_type, workout_notes, updated_at)
      VALUES (${sessionDraft.date}, 'gym', ${workoutSummaryNote}, NOW())
      ON CONFLICT (date) DO UPDATE
      SET workout_type = 'gym',
          workout_notes = ${workoutSummaryNote},
          updated_at = NOW();
    `;

    // 5. Increment activity log count
    await sql`
      INSERT INTO daily_activity_logs (date, habits_count, updated_at)
      VALUES (${sessionDraft.date}, 1, NOW())
      ON CONFLICT (date) DO UPDATE
      SET habits_count = daily_activity_logs.habits_count + 1,
          updated_at = NOW();
    `;

    // 6. Award Habitica XP
    await awardHabiticaEvent("WORKOUT_COMPLETED", {
      customNotes: `${mins} min • ${totalVolumeKg} kg levantados (${totalSetsCount} series)${prsAchieved.length > 0 ? ` • ${prsAchieved.length} PRs batidos` : ""}`,
    });

    revalidatePath("/health/training");
    revalidatePath("/health");
    revalidatePath("/today");
    revalidatePath("/");

    return {
      success: true,
      prsAchieved,
      session: {
        ...sessionDraft,
        prsAchieved,
      },
    };
  } catch (error) {
    console.error("[finishWorkoutSessionAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al terminar entreno",
    };
  }
}

/**
 * Server Action: Discards an active workout session.
 */
export async function discardActiveWorkoutSessionAction(params: {
  sessionId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`
      DELETE FROM workout_sessions
      WHERE id = ${params.sessionId} AND status = 'in_progress';
    `;
    revalidatePath("/health/training");
    return { success: true };
  } catch (error) {
    console.error("[discardActiveWorkoutSessionAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al descartar entreno",
    };
  }
}

/**
 * Server Action: Deletes a completed workout session.
 */
export async function deleteWorkoutSessionAction(params: {
  sessionId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`DELETE FROM workout_sessions WHERE id = ${params.sessionId};`;
    revalidatePath("/health/training");
    return { success: true };
  } catch (error) {
    console.error("[deleteWorkoutSessionAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar entreno",
    };
  }
}

/**
 * Server Action: Fetches all custom user routines.
 */
export async function fetchRoutinesAction(): Promise<WorkoutRoutine[]> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    const rows = (await sql`
      SELECT * FROM workout_routines ORDER BY created_at DESC;
    `) as Record<string, unknown>[];

    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      description: r.description ? String(r.description) : undefined,
      exercises: Array.isArray(r.exercises) ? (r.exercises as unknown as WorkoutRoutineExercise[]) : [],
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : undefined,
    }));
  } catch (error) {
    console.error("[fetchRoutinesAction Error]:", error);
    return [];
  }
}

/**
 * Server Action: Saves or updates a custom workout routine.
 */
export async function saveRoutineAction(
  routine: WorkoutRoutine
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    const routineId = routine.id || `routine-${Date.now()}`;

    await sql`
      INSERT INTO workout_routines (id, title, description, exercises, created_at, updated_at)
      VALUES (
        ${routineId},
        ${routine.title},
        ${routine.description || null},
        ${JSON.stringify(routine.exercises)}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          description = EXCLUDED.description,
          exercises = EXCLUDED.exercises,
          updated_at = NOW();
    `;

    revalidatePath("/health/training");
    return { success: true };
  } catch (error) {
    console.error("[saveRoutineAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al guardar rutina",
    };
  }
}

/**
 * Server Action: Deletes a custom workout routine.
 */
export async function deleteRoutineAction(
  routineId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`DELETE FROM workout_routines WHERE id = ${routineId};`;
    revalidatePath("/health/training");
    return { success: true };
  } catch (error) {
    console.error("[deleteRoutineAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al eliminar rutina",
    };
  }
}

/**
 * Server Action: Fetches the exercise catalog with optional muscle group filter and query.
 */
export async function fetchExerciseCatalogAction(params?: {
  muscleGroup?: string;
  query?: string;
}): Promise<ExerciseCatalogItem[]> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    const muscle = params?.muscleGroup && params.muscleGroup !== "all" ? params.muscleGroup : null;
    const search = params?.query?.trim() ? `%${params.query.trim().toLowerCase()}%` : null;

    const rows = (await sql`
      SELECT * FROM exercise_catalog
      WHERE (${muscle}::text IS NULL OR muscle_group = ${muscle})
        AND (${search}::text IS NULL OR LOWER(title) LIKE ${search})
      ORDER BY title ASC;
    `) as Record<string, unknown>[];

    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      muscleGroup: r.muscle_group as MuscleGroupId,
      secondaryMuscles: Array.isArray(r.secondary_muscles) ? (r.secondary_muscles as MuscleGroupId[]) : [],
      equipmentType: (r.equipment_type || "other") as EquipmentType,
      notes: r.notes ? String(r.notes) : null,
      isCustom: Boolean(r.is_custom),
      maxWeightKg: r.max_weight_kg ? Number(r.max_weight_kg) : undefined,
      maxEstimated1Rm: r.max_estimated_1rm ? Number(r.max_estimated_1rm) : undefined,
      lastTrainedAt: r.last_trained_at ? String(r.last_trained_at) : undefined,
      totalSessionsCount: Number(r.total_sessions_count || 0),
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : undefined,
    }));
  } catch (error) {
    console.error("[fetchExerciseCatalogAction Error]:", error);
    return [];
  }
}

/**
 * Server Action: Creates a new custom exercise in the user's catalog.
 */
export async function createCustomExerciseAction(params: {
  title: string;
  muscleGroup: MuscleGroupId;
  secondaryMuscles?: MuscleGroupId[];
  equipmentType: EquipmentType;
  notes?: string;
}): Promise<{ success: boolean; exercise?: ExerciseCatalogItem; error?: string }> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    const title = params.title.trim();
    if (!title) throw new Error("El título del ejercicio es requerido");

    const id = `ex-${Date.now()}`;
    await sql`
      INSERT INTO exercise_catalog (
        id, title, muscle_group, secondary_muscles, equipment_type,
        notes, is_custom, created_at, updated_at
      ) VALUES (
        ${id},
        ${title},
        ${params.muscleGroup},
        ${JSON.stringify(params.secondaryMuscles || [])}::jsonb,
        ${params.equipmentType},
        ${params.notes || null},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (title) DO UPDATE
      SET muscle_group = EXCLUDED.muscle_group,
          secondary_muscles = EXCLUDED.secondary_muscles,
          equipment_type = EXCLUDED.equipment_type,
          notes = EXCLUDED.notes,
          updated_at = NOW();
    `;

    const newEx: ExerciseCatalogItem = {
      id,
      title,
      muscleGroup: params.muscleGroup,
      secondaryMuscles: params.secondaryMuscles,
      equipmentType: params.equipmentType,
      notes: params.notes || null,
      isCustom: true,
    };

    revalidatePath("/health/training");
    return { success: true, exercise: newEx };
  } catch (error) {
    console.error("[createCustomExerciseAction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear ejercicio",
    };
  }
}

/**
 * Server Action: Fetches workout history.
 */
export async function fetchWorkoutHistoryAction(params?: {
  page?: number;
  limit?: number;
}): Promise<{ workouts: WorkoutSession[]; totalCount: number }> {
  try {
    const sql = getDb();
    await ensureWorkoutTables(sql);

    const limit = params?.limit || 20;
    const offset = ((params?.page || 1) - 1) * limit;

    // Fetch from workout_sessions
    const sessionRows = (await sql`
      SELECT * FROM workout_sessions 
      WHERE status = 'completed'
      ORDER BY date DESC, start_time DESC
      LIMIT ${limit} OFFSET ${offset};
    `) as Record<string, unknown>[];

    const countRes = (await sql`
      SELECT COUNT(*)::int as count FROM workout_sessions WHERE status = 'completed';
    `) as { count: number }[];

    const nativeSessions: WorkoutSession[] = sessionRows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      description: r.description ? String(r.description) : undefined,
      routineId: r.routine_id ? String(r.routine_id) : null,
      status: "completed",
      startTime: new Date(r.start_time as string).toISOString(),
      endTime: r.end_time ? new Date(r.end_time as string).toISOString() : null,
      date: String(r.date),
      durationSeconds: Number(r.duration_seconds || 0),
      totalVolumeKg: Number(r.total_volume_kg || 0),
      exercisesCount: Number(r.exercises_count || 0),
      setsCount: Number(r.sets_count || 0),
      exercises: Array.isArray(r.exercises) ? (r.exercises as WorkoutExercise[]) : [],
      prsAchieved: Array.isArray(r.prs_achieved) ? (r.prs_achieved as PRRecord[]) : [],
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at as string).toISOString() : undefined,
    }));

    return {
      workouts: nativeSessions,
      totalCount: Number(countRes[0]?.count || nativeSessions.length),
    };
  } catch (error) {
    console.error("[fetchWorkoutHistoryAction Error]:", error);
    return { workouts: [], totalCount: 0 };
  }
}

/**
 * Helper: Fetches all historical completed workouts for ghost values & PR calculation.
 */
async function fetchAllHistoricalWorkouts(
  sql: NeonSql
): Promise<WorkoutSession[]> {
  try {
    const sessionRows = (await sql`
      SELECT * FROM workout_sessions 
      WHERE status = 'completed'
      ORDER BY date DESC, start_time DESC 
      LIMIT 100;
    `) as Record<string, unknown>[];

    return sessionRows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      status: "completed",
      startTime: new Date(r.start_time as string).toISOString(),
      endTime: r.end_time ? new Date(r.end_time as string).toISOString() : null,
      date: String(r.date),
      durationSeconds: Number(r.duration_seconds || 0),
      totalVolumeKg: Number(r.total_volume_kg || 0),
      exercisesCount: Number(r.exercises_count || 0),
      setsCount: Number(r.sets_count || 0),
      exercises: Array.isArray(r.exercises) ? (r.exercises as WorkoutExercise[]) : [],
      prsAchieved: Array.isArray(r.prs_achieved) ? (r.prs_achieved as PRRecord[]) : [],
    }));
  } catch (error) {
    console.error("[fetchAllHistoricalWorkouts Error]:", error);
    return [];
  }
}
