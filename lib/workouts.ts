import {
  EquipmentType,
  ExerciseCatalogItem,
  MuscleGroupId,
  PRRecord,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from "./types";
import { identifyMusclesForExercise } from "./muscleRecovery";

/**
 * Calculates Estimated 1RM using Epley Formula:
 * 1RM = Weight * (1 + Reps / 30)
 * For 1 rep, 1RM = Weight.
 */
export function calculateEstimated1Rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  const epley = weightKg * (1 + reps / 30);
  return Math.round(epley * 10) / 10;
}

/**
 * Calculates Estimated 1RM using Brzycki Formula:
 * 1RM = Weight / (1.0278 - 0.0278 * Reps)
 */
export function calculateBrzycki1Rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps >= 36) return Math.round(weightKg * 2 * 10) / 10;
  const brzycki = weightKg / (1.0278 - 0.0278 * reps);
  return Math.round(brzycki * 10) / 10;
}

/**
 * Calculates total volume and sets count for a workout session.
 */
export function calculateWorkoutVolume(exercises: WorkoutExercise[]): {
  totalVolumeKg: number;
  totalSetsCount: number;
} {
  let totalVolumeKg = 0;
  let totalSetsCount = 0;

  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      if (s.completed) {
        totalSetsCount += 1;
        if (s.weightKg && s.reps) {
          totalVolumeKg += s.weightKg * s.reps;
        }
      }
    });
  });

  return {
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSetsCount,
  };
}

/**
 * Normalizes exercise title for consistent lookup.
 */
export function normalizeExerciseTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Infers default equipment type from exercise name.
 */
export function inferEquipmentType(title: string): EquipmentType {
  const norm = normalizeExerciseTitle(title);
  if (
    norm.includes("barbell") ||
    norm.includes("barra") ||
    norm.includes("bench press") ||
    norm.includes("squat") ||
    norm.includes("deadlift") ||
    norm.includes("peso muerto") ||
    norm.includes("sentadilla")
  ) {
    return "barbell";
  }
  if (norm.includes("dumbbell") || norm.includes("mancuerna")) {
    return "dumbbell";
  }
  if (
    norm.includes("cable") ||
    norm.includes("polea") ||
    norm.includes("pulldown") ||
    norm.includes("jalon") ||
    norm.includes("crossover") ||
    norm.includes("face pull")
  ) {
    return "cable";
  }
  if (
    norm.includes("machine") ||
    norm.includes("maquina") ||
    norm.includes("prensa") ||
    norm.includes("leg press") ||
    norm.includes("pec deck") ||
    norm.includes("hack")
  ) {
    return "machine";
  }
  if (norm.includes("smith")) {
    return "smith_machine";
  }
  if (norm.includes("kettlebell") || norm.includes("pesa rusa")) {
    return "kettlebell";
  }
  if (
    norm.includes("bodyweight") ||
    norm.includes("pull up") ||
    norm.includes("dominada") ||
    norm.includes("chin up") ||
    norm.includes("dip") ||
    norm.includes("fondo") ||
    norm.includes("push up") ||
    norm.includes("flexion") ||
    norm.includes("lagartija") ||
    norm.includes("crunch") ||
    norm.includes("plank")
  ) {
    return "bodyweight";
  }
  return "other";
}

/**
 * Detects new Personal Records (PRs) achieved in a workout session compared against historical sessions.
 */
