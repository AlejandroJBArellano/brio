"use server";

import { getDb } from "@/lib/db";
import {
  HabiticaTag,
  HabiticaTask,
  LearningItem,
  LearningItemType,
  LearningStatus,
  ProjectItem,
  ProjectsDashboardData,
  ProjectStatus,
} from "@/lib/types";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import { getCachedHabiticaTags, getCachedHabiticaTasks } from "@/lib/dal/habitica";
import { revalidatePath } from "next/cache";

interface ProjectDbRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  tech_stack?: string[];
  repo_url?: string;
  live_url?: string;
  progress?: number | string;
  task_prefixes?: string[];
  canonical_prefix?: string;
  created_at?: Date | string;
}

interface LearningDbRow {
  id: string;
  title: string;
  type: string;
  author?: string;
  current_progress?: number | string;
  total_progress?: number | string;
  key_takeaways?: string;
  status: string;
  created_at?: Date | string;
}

interface ScratchpadDbRow {
  content?: string;
}

export interface ProjectsPageData {
  projects: ProjectItem[];
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
}

/**
 * Server Action: Fetches all projects with Habitica tasks and tags for the dedicated /projects page.
 */
export async function fetchProjectsPageDataAction(): Promise<ProjectsPageData> {
  const sql = getDb();

  const [projectRows, tasks, tags] = await Promise.all([
    sql`SELECT * FROM projects ORDER BY updated_at DESC;`,
    getCachedHabiticaTasks().catch(() => []),
    getCachedHabiticaTags().catch(() => []),
  ]);

  const projects: ProjectItem[] = (projectRows as unknown as ProjectDbRow[]).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || undefined,
    status: p.status as ProjectStatus,
    techStack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
    repoUrl: p.repo_url || undefined,
    liveUrl: p.live_url || undefined,
    progress: Number(p.progress) || 0,
    taskPrefixes: Array.isArray(p.task_prefixes) ? p.task_prefixes : [],
    canonicalPrefix: p.canonical_prefix || undefined,
    createdAt: p.created_at?.toString(),
  }));

  return {
    projects,
    tasks,
    tags,
  };
}

/**
 * Server Action: Fetches all projects, learning items, and scratchpad content concurrently.
 */
