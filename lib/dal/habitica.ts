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

export const getCachedHabiticaTags = cache(async (): Promise<HabiticaTag[]> => {
  return habiticaClient.getUserTags();
});

export const getCachedHabiticaDashboardData = cache(async () => {
  const isConfigured = isHabiticaConfigured();
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
