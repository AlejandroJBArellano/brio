import { verifyAgentAuth } from "@/lib/agentAuth";
import { habiticaClient } from "@/lib/habitica";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ taskId: string; checklistId: string }>;
}

/**
 * POST /api/agent/tasks/[taskId]/checklist/[checklistId]
 * Toggles or completes an individual checklist item.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId, checklistId } = await context.params;

  try {
    const updated = await habiticaClient.scoreChecklistItem(taskId, checklistId);

    revalidatePath("/");
    revalidatePath("/projects");

    const item = (updated.checklist || []).find((c) => c.id === checklistId);

    return NextResponse.json({
      success: true,
      taskId,
      checklistId,
      completed: item?.completed ?? true,
      item,
    });
  } catch (error) {
    console.error("[Agent API Checklist Score Error]:", error);
    return NextResponse.json(
      { error: "Failed to toggle checklist item in Habitica." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent/tasks/[taskId]/checklist/[checklistId]
 * Deletes a checklist item from a task.
 */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId, checklistId } = await context.params;

  try {
    await habiticaClient.deleteChecklistItem(taskId, checklistId);

    revalidatePath("/");
    revalidatePath("/projects");

    return NextResponse.json({
      success: true,
      deletedChecklistId: checklistId,
    });
  } catch (error) {
    console.error("[Agent API Delete Checklist Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete checklist item in Habitica." },
      { status: 500 }
    );
  }
}
