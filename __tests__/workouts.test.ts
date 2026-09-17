import assert from "node:assert";
import test from "node:test";
import {
  calculateBrzycki1Rm,
  calculateEstimated1Rm,
  calculateWorkoutVolume,
  detectWorkoutPRs,
  extractCatalogFromWorkouts,
  inferEquipmentType,
} from "../lib/workouts";
import { WorkoutSession } from "../lib/types";

test("calculateEstimated1Rm - Epley Formula calculation", () => {
  // 1 rep equals exact weight
  assert.strictEqual(calculateEstimated1Rm(100, 1), 100);

  // 100 kg for 10 reps = 100 * (1 + 10/30) = 133.3
  assert.strictEqual(calculateEstimated1Rm(100, 10), 133.3);

  // 80 kg for 6 reps = 80 * (1 + 6/30) = 80 * 1.2 = 96
  assert.strictEqual(calculateEstimated1Rm(80, 6), 96);

  // Zero / negative edge cases
  assert.strictEqual(calculateEstimated1Rm(0, 10), 0);
  assert.strictEqual(calculateEstimated1Rm(100, 0), 0);
});

test("calculateBrzycki1Rm - Brzycki Formula calculation", () => {
  assert.strictEqual(calculateBrzycki1Rm(100, 1), 100);
  // 100 kg for 5 reps = 100 / (1.0278 - 0.0278 * 5) = 100 / 0.8888 = 112.5
  assert.strictEqual(calculateBrzycki1Rm(100, 5), 112.5);
});

test("calculateWorkoutVolume - sums completed sets volume only", () => {
  const exercises = [
    {
      index: 0,
      exerciseId: "ex-1",
      title: "Bench Press",
      muscleGroup: "chest" as const,
      sets: [
        { index: 0, type: "normal" as const, weightKg: 80, reps: 10, completed: true },
        { index: 1, type: "normal" as const, weightKg: 90, reps: 8, completed: true },
        { index: 2, type: "normal" as const, weightKg: 100, reps: 5, completed: false }, // not completed
      ],
    },
    {
      index: 1,
      exerciseId: "ex-2",
      title: "Dips",
      muscleGroup: "triceps" as const,
      sets: [
        { index: 0, type: "normal" as const, weightKg: 20, reps: 10, completed: true },
      ],
    },
  ];

  const result = calculateWorkoutVolume(exercises);
  // Completed sets: (80*10 = 800) + (90*8 = 720) + (20*10 = 200) = 1720
  assert.strictEqual(result.totalVolumeKg, 1720);
  assert.strictEqual(result.totalSetsCount, 3);
});

test("inferEquipmentType - infers correct gym equipment from title", () => {
  assert.strictEqual(inferEquipmentType("Barbell Bench Press"), "barbell");
  assert.strictEqual(inferEquipmentType("Mancuernas press inclinado"), "dumbbell");
  assert.strictEqual(inferEquipmentType("Jalón en polea"), "cable");
  assert.strictEqual(inferEquipmentType("Prensa de piernas en máquina"), "machine");
  assert.strictEqual(inferEquipmentType("Dominadas con agarre supino"), "bodyweight");
});

test("detectWorkoutPRs - detects new weight and 1RM records", () => {
  const history: WorkoutSession[] = [
    {
      id: "hist-1",
      title: "Pecho Anterior",
      status: "completed",
      startTime: "2026-09-01T10:00:00Z",
      date: "2026-09-01",
      durationSeconds: 3600,
      totalVolumeKg: 2000,
      exercisesCount: 1,
      setsCount: 3,
      exercises: [
        {
          index: 0,
          exerciseId: "ex-1",
          title: "Press Banca",
          muscleGroup: "chest",
          sets: [
            { index: 0, type: "normal", weightKg: 80, reps: 8, completed: true },
            { index: 1, type: "normal", weightKg: 85, reps: 6, completed: true },
          ],
        },
      ],
    },
  ];

  const currentSession: WorkoutSession = {
    id: "curr-1",
    title: "Pecho Hoy",
    status: "completed",
    startTime: "2026-09-16T10:00:00Z",
    date: "2026-09-16",
    durationSeconds: 3600,
    totalVolumeKg: 3000,
    exercisesCount: 1,
    setsCount: 2,
    exercises: [
      {
        index: 0,
        exerciseId: "ex-1",
        title: "Press Banca",
        muscleGroup: "chest",
        sets: [
          { index: 0, type: "normal", weightKg: 95, reps: 6, completed: true }, // PR! 95kg > 85kg
        ],
      },
    ],
  };

  const prs = detectWorkoutPRs(currentSession, history);
  assert.ok(prs.length > 0);
  const weightPr = prs.find((p) => p.type === "weight");
  assert.ok(weightPr);
  assert.strictEqual(weightPr.value, 95);
  assert.strictEqual(weightPr.prevValue, 85);
});

test("extractCatalogFromWorkouts - builds unique exercise catalog with maxes", () => {
  const workouts = [
    {
      id: "w-1",
      title: "Push",
      startTime: "2026-09-01T10:00:00Z",
      endTime: "2026-09-01T11:00:00Z",
      date: "2026-09-01",
      durationSeconds: 3600,
      totalVolumeKg: 2000,
      exercisesCount: 2,
      setsCount: 2,
      exercises: [
        {
          index: 0,
          title: "Bench Press",
          sets: [{ index: 0, type: "normal", weightKg: 100, reps: 5 }],
        },
        {
          index: 1,
          title: "Tricep Pushdown",
          sets: [{ index: 0, type: "normal", weightKg: 30, reps: 12 }],
        },
      ],
    },
  ];

  const catalog = extractCatalogFromWorkouts(workouts as any);
  assert.strictEqual(catalog.length, 2);
  const bench = catalog.find((c) => c.title === "Bench Press");
  assert.ok(bench);
  assert.strictEqual(bench.maxWeightKg, 100);
  assert.strictEqual(bench.muscleGroup, "chest");
  assert.strictEqual(bench.equipmentType, "barbell");
});