export function detectWorkoutPRs(
  session: WorkoutSession,
  historicalSessions: WorkoutSession[]
): PRRecord[] {
  const prs: PRRecord[] = [];
  const exerciseMaxes: Record<
    string,
    { maxWeight: number; max1Rm: number; maxVolume: number }
  > = {};

  // Build historical maxes per exercise
  historicalSessions.forEach((hist) => {
    // Avoid comparing against the current session itself
    if (hist.id === session.id) return;

    hist.exercises.forEach((ex) => {
      const normKey = normalizeExerciseTitle(ex.title);
      if (!exerciseMaxes[normKey]) {
        exerciseMaxes[normKey] = { maxWeight: 0, max1Rm: 0, maxVolume: 0 };
      }

      ex.sets.forEach((s) => {
        const weight = Number(s.weightKg || 0);
        const reps = Number(s.reps || 0);
        if (weight > 0 && reps > 0) {
          const est1Rm = calculateEstimated1Rm(weight, reps);
          const setVolume = weight * reps;

          if (weight > exerciseMaxes[normKey].maxWeight) {
            exerciseMaxes[normKey].maxWeight = weight;
          }
          if (est1Rm > exerciseMaxes[normKey].max1Rm) {
            exerciseMaxes[normKey].max1Rm = est1Rm;
          }
          if (setVolume > exerciseMaxes[normKey].maxVolume) {
            exerciseMaxes[normKey].maxVolume = setVolume;
          }
        }
      });
    });
  });

  // Check current session completed sets
  session.exercises.forEach((ex) => {
    const normKey = normalizeExerciseTitle(ex.title);
    const hist = exerciseMaxes[normKey];

    let sessionMaxWeight = 0;
    let sessionMax1Rm = 0;
    let sessionMaxVolume = 0;

    ex.sets.forEach((s) => {
      if (!s.completed) return;
      const weight = Number(s.weightKg || 0);
      const reps = Number(s.reps || 0);
      if (weight <= 0 || reps <= 0) return;

      const est1Rm = calculateEstimated1Rm(weight, reps);
      const setVol = weight * reps;

      if (weight > sessionMaxWeight) sessionMaxWeight = weight;
      if (est1Rm > sessionMax1Rm) sessionMax1Rm = est1Rm;
      if (setVol > sessionMaxVolume) sessionMaxVolume = setVol;
    });

    if (hist && (hist.maxWeight > 0 || hist.max1Rm > 0)) {
      if (sessionMaxWeight > hist.maxWeight) {
        prs.push({
          exerciseTitle: ex.title,
          type: "weight",
          value: sessionMaxWeight,
          prevValue: hist.maxWeight,
          unit: "kg",
          date: session.date,
        });
      }
      if (sessionMax1Rm > hist.max1Rm) {
        prs.push({
          exerciseTitle: ex.title,
          type: "1rm",
          value: sessionMax1Rm,
          prevValue: hist.max1Rm,
          unit: "kg",
          date: session.date,
        });
      }
      if (sessionMaxVolume > hist.maxVolume) {
        prs.push({
          exerciseTitle: ex.title,
          type: "volume",
          value: sessionMaxVolume,
          prevValue: hist.maxVolume,
          unit: "kg",
          date: session.date,
        });
      }
    }
  });

  return prs;
}

/**
 * Extracts a unified catalog of exercises from past workout sessions.
 */
export function extractCatalogFromWorkouts(
  workouts: WorkoutSession[]
): ExerciseCatalogItem[] {
  const map = new Map<string, ExerciseCatalogItem>();

  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      const norm = normalizeExerciseTitle(ex.title);
      if (!norm) return;

      const muscleRule = identifyMusclesForExercise(ex.title);
      const primaryMuscle = (muscleRule.primary[0] || "chest") as MuscleGroupId;
      const secondaryMuscles = (muscleRule.secondary || []) as MuscleGroupId[];
      const equipmentType = inferEquipmentType(ex.title);

      let maxWeight = 0;
      let max1Rm = 0;

      ex.sets.forEach((s) => {
        const weight = Number(s.weightKg || 0);
        const reps = Number(s.reps || 0);
        if (weight > 0 && reps > 0) {
          if (weight > maxWeight) maxWeight = weight;
          const est1Rm = calculateEstimated1Rm(weight, reps);
          if (est1Rm > max1Rm) max1Rm = est1Rm;
        }
      });

      if (!map.has(norm)) {
        map.set(norm, {
          id: `ex-${norm.replace(/[^a-z0-9]/g, "-")}`,
          title: ex.title.trim(),
          muscleGroup: primaryMuscle,
          secondaryMuscles,
          equipmentType,
          isCustom: false,
          maxWeightKg: maxWeight > 0 ? maxWeight : undefined,
          maxEstimated1Rm: max1Rm > 0 ? max1Rm : undefined,
          lastTrainedAt: w.date,
          totalSessionsCount: 1,
        });
      } else {
        const existing = map.get(norm)!;
        existing.totalSessionsCount = (existing.totalSessionsCount || 1) + 1;
        if (maxWeight > (existing.maxWeightKg || 0)) {
          existing.maxWeightKg = maxWeight;
        }
        if (max1Rm > (existing.maxEstimated1Rm || 0)) {
          existing.maxEstimated1Rm = max1Rm;
        }
        if (w.date > (existing.lastTrainedAt || "")) {
          existing.lastTrainedAt = w.date;
        }
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Gets previous set performance for an exercise from recent sessions.
 */
export function getPreviousPerformanceForExercise(
  exerciseTitle: string,
  historicalSessions: WorkoutSession[]
): WorkoutSet[] | null {
  const normKey = normalizeExerciseTitle(exerciseTitle);

  for (const session of historicalSessions) {
    const match = session.exercises.find(
      (e) => normalizeExerciseTitle(e.title) === normKey
    );
    if (match && match.sets.length > 0) {
      return match.sets.map((s, idx) => ({
        index: s.index ?? idx,
        type: ((s.type as string) || "normal") as WorkoutSet["type"],
        weightKg: s.weightKg || null,
        reps: s.reps || null,
        rpe: s.rpe || null,
        completed: false,
      }));
    }
  }

  return null;
}
