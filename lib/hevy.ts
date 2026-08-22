import { HevyExercise, HevySet, HevyWorkout } from "./types";

const HEVY_BASE_URL = "https://api.hevyapp.com";

interface RawHevySet {
  index?: number;
  type?: string;
  weight_kg?: number | string | null;
  reps?: number | string | null;
  distance_meters?: number | string | null;
  duration_seconds?: number | string | null;
  rpe?: number | string | null;
}

interface RawHevyExercise {
  index?: number;
  title?: string;
  notes?: string | null;
  exercise_template_id?: string | null;
  superset_id?: string | null;
  sets?: RawHevySet[];
}

interface RawHevyWorkout {
  id?: string;
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  exercises?: RawHevyExercise[];
  updated_at?: string;
}

interface NeonSql {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>;
}

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
export function parseRawHevyWorkout(raw: RawHevyWorkout): HevyWorkout {
  const startTime = raw.start_time || new Date().toISOString();
  const endTime = raw.end_time || raw.start_time || new Date().toISOString();
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));

  const date = startTime.split("T")[0];

  const exercises: HevyExercise[] = Array.isArray(raw.exercises)
    ? raw.exercises.map((ex, exIdx) => {
        const sets: HevySet[] = Array.isArray(ex.sets)
          ? ex.sets.map((s, sIdx) => ({
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

  // Calculate total volume (weightKg * reps)
  let totalVolumeKg = 0;
  let totalSetsCount = 0;

  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      totalSetsCount++;
      if (s.weightKg && s.reps) {
        totalVolumeKg += s.weightKg * s.reps;
      }
    });
  });

  return {
    id: raw.id || `hevy-${Date.now()}`,
    title: raw.title || "Entrenamiento",
    description: raw.description || undefined,
    startTime,
    endTime,
    date,
    durationSeconds,
    totalVolumeKg: Math.round(totalVolumeKg),
    exercisesCount: exercises.length,
    setsCount: totalSetsCount,
    exercises,
    updatedAt: raw.updated_at || undefined,
  };
}

/**
 * Fetches a single workout detail from Hevy API by workoutId.
 */
export async function fetchHevyWorkoutById(workoutId: string): Promise<HevyWorkout | null> {
  const apiKey = getHevyApiKey();
  const url = `${HEVY_BASE_URL}/v1/workouts/${workoutId}`;

  const res = await fetch(url, {
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Hevy API Error: HTTP ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { workout?: RawHevyWorkout } | RawHevyWorkout;
  const raw = ("workout" in json && json.workout) ? json.workout : json as RawHevyWorkout;
  return parseRawHevyWorkout(raw);
}

/**
 * Fetches page of workouts from Hevy API (paginated, sorted newest first).
 */
export async function fetchHevyWorkoutsList(
  page = 1,
  pageSize = 10
): Promise<{
  page: number;
  pageCount: number;
  workouts: HevyWorkout[];
}> {
  const apiKey = getHevyApiKey();
  const url = `${HEVY_BASE_URL}/v1/workouts?page=${page}&pageSize=${pageSize}`;

  const res = await fetch(url, {
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Hevy API Error: HTTP ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    workouts?: RawHevyWorkout[];
    page?: number;
    page_count?: number;
  };
  const rawList = Array.isArray(data.workouts) ? data.workouts : [];
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
export async function saveHevyWorkoutToDb(sql: NeonSql, workout: HevyWorkout) {
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
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        date = EXCLUDED.date,
        duration_seconds = EXCLUDED.duration_seconds,
        total_volume_kg = EXCLUDED.total_volume_kg,
        exercises_count = EXCLUDED.exercises_count,
        sets_count = EXCLUDED.sets_count,
        exercises = EXCLUDED.exercises,
        hevy_updated_at = EXCLUDED.hevy_updated_at;
  `;

  // 2. Sync workout in health_logs
  const workoutNotes = `${workout.title} (${Math.round(workout.durationSeconds / 60)} min, ${workout.totalVolumeKg.toLocaleString()} kg)`;
  await sql`
    INSERT INTO health_logs (date, workout_type, workout_notes, updated_at)
    VALUES (${workout.date}, 'gym', ${workoutNotes}, NOW())
    ON CONFLICT (date) DO UPDATE
    SET workout_type = 'gym',
        workout_notes = ${workoutNotes},
        updated_at = NOW();
  `;

  // 3. Increment activity log count
  await sql`
    INSERT INTO daily_activity_logs (date, habits_count, updated_at)
    VALUES (${workout.date}, 1, NOW())
    ON CONFLICT (date) DO UPDATE
    SET habits_count = daily_activity_logs.habits_count + 1,
        updated_at = NOW();
  `;
}
