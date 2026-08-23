import { HevyWorkout, MuscleGroupId, MuscleRecoveryItem, MuscleRecoverySummary } from "./types";

interface MuscleMappingRule {
  primary: MuscleGroupId[];
  secondary: MuscleGroupId[];
}

export const MUSCLE_METADATA: Record<
  MuscleGroupId,
  { name: string; nameEn: string; category: "upper_push" | "upper_pull" | "core" | "lower" }
> = {
  chest: { name: "Pectorales", nameEn: "Chest", category: "upper_push" },
  shoulders: { name: "Deltoides / Hombros", nameEn: "Shoulders", category: "upper_push" },
  triceps: { name: "Tríceps", nameEn: "Triceps", category: "upper_push" },
  upper_back: { name: "Trapecios / Alta Espalda", nameEn: "Upper Back", category: "upper_pull" },
  lats: { name: "Dorsales", nameEn: "Lats", category: "upper_pull" },
  biceps: { name: "Bíceps", nameEn: "Biceps", category: "upper_pull" },
  forearms: { name: "Antebrazos", nameEn: "Forearms", category: "upper_pull" },
  abs: { name: "Abdomen & Core", nameEn: "Abs & Core", category: "core" },
  quads: { name: "Cuádriceps", nameEn: "Quads", category: "lower" },
  hamstrings: { name: "Femorales / Isquios", nameEn: "Hamstrings", category: "lower" },
  glutes: { name: "Glúteos", nameEn: "Glutes", category: "lower" },
  calves: { name: "Gemelos / Pantorrillas", nameEn: "Calves", category: "lower" },
};

/**
 * Normalizes exercise name to facilitate fuzzy keyword matching.
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Maps an exercise name to primary and secondary muscle groups.
 */
export function identifyMusclesForExercise(title: string): MuscleMappingRule {
  const norm = normalizeName(title);

  // Chest / Pecho
  if (
    norm.includes("bench press") ||
    norm.includes("banca") ||
    norm.includes("chest press") ||
    norm.includes("pecho") ||
    norm.includes("incline press") ||
    norm.includes("decline press") ||
    norm.includes("aperturas") ||
    norm.includes("chest fly") ||
    norm.includes("pec deck") ||
    norm.includes("push up") ||
    norm.includes("flexion") ||
    norm.includes("lagartija") ||
    norm.includes("dips") ||
    norm.includes("fondos")
  ) {
    return {
      primary: ["chest"],
      secondary: norm.includes("incline") ? ["shoulders", "triceps"] : ["triceps", "shoulders"],
    };
  }

  // Shoulders / Hombros
  if (
    norm.includes("overhead press") ||
    norm.includes("military press") ||
    norm.includes("press militar") ||
    norm.includes("shoulder press") ||
    norm.includes("lateral raise") ||
    norm.includes("elevacion lateral") ||
    norm.includes("front raise") ||
    norm.includes("elevacion frontal") ||
    norm.includes("arnold") ||
    norm.includes("face pull") ||
    norm.includes("rear delt") ||
    norm.includes("pajaro") ||
    norm.includes("upright row") ||
    norm.includes("remo al menton")
  ) {
    return {
      primary: ["shoulders"],
      secondary: norm.includes("press") ? ["triceps", "upper_back"] : ["upper_back"],
    };
  }

  // Lats / Dorsales & Upper Back
  if (
    norm.includes("pull up") ||
    norm.includes("dominada") ||
    norm.includes("lat pulldown") ||
    norm.includes("jalon") ||
    norm.includes("chin up") ||
    norm.includes("pulldown")
  ) {
    return {
      primary: ["lats"],
      secondary: ["biceps", "upper_back", "forearms"],
    };
  }

  if (
    norm.includes("barbell row") ||
    norm.includes("dumbbell row") ||
    norm.includes("remo con") ||
    norm.includes("remo en") ||
    norm.includes("cable row") ||
    norm.includes("seated row") ||
    norm.includes("t-bar row") ||
    norm.includes("shrug") ||
    norm.includes("encogimiento")
  ) {
    return {
      primary: ["upper_back", "lats"],
      secondary: ["biceps", "forearms"],
    };
  }

  // Deadlifts / Peso Muerto
  if (norm.includes("deadlift") || norm.includes("peso muerto")) {
    if (norm.includes("rumano") || norm.includes("romanian") || norm.includes("stiff")) {
      return {
        primary: ["hamstrings", "glutes"],
        secondary: ["upper_back", "forearms", "abs"],
      };
    }
    return {
      primary: ["upper_back", "glutes", "hamstrings"],
      secondary: ["quads", "forearms", "lats", "abs"],
    };
  }

  // Biceps / Bíceps
  if (
    norm.includes("bicep") ||
    norm.includes("curl") ||
    norm.includes("predicador") ||
    norm.includes("martillo") ||
    norm.includes("hammer") ||
    norm.includes("preacher")
  ) {
    // If not a leg curl
    if (!norm.includes("leg") && !norm.includes("femoral") && !norm.includes("pierna")) {
      return {
        primary: ["biceps"],
        secondary: ["forearms"],
      };
    }
  }

  // Triceps / Tríceps
  if (
    norm.includes("tricep") ||
    norm.includes("skull crusher") ||
    norm.includes("press frances") ||
    norm.includes("extension de codo") ||
    norm.includes("pushdown") ||
    norm.includes("triceps extension") ||
    norm.includes("kickback") ||
    norm.includes("patada")
  ) {
    return {
      primary: ["triceps"],
      secondary: [],
    };
  }

  // Quads / Cuádriceps & Squats
  if (
    norm.includes("squat") ||
    norm.includes("sentadilla") ||
    norm.includes("leg press") ||
    norm.includes("prensa") ||
    norm.includes("leg extension") ||
    norm.includes("extension de pierna") ||
    norm.includes("hack") ||
    norm.includes("lunge") ||
    norm.includes("zancada") ||
    norm.includes("desplante")
  ) {
    return {
      primary: ["quads"],
      secondary: ["glutes", "calves", "abs"],
    };
  }

  // Hamstrings & Glutes
  if (
    norm.includes("leg curl") ||
    norm.includes("curl femoral") ||
    norm.includes("hip thrust") ||
    norm.includes("glute") ||
    norm.includes("gluteo") ||
    norm.includes("abduccion") ||
    norm.includes("abductor")
  ) {
    return {
      primary: ["hamstrings", "glutes"],
      secondary: ["calves"],
    };
  }

  // Calves / Pantorrillas
  if (
    norm.includes("calf") ||
    norm.includes("pantorrilla") ||
    norm.includes("gemelos") ||
    norm.includes("talones")
  ) {
    return {
      primary: ["calves"],
      secondary: [],
    };
  }

  // Abs & Core
  if (
    norm.includes("abs") ||
    norm.includes("crunch") ||
    norm.includes("plank") ||
    norm.includes("plancha") ||
    norm.includes("leg raise") ||
    norm.includes("elevacion de piernas") ||
    norm.includes("ab wheel") ||
    norm.includes("rueda abdominal") ||
    norm.includes("russian twist")
  ) {
    return {
      primary: ["abs"],
      secondary: [],
    };
  }

  // Fallback defaults
  return {
    primary: [],
    secondary: [],
  };
}

