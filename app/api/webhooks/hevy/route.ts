import { getDb } from "@/lib/db";
import { fetchHevyWorkoutById, saveHevyWorkoutToDb } from "@/lib/hevy";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const workoutId = body.workoutId || body.workout_id || body.id;

    if (!workoutId) {
      return NextResponse.json(
        { success: false, error: "Missing workoutId in payload" },
        { status: 400 }
      );
    }

    console.log(`[Hevy Webhook] Received notification for workoutId: ${workoutId}`);

    // Fetch workout detail from Hevy API
    const workout = await fetchHevyWorkoutById(workoutId);
    if (!workout) {
      console.warn(`[Hevy Webhook] Could not retrieve workout ${workoutId} from Hevy API`);
      return NextResponse.json(
        { success: false, error: `Workout ${workoutId} not found in Hevy` },
        { status: 404 }
      );
    }

    // Save to DB and sync with health_logs
    const sql = getDb();
    await saveHevyWorkoutToDb(sql, workout);

    // Award Habitica XP for Hevy workout
    await awardHabiticaEvent("WORKOUT_COMPLETED", {
      customNotes: `Hevy: ${workout.title} • ${workout.totalVolumeKg || 0} kg levantados (${workout.setsCount || 0} sets)`,
    });

    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: `Workout ${workoutId} synced successfully`,
      title: workout.title,
      date: workout.date,
      totalVolumeKg: workout.totalVolumeKg,
    });
  } catch (error: unknown) {
    console.error("[Hevy Webhook Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/hevy",
    description: "Hevy Workout Tracker Webhook Receiver for Brio",
  });
}
