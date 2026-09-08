"use server";

import { getDb } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { parseNotionUrl, syncNotionTasksToHabitica } from "@/lib/notion";
import { revalidatePath } from "next/cache";

export interface SaveNotionIntegrationParams {
  projectId: string;
  tokenV2: string;
  userId?: string;
  notionUrl: string;
}

/**
 * Server Action: Encrypts sensitive session token and saves Notion configuration to Neon DB.
 */
export async function saveNotionIntegrationAction(params: SaveNotionIntegrationParams) {
  const { projectId, tokenV2, userId, notionUrl } = params;

  if (!projectId || !tokenV2 || !notionUrl) {
    return { success: false, error: "Faltan datos requeridos para la integración." };
  }

  const { pageId, collectionViewId } = parseNotionUrl(notionUrl);
  if (!pageId) {
    return {
      success: false,
      error: "No se pudo extraer el ID de la página desde la URL de Notion proporcionada.",
    };
  }

  const encryptedToken = encryptSecret(tokenV2.trim());

  const notionConfig = {
    enabled: true,
    provider: "notion",
    mode: "token_v2",
    encryptedToken,
    userId: userId?.trim() || undefined,
    url: notionUrl.trim(),
    pageId,
    collectionViewId,
    updatedAt: new Date().toISOString(),
  };

  const sql = getDb();

  // Ensure column exists
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}'::jsonb;`;

  // Update projects table with jsonb_set or merging integrations
  await sql`
    UPDATE projects
    SET integrations = COALESCE(integrations, '{}'::jsonb) || jsonb_build_object('notion', ${JSON.stringify(notionConfig)}::jsonb),
        updated_at = NOW()
    WHERE id = ${projectId};
  `;

  revalidatePath("/today");
  revalidatePath("/projects");

  return { success: true };
}

/**
 * Server Action: Synchronizes tasks on demand from Notion to Habitica for a specific project.
 */
export async function syncProjectFromNotionAction(projectId: string) {
  const sql = getDb();

  // Ensure column exists
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}'::jsonb;`;

  const rows = await sql`
    SELECT id, title, canonical_prefix, integrations 
    FROM projects 
    WHERE id = ${projectId} 
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) {
    return { success: false, error: "Proyecto no encontrado." };
  }

  const project = rows[0];
  const integrations = (project.integrations as Record<string, any>) || {};
  const notionConfig = integrations.notion;

  if (!notionConfig || !notionConfig.encryptedToken) {
    return {
      success: false,
      error: "El proyecto no tiene configurada la integración de Notion.",
    };
  }

  let decryptedToken = "";
  try {
    decryptedToken = decryptSecret(notionConfig.encryptedToken);
  } catch (err) {
    return {
      success: false,
      error: "Error al descifrar las credenciales de Notion.",
    };
  }

  const syncResult = await syncNotionTasksToHabitica({
    config: {
      tokenV2: decryptedToken,
      userId: notionConfig.userId,
      pageId: notionConfig.pageId,
      collectionId: notionConfig.collectionId,
      collectionViewId: notionConfig.collectionViewId,
      url: notionConfig.url,
    },
    canonicalPrefix: project.canonical_prefix || "[UNPO]",
  });

  // Update lastSyncedAt
  if (syncResult.success) {
    const updatedNotion = {
      ...notionConfig,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStats: {
        totalFound: syncResult.totalFound,
        createdCount: syncResult.createdCount,
        skippedCount: syncResult.skippedCount,
      },
    };

    await sql`
      UPDATE projects
      SET integrations = COALESCE(integrations, '{}'::jsonb) || jsonb_build_object('notion', ${JSON.stringify(updatedNotion)}::jsonb),
          updated_at = NOW()
      WHERE id = ${projectId};
    `;

    revalidatePath("/today");
    revalidatePath("/projects");
  }

  return syncResult;
}
