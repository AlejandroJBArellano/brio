import { verifyAgentAuth } from "@/lib/agentAuth";
import { getDb } from "@/lib/db";
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
    const sql = getDb();
    const rows = await sql`
      UPDATE task_checklists
      SET completed = NOT completed
      WHERE id = ${checklistId} AND task_id = ${taskId}
      RETURNING id, text, completed;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
    }

    const item = rows[0];

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    return NextResponse.json({
      success: true,
      taskId,
      checklistId,
      completed: Boolean(item.completed),
      item,
    });
  } catch (error) {
    console.error("[Agent API Checklist Score Error]:", error);
    return NextResponse.json(
      { error: "Failed to toggle checklist item in PostgreSQL." },
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
    const sql = getDb();
    await sql`
      DELETE FROM task_checklists
      WHERE id = ${checklistId} AND task_id = ${taskId};
    `;

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    return NextResponse.json({
      success: true,
      deletedChecklistId: checklistId,
    });
  } catch (error) {
    console.error("[Agent API Delete Checklist Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete checklist item from PostgreSQL." },
      { status: 500 }
    );
  }
}
