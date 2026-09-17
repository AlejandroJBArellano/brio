import { verifyAgentAuth } from "@/lib/agentAuth";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

function stripEmojis(str = "") {
  if (!str) return "";
  return str
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{FE0F}\u{200D}\u{200C}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * PATCH /api/agent/tasks/[taskId]
 * Updates an existing task's title, markdown notes, priority, or tags in PostgreSQL.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId } = await context.params;

  try {
    const body = await request.json();
    const sql = getDb();

    const cleanTitle = body.title ? stripEmojis(body.title) : undefined;
    const cleanNotes = body.notes !== undefined ? stripEmojis(body.notes) : undefined;
    const priority = typeof body.priority === "number" ? body.priority : undefined;

    if (cleanTitle !== undefined || cleanNotes !== undefined || priority !== undefined) {
      await sql`
        UPDATE tasks
        SET text = COALESCE(${cleanTitle ?? null}, text),
            notes = COALESCE(${cleanNotes ?? null}, notes),
            priority = COALESCE(${priority ?? null}, priority),
            updated_at = NOW()
        WHERE id = ${taskId};
      `;
    }

    if (Array.isArray(body.tags)) {
      await sql`DELETE FROM task_tags WHERE task_id = ${taskId};`;
      for (const tagIdOrName of body.tags) {
        const cleanTag = stripEmojis(tagIdOrName);
        const existing = await sql`
          SELECT id FROM tags WHERE id = ${tagIdOrName} OR name = ${cleanTag} LIMIT 1;
        `;
        let tagId = tagIdOrName;
        if (existing.length === 0) {
          tagId = crypto.randomUUID();
          await sql`
            INSERT INTO tags (id, name, created_at)
            VALUES (${tagId}, ${cleanTag}, NOW())
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;
          `;
        } else {
          tagId = existing[0].id;
        }
        await sql`
          INSERT INTO task_tags (task_id, tag_id)
          VALUES (${taskId}, ${tagId})
          ON CONFLICT (task_id, tag_id) DO NOTHING;
        `;
      }
    }

    const rows = await sql`SELECT id, text, notes, priority, completed FROM tasks WHERE id = ${taskId} LIMIT 1;`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const updated = rows[0];

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
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
      { error: "Failed to update task in PostgreSQL." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent/tasks/[taskId]
 * Deletes a task from PostgreSQL.
 */
export async function DELETE(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { taskId } = await context.params;

  try {
    const sql = getDb();
    await sql`DELETE FROM tasks WHERE id = ${taskId};`;

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    return NextResponse.json({ success: true, deletedTaskId: taskId });
  } catch (error) {
    console.error("[Agent API DELETE Task Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete task from PostgreSQL." },
      { status: 500 }
    );
  }
}
