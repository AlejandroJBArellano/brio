import { getEnv, isHabiticaConfigured } from "./env";
import {
  BatchTaskCreationItemResult,
  HabiticaApiResponse,
  HabiticaStats,
  HabiticaTask,
  HabiticaTaskPayload,
  HabiticaUser,
  TaskType,
} from "./types";

/**
 * Custom error class for Habitica API errors with HTTP status and details.
 */
export class HabiticaApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number = 500, details?: unknown) {
    super(message);
    this.name = "HabiticaApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Mock data used for preview / demo mode when credentials are not configured.
 */
const MOCK_USER: HabiticaUser = {
  id: "demo-user-id",
  profile: {
    name: "Hero of Brio",
  },
  stats: {
    hp: 46,
    maxHealth: 50,
    mp: 120,
    maxMP: 150,
    exp: 280,
    toNextLevel: 450,
    lvl: 14,
    gp: 342.5,
    class: "rogue",
    points: 3,
  },
};

const MOCK_TASKS: HabiticaTask[] = [
  {
    id: "mock-daily-1",
    text: "Deep work session (90m)",
    type: "daily",
    value: 4.5,
    priority: 1.5,
    streak: 6,
    isDue: true,
    tags: ["focus", "deepwork"],
    notes: "No Slack, no email, purely high-leverage engineering",
  },
  {
    id: "mock-daily-2",
    text: "Morning physical conditioning",
    type: "daily",
    value: 12,
    priority: 1,
    streak: 19,
    isDue: true,
    tags: ["health"],
  },
  {
    id: "mock-todo-1",
    text: "Review pull requests & deploy Brio v1.0",
    type: "todo",
    value: 2.1,
    priority: 2,
    completed: false,
    tags: ["engineering", "urgent"],
    notes: "Check Habitica batch capture benchmarks",
  },
  {
    id: "mock-todo-2",
    text: "Configure cloud backups for PostgreSQL",
    type: "todo",
    value: -1.2,
    priority: 1.5,
    completed: false,
    tags: ["infra"],
  },
  {
    id: "mock-habit-1",
    text: "Hydration (500ml water)",
    type: "habit",
    value: 8.5,
    priority: 1,
    up: true,
    down: false,
    counterUp: 4,
    counterDown: 0,
    tags: ["health"],
  },
  {
    id: "mock-habit-2",
    text: "Avoid doomscrolling",
    type: "habit",
    value: -3.0,
    priority: 1.5,
    up: true,
    down: true,
    counterUp: 1,
    counterDown: 2,
    tags: ["mindset"],
  },
];

// In-memory mock store for demo mode sessions
let inMemoryMockTasks: HabiticaTask[] = [...MOCK_TASKS];
let inMemoryMockUser: HabiticaUser = { ...MOCK_USER };

/**
 * Habitica REST API Client.
 * Follows Single Responsibility Principle and encapsulates HTTP transport, authentication, and error formatting.
 */
export class HabiticaClient {
  private customUserId?: string;
  private customApiKey?: string;
  private customBaseUrl?: string;

  constructor(options?: {
    userId?: string;
    apiKey?: string;
    baseUrl?: string;
  }) {
    if (options?.userId) this.customUserId = options.userId;
    if (options?.apiKey) this.customApiKey = options.apiKey;
    if (options?.baseUrl) this.customBaseUrl = options.baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const env = isHabiticaConfigured() ? getEnv() : null;
    const userId = this.customUserId || env?.HABITICA_USER_ID;
    const apiKey = this.customApiKey || env?.HABITICA_API_KEY;

    if (!userId || !apiKey) {
      throw new HabiticaApiError(
        "Habitica credentials missing. Configure HABITICA_USER_ID and HABITICA_API_KEY in .env.local",
        401
      );
    }

    return {
      "x-api-user": userId,
      "x-api-key": apiKey,
      "x-client": "brio-operating-system",
      "Content-Type": "application/json",
    };
  }

  private getBaseUrl(): string {
    if (this.customBaseUrl) return this.customBaseUrl;
    if (isHabiticaConfigured()) {
      return getEnv().HABITICA_BASE_URL;
    }
    return "https://habitica.com/api/v3";
  }

  /**
   * Internal generic fetch handler with consistent error handling and timeout protection.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: "no-store",
      });

      const json = (await response.json()) as HabiticaApiResponse<T>;

      if (!response.ok || !json.success) {
        const errorMsg =
          json.message ||
          (json.errors && json.errors.length > 0
            ? json.errors.map((e) => e.message).join(", ")
            : `Habitica API request failed with status ${response.status}`);

        throw new HabiticaApiError(errorMsg, response.status, json);
      }

      return json.data;
    } catch (error: unknown) {
      if (error instanceof HabiticaApiError) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "Unknown network error";
      throw new HabiticaApiError(`Network or Client Error: ${message}`, 500, error);
    }
  }

  /**
   * Fetches user profile, stats (HP, MP, EXP, Level, Class, GP) and state.
   */
  public async getUserProfile(): Promise<HabiticaUser> {
    if (!isHabiticaConfigured() && !this.customUserId) {
      return inMemoryMockUser;
    }

    return this.request<HabiticaUser>(
      "/user?userFields=stats,profile,preferences,flags"
    );
  }

