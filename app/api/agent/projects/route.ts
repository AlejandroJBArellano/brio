import { createProjectAction, fetchProjectsPageDataAction } from "@/app/actions/projects";
import { verifyAgentAuth } from "@/lib/agentAuth";
import { ProjectStatus } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * GET /api/agent/projects
 * Returns all active projects in Brio.
 */
export async function GET(request: Request) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { projects } = await fetchProjectsPageDataAction();
    return NextResponse.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("[Agent API GET Projects Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/projects
 * Creates a new project in Brio.
 */
export async function POST(request: Request) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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

    const description = body.description || undefined;
    const status: ProjectStatus = body.status || "in_progress";
    const techStack = Array.isArray(body.techStack) ? body.techStack : [];
    const taskPrefixes = Array.isArray(body.taskPrefixes) ? body.taskPrefixes : [];
    const canonicalPrefix = body.canonicalPrefix || (body.prefix ? `[${body.prefix.replace(/[\[\]]/g, "").trim()}]` : `[${title}]`);
    const repoUrl = body.repoUrl || undefined;
    const liveUrl = body.liveUrl || undefined;
    const progress = typeof body.progress === "number" ? body.progress : 0;

    const res = await createProjectAction({
      title,
      description,
      status,
      techStack,
      taskPrefixes,
      canonicalPrefix,
      repoUrl,
      liveUrl,
      progress,
    });

    if (!res.success) {
      return NextResponse.json(
        { error: res.error || "Failed to create project." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        project: {
          title,
          description,
          status,
          techStack,
          taskPrefixes,
          canonicalPrefix,
          repoUrl,
          liveUrl,
          progress,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Agent API POST Project Error]:", error);
    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 }
    );
  }
}
