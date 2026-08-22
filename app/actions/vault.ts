"use server";

import { ensureDatabaseSchema, getDb } from "@/lib/db";
import {
  generateS3FileKey,
  uploadBufferToS3,
  deleteFileFromS3,
  getPresignedDownloadUrl,
} from "@/lib/s3";
import {
  ProjectItem,
  VaultDashboardData,
  VaultItem,
  VaultItemCategory,
  VaultItemStatus,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Fetches all items in Brio Vault (Books, Sheet Music, Documents, Projects & Scratchpad).
 */
export async function fetchVaultDashboardDataAction(): Promise<VaultDashboardData> {
  const sql = getDb();

  // 1. Fetch vault items
  const rows = await sql`
    SELECT * FROM vault_items ORDER BY updated_at DESC;
  `;

  const allItems: VaultItem[] = rows.map((r: any) => {
    const fileUrl = r.file_key ? `/api/vault/file?id=${r.id}` : r.file_url || undefined;

    return {
      id: r.id,
      category: r.category as VaultItemCategory,
      title: r.title,
      authorOrCreator: r.author_or_creator || undefined,
      status: r.status as VaultItemStatus,
      instrument: r.instrument || undefined,
      difficulty: r.difficulty || undefined,
      platform: r.platform || undefined,
      url: r.url || undefined,
      coverUrl: r.cover_url || undefined,
      fileUrl,
      fileKey: r.file_key || undefined,
      fileName: r.file_name || undefined,
      fileSizeBytes: r.file_size_bytes ? Number(r.file_size_bytes) : undefined,
      progress: Number(r.progress) || 0,
      totalPages: r.total_pages ? Number(r.total_pages) : undefined,
      notes: r.notes || undefined,
      tags: Array.isArray(r.tags) ? r.tags : [],
      createdAt: r.created_at?.toString(),
      updatedAt: r.updated_at?.toString(),
    };
  });

  const books = allItems.filter((i) => i.category === "book");
  const sheetMusic = allItems.filter((i) => i.category === "sheet_music");
  const courses = allItems.filter((i) => i.category === "course");
  const resources = allItems.filter(
    (i) => i.category === "video" || i.category === "link" || i.category === "document"
  );
  const documents = allItems.filter((i) => i.category === "document");

  // 2. Fetch projects
  const projectRows = await sql`
    SELECT * FROM projects ORDER BY updated_at DESC;
  `;

  const projects: ProjectItem[] = projectRows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    status: r.status,
    techStack: Array.isArray(r.tech_stack) ? r.tech_stack : [],
    repoUrl: r.repo_url || undefined,
    liveUrl: r.live_url || undefined,
    progress: Number(r.progress) || 0,
    createdAt: r.created_at?.toString(),
  }));

  // 3. Fetch scratchpad
  const scratchRows = await sql`
    SELECT content FROM scratchpad_notes WHERE id = 'default' LIMIT 1;
  `;
  const scratchpadContent = scratchRows.length > 0 ? scratchRows[0].content || "" : "";

  return {
    books,
    sheetMusic,
    courses,
    resources,
    documents,
    projects,
    scratchpadContent,
    stats: {
      totalBooks: books.length,
      booksCompleted: books.filter((b) => b.status === "completed").length,
      totalSheetMusic: sheetMusic.length,
      sheetMusicMastered: sheetMusic.filter((s) => s.status === "completed").length,
      totalCourses: courses.length,
      coursesCompleted: courses.filter((c) => c.status === "completed").length,
      totalResources: resources.length,
      totalProjects: projects.length,
    },
  };
}

/**
 * Server Action: Creates a new Vault item with optional S3 file & cover upload.
 */
