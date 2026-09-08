import { resolveProject, verifyAgentAuth } from "@/lib/agentAuth";
import { habiticaClient } from "@/lib/habitica";
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
    const rawTasks = await habiticaClient.getUserTasks("todos");
    const metrics = matchTasksToProject(project, rawTasks);

    let filteredTasks: HabiticaTask[] = metrics.matchedTasks;
    if (statusFilter === "pending") {
      filteredTasks = metrics.matchedTasks.filter((t) => !t.completed);
    } else if (statusFilter === "completed") {
      filteredTasks = metrics.matchedTasks.filter((t) => t.completed);
    }

    const { canonicalPrefix } = getProjectKeywords(project);

    // Format tasks cleanly
    const tasks = filteredTasks.map((t) => {
      // Strip canonical prefix for clean title
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
      { error: "Failed to fetch project tasks from Habitica." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/projects/[identifier]/tasks
 * Creates a new task in Habitica with the project's canonical prefix, markdown notes, and checklist items.
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
    const finalTitle = title.startsWith(canonicalPrefix)
      ? title
      : `${canonicalPrefix} ${title}`;

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

    // Create main task in Habitica
    const created = await habiticaClient.createTask({
      text: finalTitle,
      type: "todo",
      notes: body.notes || "",
      priority: priorityNum,
      tags: Array.isArray(body.tags) ? body.tags : [],
    });

    // Add checklist items if provided
    const checklistInputs = Array.isArray(body.checklist) ? body.checklist : [];
    const addedChecklist: Array<{ id: string; text: string; completed: boolean }> = [];

    for (const item of checklistInputs) {
      const itemText = typeof item === "string" ? item.trim() : item?.text?.trim();
      if (itemText) {
        try {
          const updated = await habiticaClient.createChecklistItem(created.id, itemText);
          const newItem = (updated.checklist || []).slice(-1)[0];
          if (newItem) {
            addedChecklist.push({
              id: newItem.id || "",
              text: newItem.text,
              completed: newItem.completed ?? false,
            });
          }
        } catch (chkErr) {
          console.warn(`[Failed to create checklist item "${itemText}"]:`, chkErr);
        }
      }
    }

    revalidatePath("/");
    revalidatePath("/projects");

    return NextResponse.json(
      {
        success: true,
        task: {
          id: created.id,
          title: title.startsWith(canonicalPrefix)
            ? title.slice(canonicalPrefix.length).trim()
            : title,
          rawTitle: created.text,
          completed: created.completed,
          notes: created.notes || "",
          priority: created.priority,
          checklist: addedChecklist.length > 0 ? addedChecklist : created.checklist || [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Agent API POST Task Error]:", error);
    return NextResponse.json(
      { error: "Failed to create task in Habitica." },
      { status: 500 }
    );
  }
}
