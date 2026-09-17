"use server";

import { getDb } from "@/lib/db";
import { getCachedDashboardData, getCachedTags } from "@/lib/dal/tasks";
import { parseBatchInput, parseTaskLine, toHabiticaPayload } from "@/lib/parser";
import {
  BatchActionResult,
  BatchTaskCreationItemResult,
  HabiticaTag,
  HabiticaTask,
  HabiticaTaskPayload,
  HabiticaUser,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

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
 * Fetches a single task with its checklists and tags.
 */
async function fetchTaskWithDetails(taskId: string): Promise<HabiticaTask | null> {
  const sql = getDb();
  const [taskRows, checklistRows, tagRows] = await Promise.all([
    sql`SELECT * FROM tasks WHERE id = ${taskId} LIMIT 1;`,
    sql`SELECT id, text, completed, order_index FROM task_checklists WHERE task_id = ${taskId} ORDER BY order_index ASC;`,
    sql`SELECT tag_id FROM task_tags WHERE task_id = ${taskId};`,
  ]);

  if (taskRows.length === 0) return null;
  const t = taskRows[0];

  return {
    id: t.id,
    text: t.text,
    notes: t.notes || "",
    type: t.type,
    priority: Number(t.priority) || 1,
    completed: Boolean(t.completed),
    date: t.due_date ? new Date(t.due_date).toISOString() : undefined,
    isDue: t.is_due !== null ? Boolean(t.is_due) : true,
    streak: Number(t.streak) || 0,
    repeat: t.repeat_days || undefined,
    frequency: t.frequency || "daily",
    everyX: Number(t.every_x) || 1,
    up: t.up !== null ? Boolean(t.up) : true,
    down: t.down !== null ? Boolean(t.down) : false,
    counterUp: Number(t.counter_up) || 0,
    counterDown: Number(t.counter_down) || 0,
    value: Number(t.value) || 0,
    checklist: (checklistRows as Array<{ id: string; text: string; completed: boolean }>).map((c) => ({
      id: c.id,
      text: c.text,
      completed: Boolean(c.completed),
    })),
    tags: (tagRows as Array<{ tag_id: string }>).map((tr) => tr.tag_id),
    createdAt: t.created_at ? new Date(t.created_at).toISOString() : undefined,
    updatedAt: t.updated_at ? new Date(t.updated_at).toISOString() : undefined,
  };
}

/**
 * Internal helper to insert a task, its checklists, and associated tags into PostgreSQL.
 */
async function insertTaskInternal(payload: HabiticaTaskPayload): Promise<HabiticaTask> {
  const sql = getDb();
  const id = crypto.randomUUID();
  const cleanText = stripEmojis(payload.text) || payload.text;
  const cleanNotes = stripEmojis(payload.notes || "");
  const priority = typeof payload.priority === "number" ? payload.priority : 1;
  const type = payload.type || "todo";
  const dueDate = payload.date ? new Date(payload.date).toISOString() : null;
  const repeatDays = payload.repeat
    ? JSON.stringify(payload.repeat)
    : JSON.stringify({ m: true, t: true, w: true, th: true, f: true, s: true, su: true });
  const frequency = payload.frequency || "daily";
  const everyX = typeof payload.everyX === "number" ? payload.everyX : 1;
  const up = payload.up !== undefined ? Boolean(payload.up) : true;
  const down = payload.down !== undefined ? Boolean(payload.down) : false;

  await sql`
    INSERT INTO tasks (
      id, text, notes, type, priority, completed, due_date,
      repeat_days, frequency, every_x, up, down, counter_up, counter_down, created_at, updated_at
    ) VALUES (
      ${id}, ${cleanText}, ${cleanNotes}, ${type}, ${priority}, FALSE, ${dueDate},
      ${repeatDays}::jsonb, ${frequency}, ${everyX}, ${up}, ${down}, 0, 0, NOW(), NOW()
    );
  `;

  // Checklists
  if (Array.isArray(payload.checklist) && payload.checklist.length > 0) {
    for (let i = 0; i < payload.checklist.length; i++) {
      const chk = payload.checklist[i];
      const chkId = chk.id || crypto.randomUUID();
      const chkText = stripEmojis(chk.text) || chk.text;
      await sql`
        INSERT INTO task_checklists (id, task_id, text, completed, order_index, created_at)
        VALUES (${chkId}, ${id}, ${chkText}, ${Boolean(chk.completed)}, ${i}, NOW());
      `;
    }
  }

  // Tags
  if (Array.isArray(payload.tags) && payload.tags.length > 0) {
    for (const tagIdOrName of payload.tags) {
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
        VALUES (${id}, ${tagId})
        ON CONFLICT (task_id, tag_id) DO NOTHING;
      `;
    }
  }

  return (await fetchTaskWithDetails(id))!;
}

/**
 * Server Action: Frictionless Batch Capture
 * Parses multiline raw text and creates tasks directly in PostgreSQL.
 */
export async function submitBatchCaptureAction(rawText: string): Promise<BatchActionResult> {
  const trimmed = rawText?.trim() || "";

  if (!trimmed) {
    return {
      success: false,
      totalParsed: 0,
      createdCount: 0,
      failedCount: 0,
      results: [],
      errors: ["Input cannot be empty. Please enter at least one task line."],
      summary: "Empty input submitted.",
      isDemo: false,
    };
  }

  try {
    const parsed = parseBatchInput(trimmed);

    if (parsed.payloads.length === 0) {
      return {
        success: false,
        totalParsed: 0,
        createdCount: 0,
        failedCount: 0,
        results: [],
        errors: ["No valid tasks could be parsed from the provided input."],
        summary: "No actionable task lines found.",
        isDemo: false,
      };
    }

    const results: BatchTaskCreationItemResult[] = [];
    let createdCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsed.payloads.length; i++) {
      const payload = parsed.payloads[i];
      try {
        const task = await insertTaskInternal(payload);
        results.push({
          index: i,
          task: payload,
          success: true,
          data: task,
        });
        createdCount++;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to create task";
        results.push({
          index: i,
          task: payload,
          success: false,
          error: errMsg,
        });
        errors.push(`Line ${i + 1}: ${errMsg}`);
        failedCount++;
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    const summaryParts: string[] = [];
    if (parsed.stats.todos > 0) summaryParts.push(`${parsed.stats.todos} to-do(s)`);
    if (parsed.stats.dailies > 0) summaryParts.push(`${parsed.stats.dailies} diaria(s)`);
    if (parsed.stats.habits > 0) summaryParts.push(`${parsed.stats.habits} hábito(s)`);

    return {
      success: createdCount > 0,
      totalParsed: parsed.payloads.length,
      createdCount,
      failedCount,
      results,
      errors,
      summary: `Creadas ${createdCount} de ${parsed.payloads.length} tareas (${summaryParts.join(", ")})`,
      isDemo: false,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected batch processing failure";
    return {
      success: false,
      totalParsed: 0,
      createdCount: 0,
      failedCount: 1,
      results: [],
      errors: [message],
      summary: "Fallo en captura batch.",
      isDemo: false,
    };
  }
}

/**
 * Server Action: Rapid Single Task Capture (used by Omnibar)
 */
export async function createSingleTaskAction(
  rawInput: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const parsed = parseTaskLine(rawInput);
    if (!parsed) {
      return { success: false, error: "Texto de tarea inválido" };
    }

    const payload = toHabiticaPayload(parsed);
    const task = await insertTaskInternal(payload);

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    return { success: true, task };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear tarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Score or Complete Task
 */
export async function toggleTaskAction(
  taskId: string,
  direction: "up" | "down" = "up"
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM tasks WHERE id = ${taskId} LIMIT 1;`;
    if (rows.length === 0) {
      return { success: false, error: "Tarea no encontrada" };
    }
    const task = rows[0];

    if (task.type === "todo") {
      const newCompleted = !task.completed;
      await sql`
        UPDATE tasks
        SET completed = ${newCompleted},
            completed_at = ${newCompleted ? new Date().toISOString() : null},
            updated_at = NOW()
        WHERE id = ${taskId};
      `;
    } else if (task.type === "daily") {
      const newCompleted = !task.completed;
      const currentStreak = Number(task.streak) || 0;
      const newStreak = newCompleted ? currentStreak + 1 : Math.max(0, currentStreak - 1);
      await sql`
        UPDATE tasks
        SET completed = ${newCompleted},
            completed_at = ${newCompleted ? new Date().toISOString() : null},
            streak = ${newStreak},
            updated_at = NOW()
        WHERE id = ${taskId};
      `;
    } else if (task.type === "habit") {
      if (direction === "up") {
        await sql`
          UPDATE tasks
          SET counter_up = counter_up + 1,
              updated_at = NOW()
          WHERE id = ${taskId};
        `;
      } else {
        await sql`
          UPDATE tasks
          SET counter_down = counter_down + 1,
              updated_at = NOW()
          WHERE id = ${taskId};
        `;
      }
    }

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar tarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Update Task in Place
 */
export async function updateTaskAction(
  taskId: string,
  payload: Partial<HabiticaTaskPayload>
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const sql = getDb();
    const cleanText = payload.text !== undefined ? stripEmojis(payload.text) : undefined;
    const cleanNotes = payload.notes !== undefined ? stripEmojis(payload.notes) : undefined;

    if (cleanText !== undefined || cleanNotes !== undefined || payload.priority !== undefined) {
      await sql`
        UPDATE tasks
        SET text = COALESCE(${cleanText ?? null}, text),
            notes = COALESCE(${cleanNotes ?? null}, notes),
            priority = COALESCE(${payload.priority ?? null}, priority),
            updated_at = NOW()
        WHERE id = ${taskId};
      `;
    }

    if (Array.isArray(payload.tags)) {
      await sql`DELETE FROM task_tags WHERE task_id = ${taskId};`;
      for (const tagIdOrName of payload.tags) {
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

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    const updated = await fetchTaskWithDetails(taskId);
    return { success: true, task: updated || undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar tarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Delete Task
 */
export async function deleteTaskAction(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`DELETE FROM tasks WHERE id = ${taskId};`;

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar tarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Convert Task Type (daily <-> habit <-> todo)
 */
export async function convertTaskTypeAction(
  taskId: string,
  targetType: "daily" | "habit" | "todo"
): Promise<{ success: boolean; newTask?: HabiticaTask; error?: string }> {
  try {
    const sql = getDb();
    await sql`
      UPDATE tasks
      SET type = ${targetType},
          updated_at = NOW()
      WHERE id = ${taskId};
    `;

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    const newTask = await fetchTaskWithDetails(taskId);
    return { success: true, newTask: newTask || undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al convertir tipo de tarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Toggle Rest at Inn (Sleep) - Kept for compatibility
 */
export async function toggleSleepAction(): Promise<{
  success: boolean;
  resting?: boolean;
  error?: string;
}> {
  return { success: true, resting: false };
}

/**
 * Server Action: Force Sync & Run Cron
 */
export async function syncHabiticaDataAction(): Promise<{ success: boolean }> {
  revalidatePath("/", "layout");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/projects");
  return { success: true };
}

/**
 * Server Action: Fetch Single Fresh Task
 */
export async function fetchSingleTaskAction(
  taskId: string,
  _skipCache: boolean = true
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const task = await fetchTaskWithDetails(taskId);
    if (!task) return { success: false, error: "Tarea no encontrada" };
    return { success: true, task };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener tarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Add Checklist Subtask Item
 */
export async function addChecklistItemAction(
  taskId: string,
  text: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const sql = getDb();
    const id = crypto.randomUUID();
    const cleanText = stripEmojis(text) || text;

    const [maxOrder] = await sql`
      SELECT COALESCE(MAX(order_index), -1)::int as max_order
      FROM task_checklists
      WHERE task_id = ${taskId};
    `;
    const nextOrder = (maxOrder?.max_order ?? -1) + 1;

    await sql`
      INSERT INTO task_checklists (id, task_id, text, completed, order_index, created_at)
      VALUES (${id}, ${taskId}, ${cleanText}, FALSE, ${nextOrder}, NOW());
    `;

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    const task = await fetchTaskWithDetails(taskId);
    return { success: true, task: task || undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al añadir subtarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Toggle Checklist Item Score
 */
export async function toggleChecklistItemAction(
  taskId: string,
  itemId: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const sql = getDb();
    await sql`
      UPDATE task_checklists
      SET completed = NOT completed
      WHERE id = ${itemId} AND task_id = ${taskId};
    `;

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    const task = await fetchTaskWithDetails(taskId);
    return { success: true, task: task || undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al marcar subtarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Delete Checklist Item
 */
export async function deleteChecklistItemAction(
  taskId: string,
  itemId: string
): Promise<{ success: boolean; task?: HabiticaTask; error?: string }> {
  try {
    const sql = getDb();
    await sql`
      DELETE FROM task_checklists
      WHERE id = ${itemId} AND task_id = ${taskId};
    `;

    revalidatePath("/", "layout");
    revalidatePath("/today");
    revalidatePath("/tasks");
    revalidatePath("/projects");

    const task = await fetchTaskWithDetails(taskId);
    return { success: true, task: task || undefined };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar subtarea";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Fetch Tags
 */
export async function fetchTagsAction(): Promise<HabiticaTag[]> {
  return getCachedTags();
}

/**
 * Server Action: Fetch complete dashboard data
 */
export async function fetchDashboardDataAction(): Promise<{
  user: HabiticaUser;
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  isConfigured: boolean;
}> {
  return getCachedDashboardData();
}
