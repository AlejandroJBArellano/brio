import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { extractCatalogFromWorkouts } from "../lib/workouts";
import { WorkoutSession, WorkoutExercise } from "../lib/types";

// Parse .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(databaseUrl);

function toIsoString(val: unknown): string {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function toDateString(val: unknown): string {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string") {
    if (val.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.slice(0, 10);
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

async function runMigration() {
  console.log("🚀 Running workout migration on Neon DB...");

  // 1. Create workout_routines table
  console.log("Creating workout_routines table...");
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

  // 2. Create exercise_catalog table
  console.log("Creating exercise_catalog table...");
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

  // 3. Create workout_sessions table
  console.log("Creating workout_sessions table...");
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
      total_volume_kg FLOAT NOT NULL DEFAULT 0,
      exercises_count INT NOT NULL DEFAULT 0,
      sets_count INT NOT NULL DEFAULT 0,
      exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
      prs_achieved JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Alter column if was previously created as INT
  try {
    await sql`ALTER TABLE workout_sessions ALTER COLUMN total_volume_kg TYPE FLOAT;`;
  } catch {
    // Ignore if already float
  }

  // 4. Create indexes
  console.log("Creating indexes...");
  await sql`CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date DESC, start_time DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exercise_catalog_muscle ON exercise_catalog(muscle_group);`;

  // 5. Migrate historical data from hevy_workouts if it exists
  try {
    const checkTable = (await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hevy_workouts'
      );
    `) as { exists: boolean }[];

    if (checkTable[0]?.exists) {
      console.log("📦 Found legacy 'hevy_workouts' table! Migrating workouts into 'workout_sessions'...");
      const hevyRows = (await sql`SELECT * FROM hevy_workouts ORDER BY start_time ASC;`) as Record<string, unknown>[];
      console.log(`Found ${hevyRows.length} historical Hevy workouts to migrate.`);

      let migratedCount = 0;
      for (const r of hevyRows) {
        const id = String(r.id);
        const title = String(r.title || "Entrenamiento");
        const description = r.description ? String(r.description) : null;
        const startTime = toIsoString(r.start_time);
        const endTime = r.end_time ? toIsoString(r.end_time) : startTime;
        const date = toDateString(r.date || r.start_time);
        const durationSeconds = Math.round(Number(r.duration_seconds || 0));
        const totalVolumeKg = Number(r.total_volume_kg || 0);
        const exercisesCount = Math.round(Number(r.exercises_count || 0));
        const setsCount = Math.round(Number(r.sets_count || 0));
        const exercises = Array.isArray(r.exercises) ? r.exercises : [];

        await sql`
          INSERT INTO workout_sessions (
            id, title, description, status, start_time, end_time,
            date, duration_seconds, total_volume_kg, exercises_count,
            sets_count, exercises, created_at, updated_at
          ) VALUES (
            ${id},
            ${title},
            ${description},
            'completed',
            ${startTime}::timestamptz,
            ${endTime}::timestamptz,
            ${date},
            ${durationSeconds},
            ${totalVolumeKg},
            ${exercisesCount},
            ${setsCount},
            ${JSON.stringify(exercises)}::jsonb,
            NOW(),
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
              exercises = EXCLUDED.exercises;
        `;
        migratedCount++;
      }
      console.log(`✅ Successfully migrated ${migratedCount} workouts into 'workout_sessions'.`);
    } else {
      console.log("No legacy 'hevy_workouts' table found. Skipping table data migration.");
    }
  } catch (err) {
    console.error("Warning during hevy_workouts migration:", err);
  }

  // 6. Populate exercise_catalog from all completed workout sessions
  console.log("🌱 Extracting and seeding exercise catalog from historical sessions...");
  const sessions = (await sql`SELECT * FROM workout_sessions WHERE status = 'completed' ORDER BY date ASC;`) as Record<string, unknown>[];
  if (sessions.length > 0) {
    const parsedSessions: WorkoutSession[] = sessions.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      status: "completed",
      startTime: toIsoString(r.start_time),
      endTime: r.end_time ? toIsoString(r.end_time) : null,
      date: toDateString(r.date),
      durationSeconds: Number(r.duration_seconds || 0),
      totalVolumeKg: Number(r.total_volume_kg || 0),
      exercisesCount: Number(r.exercises_count || 0),
      setsCount: Number(r.sets_count || 0),
      exercises: Array.isArray(r.exercises) ? (r.exercises as WorkoutExercise[]) : [],
    }));

    const catalog = extractCatalogFromWorkouts(parsedSessions);
    console.log(`Extracted ${catalog.length} unique exercises with historical PRs and stats.`);

    for (const item of catalog) {
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
          ${item.maxEstimated1Rm || null},
          ${item.lastTrainedAt || null},
          ${item.totalSessionsCount || 0},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET muscle_group = EXCLUDED.muscle_group,
            secondary_muscles = EXCLUDED.secondary_muscles,
            equipment_type = EXCLUDED.equipment_type,
            max_weight_kg = EXCLUDED.max_weight_kg,
            max_estimated_1rm = EXCLUDED.max_estimated_1rm,
            last_trained_at = EXCLUDED.last_trained_at,
            total_sessions_count = EXCLUDED.total_sessions_count,
            updated_at = NOW();
      `;
    }
    console.log(`✅ Seeded ${catalog.length} exercises into 'exercise_catalog'.`);
  }

  // 7. Verify counts
  const [sessionsCount] = (await sql`SELECT COUNT(*)::int as count FROM workout_sessions;`) as { count: number }[];
  const [catalogCount] = (await sql`SELECT COUNT(*)::int as count FROM exercise_catalog;`) as { count: number }[];
  console.log(`\n🎉 Migration complete!`);
  console.log(`- Total workout sessions: ${sessionsCount.count}`);
  console.log(`- Total exercises in catalog: ${catalogCount.count}`);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
