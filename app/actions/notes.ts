"use server";

import { getDb } from "@/lib/db";
import { generateS3FileKey, uploadBufferToS3 } from "@/lib/s3";
import { ContextualNote, NoteCategory } from "@/lib/types";
import { revalidatePath } from "next/cache";

interface ContextualNoteDbRow {
  id: string;
  project_id: string;
  task_id?: string;
  title: string;
  content: string;
  category: string;
  tags?: string[] | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Initializes the contextual_notes table if not exists.
 */
async function ensureNotesTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS contextual_notes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      task_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'idea',
      tags JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
}

/**
 * Server Action: Fetches all contextual notes, optionally filtered by project and/or task.
 */
export async function fetchContextualNotesAction(
  projectId?: string,
  taskId?: string
): Promise<ContextualNote[]> {
  try {
    await ensureNotesTable();
    const sql = getDb();

    let rows: ContextualNoteDbRow[];

    if (projectId && taskId) {
      rows = (await sql`
        SELECT * FROM contextual_notes 
        WHERE project_id = ${projectId} AND task_id = ${taskId}
        ORDER BY updated_at DESC;
      `) as unknown as ContextualNoteDbRow[];
    } else if (projectId) {
      rows = (await sql`
        SELECT * FROM contextual_notes 
        WHERE project_id = ${projectId}
        ORDER BY updated_at DESC;
      `) as unknown as ContextualNoteDbRow[];
    } else if (taskId) {
      rows = (await sql`
        SELECT * FROM contextual_notes 
        WHERE task_id = ${taskId}
        ORDER BY updated_at DESC;
      `) as unknown as ContextualNoteDbRow[];
    } else {
      rows = (await sql`
        SELECT * FROM contextual_notes 
        ORDER BY updated_at DESC;
      `) as unknown as ContextualNoteDbRow[];
    }

    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      taskId: r.task_id || undefined,
      title: r.title,
      content: r.content,
      category: (r.category || "idea") as NoteCategory,
      tags: Array.isArray(r.tags) ? r.tags : [],
      createdAt: r.created_at?.toString() || new Date().toISOString(),
      updatedAt: r.updated_at?.toString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("[Fetch Contextual Notes Error]:", error);
    return [];
  }
}

/**
 * Server Action: Creates or updates a contextual note.
 */
export async function saveContextualNoteAction(payload: {
  id?: string;
  projectId: string;
  taskId?: string;
  title: string;
  content: string;
  category?: NoteCategory;
  tags?: string[];
}): Promise<{ success: boolean; note?: ContextualNote; error?: string }> {
  try {
    await ensureNotesTable();
    const sql = getDb();

    const noteId = payload.id || `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const category = payload.category || "idea";
    const tagsJson = JSON.stringify(payload.tags || []);
    const taskIdVal = payload.taskId || null;

    const rows = (await sql`
      INSERT INTO contextual_notes (
        id, project_id, task_id, title, content, category, tags, created_at, updated_at
      ) VALUES (
        ${noteId}, ${payload.projectId}, ${taskIdVal}, ${payload.title}, ${payload.content},
        ${category}, ${tagsJson}::jsonb, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        project_id = ${payload.projectId},
        task_id = ${taskIdVal},
        title = ${payload.title},
        content = ${payload.content},
        category = ${category},
        tags = ${tagsJson}::jsonb,
        updated_at = NOW()
      RETURNING *;
    `) as unknown as ContextualNoteDbRow[];

    revalidatePath("/");
    revalidatePath("/today");
    revalidatePath("/vault");
    revalidatePath("/projects");

    if (rows.length > 0) {
      const r = rows[0];
      return {
        success: true,
        note: {
          id: r.id,
          projectId: r.project_id,
          taskId: r.task_id || undefined,
          title: r.title,
          content: r.content,
          category: (r.category || "idea") as NoteCategory,
          tags: Array.isArray(r.tags) ? r.tags : [],
          createdAt: r.created_at?.toString() || new Date().toISOString(),
          updatedAt: r.updated_at?.toString() || new Date().toISOString(),
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Save Contextual Note Error]:", error);
    return { success: false, error: "Failed to save contextual note" };
  }
}

/**
 * Server Action: Deletes a contextual note by ID.
 */
export async function deleteContextualNoteAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`DELETE FROM contextual_notes WHERE id = ${id};`;

    revalidatePath("/");
    revalidatePath("/today");
    return { success: true };
  } catch (error) {
    console.error("[Delete Contextual Note Error]:", error);
    return { success: false, error: "Failed to delete note" };
  }
}

/**
 * Server Action: Uploads an image for contextual task notes and returns a persistent streaming URL.
 */
export async function uploadNoteImageAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; key?: string; fileName?: string; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No se seleccionó ningún archivo." };
    }

    if (file.size > 20 * 1024 * 1024) {
      return { success: false, error: "La imagen excede el límite de 20MB." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateS3FileKey("notes", file.name || "captura.png");
    const contentType = file.type || "image/png";

    await uploadBufferToS3({
      buffer,
      key,
      contentType,
    });

    // We use the streaming endpoint /api/vault/file?key=... which is permanent and does not expire
    const persistentUrl = `/api/vault/file?key=${encodeURIComponent(key)}`;

    return {
      success: true,
      url: persistentUrl,
      key,
      fileName: file.name || "imagen.png",
    };
  } catch (error) {
    console.error("[Upload Note Image Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al subir la imagen.",
    };
  }
}
