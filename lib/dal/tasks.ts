import { cache } from "react";
import { getDb } from "@/lib/db";
import { HabiticaTag, HabiticaTask, HabiticaUser } from "@/lib/types";

export const DEFAULT_BRIO_USER: HabiticaUser = {
  id: "brio-owner",
  profile: {
    name: "Alejandro",
  },
  stats: {
    hp: 50,
    maxHealth: 50,
    mp: 100,
    maxMP: 100,
    exp: 0,
    toNextLevel: 100,
    lvl: 1,
    gp: 0,
    class: "executive",
  },
  preferences: {
    sleep: false,
  },
  flags: {
    rest: false,
  },
};

interface TaskDbRow {
  id: string;
  text: string;
  notes: string | null;
  type: "todo" | "daily" | "habit" | "reward";
  priority: number | string | null;
  completed: boolean | null;
  completed_at: Date | string | null;
  due_date: Date | string | null;
  is_due: boolean | null;
  streak: number | string | null;
  repeat_days: Record<string, boolean> | null;
  frequency: string | null;
  every_x: number | string | null;
  up: boolean | null;
  down: boolean | null;
  counter_up: number | string | null;
  counter_down: number | string | null;
  value: number | string | null;
  project_id: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface ChecklistDbRow {
  id: string;
  task_id: string;
  text: string;
  completed: boolean | null;
  order_index: number | null;
}

interface TagDbRow {
  id: string;
  name: string;
}

interface TaskTagDbRow {
  task_id: string;
  tag_id: string;
}

/**
 * Runs a lightweight daily reset for daily tasks whose completion was on an earlier date.
 */
async function resetDailiesIfNeeded() {
  try {
    const sql = getDb();
    const dayMap = ["su", "m", "t", "w", "th", "f", "s"] as const;
    const todayDayKey = dayMap[new Date().getDay()];

    // 1. Uncheck completed dailies from previous days
    await sql`
      UPDATE tasks
      SET completed = FALSE,
          updated_at = NOW()
      WHERE type = 'daily'
        AND completed = TRUE
        AND completed_at < CURRENT_DATE;
    `;

    // 2. Refresh is_due for all dailies based on today's scheduled day of the week
    await sql`
      UPDATE tasks
      SET is_due = CASE
            WHEN repeat_days IS NULL THEN TRUE
            WHEN (repeat_days->>${todayDayKey})::boolean IS NOT FALSE THEN TRUE
            ELSE FALSE
          END
      WHERE type = 'daily';
    `;
  } catch (error) {
    console.error("[Tasks DAL] Error resetting dailies:", error);
  }
}

/**
 * Fetches all tags from PostgreSQL.
 */
export const getCachedTags = cache(async (): Promise<HabiticaTag[]> => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, name FROM tags ORDER BY name ASC;`;
    return (rows as unknown as TagDbRow[]).map((r) => ({
      id: r.id,
      name: r.name,
    }));
  } catch (error) {
    console.error("[Tasks DAL] Failed to fetch tags:", error);
    return [];
  }
});

/**
 * Fetches tasks from PostgreSQL.
 */
export const getCachedTasks = cache(
  async (type?: "todos" | "dailys" | "habits" | "completedTodos"): Promise<HabiticaTask[]> => {
    try {
      await resetDailiesIfNeeded();
      const sql = getDb();

      let query;
      if (type === "todos") {
        query = sql`SELECT * FROM tasks WHERE type = 'todo' AND completed = FALSE ORDER BY created_at DESC;`;
      } else if (type === "completedTodos") {
        query = sql`SELECT * FROM tasks WHERE type = 'todo' AND completed = TRUE ORDER BY completed_at DESC NULLS LAST, updated_at DESC;`;
      } else if (type === "dailys") {
        query = sql`SELECT * FROM tasks WHERE type = 'daily' ORDER BY priority DESC, created_at ASC;`;
      } else if (type === "habits") {
        query = sql`SELECT * FROM tasks WHERE type = 'habit' ORDER BY priority DESC, created_at ASC;`;
      } else {
        // Active tasks by default (all dailies, habits, and non-completed todos)
        query = sql`SELECT * FROM tasks WHERE (type != 'todo' OR completed = FALSE) ORDER BY created_at DESC;`;
      }

      const [taskRows, checklistRows, taskTagRows] = await Promise.all([
        query,
        sql`SELECT id, task_id, text, completed, order_index FROM task_checklists ORDER BY order_index ASC;`,
        sql`SELECT task_id, tag_id FROM task_tags;`,
      ]);

      // Group checklists by task_id
      const checklistMap = new Map<string, Array<{ id: string; text: string; completed: boolean }>>();
      for (const ch of checklistRows as unknown as ChecklistDbRow[]) {
        const list = checklistMap.get(ch.task_id) || [];
        list.push({
          id: ch.id,
          text: ch.text,
          completed: Boolean(ch.completed),
        });
        checklistMap.set(ch.task_id, list);
      }

      // Group tags by task_id
      const tagsMap = new Map<string, string[]>();
      for (const tt of taskTagRows as unknown as TaskTagDbRow[]) {
        const list = tagsMap.get(tt.task_id) || [];
        list.push(tt.tag_id);
        tagsMap.set(tt.task_id, list);
      }

      return (taskRows as unknown as TaskDbRow[]).map((t) => ({
        id: t.id,
        text: t.text,
        notes: t.notes || "",
        type: t.type,
        priority: Number(t.priority) || 1,
        completed: Boolean(t.completed),
        date: t.due_date ? new Date(t.due_date).toISOString() : undefined,
        isDue: t.is_due !== null ? Boolean(t.is_due) : true,
        streak: Number(t.streak) || 0,
        repeat: t.repeat_days || undefined,
        frequency: (t.frequency as "daily" | "weekly" | "monthly" | "yearly") || "daily",
        everyX: Number(t.every_x) || 1,
        up: t.up !== null ? Boolean(t.up) : true,
        down: t.down !== null ? Boolean(t.down) : false,
        counterUp: Number(t.counter_up) || 0,
        counterDown: Number(t.counter_down) || 0,
        value: Number(t.value) || 0,
        checklist: checklistMap.get(t.id) || [],
        tags: tagsMap.get(t.id) || [],
        createdAt: t.created_at ? new Date(t.created_at).toISOString() : undefined,
        updatedAt: t.updated_at ? new Date(t.updated_at).toISOString() : undefined,
      }));
    } catch (error) {
      console.error("[Tasks DAL] Failed to fetch tasks:", error);
      return [];
    }
  }
);

/**
 * Fetches all tasks including completed to-dos (useful for projects).
 */
export const getCachedTasksWithCompleted = cache(async (): Promise<HabiticaTask[]> => {
  try {
    await resetDailiesIfNeeded();
    const sql = getDb();

    const [taskRows, checklistRows, taskTagRows] = await Promise.all([
      sql`SELECT * FROM tasks ORDER BY created_at DESC;`,
      sql`SELECT id, task_id, text, completed, order_index FROM task_checklists ORDER BY order_index ASC;`,
      sql`SELECT task_id, tag_id FROM task_tags;`,
    ]);

    const checklistMap = new Map<string, Array<{ id: string; text: string; completed: boolean }>>();
    for (const ch of checklistRows as unknown as ChecklistDbRow[]) {
      const list = checklistMap.get(ch.task_id) || [];
      list.push({
        id: ch.id,
        text: ch.text,
        completed: Boolean(ch.completed),
      });
      checklistMap.set(ch.task_id, list);
    }

    const tagsMap = new Map<string, string[]>();
    for (const tt of taskTagRows as unknown as TaskTagDbRow[]) {
      const list = tagsMap.get(tt.task_id) || [];
      list.push(tt.tag_id);
      tagsMap.set(tt.task_id, list);
    }

    return (taskRows as unknown as TaskDbRow[]).map((t) => ({
      id: t.id,
      text: t.text,
      notes: t.notes || "",
      type: t.type,
      priority: Number(t.priority) || 1,
      completed: Boolean(t.completed),
      date: t.due_date ? new Date(t.due_date).toISOString() : undefined,
      isDue: t.is_due !== null ? Boolean(t.is_due) : true,
      streak: Number(t.streak) || 0,
      repeat: t.repeat_days || undefined,
      frequency: (t.frequency as "daily" | "weekly" | "monthly" | "yearly") || "daily",
      everyX: Number(t.every_x) || 1,
      up: t.up !== null ? Boolean(t.up) : true,
      down: t.down !== null ? Boolean(t.down) : false,
      counterUp: Number(t.counter_up) || 0,
      counterDown: Number(t.counter_down) || 0,
      value: Number(t.value) || 0,
      checklist: checklistMap.get(t.id) || [],
      tags: tagsMap.get(t.id) || [],
      createdAt: t.created_at ? new Date(t.created_at).toISOString() : undefined,
      updatedAt: t.updated_at ? new Date(t.updated_at).toISOString() : undefined,
    }));
  } catch (error) {
    console.error("[Tasks DAL] Failed to fetch all tasks:", error);
    return [];
  }
});

/**
 * Main dashboard data getter deduplicated with React.cache().
 */
export const getCachedDashboardData = cache(async () => {
  const [tasks, tags] = await Promise.all([
    getCachedTasks(),
    getCachedTags(),
  ]);

  return {
    user: DEFAULT_BRIO_USER,
    tasks,
    tags,
    isConfigured: true,
  };
});
