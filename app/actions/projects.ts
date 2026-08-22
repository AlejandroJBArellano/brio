"use server";

import { ensureDatabaseSchema, getDb } from "@/lib/db";
import {
  LearningItem,
  LearningItemType,
  LearningStatus,
  ProjectItem,
  ProjectsDashboardData,
  ProjectStatus,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Fetches all projects, learning items, and scratchpad content.
 */
export async function fetchProjectsDashboardDataAction(): Promise<ProjectsDashboardData> {
  const sql = getDb();

  // 1. Fetch projects
  const projectRows = await sql`
    SELECT * FROM projects ORDER BY created_at DESC;
  `;

  const projects: ProjectItem[] = projectRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || undefined,
    status: p.status as ProjectStatus,
    techStack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
    repoUrl: p.repo_url || undefined,
    liveUrl: p.live_url || undefined,
    progress: Number(p.progress) || 0,
    createdAt: p.created_at?.toString(),
  }));

  // 2. Fetch learning items (Books & Courses)
  const learningRows = await sql`
    SELECT * FROM learning_items ORDER BY created_at DESC;
  `;

  const learningItems: LearningItem[] = learningRows.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type as LearningItemType,
    author: l.author || undefined,
    currentProgress: Number(l.current_progress) || 0,
    totalProgress: Number(l.total_progress) || 100,
    keyTakeaways: l.key_takeaways || undefined,
    status: l.status as LearningStatus,
    createdAt: l.created_at?.toString(),
  }));

  // 3. Fetch scratchpad
  const scratchRows = await sql`
    SELECT content FROM scratchpad_notes WHERE id = 'default' LIMIT 1;
  `;

  const scratchpadContent =
    scratchRows.length > 0
      ? scratchRows[0].content || ""
      : "# 📝 Scratchpad & Brain Vault\n\n- [ ] Revisar métricas semanales\n- Idea de side project: Generador de contratos con IA\n- Nota: Configurar webhook de Google Calendar";

  return {
    projects,
    learningItems,
    scratchpadContent,
  };
}

/**
 * Server Action: Creates a new project in the backlog.
 */
export async function createProjectAction(payload: {
  title: string;
  description?: string;
  status?: ProjectStatus;
  techStack?: string[];
  repoUrl?: string;
  liveUrl?: string;
  progress?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const id = `prj-${Date.now()}`;

    await sql`
      INSERT INTO projects (id, title, description, status, tech_stack, repo_url, live_url, progress)
      VALUES (${id}, ${payload.title}, ${payload.description || null}, ${payload.status || "idea"}, ${JSON.stringify(payload.techStack || [])}::jsonb, ${payload.repoUrl || null}, ${payload.liveUrl || null}, ${payload.progress || 0});
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Create Project Error]:", error);
    return { success: false, error: "Failed to create project" };
  }
}

/**
 * Server Action: Updates project status or progress.
 */
export async function updateProjectStatusAction(
  id: string,
  status: ProjectStatus,
  progress?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    if (progress !== undefined) {
      await sql`
        UPDATE projects
        SET status = ${status}, progress = ${progress}, updated_at = NOW()
        WHERE id = ${id};
      `;
    } else {
      await sql`
        UPDATE projects
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id};
      `;
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Project Error]:", error);
    return { success: false, error: "Failed to update project" };
  }
}

/**
 * Server Action: Deletes a project.
 */
export async function deleteProjectAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    await sql`DELETE FROM projects WHERE id = ${id};`;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Project Error]:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

/**
 * Server Action: Creates a new learning item (book/course).
 */
export async function createLearningItemAction(payload: {
  title: string;
  type: LearningItemType;
  author?: string;
  totalProgress?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    const id = `lrn-${Date.now()}`;

    await sql`
      INSERT INTO learning_items (id, title, type, author, current_progress, total_progress, status)
      VALUES (${id}, ${payload.title}, ${payload.type}, ${payload.author || null}, 0, ${payload.totalProgress || 100}, 'reading');
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Create Learning Item Error]:", error);
    return { success: false, error: "Failed to create learning item" };
  }
}

/**
 * Server Action: Updates reading/course progress.
 */
export async function updateLearningProgressAction(
  id: string,
  currentProgress: number,
  keyTakeaways?: string,
  status?: LearningStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    await sql`
      UPDATE learning_items
      SET current_progress = ${currentProgress},
          key_takeaways = COALESCE(${keyTakeaways || null}, key_takeaways),
          status = COALESCE(${status || null}, status)
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Learning Progress Error]:", error);
    return { success: false, error: "Failed to update learning progress" };
  }
}

/**
 * Server Action: Deletes a learning item.
 */
export async function deleteLearningItemAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();
    await sql`DELETE FROM learning_items WHERE id = ${id};`;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Learning Item Error]:", error);
    return { success: false, error: "Failed to delete learning item" };
  }
}

/**
 * Server Action: Saves scratchpad content to Neon DB.
 */
export async function saveScratchpadAction(
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    await sql`
      INSERT INTO scratchpad_notes (id, content, updated_at)
      VALUES ('default', ${content}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET content = ${content}, updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Save Scratchpad Error]:", error);
    return { success: false, error: "Failed to save scratchpad" };
  }
}
