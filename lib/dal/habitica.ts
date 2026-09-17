import { cache } from "react";
import { habiticaClient } from "@/lib/habitica";
import { isHabiticaConfigured } from "@/lib/env";
import { HabiticaTask, HabiticaTag, HabiticaUser } from "@/lib/types";

/**
 * Data Access Layer (DAL) for Habitica API.
 * Uses React.cache() to deduplicate requests within a single SSR render pass.
 */
export const getCachedHabiticaUser = cache(async (): Promise<HabiticaUser> => {
  return habiticaClient.getUserProfile();
});

export const getCachedHabiticaTasks = cache(
  async (type?: "todos" | "dailys" | "habits" | "completedTodos"): Promise<HabiticaTask[]> => {
    return habiticaClient.getUserTasks(type);
  }
);

export const getCachedHabiticaTasksWithCompleted = cache(
  async (): Promise<HabiticaTask[]> => {
    const [active, completed] = await Promise.all([
      habiticaClient.getUserTasks().catch(() => []),
      habiticaClient.getUserTasks("completedTodos").catch(() => []),
    ]);

    const taskMap = new Map<string, HabiticaTask>();
    for (const t of active) {
      taskMap.set(t.id, t);
    }
    for (const t of completed) {
      taskMap.set(t.id, { ...t, completed: true });
    }
    return Array.from(taskMap.values());
  }
);

export const getCachedHabiticaTags = cache(async (): Promise<HabiticaTag[]> => {
  return habiticaClient.getUserTags();
});

export const getCachedHabiticaDashboardData = cache(async () => {
  const isConfigured = isHabiticaConfigured();
  if (isConfigured) {
    await habiticaClient.checkAndRunCronIfNeeded().catch((err) => {
      console.warn("[DAL Habitica Cron Check]:", err);
    });
  }

  const [user, tasks, tags] = await Promise.all([
    getCachedHabiticaUser(),
    getCachedHabiticaTasks(),
    getCachedHabiticaTags(),
  ]);

  return {
    user,
    tasks,
    tags,
    isConfigured,
  };
});