/**
 * Calculates complete muscle recovery status from recent Hevy workouts.
 */
export function calculateMuscleRecovery(
  recentWorkouts: HevyWorkout[] = [],
  now: Date = new Date()
): MuscleRecoverySummary {
  const muscleGroups: MuscleGroupId[] = [
    "chest",
    "shoulders",
    "upper_back",
    "lats",
    "biceps",
    "triceps",
    "forearms",
    "abs",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
  ];

  const nowMs = now.getTime();
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;

  // Track per muscle stats
  const muscleData: Record<
    MuscleGroupId,
    {
      lastTrainedTimestamp: number | null;
      lastWorkoutTitle: string | null;
      recentExercises: Set<string>;
      setsLast7Days: number;
      volumeLast7Days: number;
    }
  > = muscleGroups.reduce((acc, id) => {
    acc[id] = {
      lastTrainedTimestamp: null,
      lastWorkoutTitle: null,
      recentExercises: new Set<string>(),
      setsLast7Days: 0,
      volumeLast7Days: 0,
    };
    return acc;
  }, {} as Record<MuscleGroupId, {
    lastTrainedTimestamp: number | null;
    lastWorkoutTitle: string | null;
    recentExercises: Set<string>;
    setsLast7Days: number;
    volumeLast7Days: number;
  }>);

  // Iterate over workouts (assumed sorted newest to oldest, or we check dates)
  const sortedWorkouts = [...recentWorkouts].sort(
    (a, b) => new Date(b.startTime || b.date).getTime() - new Date(a.startTime || a.date).getTime()
  );

  sortedWorkouts.forEach((w) => {
    const workoutTime = new Date(w.startTime || w.date).getTime();
    if (isNaN(workoutTime)) return;

    const isWithin7Days = workoutTime >= sevenDaysAgoMs;

    (w.exercises || []).forEach((ex) => {
      const { primary, secondary } = identifyMusclesForExercise(ex.title);
      const setsCount = (ex.sets || []).length;
      let exerciseVolume = 0;
      (ex.sets || []).forEach((s) => {
        if (s.weightKg && s.reps) {
          exerciseVolume += s.weightKg * s.reps;
        }
      });

      // Assign primary muscles
      primary.forEach((mId) => {
        if (!muscleData[mId]) return;
        if (!muscleData[mId].lastTrainedTimestamp || workoutTime > muscleData[mId].lastTrainedTimestamp!) {
          muscleData[mId].lastTrainedTimestamp = workoutTime;
          muscleData[mId].lastWorkoutTitle = w.title;
        }
        muscleData[mId].recentExercises.add(ex.title);
        if (isWithin7Days) {
          muscleData[mId].setsLast7Days += setsCount;
          muscleData[mId].volumeLast7Days += exerciseVolume;
        }
      });

      // Assign secondary muscles (half volume weight)
      secondary.forEach((mId) => {
        if (!muscleData[mId]) return;
        if (!muscleData[mId].lastTrainedTimestamp || workoutTime > muscleData[mId].lastTrainedTimestamp!) {
          muscleData[mId].lastTrainedTimestamp = workoutTime;
          if (!muscleData[mId].lastWorkoutTitle) {
            muscleData[mId].lastWorkoutTitle = w.title;
          }
        }
        muscleData[mId].recentExercises.add(ex.title);
        if (isWithin7Days) {
          muscleData[mId].setsLast7Days += Math.round(setsCount * 0.5);
          muscleData[mId].volumeLast7Days += Math.round(exerciseVolume * 0.5);
        }
      });
    });
  });

  // Calculate recovery percentage for each muscle
  const resultMuscles = {} as Record<MuscleGroupId, MuscleRecoveryItem>;
  let totalRecoverySum = 0;
  let readyToTrainCount = 0;
  let recoveringCount = 0;
  let exhaustedCount = 0;
  const suggestedFocusToday: string[] = [];

  muscleGroups.forEach((mId) => {
    const meta = MUSCLE_METADATA[mId];
    const data = muscleData[mId];

    if (!data.lastTrainedTimestamp) {
      // Muscle has not been trained in recent history -> 100% Rested
      resultMuscles[mId] = {
        id: mId,
        name: meta.name,
        nameEn: meta.nameEn,
        category: meta.category,
        recoveryPercent: 100,
        state: "rested",
        hoursToFullRecovery: 0,
        totalSetsLast7Days: 0,
        totalVolumeLast7Days: 0,
        recentExercises: [],
        recommendation: "Músculo descansado (> 7 días sin estímulo). Listo para ser entrenado con alta intensidad.",
      };
      readyToTrainCount++;
      totalRecoverySum += 100;
      suggestedFocusToday.push(meta.name);
      return;
    }

    const hoursSince = Math.max(0, (nowMs - data.lastTrainedTimestamp) / (1000 * 60 * 60));

    // Dynamic recovery window based on sets / volume
    let fullRecoveryHours = 48; // Base 48h for moderate workout
    if (data.setsLast7Days > 12) fullRecoveryHours = 72;
    else if (data.setsLast7Days > 6) fullRecoveryHours = 60;
    else if (data.setsLast7Days <= 3) fullRecoveryHours = 36;

    let recoveryPercent = 100;
    let state: MuscleRecoveryItem["state"] = "recovered";
    let hoursToFullRecovery = 0;
    let recommendation = "";

    if (hoursSince >= fullRecoveryHours) {
      recoveryPercent = 100;
      if (hoursSince > 120) {
        state = "rested";
        recommendation = `Descansado (${Math.round(hoursSince / 24)} días sin estímulo). Excelente momento para entrenarlo hoy.`;
      } else {
        state = "recovered";
        recommendation = "100% Recuperado. Glucógeno y fuerza restaurados. Óptimo para sobrecarga progresiva.";
      }
      readyToTrainCount++;
      suggestedFocusToday.push(meta.name);
    } else {
      recoveryPercent = Math.min(99, Math.max(5, Math.round((hoursSince / fullRecoveryHours) * 100)));
      hoursToFullRecovery = Math.round(fullRecoveryHours - hoursSince);

      if (recoveryPercent < 40) {
        state = "exhausted";
        recommendation = `Fatiga aguda / Daño muscular (listo en ~${hoursToFullRecovery}h). Prioriza proteína, agua e hidratación.`;
        exhaustedCount++;
      } else {
        state = "recovering";
        recommendation = `Recuperación activa (faltan ~${hoursToFullRecovery}h). Evita series al fallo en este grupo hoy.`;
        recoveringCount++;
      }
    }

    totalRecoverySum += recoveryPercent;

    resultMuscles[mId] = {
      id: mId,
      name: meta.name,
      nameEn: meta.nameEn,
      category: meta.category,
      recoveryPercent,
      state,
      lastTrainedAt: new Date(data.lastTrainedTimestamp).toISOString(),
      hoursSinceLastTrained: Math.round(hoursSince),
      hoursToFullRecovery,
      totalSetsLast7Days: data.setsLast7Days,
      totalVolumeLast7Days: data.volumeLast7Days,
      lastWorkoutTitle: data.lastWorkoutTitle || undefined,
      recentExercises: Array.from(data.recentExercises).slice(0, 5),
      recommendation,
    };
  });

  const overallRecoveryPercent = Math.round(totalRecoverySum / muscleGroups.length);

  return {
    overallRecoveryPercent,
    readyToTrainCount,
    recoveringCount,
    exhaustedCount,
    muscles: resultMuscles,
    suggestedFocusToday: suggestedFocusToday.slice(0, 4),
  };
}
