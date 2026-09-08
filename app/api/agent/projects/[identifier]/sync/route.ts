import { resolveProject, verifyAgentAuth } from "@/lib/agentAuth";
import { syncProjectFromNotionAction } from "@/app/actions/projectIntegrations";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ identifier: string }> }
) {
  const auth = verifyAgentAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { identifier } = await context.params;
  const project = await resolveProject(identifier);

  if (!project) {
    return NextResponse.json(
      {
        error: `Proyecto no encontrado con el identificador: '${identifier}'.`,
      },
      { status: 404 }
    );
  }

  const result = await syncProjectFromNotionAction(project.id);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error || "Fallo en la sincronización de Notion.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    project: project.title,
    canonicalPrefix: project.canonicalPrefix,
    totalFound: result.totalFound,
    createdCount: result.createdCount,
    skippedCount: result.skippedCount,
    createdTasks: result.createdTasks,
  });
}
