import { habiticaClient } from "./habitica";
import { getCachedHabiticaTasks } from "./dal/habitica";
import { HabiticaTask } from "./types";

export interface NotionTaskItem {
  id: string;
  title: string;
  status: string;
  priority?: string;
  category?: string;
  ticketId?: string;
}

export interface NotionSyncConfig {
  tokenV2: string;
  userId?: string;
  pageId: string;
  collectionId?: string;
  collectionViewId?: string;
  url?: string;
}

export interface NotionSyncResult {
  success: boolean;
  totalFound: number;
  createdCount: number;
  skippedCount: number;
  error?: string;
  createdTasks: string[];
}

/**
 * Normalizes UUID strings with standard hyphens (8-4-4-4-12)
 */
function normalizeUuid(id: string): string {
  const clean = id.replace(/-/g, "").trim();
  if (clean.length !== 32) return id;
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

/**
 * Extracts pageId and collectionViewId from any Notion URL format.
 */
export function parseNotionUrl(url: string): { pageId?: string; collectionViewId?: string } {
  try {
    const parsed = new URL(url);
    const vParam = parsed.searchParams.get("v");
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1] || "";

    // Extract 32-hex characters from the last path segment
    const pageMatch = lastSegment.match(/([a-f0-9]{32})$/i);
    const pageId = pageMatch ? normalizeUuid(pageMatch[1]) : undefined;
    const collectionViewId = vParam ? normalizeUuid(vParam) : undefined;

    return { pageId, collectionViewId };
  } catch {
    return {};
  }
}

/**
 * Fetches Notion tasks from internal collection view API using session token_v2.
 */
export async function fetchNotionCollectionTasks(
  config: NotionSyncConfig
): Promise<NotionTaskItem[]> {
  const { tokenV2, userId, pageId } = config;
  let collectionId = config.collectionId;
  let collectionViewId = config.collectionViewId;

  const cookieHeader = `token_v2=${tokenV2};${userId ? ` notion_user_id=${userId};` : ""}`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    cookie: cookieHeader,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };

  if (userId) {
    headers["x-notion-active-user-header"] = userId;
  }

  // 1. If collection IDs are missing, resolve them via loadPageChunk
  if (!collectionId || !collectionViewId) {
    const chunkRes = await fetch("https://app.notion.com/api/v3/loadPageChunk", {
      method: "POST",
      headers,
      body: JSON.stringify({
        pageId: normalizeUuid(pageId),
        limit: 50,
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      }),
    });

    if (!chunkRes.ok) {
      throw new Error(`Error al conectar con Notion (Status ${chunkRes.status})`);
    }

    const chunkData = await chunkRes.json();
    const pageBlock =
      chunkData.recordMap?.block?.[normalizeUuid(pageId)]?.value?.value ||
      chunkData.recordMap?.block?.[normalizeUuid(pageId)]?.value;

    collectionId = pageBlock?.collection_id;
    collectionViewId = collectionViewId || pageBlock?.view_ids?.[0];

    if (!collectionId || !collectionViewId) {
      throw new Error("No se pudo detectar la base de datos de Notion desde la página indicada.");
    }
  }

  // 2. Query Collection
  const queryRes = await fetch("https://app.notion.com/api/v3/queryCollection", {
    method: "POST",
    headers,
    body: JSON.stringify({
      collection: { id: collectionId },
      collectionView: { id: collectionViewId },
      loader: {
        type: "reducer",
        reducers: {
          collection_group_results: {
            type: "results",
            limit: 200,
          },
        },
        userTimeZone: "America/Mexico_City",
      },
    }),
  });

  if (!queryRes.ok) {
    throw new Error(`Fallo al consultar tareas en Notion (Status ${queryRes.status})`);
  }

  const queryData = await queryRes.json();
  const blocks = queryData.recordMap?.block || {};

  const tasks: NotionTaskItem[] = [];

  for (const blockId of Object.keys(blocks)) {
    const blockData = blocks[blockId]?.value?.value || blocks[blockId]?.value;
    if (!blockData || blockData.type !== "page") continue;

    const props = blockData.properties || {};
    const titleArr = props.title;
    if (!titleArr || !titleArr[0] || !titleArr[0][0]) continue;

    const title = titleArr[0][0].trim();

    // Look for status property
    let status = "Sin Estado";
    for (const key of Object.keys(props)) {
      const val = props[key]?.[0]?.[0];
      if (
        val &&
        [
          "Backlog",
          "Ready",
          "In Progress",
          "Completed",
          "Verified",
          "Completed from Base Project",
        ].includes(val)
      ) {
        status = val;
        break;
      }
    }

    // Look for priority property
    let priority: string | undefined;
    for (const key of Object.keys(props)) {
      const val = props[key]?.[0]?.[0];
      if (val && (val.includes("High") || val.includes("Medium") || val.includes("Low"))) {
        priority = val;
        break;
      }
    }

    // Look for category property
    let category: string | undefined;
    for (const key of Object.keys(props)) {
      const val = props[key]?.[0]?.[0];
      if (
        val &&
        [
          "Bug",
          "Feature",
          "Testing",
          "Request",
          "Debugging",
          "Optimization",
          "Cloud",
        ].includes(val)
      ) {
        category = val;
        break;
      }
    }

    tasks.push({
      id: blockData.id,
      title,
      status,
      priority,
      category,
    });
  }

  return tasks;
}

