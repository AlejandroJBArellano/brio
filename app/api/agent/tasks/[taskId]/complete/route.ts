import { verifyAgentAuth } from "@/lib/agentAuth";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * POST /api/agent/tasks/[taskId]/complete
 * Marks a task as completed in PostgreSQL.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId } = await context.params;

  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM tasks WHERE id = ${taskId} LIMIT 1;`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const task = rows[0];

    if (task.type === "todo") {
      await sql`
        UPDATE tasks
        SET completed = TRUE,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = ${taskId};
      `;
    } else if (task.type === "daily") {
      const currentStreak = Number(task.streak) || 0;
      await sql`
        UPDATE tasks
        SET completed = TRUE,
            completed_at = NOW(),
            streak = ${currentStreak + 1},
            updated_at = NOW()
        WHERE id = ${taskId};
      `;
    } else if (task.type === "habit") {
      await sql`
        UPDATE tasks
        SET counter_up = counter_up + 1,
            updated_at = NOW()
        WHERE id = ${taskId};
      `;
    }

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    return NextResponse.json({
      success: true,
      completedTaskId: taskId,
    });
  } catch (error) {
    console.error("[Agent API Complete Task Error]:", error);
    return NextResponse.json(
      { error: "Failed to mark task as completed in PostgreSQL." },
      { status: 500 }
    );
  }
}