export async function fetchProjectsDashboardDataAction(): Promise<ProjectsDashboardData> {
  const sql = getDb();

  const [projectRows, learningRows, scratchRows] = await Promise.all([
    sql`SELECT * FROM projects ORDER BY created_at DESC;`,
    sql`SELECT * FROM learning_items ORDER BY created_at DESC;`,
    sql`SELECT content FROM scratchpad_notes WHERE id = 'default' LIMIT 1;`,
  ]);

  const projects: ProjectItem[] = (projectRows as unknown as ProjectDbRow[]).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || undefined,
    status: p.status as ProjectStatus,
    techStack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
    repoUrl: p.repo_url || undefined,
    liveUrl: p.live_url || undefined,
    progress: Number(p.progress) || 0,
    taskPrefixes: Array.isArray(p.task_prefixes) ? p.task_prefixes : [],
    canonicalPrefix: p.canonical_prefix || undefined,
    createdAt: p.created_at?.toString(),
  }));

  const learningItems: LearningItem[] = (learningRows as unknown as LearningDbRow[]).map((l) => ({
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

  const scratchpadContent =
    scratchRows.length > 0
      ? (scratchRows[0] as unknown as ScratchpadDbRow).content || ""
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
  taskPrefixes?: string[];
  canonicalPrefix?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const id = `prj-${Date.now()}`;
    const techStackJson = JSON.stringify(payload.techStack || []);
    const prefixesJson = JSON.stringify(payload.taskPrefixes || []);

    await sql`
      INSERT INTO projects (
        id, title, description, status, tech_stack, repo_url, live_url, progress, task_prefixes, canonical_prefix
      ) VALUES (
        ${id}, 
        ${payload.title}, 
        ${payload.description || null}, 
        ${payload.status || "idea"}, 
        ${techStackJson}::jsonb, 
        ${payload.repoUrl || null}, 
        ${payload.liveUrl || null}, 
        ${payload.progress || 0},
        ${prefixesJson}::jsonb,
        ${payload.canonicalPrefix || null}
      );
    `;

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/vault");
    revalidatePath("/today");
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
    const sql = getDb();

    let projectTitle = "Proyecto";
    if (status === "launched") {
      const rows = await sql`SELECT title FROM projects WHERE id = ${id} LIMIT 1;`;
      if (rows.length > 0) {
        projectTitle = (rows[0].title as string) || projectTitle;
      }
    }

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

    if (status === "launched") {
      await awardHabiticaEvent("PROJECT_COMPLETED", {
        customTitle: `Proyecto: ${projectTitle}`,
        customNotes: `Proyecto completado y lanzado en Brio`,
      });
    }

    revalidatePath("/");
    revalidatePath("/vault");
    revalidatePath("/projects");
    revalidatePath("/today");
    return { success: true };
  } catch (error) {
    console.error("[Update Project Error]:", error);
    return { success: false, error: "Failed to update project" };
  }
}

/**
 * Server Action: Updates complete details of a project.
 */
export async function updateProjectDetailsAction(payload: {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  techStack?: string[];
  repoUrl?: string;
  liveUrl?: string;
  progress?: number;
  taskPrefixes?: string[];
  canonicalPrefix?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const techStackJson = JSON.stringify(payload.techStack || []);
    const prefixesJson = JSON.stringify(payload.taskPrefixes || []);

    await sql`
      UPDATE projects
      SET title = ${payload.title},
          description = ${payload.description || null},
          status = ${payload.status},
          tech_stack = ${techStackJson}::jsonb,
          repo_url = ${payload.repoUrl || null},
          live_url = ${payload.liveUrl || null},
          progress = ${payload.progress ?? 0},
          task_prefixes = ${prefixesJson}::jsonb,
          canonical_prefix = ${payload.canonicalPrefix || null},
          updated_at = NOW()
      WHERE id = ${payload.id};
    `;

    revalidatePath("/");
    revalidatePath("/vault");
    revalidatePath("/projects");
    revalidatePath("/today");
    return { success: true };
  } catch (error) {
    console.error("[Update Project Details Error]:", error);
    return { success: false, error: "Failed to update project details" };
  }
}

/**
 * Server Action: Deletes a project.
 */
export async function deleteProjectAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`DELETE FROM projects WHERE id = ${id};`;
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/vault");
    revalidatePath("/today");
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
    const sql = getDb();

    const rows = await sql`
      SELECT title, type, total_progress FROM learning_items WHERE id = ${id} LIMIT 1;
    `;
    const itemTitle = rows.length > 0 ? (rows[0].title as string) : "Estudio";
    const itemType = rows.length > 0 ? (rows[0].type as string) : "Curso";
    const totalProg = rows.length > 0 ? Number(rows[0].total_progress) || 100 : 100;

    const isFinished = status === "completed" || currentProgress >= totalProg;
    const finalStatus = isFinished ? "completed" : status;

    await sql`
      UPDATE learning_items
      SET current_progress = ${currentProgress},
          key_takeaways = COALESCE(${keyTakeaways || null}, key_takeaways),
          status = COALESCE(${finalStatus || null}, status)
      WHERE id = ${id};
    `;

    // Award Habitica XP for study session
    await awardHabiticaEvent("VAULT_PROGRESS", {
      customNotes: `Progreso en "${itemTitle}" (${currentProgress}/${totalProg})`,
    });

    if (isFinished) {
      await awardHabiticaEvent("VAULT_COMPLETED", {
        customTitle: `${itemTitle} (${itemType})`,
        customNotes: `Completado al 100%`,
      });
    }

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
