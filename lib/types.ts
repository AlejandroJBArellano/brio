/**
 * Core Habitica domain models and Brio application types.
 */

export type TaskType = "todo" | "daily" | "habit" | "reward";

export interface HabiticaStats {
  hp: number;
  maxHealth: number;
  mp: number;
  maxMP: number;
  exp: number;
  toNextLevel: number;
  lvl: number;
  gp: number; // Gold pieces
  class: "warrior" | "rogue" | "wizard" | "healer" | "special" | string;
  points?: number;
}

export interface HabiticaProfile {
  name: string;
  imageUrl?: string;
}

export interface HabiticaUser {
  id: string;
  profile: HabiticaProfile;
  stats: HabiticaStats;
  preferences?: {
    timezoneOffset?: number;
    dayStart?: number;
  };
  flags?: {
    rest?: boolean;
  };
}

export interface HabiticaTag {
  id: string;
  name: string;
}

export interface HabiticaChecklistItem {
  id?: string;
  text: string;
  completed?: boolean;
}

export interface HabiticaTask {
  id: string;
  text: string;
  notes?: string;
  type: TaskType;
  value?: number;
  priority?: number; // 0.1 (trivial), 1 (easy), 1.5 (medium), 2 (hard)
  tags?: string[];
  completed?: boolean; // For todos
  isDue?: boolean; // For dailies
  streak?: number; // For dailies
  up?: boolean; // For habits
  down?: boolean; // For habits
  counterUp?: number; // For habits
  counterDown?: number; // For habits
  checklist?: HabiticaChecklistItem[];
  date?: string; // Due date ISO string
  createdAt?: string;
  updatedAt?: string;
}

export interface HabiticaTaskPayload {
  text: string;
  type: TaskType;
  notes?: string;
  tags?: string[];
  priority?: number;
  up?: boolean;
  down?: boolean;
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  checklist?: Array<{ text: string; completed?: boolean }>;
  date?: string;
}

export interface HabiticaApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Array<{ message: string; param?: string }>;
}

export interface ParsedTask {
  raw: string;
  text: string;
  type: TaskType;
  notes?: string;
  tags: string[];
  priority?: number;
  up?: boolean;
  down?: boolean;
  dueDate?: string;
}

export interface BatchParseResult {
  tasks: ParsedTask[];
  payloads: HabiticaTaskPayload[];
  stats: {
    total: number;
    todos: number;
    dailies: number;
    habits: number;
    tagsExtracted: number;
  };
}

export interface BatchTaskCreationItemResult {
  index: number;
  task: HabiticaTaskPayload;
  success: boolean;
  data?: HabiticaTask;
  error?: string;
}

export interface BatchActionResult {
  success: boolean;
  totalParsed: number;
  createdCount: number;
  failedCount: number;
  results: BatchTaskCreationItemResult[];
  errors: string[];
  summary: string;
  isDemo?: boolean;
}
