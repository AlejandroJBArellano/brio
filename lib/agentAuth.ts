import { getDb } from "@/lib/db";
import { getProjectKeywords } from "@/lib/projectMatcher";
import { ProjectItem, ProjectStatus } from "@/lib/types";

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

/**
 * Validates the agent authentication token from request headers.
 * Accepts either:
 * - Authorization: Bearer <BRIO_AGENT_TOKEN>
 * - x-brio-token: <BRIO_AGENT_TOKEN>
 */
export function verifyAgentAuth(request: Request): {
  authorized: boolean;
  status?: number;
  error?: string;
} {
  const configuredToken = process.env.BRIO_AGENT_TOKEN;

  if (!configuredToken) {
    return {
      authorized: false,
      status: 500,
      error: "BRIO_AGENT_TOKEN is not configured on the server.",
    };
  }

  const authHeader = request.headers.get("authorization");
  const brioTokenHeader = request.headers.get("x-brio-token");

  let providedToken = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedToken = authHeader.slice(7).trim();
  } else if (brioTokenHeader) {
    providedToken = brioTokenHeader.trim();
  }

  if (!providedToken) {
    return {
      authorized: false,
      status: 401,
      error: "Missing authentication token. Pass 'Authorization: Bearer <token>' or 'x-brio-token'.",
    };
  }

  if (providedToken !== configuredToken) {
    return {
      authorized: false,
      status: 403,
      error: "Invalid agent token.",
    };
  }

  return { authorized: true };
}

/**
 * Normalizes strings for loose project name matching (e.g. 'kittnos' -> 'kittnos', 'Kittn OS' -> 'kittnos').
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\[\]\-_—:\s]/g, "")
    .trim();
}

/**
 * Resolves a ProjectItem dynamically from Neon DB using flexible matching:
 * Matches by UUID / ID, canonical prefix (e.g. '[Kittn OS]'), title, or normalized slug (e.g. 'kittnos').
 */
export async function resolveProject(
  identifier: string
): Promise<ProjectItem | null> {
  const cleanId = identifier?.trim();
  if (!cleanId) return null;

  const sql = getDb();
  const rows = await sql`SELECT * FROM projects ORDER BY created_at DESC;`;

  const projects: ProjectItem[] = (rows as unknown as ProjectDbRow[]).map(
    (p) => ({
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
    })
  );

  const normalizedInput = normalizeString(cleanId);
  const inputLower = cleanId.toLowerCase();

  // 1. Direct ID match
  const byId = projects.find((p) => p.id === cleanId);
  if (byId) return byId;

  // 2. Canonical prefix match (with or without brackets)
  const byCanonical = projects.find((p) => {
    const { canonicalPrefix } = getProjectKeywords(p);
    const prefixWithoutBrackets = canonicalPrefix.replace(/[\[\]]/g, "").trim();
    return (
      canonicalPrefix.toLowerCase() === inputLower ||
      prefixWithoutBrackets.toLowerCase() === inputLower ||
      normalizeString(canonicalPrefix) === normalizedInput
    );
  });
  if (byCanonical) return byCanonical;

  // 3. User configured task prefixes match
  const byCustomPrefix = projects.find((p) =>
    (p.taskPrefixes || []).some(
      (prefix) =>
        prefix.toLowerCase() === inputLower ||
        normalizeString(prefix) === normalizedInput
    )
  );
  if (byCustomPrefix) return byCustomPrefix;

  // 4. Title / slug normalized match
  const byNormalizedTitle = projects.find((p) => {
    const normTitle = normalizeString(p.title);
    return (
      normTitle.includes(normalizedInput) || normalizedInput.includes(normTitle)
    );
  });
  if (byNormalizedTitle) return byNormalizedTitle;

  return null;
}
