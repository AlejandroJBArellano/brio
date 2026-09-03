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
    sleep?: boolean;
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
  repeat?: {
    m?: boolean;
    t?: boolean;
    w?: boolean;
    th?: boolean;
    f?: boolean;
    s?: boolean;
    su?: boolean;
  };
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  everyX?: number;
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
  repeat?: {
    m?: boolean;
    t?: boolean;
    w?: boolean;
    th?: boolean;
    f?: boolean;
    s?: boolean;
    su?: boolean;
  };
  everyX?: number;
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

export type HabiticaEventType =
  | "MORNING_KICKOFF"
  | "EVENING_REVIEW"
  | "WORKOUT_COMPLETED"
  | "HYDRATION_LOGGED"
  | "SUPPLEMENTS_COMPLETED"
  | "SLEEP_LOGGED"
  | "BODY_COMPOSITION_LOGGED"
  | "LAB_REPORT_LOGGED"
  | "NUTRITION_HABIT"
  | "SCHEDULED_MEAL_COMPLETED"
  | "DAILY_EXPENSES_LOGGED"
  | "SAVINGS_CONTRIBUTION"
  | "WISHLIST_DISMISSED_COOLING"
  | "VAULT_PROGRESS"
  | "VAULT_COMPLETED"
  | "PROJECT_COMPLETED"
  | "CIRCADIAN_HABIT_COMPLETED";

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

export interface FinanceCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isAntDefault?: boolean;
  isFixed?: boolean;
  orderIndex?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  type?: "credit" | "debit" | "cash" | "bank" | "other" | string;
  icon?: string;
  color?: string;
  orderIndex?: number;
  isActive?: boolean;
  createdAt?: string;
}

export const DEFAULT_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: "comida", name: "Comida & Restaurantes", icon: "🍔", isAntDefault: false, isFixed: false, orderIndex: 0, isActive: true },
  { id: "antojo", name: "Antojo / Gustito (Hormiga)", icon: "☕", isAntDefault: true, isFixed: false, orderIndex: 1, isActive: true },
  { id: "transporte", name: "Transporte / Gasolina", icon: "🚗", isAntDefault: false, isFixed: false, orderIndex: 2, isActive: true },
  { id: "servicios", name: "Servicios & Renta", icon: "🏠", isAntDefault: false, isFixed: true, orderIndex: 3, isActive: true },
  { id: "suscripciones", name: "Suscripciones & Software", icon: "💻", isAntDefault: false, isFixed: true, orderIndex: 4, isActive: true },
  { id: "salud", name: "Salud & Farmacia", icon: "💊", isAntDefault: false, isFixed: false, orderIndex: 5, isActive: true },
  { id: "compras", name: "Compras & Ropa", icon: "🛍️", isAntDefault: false, isFixed: false, orderIndex: 6, isActive: true },
  { id: "ingreso", name: "Sueldo / Freelance", icon: "💰", isAntDefault: false, isFixed: false, orderIndex: 7, isActive: true },
];

export const DEFAULT_FINANCE_ACCOUNTS: FinanceAccount[] = [
  { id: "nu", name: "Tarjeta Nu", type: "credit", icon: "💳", orderIndex: 0, isActive: true },
  { id: "bbva", name: "BBVA Débito", type: "debit", icon: "🏦", orderIndex: 1, isActive: true },
  { id: "santander", name: "Santander", type: "credit", icon: "💳", orderIndex: 2, isActive: true },
  { id: "efectivo", name: "Efectivo 💵", type: "cash", icon: "💵", orderIndex: 3, isActive: true },
  { id: "hey", name: "Hey Banco", type: "debit", icon: "🏦", orderIndex: 4, isActive: true },
  { id: "default", name: "Cuenta Principal", type: "other", icon: "💳", orderIndex: 5, isActive: true },
];

export type CommitmentType = "installment" | "variable_schedule" | "recurring" | "one_time";
export type CommitmentFrequency = "monthly" | "biweekly" | "weekly" | "annual" | "custom";
export type CommitmentStatus = "active" | "completed" | "paused";

export interface VariablePaymentScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  isPaid: boolean;
  paidAt?: string;
  transactionId?: string;
}

export interface FinanceCommitment {
  id: string;
  title: string;
  type: CommitmentType;
  category: string;
  defaultAccount: string;
  totalAmount?: number;
  installmentAmount?: number;
  installmentsTotal?: number;
  installmentsPaid?: number;
  frequency: CommitmentFrequency;
  nextDueDate?: string; // YYYY-MM-DD
  variableSchedule: VariablePaymentScheduleItem[];
  status: CommitmentStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  remainingInstallments?: number;
  remainingBalance?: number;
  nextPaymentAmount?: number;
  isOverdue?: boolean;
  daysUntilDue?: number;
}

