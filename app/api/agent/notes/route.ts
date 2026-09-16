import { fetchContextualNotesAction, saveContextualNoteAction } from "@/app/actions/notes";
import { resolveProject, verifyAgentAuth } from "@/lib/agentAuth";
import { NoteCategory } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * GET /api/agent/notes
 * Returns contextual notes, optionally filtered by project and/or task.
 */
export async function GET(request: Request) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const projectParam = searchParams.get("project") || searchParams.get("projectId");
  const taskId = searchParams.get("taskId") || undefined;

  let projectId: string | undefined = undefined;
  if (projectParam) {
    const project = await resolveProject(projectParam);
    projectId = project ? project.id : projectParam;
  }

  try {
    const notes = await fetchContextualNotesAction(projectId, taskId);
    return NextResponse.json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("[Agent API GET Notes Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch contextual notes." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/notes
 * Creates or updates a contextual note attached to a project and/or task.
 */
export async function POST(request: Request) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    const content = (body.content || "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Field 'title' is required." },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json(
        { error: "Field 'content' is required." },
        { status: 400 }
      );
    }

    let projectId = body.projectId || "default_project";
    if (body.project) {
      const resolved = await resolveProject(body.project);
      if (resolved) {
        projectId = resolved.id;
      } else if (!body.projectId) {
        projectId = body.project;
      }
    }

    const category: NoteCategory = body.category || "technical";
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const taskId = body.taskId || undefined;

    const res = await saveContextualNoteAction({
      id: body.id,
      projectId,
      taskId,
      title,
      content,
      category,
      tags,
    });

    if (!res.success) {
      return NextResponse.json(
        { error: res.error || "Failed to save contextual note." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        note: res.note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Agent API POST Note Error]:", error);
    return NextResponse.json(
      { error: "Failed to create contextual note." },
      { status: 500 }
    );
  }
}
