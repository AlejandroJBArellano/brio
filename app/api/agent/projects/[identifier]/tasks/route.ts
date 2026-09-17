import { resolveProject, verifyAgentAuth } from "@/lib/agentAuth";
import { getCachedTasksWithCompleted } from "@/lib/dal/tasks";
import { getDb } from "@/lib/db";
import { getProjectKeywords, matchTasksToProject } from "@/lib/projectMatcher";
import { HabiticaTask } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ identifier: string }>;
}

const PRIORITY_MAP: Record<string, number> = {
  trivial: 0.1,
  easy: 1,
  medium: 1.5,
  hard: 2,
  urgent: 2,
};

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
 * GET /api/agent/projects/[identifier]/tasks
 * Returns tasks for the resolved project, with optional ?status=pending|completed|all filter.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { identifier } = await context.params;
  const project = await resolveProject(identifier);

  if (!project) {
    return NextResponse.json(
      {
        error: `Project '${identifier}' not found in Brio.`,
        hint: "Verify project title or canonical prefix in Brio.",
      },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "pending";

  try {
    const allTasks = await getCachedTasksWithCompleted();
    const metrics = matchTasksToProject(project, allTasks);

    let filteredTasks: HabiticaTask[] = metrics.matchedTasks;
    if (statusFilter === "pending") {
      filteredTasks = metrics.matchedTasks.filter((t) => !t.completed);
    } else if (statusFilter === "completed") {
      filteredTasks = metrics.matchedTasks.filter((t) => t.completed);
    }

    const { canonicalPrefix } = getProjectKeywords(project);

    // Format tasks cleanly
    const tasks = filteredTasks.map((t) => {
      let cleanTitle = t.text;
      if (cleanTitle.startsWith(canonicalPrefix)) {
        cleanTitle = cleanTitle.slice(canonicalPrefix.length).trim();
      }

      return {
        id: t.id,
        title: cleanTitle,
        rawTitle: t.text,
        completed: t.completed,
        notes: t.notes || "",
        priority: t.priority,
        tags: t.tags || [],
        checklist: (t.checklist || []).map((c) => ({
          id: c.id,
          text: c.text,
          completed: c.completed,
        })),
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        canonicalPrefix,
        progressPercent: metrics.progressPercent,
      },
      counts: {
        total: metrics.totalCount,
        pending: metrics.pendingCount,
        completed: metrics.completedCount,
      },
      tasks,
    });
  } catch (error) {
    console.error("[Agent API GET Tasks Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch project tasks from database." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/projects/[identifier]/tasks
 * Creates a new task in PostgreSQL with the project's canonical prefix, markdown notes, and checklist items.
 */
export async function POST(request: Request, context: RouteContext) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { identifier } = await context.params;
  const project = await resolveProject(identifier);

  if (!project) {
    return NextResponse.json(
      { error: `Project '${identifier}' not found in Brio.` },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const title = (body.title || "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Field 'title' is required." },
        { status: 400 }
      );
    }

    const { canonicalPrefix } = getProjectKeywords(project);

    // Inject canonical prefix if missing
    const rawTitle = title.startsWith(canonicalPrefix)
      ? title
      : `${canonicalPrefix} ${title}`;

    const cleanTitle = stripEmojis(rawTitle);
    const cleanNotes = stripEmojis(body.notes || "");

    // Resolve priority
    let priorityNum = 1.5;
    if (typeof body.priority === "number") {
      priorityNum = body.priority;
    } else if (typeof body.priority === "string") {
      const pKey = body.priority.toLowerCase().replace("!", "");
      if (PRIORITY_MAP[pKey] !== undefined) {
        priorityNum = PRIORITY_MAP[pKey];
      }
    }

    const sql = getDb();
    const taskId = crypto.randomUUID();

    await sql`
      INSERT INTO tasks (
        id, text, notes, type, priority, completed,
        project_id, created_at, updated_at
      ) VALUES (
        ${taskId}, ${cleanTitle}, ${cleanNotes}, 'todo', ${priorityNum},
        FALSE, ${project.id}, NOW(), NOW()
      );
    `;

    // Add checklist items if provided
    const checklistInputs = Array.isArray(body.checklist) ? body.checklist : [];
    const addedChecklist: Array<{ id: string; text: string; completed: boolean }> = [];

    for (let i = 0; i < checklistInputs.length; i++) {
      const item = checklistInputs[i];
      const itemText = typeof item === "string" ? item.trim() : item?.text?.trim();
      if (itemText) {
        const cleanItemText = stripEmojis(itemText);
        const chkId = crypto.randomUUID();
        await sql`
          INSERT INTO task_checklists (id, task_id, text, completed, order_index, created_at)
          VALUES (${chkId}, ${taskId}, ${cleanItemText}, FALSE, ${i}, NOW());
        `;
        addedChecklist.push({
          id: chkId,
          text: cleanItemText,
          completed: false,
        });
      }
    }

    // Add tags if provided
    if (Array.isArray(body.tags) && body.tags.length > 0) {
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

    revalidatePath("/");
    revalidatePath("/projects");

    return NextResponse.json(
      {
        success: true,
        task: {
          id: taskId,
          title: title.startsWith(canonicalPrefix)
            ? title.slice(canonicalPrefix.length).trim()
            : title,
          rawTitle: cleanTitle,
          completed: false,
          notes: cleanNotes,
          priority: priorityNum,
          checklist: addedChecklist,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Agent API POST Task Error]:", error);
    return NextResponse.json(
      { error: "Failed to create task in PostgreSQL." },
      { status: 500 }
    );
  }
}