/**
 * Synchronizes active tasks (Backlog, Ready, In Progress) from Notion into Habitica/Brio.
 */
export async function syncNotionTasksToHabitica(params: {
  config: NotionSyncConfig;
  canonicalPrefix?: string;
}): Promise<NotionSyncResult> {
  const { config, canonicalPrefix = "[UNPO]" } = params;

  // 1. Fetch Notion tasks
  const allNotionTasks = await fetchNotionCollectionTasks(config);

  // Filter only active tasks (Backlog, Ready, In Progress)
  const activeTasks = allNotionTasks.filter((t) =>
    ["Backlog", "Ready", "In Progress"].includes(t.status)
  );

  // 2. Fetch existing Habitica tasks to prevent duplicates
  const existingHabiticaTasks: HabiticaTask[] = await getCachedHabiticaTasks().catch(() => []);

  let createdCount = 0;
  let skippedCount = 0;
  const createdTitles: string[] = [];

  const prefixWithBracket = canonicalPrefix.startsWith("[")
    ? canonicalPrefix
    : `[${canonicalPrefix}]`;

  for (const notionTask of activeTasks) {
    const expectedTitle = `${prefixWithBracket} ${notionTask.title}`.trim();
    const notionTag = `<!-- notion_id: ${notionTask.id} -->`;

    // Check if task already exists in Habitica
    const alreadyExists = existingHabiticaTasks.some((ht) => {
      const notesMatch = ht.notes && ht.notes.includes(notionTask.id);
      const titleMatch =
        ht.text.toLowerCase().trim() === expectedTitle.toLowerCase().trim() ||
        ht.text.toLowerCase().includes(notionTask.title.toLowerCase().trim());
      return notesMatch || titleMatch;
    });

    if (alreadyExists) {
      skippedCount++;
      continue;
    }

    // Determine Habitica priority
    // 0.1 = Trivial, 1 = Easy, 1.5 = Medium, 2 = Hard
    let habiticaPriority = 1.5;
    if (notionTask.priority?.includes("High")) habiticaPriority = 2;
    else if (notionTask.priority?.includes("Low")) habiticaPriority = 1;

    const cleanId = notionTask.id.replace(/-/g, "");
    const notionUrl = `https://app.notion.com/${cleanId}`;
    const cleanPriority = (notionTask.priority || "").replace(/[\u{1F300}-\u{1FAD6}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();

    const notesContent = [
      notionTag,
      `**Estado en Notion**: ${notionTask.status}`,
      cleanPriority ? `**Prioridad**: ${cleanPriority}` : "",
      notionTask.category ? `**Categoría**: ${notionTask.category}` : "",
      `[Ver tarea en Notion](${notionUrl})`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await habiticaClient.createTask({
        type: "todo",
        text: expectedTitle,
        priority: habiticaPriority,
        notes: notesContent,
      });

      createdCount++;
      createdTitles.push(notionTask.title);
    } catch (err) {
      console.error(`[Notion Sync] Error creating task "${notionTask.title}":`, err);
    }
  }

  return {
    success: true,
    totalFound: activeTasks.length,
    createdCount,
    skippedCount,
    createdTasks: createdTitles,
  };
}
