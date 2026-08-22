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
  checklist?: Array<{ id?: string; text: string; completed?: boolean }>;
  date?: string;
}

export type UpdateTaskPayload = Partial<HabiticaTaskPayload>;

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

// ----------------------------------------------------
// Brio Finanzas Models (Neon PostgreSQL)
// ----------------------------------------------------

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  notes?: string;
  isAntExpense: boolean;
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface MonthlyBudget {
  id: string; // e.g. "2026-08"
  month: number;
  year: number;
  budgetedIncome: number;
  budgetedFixedExpenses: number;
  budgetedVariableExpenses: number;
  dailyAntLimit: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
  color: string;
  createdAt?: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface FinanceDashboardData {
  currentBudget: MonthlyBudget;
  totalExpensesThisMonth: number;
  totalIncomeThisMonth: number;
  totalFixedExpensesThisMonth: number;
  totalVariableExpensesThisMonth: number;
  totalAntExpensesToday: number;
  totalAntExpensesThisMonth: number;
  remainingDailyAntBudget: number;
  remainingMonthlyVariableBudget: number;
  recentTransactions: Transaction[];
  savingsGoals: SavingsGoal[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface ParsedFinancialInput {
  isFinancial: boolean;
  type?: TransactionType;
  amount?: number;
  concept?: string;
  category?: string;
  account?: string;
  isAntExpense?: boolean;
  notes?: string;
}

// ----------------------------------------------------
// Google Calendar Models
// ----------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string or time
  end: string;   // ISO string or time
  startTimeFormatted: string; // e.g. "09:30 AM"
  endTimeFormatted: string;   // e.g. "10:30 AM"
  durationMinutes: number;
  isAllDay: boolean;
  location?: string;
  description?: string;
  status: "past" | "now" | "upcoming";
  timeUntil?: string;
}

export interface CalendarDaySchedule {
  date: string;
  events: CalendarEvent[];
  nextEvent?: CalendarEvent;
  totalMeetingMinutes: number;
}

// ----------------------------------------------------
// Ritual Models
// ----------------------------------------------------

export interface RitualLog {
  date: string;
  mustWinTasks: string[]; // Task IDs
  energyLevel?: number;   // 1 to 5
  dayIntention?: string;
  reflection?: string;
  expensesLogged?: boolean;
}

// ----------------------------------------------------
// Analytics & Consistency Heatmap Models
// ----------------------------------------------------

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  habitsCount: number;
  dailiesCount: number;
  todosCount: number;
  expensesCount: number;
}

export interface LifeTagDistribution {
  tag: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsDashboardData {
  heatmap: HeatmapDay[];
  tagDistributions: LifeTagDistribution[];
  totalActivitiesLogged: number;
  currentStreak: number;
  longestStreak: number;
  activeLifePillars: number;
}

// ----------------------------------------------------
// Health & Fitness Models
// ----------------------------------------------------

export type WorkoutType = "gym" | "cardio" | "rest" | "mobility" | "sports";

export interface SupplementItem {
  id: string;
  name: string;
  taken: boolean;
}

export interface HealthLog {
  date: string;
  workoutType?: WorkoutType;
  workoutNotes?: string;
  waterMl: number;
  supplements: SupplementItem[];
  sleepHours: number;
  sleepQuality: number; // 1 to 5
  stepsCount: number;
}

export interface HealthDashboardData {
  todayHealth: HealthLog;
  waterPercent: number;
  weeklyWorkoutsCount: number;
  workoutStreak: number;
  averageSleepHours: number;
  recentLogs: HealthLog[];
}

// ----------------------------------------------------
// Projects & Learning Vault Models
// ----------------------------------------------------

export type ProjectStatus = "idea" | "in_progress" | "paused" | "launched";

export interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  progress: number;
  createdAt?: string;
}

export type LearningItemType = "book" | "course" | "article";
export type LearningStatus = "reading" | "completed" | "backlog";

export interface LearningItem {
  id: string;
  title: string;
  type: LearningItemType;
  author?: string;
  currentProgress: number;
  totalProgress: number;
  keyTakeaways?: string;
  status: LearningStatus;
  createdAt?: string;
}

export interface ProjectsDashboardData {
  projects: ProjectItem[];
  learningItems: LearningItem[];
  scratchpadContent: string;
}
