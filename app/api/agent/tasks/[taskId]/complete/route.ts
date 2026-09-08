import { verifyAgentAuth } from "@/lib/agentAuth";
import { habiticaClient } from "@/lib/habitica";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * POST /api/agent/tasks/[taskId]/complete
 * Marks a task as completed in Habitica.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId } = await context.params;

  try {
    const result = await habiticaClient.scoreTask(taskId, "up");

    revalidatePath("/");
    revalidatePath("/projects");

    return NextResponse.json({
      success: true,
      completedTaskId: taskId,
      result,
    });
  } catch (error) {
    console.error("[Agent API Complete Task Error]:", error);
    return NextResponse.json(
      { error: "Failed to mark task as completed in Habitica." },
      { status: 500 }
    );
  }
}