export interface CommitmentSummaryStats {
  totalMonthlyCommitment: number;
  totalRemainingDebt: number;
  dueSoonCount: number;
  activeCount: number;
  installmentCount: number;
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
  categories?: FinanceCategory[];
  accounts?: FinanceAccount[];
  commitments?: FinanceCommitment[];
  commitmentsStats?: CommitmentSummaryStats;
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

export const DEFAULT_USER_SUPPLEMENTS: UserSupplement[] = [
  { id: "salad", name: "Ensalada Diaria", dosage: "Con semillas", timing: "Comida/Cena", orderIndex: 0, isActive: true },
  { id: "clean_eating", name: "Cero Ultraprocesados", dosage: "Sin fritos", timing: "Todo el día", orderIndex: 1, isActive: true },
  { id: "b12", name: "Vitamina B12", dosage: "2000mcg", timing: "Semanal / Mañana", orderIndex: 2, isActive: true },
  { id: "creatine", name: "Creatina", dosage: "5g", timing: "Post-entreno", orderIndex: 3, isActive: true },
  { id: "multivitamin", name: "Multivitamínico", dosage: "1 cápsula", timing: "Mañana", orderIndex: 4, isActive: true },
  { id: "omega3", name: "Omega 3", dosage: "2 cápsulas", timing: "Con comida", orderIndex: 5, isActive: true },
  { id: "protein", name: "Proteína / Shake", dosage: "30g", timing: "Post-entreno", orderIndex: 6, isActive: true },
];

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

export type MuscleGroupId =
  | "chest"
  | "shoulders"
  | "upper_back"
  | "lats"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export type MuscleRecoveryState = "exhausted" | "recovering" | "recovered" | "rested";

export interface MuscleRecoveryItem {
  id: MuscleGroupId;
  name: string;
  nameEn: string;
  category: "upper_push" | "upper_pull" | "core" | "lower";
  recoveryPercent: number; // 0 to 100
  state: MuscleRecoveryState;
  lastTrainedAt?: string;
  hoursSinceLastTrained?: number;
  hoursToFullRecovery: number;
  totalSetsLast7Days: number;
  totalVolumeLast7Days: number;
  lastWorkoutTitle?: string;
  recentExercises: string[];
  recommendation: string;
}

export interface MuscleRecoverySummary {
  overallRecoveryPercent: number;
  readyToTrainCount: number;
  recoveringCount: number;
  exhaustedCount: number;
  muscles: Record<MuscleGroupId, MuscleRecoveryItem>;
  suggestedFocusToday: string[];
}


export interface NutritionSummary {
  kcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  nextMealTitle?: string;
  portions?: Partial<Record<FoodGroupKey, number>>;
  portionGoals?: Partial<Record<FoodGroupKey, number>>;
  totalPortionsConsumed?: number;
  totalPortionsTarget?: number;
  groupsMetCount?: number;
}

export interface DailyHealthData {
  todayHealth: HealthLog;
  waterPercent: number;
  weeklyWorkoutsCount: number;
  workoutStreak: number;
  averageSleepHours: number;
  recentLogs: HealthLog[];
  supplementsCatalog: UserSupplement[];
  nutritionSummary?: NutritionSummary;
  lastWorkoutSummary?: {
    title: string;
    date: string;
  };
}

export interface TrainingHealthData {
  recentHevyWorkouts: HevyWorkout[];
  hevyStats: HevyStats;
  workoutStreak: number;
  weeklyWorkoutsCount: number;
}

export interface BiometricsHealthData {
  biomarkersData: BiomarkersDashboardData;
  bodyCompositionLogs: BodyCompositionLog[];
  latestBodyComposition?: BodyCompositionLog;
  previousBodyComposition?: BodyCompositionLog;
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
  nutritionSummary?: NutritionSummary;
  biomarkersData?: BiomarkersDashboardData;
}

// ----------------------------------------------------
// Projects & Learning Vault Models
// ----------------------------------------------------

export type ProjectStatus = "idea" | "in_progress" | "permanent" | "paused" | "launched";

export interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  progress: number;
  taskPrefixes?: string[];
  canonicalPrefix?: string;
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
// Contextual Notes Models (Brio Multi-Notes)
// ----------------------------------------------------

export type NoteCategory =
  | "idea"
  | "decision"
  | "technical"
  | "meeting"
  | "log";

export interface ContextualNote {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
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
  tasks?: HabiticaTask[];
  tags?: HabiticaTag[];
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
  b12Weekly?: boolean;
  spirulina?: boolean;
  omega3Dha?: boolean;
  magnesium?: boolean;
  vitC?: boolean;
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
  supplements?: SupplementItem[];
  supplementsCatalog?: UserSupplement[];
}

// ----------------------------------------------------
// Módulo de Estudios de Laboratorio & Biomarcadores
// ----------------------------------------------------

export type BiomarkerCategoryKey =
  | "renal"
  | "cardio"
  | "hepatic"
  | "iron"
  | "immuno"
  | "hematology"
  | "urinalysis";

export type BiomarkerStatus = "optimal" | "normal" | "high" | "low" | "critical";

export interface BiomarkerLog {
  id: string;
  reportId?: string;
  date: string; // YYYY-MM-DD
  category: BiomarkerCategoryKey;
  name: string;
  code?: string;
  valueNumeric?: number;
  valueText?: string;
  unit?: string;
  refMin?: number;
  refMax?: number;
  refText?: string;
  status: BiomarkerStatus;
  notes?: string;
  orderIndex?: number;
}

export interface LabTestReport {
  id: string;
  date: string; // YYYY-MM-DD
  labName: string;
  orderNumber?: string;
  patientId?: string;
  title: string;
  doctorNotes?: string;
  fileUrl?: string;
  fileKey?: string;
  totalBiomarkers: number;
  abnormalCount: number;
  biomarkers: BiomarkerLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BiomarkersDashboardData {
  latestReport?: LabTestReport;
  reportsHistory: LabTestReport[];
  totalBiomarkersTracked: number;
  abnormalCount: number;
  categorySummaries: Record<
    BiomarkerCategoryKey,
    { total: number; abnormal: number; optimal: number }
  >;
  historicalTrends: Record<string, Array<{ date: string; value: number; unit?: string }>>;
}

// ----------------------------------------------------
// Male Hormonal & Circadian 24-Hour Models
// ----------------------------------------------------

export type HormonalPhaseId =
  | "wake_sunlight"      // 07:30 - 08:30: Despertar & Luz Solar
  | "morning_deep_work"  // 08:30 - 12:00: Pico Testosterona / Deep Work
  | "gym_power"          // 12:00 - 14:00: Gym & Fuerza (Hevy)
  | "anabolic_lunch"     // 14:00 - 15:00: Almuerzo Post-Gym Anabólico
  | "afternoon_flow"     // 15:00 - 19:00: Bloque Laboral 2 / Proyectos
  | "evening_hard_stop"  // 19:00 - 21:30: Hard Stop 7PM & Dim Light / Relax
  | "deep_sleep_10h";    // 21:30 - 07:30: 10h Sueño Profundo & GH/Andrógenos

export interface HormonalPhaseConfig {
  id: HormonalPhaseId;
  name: string;
  shortName: string;
  startTime: string;
  endTime: string;
  icon: string;
  color: string;
  hormoneFocus: string;
  actionHeadline: string;
  description: string;
  keyNutrientsOrTips: string[];
}

export interface HormonalScheduleConfig {
  sleepStart: string;         // "21:30"
  sleepEnd: string;           // "07:30"
  sleepTargetHours: number;   // 10
  morningFocusStart: string;  // "08:30"
  morningFocusEnd: string;    // "12:00"
  gymStart: string;           // "12:00"
  gymEnd: string;             // "14:00"
  lunchStart: string;         // "14:00"
  lunchEnd: string;           // "15:00"
  afternoonWorkStart: string; // "15:00"
  workHardStop: string;       // "19:00"
}

export interface HormonalDailyChecklist {
  sleep10hLogged: boolean;
  morningSunlight: boolean;
  morningDeepWorkDone: boolean;
  gymSessionCompleted: boolean;
  postGymNutrition: boolean;
  hardStop7pmRespected: boolean;
  nightDimLightMagnesium: boolean;
}

// ----------------------------------------------------
// Despensa Inteligente & Asistente 'Qué Cocinar' Models
// ----------------------------------------------------

export type PantryCategory =
  | "proteins_legumes"
  | "carbs_cereals"
  | "healthy_fats"
  | "vegetables_greens"
  | "fruits"
  | "kitchen_essentials";

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  inStock: boolean;
  icon?: string;
}


