import { verifyAgentAuth } from "@/lib/agentAuth";
import { habiticaClient } from "@/lib/habitica";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * PATCH /api/agent/tasks/[taskId]
 * Updates an existing task's title, markdown notes, priority, or tags.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId } = await context.params;

  try {
    const body = await request.json();
    const payload: { text?: string; notes?: string; priority?: number; tags?: string[] } = {};

    if (body.title) payload.text = body.title.trim();
    if (body.notes !== undefined) payload.notes = body.notes;
    if (typeof body.priority === "number") payload.priority = body.priority;
    if (Array.isArray(body.tags)) payload.tags = body.tags;

    const updated = await habiticaClient.updateTask(taskId, payload);

    revalidatePath("/");
    revalidatePath("/projects");

    return NextResponse.json({
      success: true,
      task: {
        id: updated.id,
        rawTitle: updated.text,
        completed: updated.completed,
        notes: updated.notes || "",
        priority: updated.priority,
      },
    });
  } catch (error) {
    console.error("[Agent API PATCH Task Error]:", error);
    return NextResponse.json(
      { error: "Failed to update task in Habitica." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent/tasks/[taskId]
 * Deletes a task from Habitica.
 */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId } = await context.params;

  try {
    await habiticaClient.deleteTask(taskId);

    revalidatePath("/");
    revalidatePath("/projects");

    return NextResponse.json({ success: true, deletedTaskId: taskId });
  } catch (error) {
    console.error("[Agent API DELETE Task Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete task in Habitica." },
      { status: 500 }
    );
  }
}
