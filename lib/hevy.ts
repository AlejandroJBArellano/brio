import { HevyExercise, HevySet, HevyWorkout } from "./types";

const HEVY_BASE_URL = "https://api.hevyapp.com";

/**
 * Returns configured Hevy API Key.
 */
export function getHevyApiKey(): string {
  const key = process.env.HEVY_API_KEY;
  if (!key) {
    return "17e9405b-65f2-4501-9ef2-a89a745fee5b";
  }
  return key;
}

/**
 * Parses raw Hevy workout JSON from API into a clean, strongly-typed HevyWorkout model.
 */
export function parseRawHevyWorkout(raw: any): HevyWorkout {
  const startTime = raw.start_time || new Date().toISOString();
  const endTime = raw.end_time || raw.start_time || new Date().toISOString();
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));

  const date = startTime.split("T")[0];

  const exercises: HevyExercise[] = Array.isArray(raw.exercises)
    ? raw.exercises.map((ex: any, exIdx: number) => {
        const sets: HevySet[] = Array.isArray(ex.sets)
          ? ex.sets.map((s: any, sIdx: number) => ({
              index: s.index ?? sIdx,
              type: s.type || "normal",
              weightKg: s.weight_kg !== null && s.weight_kg !== undefined ? Number(s.weight_kg) : null,
              reps: s.reps !== null && s.reps !== undefined ? Number(s.reps) : null,
              distanceMeters: s.distance_meters !== null && s.distance_meters !== undefined ? Number(s.distance_meters) : null,
              durationSeconds: s.duration_seconds !== null && s.duration_seconds !== undefined ? Number(s.duration_seconds) : null,
              rpe: s.rpe !== null && s.rpe !== undefined ? Number(s.rpe) : null,
            }))
          : [];

        return {
          index: ex.index ?? exIdx,
          title: ex.title || "Ejercicio",
          notes: ex.notes || null,
          exerciseTemplateId: ex.exercise_template_id || null,
          supersetId: ex.superset_id || null,
          sets,
        };
      })
    : [];

  let totalVolumeKg = 0;
  let setsCount = 0;

  for (const ex of exercises) {
    setsCount += ex.sets.length;
    for (const set of ex.sets) {
      if (set.weightKg && set.reps && set.weightKg > 0 && set.reps > 0) {
        totalVolumeKg += set.weightKg * set.reps;
      }
    }
  }

  return {
    id: raw.id,
    title: raw.title || "Entrenamiento",
    description: raw.description || "",
    startTime,
    endTime,
    date,
    durationSeconds,
    totalVolumeKg: Number(totalVolumeKg.toFixed(2)),
    exercisesCount: exercises.length,
    setsCount,
    exercises,
    createdAt: raw.created_at || raw.updated_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Fetches a single workout by ID from Hevy API.
 */
export async function fetchHevyWorkoutById(workoutId: string): Promise<HevyWorkout | null> {
  const apiKey = getHevyApiKey();
  const res = await fetch(`${HEVY_BASE_URL}/v1/workouts/${workoutId}`, {
    headers: {
      "api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`[Hevy API] Failed to fetch workout ${workoutId}:`, res.status, await res.text());
    return null;
  }

  const raw = await res.json();
  return parseRawHevyWorkout(raw);
}

/**
 * Fetches a paginated list of workouts from Hevy API.
 */
export async function fetchHevyWorkoutsList(
  page: number = 1,
  pageSize: number = 10
): Promise<{ page: number; pageCount: number; workouts: HevyWorkout[] }> {
  const apiKey = getHevyApiKey();
  const res = await fetch(`${HEVY_BASE_URL}/v1/workouts?page=${page}&pageSize=${pageSize}`, {
    headers: {
      "api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Hevy API returned status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const rawList = Array.isArray(data.workouts) ? data.workouts : Array.isArray(data) ? data : [];
  const workouts = rawList.map(parseRawHevyWorkout);

  return {
    page: data.page || page,
    pageCount: data.page_count || 1,
    workouts,
  };
}

/**
 * Upserts a HevyWorkout in Neon DB and updates daily health & activity records.
 */
export async function saveHevyWorkoutToDb(sql: any, workout: HevyWorkout) {
  // 1. Insert or update in hevy_workouts
  await sql`
    INSERT INTO hevy_workouts (
      id, title, description, start_time, end_time, date,
      duration_seconds, total_volume_kg, exercises_count, sets_count,
      exercises, hevy_updated_at, created_at
    )
    VALUES (
      ${workout.id},
      ${workout.title},
      ${workout.description || null},
      ${workout.startTime},
      ${workout.endTime},
      ${workout.date},
      ${workout.durationSeconds},
      ${workout.totalVolumeKg},
      ${workout.exercisesCount},
      ${workout.setsCount},
      ${JSON.stringify(workout.exercises)}::jsonb,
      ${workout.updatedAt || null},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET title = ${workout.title},
        description = ${workout.description || null},
        start_time = ${workout.startTime},
        end_time = ${workout.endTime},
        date = ${workout.date},
        duration_seconds = ${workout.durationSeconds},
        total_volume_kg = ${workout.totalVolumeKg},
        exercises_count = ${workout.exercisesCount},
        sets_count = ${workout.setsCount},
        exercises = ${JSON.stringify(workout.exercises)}::jsonb,
        hevy_updated_at = ${workout.updatedAt || null};
  `;

  // 2. Automatically sync with health_logs for that date
  const workoutNotes = `Hevy: ${workout.title} (${workout.exercisesCount} ejercicios • ${workout.setsCount} sets • ${Math.round(
    workout.totalVolumeKg
  ).toLocaleString("es-MX")} kg)`;

  await sql`
    INSERT INTO health_logs (date, workout_type, workout_notes, updated_at)
    VALUES (${workout.date}, 'gym', ${workoutNotes}, NOW())
    ON CONFLICT (date) DO UPDATE
    SET workout_type = COALESCE(health_logs.workout_type, 'gym'),
        workout_notes = CASE 
          WHEN health_logs.workout_notes IS NULL OR health_logs.workout_notes = '' THEN ${workoutNotes}
          WHEN health_logs.workout_notes NOT LIKE '%Hevy%' THEN health_logs.workout_notes || ' | ' || ${workoutNotes}
          ELSE ${workoutNotes}
        END,
        updated_at = NOW();
  `;

  // 3. Update daily_activity_logs for Heatmap
  await sql`
    INSERT INTO daily_activity_logs (date, habits_count, updated_at)
    VALUES (${workout.date}, 1, NOW())
    ON CONFLICT (date) DO UPDATE
    SET habits_count = GREATEST(daily_activity_logs.habits_count, 1),
        updated_at = NOW();
  `;
}
