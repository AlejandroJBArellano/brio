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
 * Maps a project title or ID to its standard bracket prefixes and search keywords.
 */
export function getProjectKeywords(project: ProjectItem): {
  prefixes: string[];
  canonicalPrefix: string;
} {
  const titleLower = project.title.toLowerCase();

  if (titleLower.includes("unpo")) {
    return { prefixes: ["unpo"], canonicalPrefix: "[UNPO]" };
  }
  if (titleLower.includes("pbj") || titleLower.includes("montgomery")) {
    return { prefixes: ["pbj", "montgomery"], canonicalPrefix: "[PBJ]" };
  }
  if (titleLower.includes("0 => 100") || titleLower.includes("0 -> 100") || titleLower.includes("marca personal")) {
    return { prefixes: ["0 -> 100", "0 => 100", "0->100", "marca personal"], canonicalPrefix: "[0 -> 100]" };
  }
  if (titleLower.includes("hybridge")) {
    return { prefixes: ["hybridge", "hybridge: oss", "hybridge oss"], canonicalPrefix: "[Hybridge]" };
  }
  if (titleLower.includes("kittn")) {
    return { prefixes: ["kittn os", "kittn"], canonicalPrefix: "[Kittn OS]" };
  }
  if (titleLower.includes("adaquest")) {
    return { prefixes: ["adaquest"], canonicalPrefix: "[AdaQuest]" };
  }
  if (titleLower.includes("strata")) {
    return { prefixes: ["strata"], canonicalPrefix: "[Strata]" };
  }
  if (titleLower.includes("brio")) {
    return { prefixes: ["brio"], canonicalPrefix: "[Brio]" };
  }

  // Fallback: use the first word or main title segment
  const cleanTitle = project.title.split(/[—\-:]/)[0].trim();
  return {
    prefixes: [cleanTitle.toLowerCase()],
    canonicalPrefix: `[${cleanTitle}]`,
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
