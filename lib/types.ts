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
  wishlistData?: WishlistDashboardData;
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
  dosage?: string;
  timing?: string;
}

export interface UserSupplement {
  id: string;
  name: string;
  dosage?: string;
  timing?: string;
  orderIndex?: number;
  isActive?: boolean;
  createdAt?: string;
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

export interface SegmentalDistribution {
  trunk: number;
  leftArm: number;
  rightArm: number;
  leftLeg: number;
  rightLeg: number;
}

export interface BodyCompositionSegmental {
  muscle?: SegmentalDistribution;
  fat?: SegmentalDistribution;
}

export interface BodyCompositionLog {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  skeletalMuscleKg?: number;
  fatFreeMassKg?: number;
  visceralFatLevel?: number;
  bmi?: number;
  bmrKcal?: number;
  waterLiters?: number;
  segmentalData?: BodyCompositionSegmental;
  notes?: string;
  createdAt?: string;
}

export interface HevySet {
  index: number;
  type: "normal" | "warmup" | "failure" | "drop" | string;
  weightKg?: number | null;
  reps?: number | null;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  rpe?: number | null;
}

export interface HevyExercise {
  index: number;
  title: string;
  notes?: string | null;
  exerciseTemplateId?: string | null;
  supersetId?: string | null;
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  durationSeconds: number;
  totalVolumeKg: number;
  exercisesCount: number;
  setsCount: number;
  exercises: HevyExercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HevyStats {
  totalWorkouts: number;
  totalVolumeKg: number;
  lastSyncedAt?: string;
}

export interface HealthDashboardData {
  todayHealth: HealthLog;
  waterPercent: number;
  weeklyWorkoutsCount: number;
  workoutStreak: number;
  averageSleepHours: number;
  recentLogs: HealthLog[];
  supplementsCatalog?: UserSupplement[];
  bodyCompositionLogs?: BodyCompositionLog[];
  latestBodyComposition?: BodyCompositionLog;
  previousBodyComposition?: BodyCompositionLog;
  recentHevyWorkouts?: HevyWorkout[];
  hevyStats?: HevyStats;
  nutritionData?: NutritionDashboardData;
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

// ----------------------------------------------------
// Wishlist Anti-Impulso Models (Brio Finanzas)
// ----------------------------------------------------

export type WishlistStatus = "cooling" | "ready" | "purchased" | "dismissed";
export type WishlistPriority = "high" | "medium" | "low";

export interface WishlistItem {
  id: string;
  title: string;
  priceEstimated: number;
  category: string;
  priority: WishlistPriority;
  url?: string;
  imageUrl?: string;
  reasonOrNotes?: string;
  status: WishlistStatus;
  coolingDaysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  isCoolingFinished: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface WishlistDashboardData {
  items: WishlistItem[];
  stats: {
    totalWishlistValue: number;
    totalSavedImpulseValue: number;
    coolingCount: number;
    readyCount: number;
    purchasedCount: number;
    dismissedCount: number;
  };
}

// ----------------------------------------------------
// Bóveda & Intereses (Vault: Books, Sheet Music, Courses, Videos & Resources)
// ----------------------------------------------------

export type VaultItemCategory =
  | "book"
  | "sheet_music"
  | "course"
  | "video"
  | "link"
  | "document"
  | "project";

export type VaultItemStatus = "backlog" | "in_progress" | "completed";

export interface VaultItem {
  id: string;
  category: VaultItemCategory;
  title: string;
  authorOrCreator?: string;
  status: VaultItemStatus;
  instrument?: string; // Piano, Guitarra, Voz, etc.
  difficulty?: "beginner" | "intermediate" | "advanced" | string;
  platform?: string; // Udemy, YouTube, Platzi, Coursera, GitHub, Notion, etc.
  url?: string;
  coverUrl?: string;
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileSizeBytes?: number;
  progress?: number; // Current page or percentage or current lesson
  totalPages?: number; // Total pages or total lessons
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VaultDashboardData {
  books: VaultItem[];
  sheetMusic: VaultItem[];
  courses: VaultItem[];
  resources: VaultItem[];
  documents: VaultItem[];
  projects: ProjectItem[];
  scratchpadContent: string;
  stats: {
    totalBooks: number;
    booksCompleted: number;
    totalSheetMusic: number;
    sheetMusicMastered: number;
    totalCourses: number;
    coursesCompleted: number;
    totalResources: number;
    totalProjects: number;
  };
}

// ----------------------------------------------------
// Módulo de Nutrición & Dietas (Plan Mariana Mont & Tracking)
// ----------------------------------------------------

export type FoodGroupKey =
  | "fruits"
  | "vegetables"
  | "cereals"
  | "tubers"
  | "legumes"
  | "fats_seeds"
  | "leafy_greens";

export type MealSlotType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "smoothie"
  | "salad"
  | "soup"
  | "sauce_dip"
  | "infusion_shot";

export interface MacroEstimate {
  kcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface FoodGroupMeta {
  key: FoodGroupKey;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  unit: string;
  standardPortionDesc: string;
  defaultDailyTarget: number;
  macroFactor: MacroEstimate;
}

export interface NutritionRecipe {
  id: string;
  title: string;
  mealSlot: MealSlotType;
  category?: string; // "Lechadas", "Quesos & Patés", "Sopas & Cremas", "Platos Fuertes", "Ensaladas", "Snacks & Postres", "Smoothies", "Shots & Infusiones"
  bookSource?: string; // "La Luna Verde", "Detox 7 Días", "Detox Otoñal", "Plan Semanal"
  weekNumber?: number; // 1 to 4 for Mariana Mont plan presets
  optionLabel?: string; // "Opción 1", "Opción 2", "Opción A", etc.
  portions: Partial<Record<FoodGroupKey, number>>;
  ingredients: string[];
  prepNotes?: string;
  isPreset?: boolean;
  createdAt?: string;
}

export interface ScheduledMealItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealSlot: MealSlotType;
  recipeId?: string;
  customTitle?: string;
  isCompleted: boolean;
  portions?: Partial<Record<FoodGroupKey, number>>;
  notes?: string;
  recipe?: NutritionRecipe;
  createdAt?: string;
}

export interface NutritionHabitLog {
  dailySalad: boolean;
  hydrationGoal: boolean;
  noUltraProcessed: boolean;
  b12Weekly: boolean;
  spirulina: boolean;
  omega3Dha: boolean;
  magnesium: boolean;
  vitC: boolean;
}

export interface NutritionDailyLog {
  date: string; // YYYY-MM-DD
  portions: Record<FoodGroupKey, number>;
  habits: NutritionHabitLog;
  calculatedMacros: MacroEstimate;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NutritionSettings {
  dailyPortionGoals: Record<FoodGroupKey, number>;
  macroFactors: Record<FoodGroupKey, MacroEstimate>;
  waterTargetMl: number;
  activeWeek?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: "verduras_hojas" | "frutas" | "legumbres_granos" | "semillas_frutos" | "insumos_cocina" | "otros";
  checked: boolean;
  sourceRecipes?: string[];
  estimatedQty?: string;
}

export interface GroceryListCategory {
  categoryKey: string;
  categoryTitle: string;
  icon: string;
  items: GroceryItem[];
}

export interface NutritionDashboardData {
  todayLog: NutritionDailyLog;
  settings: NutritionSettings;
  scheduledMealsThisWeek: ScheduledMealItem[];
  scheduledMealsToday: ScheduledMealItem[];
  recipesCatalog: NutritionRecipe[];
  recentDailyLogs: NutritionDailyLog[];
  weeklyAdherence: {
    daysWithPortionsMet: number;
    daysWithSalad: number;
    daysWithWater: number;
    b12LoggedThisWeek: boolean;
  };
}