export async function createVaultItemAction(
  formData: FormData
): Promise<{ success: boolean; item?: VaultItem; error?: string }> {
  try {
    const title = (formData.get("title") as string)?.trim();
    const category = (formData.get("category") as VaultItemCategory) || "book";
    const authorOrCreator = (formData.get("authorOrCreator") as string)?.trim() || null;
    const status = (formData.get("status") as VaultItemStatus) || "backlog";
    const instrument = (formData.get("instrument") as string)?.trim() || null;
    const difficulty = (formData.get("difficulty") as string)?.trim() || null;
    const platform = (formData.get("platform") as string)?.trim() || null;
    const url = (formData.get("url") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const totalPages = parseInt(formData.get("totalPages") as string, 10) || null;
    const progress = parseInt(formData.get("progress") as string, 10) || 0;
    const tagsRaw = (formData.get("tags") as string)?.trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

    if (!title) {
      return { success: false, error: "El título es obligatorio." };
    }

    let fileUrl: string | null = null;
    let fileKey: string | null = null;
    let fileName: string | null = null;
    let fileSizeBytes: number | null = null;
    let coverUrl: string | null = (formData.get("coverUrl") as string)?.trim() || null;

    // 1. Process S3 main file upload (PDF/Document/Certificate)
    const file = formData.get("file") as File | null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const s3Folder = category === "sheet_music" ? "sheet_music" : category === "course" ? "courses" : "books";
      fileKey = generateS3FileKey(s3Folder, file.name);
      const s3Res = await uploadBufferToS3({
        buffer,
        key: fileKey,
        contentType: file.type || "application/pdf",
      });
      fileUrl = s3Res.fileUrl;
      fileName = file.name;
      fileSizeBytes = file.size;
    }

    // 2. Process S3 cover upload
    const coverFile = formData.get("coverFile") as File | null;
    if (coverFile && coverFile.size > 0) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverKey = generateS3FileKey("covers", coverFile.name);
      const coverRes = await uploadBufferToS3({
        buffer: coverBuffer,
        key: coverKey,
        contentType: coverFile.type || "image/jpeg",
      });
      coverUrl = coverRes.fileUrl;
    }

    await ensureDatabaseSchema();
    const sql = getDb();
    const id = `vault-${Date.now()}`;

    await sql`
      INSERT INTO vault_items (
        id, category, title, author_or_creator, status, instrument,
        difficulty, platform, url, cover_url, file_url, file_key, file_name, file_size_bytes,
        progress, total_pages, notes, tags, created_at, updated_at
      )
      VALUES (
        ${id},
        ${category},
        ${title},
        ${authorOrCreator},
        ${status},
        ${instrument},
        ${difficulty},
        ${platform},
        ${url},
        ${coverUrl},
        ${fileUrl},
        ${fileKey},
        ${fileName},
        ${fileSizeBytes},
        ${progress},
        ${totalPages},
        ${notes},
        ${JSON.stringify(tags)}::jsonb,
        NOW(),
        NOW()
      );
    `;

    revalidatePath("/");

    return {
      success: true,
      item: {
        id,
        category,
        title,
        authorOrCreator: authorOrCreator || undefined,
        status,
        instrument: instrument || undefined,
        difficulty: difficulty || undefined,
        platform: platform || undefined,
        url: url || undefined,
        coverUrl: coverUrl || undefined,
        fileUrl: fileKey ? `/api/vault/file?id=${id}` : fileUrl || undefined,
        fileKey: fileKey || undefined,
        fileName: fileName || undefined,
        fileSizeBytes: fileSizeBytes || undefined,
        progress,
        totalPages: totalPages || undefined,
        notes: notes || undefined,
        tags,
      },
    };
  } catch (error: any) {
    console.error("[Create Vault Item Error]:", error);
    return { success: false, error: error.message || "Error al crear el elemento en la bóveda." };
  }
}

/**
 * Server Action: Increments progress (pages read or lessons completed).
 */
export async function incrementVaultItemProgressAction(
  id: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    const rows = await sql`
      SELECT progress, total_pages, status FROM vault_items WHERE id = ${id} LIMIT 1;
    `;

    if (rows.length === 0) return { success: false, error: "Item no encontrado" };

    const item = rows[0];
    const currentProg = Number(item.progress) || 0;
    const total = Number(item.total_pages) || 0;
    const newProg = total > 0 ? Math.min(total, currentProg + amount) : currentProg + amount;
    const isCompleted = total > 0 && newProg >= total;

    await sql`
      UPDATE vault_items
      SET progress = ${newProg},
          status = CASE WHEN ${isCompleted} THEN 'completed' ELSE status END,
          updated_at = NOW()
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[Increment Progress Error]:", error);
    return { success: false, error: "No se pudo actualizar el progreso." };
  }
}

/**
 * Server Action: Quickly updates the Kanban column/status of a vault item.
 */
export async function updateVaultItemStatusAction(
  id: string,
  newStatus: VaultItemStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    await sql`
      UPDATE vault_items
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[Update Vault Item Status Error]:", error);
    return { success: false, error: "No se pudo actualizar el estado." };
  }
}

/**
 * Server Action: Updates vault item details and notes.
 */
export async function updateVaultItemAction(
  id: string,
  updates: {
    title?: string;
    authorOrCreator?: string;
    notes?: string;
    progress?: number;
    totalPages?: number;
    difficulty?: string;
    instrument?: string;
    status?: VaultItemStatus;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    await sql`
      UPDATE vault_items
      SET title = COALESCE(${updates.title ?? null}, title),
          author_or_creator = COALESCE(${updates.authorOrCreator ?? null}, author_or_creator),
          notes = COALESCE(${updates.notes ?? null}, notes),
          progress = COALESCE(${updates.progress ?? null}, progress),
          total_pages = COALESCE(${updates.totalPages ?? null}, total_pages),
          difficulty = COALESCE(${updates.difficulty ?? null}, difficulty),
          instrument = COALESCE(${updates.instrument ?? null}, instrument),
          status = COALESCE(${updates.status ?? null}, status),
          updated_at = NOW()
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[Update Vault Item Error]:", error);
    return { success: false, error: "No se pudo actualizar el elemento." };
  }
}

/**
 * Server Action: Deletes a vault item and its attached file from AWS S3.
 */
export async function deleteVaultItemAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDatabaseSchema();
    const sql = getDb();

    // Check if there is an S3 file key
    const rows = await sql`
      SELECT file_key FROM vault_items WHERE id = ${id} LIMIT 1;
    `;

    if (rows.length > 0 && rows[0].file_key) {
      await deleteFileFromS3(rows[0].file_key);
    }

    await sql`
      DELETE FROM vault_items WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[Delete Vault Item Error]:", error);
    return { success: false, error: "No se pudo eliminar el elemento." };
  }
}
