import { HabiticaTask, ProjectItem } from "./types";
import { parseTaskPrefix } from "./utils";

export interface ProjectTaskMetrics {
  matchedTasks: HabiticaTask[];
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  progressPercent: number;
  canonicalPrefix: string;
}

/**
 * Maps a project to its standard bracket prefixes and search keywords dynamically from database fields,
 * with a clean fallback to the main title segment.
 */
export function getProjectKeywords(project: ProjectItem): {
  prefixes: string[];
  canonicalPrefix: string;
} {
  const cleanTitle = project.title.split(/[—\-:]/)[0].trim();
  const titleLower = cleanTitle.toLowerCase();

  // Extract custom prefixes configured by the user on the project
  const userPrefixes = Array.isArray(project.taskPrefixes)
    ? project.taskPrefixes.map((p) => p.trim().toLowerCase()).filter(Boolean)
    : [];

  // Include user-defined prefixes and clean title (deduplicated)
  const prefixes = userPrefixes.length > 0
    ? Array.from(new Set([...userPrefixes, titleLower]))
    : [titleLower];

  // Canonical bracket prefix (e.g. "[Hybridge]", "[Brio]")
  let canonicalPrefix = project.canonicalPrefix?.trim();
  if (canonicalPrefix) {
    if (!canonicalPrefix.startsWith("[")) canonicalPrefix = `[${canonicalPrefix}`;
    if (!canonicalPrefix.endsWith("]")) canonicalPrefix = `${canonicalPrefix}]`;
  } else {
    canonicalPrefix = `[${cleanTitle}]`;
  }

  return {
    prefixes,
    canonicalPrefix,
  };
}

/**
 * Intelligently matches Habitica tasks to a given Project Item and calculates live completion metrics.
 */
export function matchTasksToProject(
  project: ProjectItem,
  tasks: HabiticaTask[] = []
): ProjectTaskMetrics {
  const { prefixes, canonicalPrefix } = getProjectKeywords(project);

  const matchedTasks = tasks.filter((t) => {
    // Strictly match ONLY To-Dos (exclude habits and dailies)
    if (t.type !== "todo") return false;

    const { prefix, cleanTitle: _cleanTitle } = parseTaskPrefix(t.text);
    const prefixLower = prefix?.toLowerCase() || "";
    const fullTextLower = t.text.toLowerCase();
    const notesLower = t.notes?.toLowerCase() || "";

    for (const p of prefixes) {
      if (prefixLower.includes(p)) return true;
      if (fullTextLower.includes(`[${p}]`) || fullTextLower.includes(p)) return true;
      if (notesLower.includes(`[${p}]`)) return true;
    }

    return false;
  });

  const totalCount = matchedTasks.length;
  const completedCount = matchedTasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    matchedTasks,
    totalCount,
    completedCount,
    pendingCount,
    progressPercent,
    canonicalPrefix,
  };
}