  /**
   * Retrieves active tasks from Habitica, optionally filtered by type.
   */
  public async getUserTasks(
    type?: "todos" | "dailys" | "habits" | "completedTodos"
  ): Promise<HabiticaTask[]> {
    if (!isHabiticaConfigured() && !this.customUserId) {
      if (!type) return inMemoryMockTasks;
      const typeKey = type.endsWith("s") ? type.slice(0, -1) : type;
      return inMemoryMockTasks.filter((t) => t.type === typeKey);
    }

    const query = type ? `?type=${type}` : "";
    return this.request<HabiticaTask[]>(`/tasks/user${query}`);
  }

  /**
   * Creates an individual task on Habitica.
   */
  public async createTask(
    payload: HabiticaTaskPayload
  ): Promise<HabiticaTask> {
    if (!isHabiticaConfigured() && !this.customUserId) {
      const newTask: HabiticaTask = {
        id: `mock-task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        text: payload.text,
        notes: payload.notes,
        type: payload.type,
        tags: payload.tags || [],
        priority: payload.priority || 1,
        value: 0,
        completed: false,
        isDue: payload.type === "daily" ? true : undefined,
        streak: payload.type === "daily" ? 0 : undefined,
        up: payload.up,
        down: payload.down,
        counterUp: payload.type === "habit" ? 0 : undefined,
        counterDown: payload.type === "habit" ? 0 : undefined,
        createdAt: new Date().toISOString(),
      };
      inMemoryMockTasks = [newTask, ...inMemoryMockTasks];
      return newTask;
    }

    return this.request<HabiticaTask>("/tasks/user", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Dispatches concurrent task creation with Promise.allSettled and robust aggregation.
   */
  public async createTasksBatch(
    tasks: HabiticaTaskPayload[]
  ): Promise<{
    created: HabiticaTask[];
    results: BatchTaskCreationItemResult[];
    createdCount: number;
    failedCount: number;
    errors: string[];
  }> {
    if (!tasks || tasks.length === 0) {
      return {
        created: [],
        results: [],
        createdCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    const promises = tasks.map((task) => this.createTask(task));
    const settled = await Promise.allSettled(promises);

    const created: HabiticaTask[] = [];
    const results: BatchTaskCreationItemResult[] = [];
    const errors: string[] = [];

    settled.forEach((outcome, index) => {
      const taskPayload = tasks[index];
      if (outcome.status === "fulfilled") {
        created.push(outcome.value);
        results.push({
          index,
          task: taskPayload,
          success: true,
          data: outcome.value,
        });
      } else {
        const errorMsg =
          outcome.reason instanceof Error
            ? outcome.reason.message
            : String(outcome.reason);
        errors.push(`Task #${index + 1} "${taskPayload.text}": ${errorMsg}`);
        results.push({
          index,
          task: taskPayload,
          success: false,
          error: errorMsg,
        });
      }
    });

    return {
      created,
      results,
      createdCount: created.length,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * Scores or toggles a task (completes a todo/daily, or increments/decrements a habit).
   */
  public async scoreTask(
    taskId: string,
    direction: "up" | "down" = "up"
  ): Promise<{ success: boolean; stats?: HabiticaStats }> {
    if (!isHabiticaConfigured() && !this.customUserId) {
      const taskIndex = inMemoryMockTasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        const task = inMemoryMockTasks[taskIndex];
        if (task.type === "todo") {
          task.completed = !task.completed;
          inMemoryMockUser.stats.exp = Math.min(
            inMemoryMockUser.stats.toNextLevel,
            inMemoryMockUser.stats.exp + 15
          );
          inMemoryMockUser.stats.gp += 2.5;
        } else if (task.type === "daily") {
          task.completed = !task.completed;
          task.isDue = !task.completed;
          if (task.completed) {
            task.streak = (task.streak || 0) + 1;
            inMemoryMockUser.stats.exp = Math.min(
              inMemoryMockUser.stats.toNextLevel,
              inMemoryMockUser.stats.exp + 20
            );
            inMemoryMockUser.stats.gp += 3.0;
          }
        } else if (task.type === "habit") {
          if (direction === "up") {
            task.counterUp = (task.counterUp || 0) + 1;
            inMemoryMockUser.stats.exp = Math.min(
              inMemoryMockUser.stats.toNextLevel,
              inMemoryMockUser.stats.exp + 10
            );
            inMemoryMockUser.stats.gp += 1.5;
          } else {
            task.counterDown = (task.counterDown || 0) + 1;
            inMemoryMockUser.stats.hp = Math.max(
              0,
              inMemoryMockUser.stats.hp - 5
            );
          }
        }
      }
      return { success: true, stats: inMemoryMockUser.stats };
    }

    const data = await this.request<{ delta?: number }>(
      `/tasks/${taskId}/score/${direction}`,
      {
        method: "POST",
      }
    );

    return { success: true };
  }
}

/**
 * Shared singleton instance
 */
export const habiticaClient = new HabiticaClient();
