"use server";

import { getDb } from "@/lib/db";
import {
  CategoryBreakdown,
  CommitmentFrequency,
  CommitmentStatus,
  CommitmentSummaryStats,
  CommitmentType,
  DEFAULT_FINANCE_ACCOUNTS,
  DEFAULT_FINANCE_CATEGORIES,
  FinanceAccount,
  FinanceCategory,
  FinanceCommitment,
  FinanceDashboardData,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
  TransactionType,
  VariablePaymentScheduleItem,
  WishlistStatus,
} from "@/lib/types";
import { awardHabiticaEvent } from "@/lib/habiticaEvents";
import { revalidatePath } from "next/cache";
import { getTodayDateStr, toDateStr } from "@/lib/dateUtils";

interface WishlistDbRow {
  id: string;
  title: string;
  price_estimated: number | string;
  category?: string;
  priority?: string;
  url?: string;
  image_url?: string;
  reason_or_notes?: string;
  status: string;
  cooling_days_total?: number | string;
  created_at?: Date | string;
  resolved_at?: Date | string;
}

interface CategoryDbRow {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  is_ant_default?: boolean | null;
  is_fixed?: boolean | null;
  order_index?: number | string | null;
  is_active?: boolean | null;
  created_at?: Date | string | null;
}

interface AccountDbRow {
  id: string;
  name: string;
  type?: string | null;
  icon?: string | null;
  color?: string | null;
  order_index?: number | string | null;
  is_active?: boolean | null;
  created_at?: Date | string | null;
}

interface CommitmentDbRow {
  id: string;
  title: string;
  type: string;
  category?: string | null;
  default_account?: string | null;
  total_amount?: number | string | null;
  installment_amount?: number | string | null;
  installments_total?: number | string | null;
  installments_paid?: number | string | null;
  frequency?: string | null;
  next_due_date?: Date | string | null;
  variable_schedule?: VariablePaymentScheduleItem[] | string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
}

type SqlClient = { (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> };

export async function ensureFinanceTables(sql: SqlClient) {
  await sql`
    CREATE TABLE IF NOT EXISTS finance_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_ant_default BOOLEAN DEFAULT FALSE,
      is_fixed BOOLEAN DEFAULT FALSE,
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS finance_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'credit',
      icon TEXT,
      color TEXT,
      order_index INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS finance_commitments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT DEFAULT 'servicios',
      default_account TEXT DEFAULT 'dolarapp',
      total_amount NUMERIC(12, 2),
      installment_amount NUMERIC(12, 2),
      installments_total INTEGER,
      installments_paid INTEGER DEFAULT 0,
      frequency TEXT DEFAULT 'monthly',
      next_due_date DATE,
      variable_schedule JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
}

export async function getFinanceCatalog(sql: SqlClient): Promise<{
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
}> {
  try {
    await ensureFinanceTables(sql);

    const [catRows, accRows] = await Promise.all([
      sql`SELECT * FROM finance_categories WHERE is_active = TRUE ORDER BY order_index ASC, created_at ASC;`,
      sql`SELECT * FROM finance_accounts WHERE is_active = TRUE ORDER BY order_index ASC, created_at ASC;`,
    ]);

    let categories: FinanceCategory[] = [];
    if (catRows.length > 0) {
      categories = (catRows as unknown as CategoryDbRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon || undefined,
        color: r.color || undefined,
        isAntDefault: Boolean(r.is_ant_default),
        isFixed: Boolean(r.is_fixed),
        orderIndex: Number(r.order_index) || 0,
        isActive: r.is_active ?? true,
        createdAt: r.created_at?.toString(),
      }));
    } else {
      for (const cat of DEFAULT_FINANCE_CATEGORIES) {
        await sql`
          INSERT INTO finance_categories (id, name, icon, color, is_ant_default, is_fixed, order_index, is_active)
          VALUES (${cat.id}, ${cat.name}, ${cat.icon || null}, ${cat.color || null}, ${Boolean(cat.isAntDefault)}, ${Boolean(cat.isFixed)}, ${cat.orderIndex || 0}, TRUE)
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      categories = DEFAULT_FINANCE_CATEGORIES;
    }

    let accounts: FinanceAccount[] = [];
    if (accRows.length > 0) {
      accounts = (accRows as unknown as AccountDbRow[]).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type || "credit",
        icon: r.icon || undefined,
        color: r.color || undefined,
        orderIndex: Number(r.order_index) || 0,
        isActive: r.is_active ?? true,
        createdAt: r.created_at?.toString(),
      }));
    } else {
      for (const acc of DEFAULT_FINANCE_ACCOUNTS) {
        await sql`
          INSERT INTO finance_accounts (id, name, type, icon, color, order_index, is_active)
          VALUES (${acc.id}, ${acc.name}, ${acc.type || "credit"}, ${acc.icon || null}, ${acc.color || null}, ${acc.orderIndex || 0}, TRUE)
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      accounts = DEFAULT_FINANCE_ACCOUNTS;
    }

    return { categories, accounts };
  } catch (error) {
    console.error("[Get Finance Catalog Error]:", error);
    return {
      categories: DEFAULT_FINANCE_CATEGORIES,
      accounts: DEFAULT_FINANCE_ACCOUNTS,
    };
  }
}

function mapCommitmentRow(r: CommitmentDbRow): FinanceCommitment {
  const totalAmount = r.total_amount ? Number(r.total_amount) : undefined;
  const installmentAmount = r.installment_amount ? Number(r.installment_amount) : undefined;
  const installmentsTotal = r.installments_total ? Number(r.installments_total) : undefined;
  const installmentsPaid = Number(r.installments_paid) || 0;
  const type = (r.type || "installment") as CommitmentType;
  const status = (r.status || "active") as CommitmentStatus;

  let variableSchedule: VariablePaymentScheduleItem[] = [];
  if (r.variable_schedule) {
    if (typeof r.variable_schedule === "string") {
      try {
        variableSchedule = JSON.parse(r.variable_schedule);
      } catch {
        variableSchedule = [];
      }
    } else if (Array.isArray(r.variable_schedule)) {
      variableSchedule = r.variable_schedule;
    }
  }

  // Calculate remaining installments
  let remainingInstallments: number | undefined;
  if (type === "installment" && installmentsTotal !== undefined) {
    remainingInstallments = Math.max(0, installmentsTotal - installmentsPaid);
  }

  // Calculate remaining balance
  let remainingBalance = 0;
  if (status === "completed") {
    remainingBalance = 0;
  } else if (type === "installment") {
    if (installmentAmount && remainingInstallments !== undefined) {
      remainingBalance = installmentAmount * remainingInstallments;
    } else if (totalAmount) {
      remainingBalance = Math.max(0, totalAmount - (installmentsPaid * (installmentAmount || 0)));
    }
  } else if (type === "variable_schedule") {
    remainingBalance = variableSchedule
      .filter((item) => !item.isPaid)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  } else if (type === "one_time") {
    remainingBalance = totalAmount || 0;
  } else if (type === "recurring") {
    remainingBalance = installmentAmount || totalAmount || 0;
  }

  // Next payment amount & next due date
  let nextPaymentAmount = installmentAmount || totalAmount || 0;
  let nextDueDate = r.next_due_date ? toDateStr(r.next_due_date) : undefined;

  if (type === "variable_schedule") {
    const nextUnpaid = variableSchedule.find((item) => !item.isPaid);
    if (nextUnpaid) {
      nextPaymentAmount = nextUnpaid.amount;
      if (!nextDueDate || nextUnpaid.date) {
        nextDueDate = nextUnpaid.date;
      }
    }
  }

  // Due date calculations
  let isOverdue = false;
  let daysUntilDue: number | undefined;
  if (nextDueDate && status === "active") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextDueDate + "T00:00:00");
    const diffMs = due.getTime() - today.getTime();
    daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));
    isOverdue = daysUntilDue < 0;
  }

  return {
    id: r.id,
    title: r.title,
    type,
    category: r.category || "servicios",
    defaultAccount: r.default_account || "dolarapp",
    totalAmount,
    installmentAmount,
    installmentsTotal,
    installmentsPaid,
    frequency: (r.frequency || "monthly") as CommitmentFrequency,
    nextDueDate,
    variableSchedule,
    status,
    notes: r.notes || undefined,
    createdAt: r.created_at?.toString(),
    updatedAt: r.updated_at?.toString(),
    remainingInstallments,
    remainingBalance,
    nextPaymentAmount,
    isOverdue,
    daysUntilDue,
  };
}

function calculateCommitmentStats(commitments: FinanceCommitment[]): CommitmentSummaryStats {
  const active = commitments.filter((c) => c.status === "active");

  const totalMonthlyCommitment = active.reduce((sum, c) => sum + (c.nextPaymentAmount || 0), 0);
  const totalRemainingDebt = active
    .filter((c) => c.type === "installment" || c.type === "variable_schedule" || c.type === "one_time")
    .reduce((sum, c) => sum + (c.remainingBalance || 0), 0);
  const dueSoonCount = active.filter((c) => c.daysUntilDue !== undefined && c.daysUntilDue <= 7).length;
  const installmentCount = active.filter((c) => c.type === "installment").length;

  return {
    totalMonthlyCommitment,
    totalRemainingDebt,
    dueSoonCount,
    activeCount: active.length,
    installmentCount,
  };
}

/**
 * Server Action: Fetches all financial metrics, budget thermometer, transactions, savings goals, and commitments.
 * Uses Promise.all to fetch budget, transactions, savings goals, wishlist, commitments, and catalogs concurrently.
 */
export async function fetchFinanceDashboardDataAction(
  targetMonth?: number,
  targetYear?: number
): Promise<FinanceDashboardData> {
  const sql = getDb();
  await ensureFinanceTables(sql);

  const now = new Date();
  const month = targetMonth || now.getMonth() + 1;
  const year = targetYear || now.getFullYear();
  const budgetId = `${year}-${String(month).padStart(2, "0")}`;

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  // Parallel execution of all 6 independent queries
  const [budgetRows, transactionRows, goalsRows, wishlistRows, commitmentRows, catalog] = await Promise.all([
    sql`SELECT * FROM monthly_budgets WHERE id = ${budgetId} LIMIT 1;`,
    sql`SELECT * FROM transactions WHERE date >= ${startDate} AND date < ${endDate} ORDER BY date DESC, created_at DESC;`,
    sql`SELECT * FROM savings_goals ORDER BY created_at ASC;`,
    sql`SELECT * FROM wishlist_items ORDER BY created_at DESC;`,
    sql`SELECT * FROM finance_commitments ORDER BY status ASC, next_due_date ASC NULLS LAST, created_at DESC;`,
    getFinanceCatalog(sql),
  ]);

  // 1. Process Monthly Budget
  let currentBudget: MonthlyBudget;
  if (budgetRows.length > 0) {
    const row = budgetRows[0];
    currentBudget = {
      id: row.id,
      month: Number(row.month),
      year: Number(row.year),
      budgetedIncome: Number(row.budgeted_income) || 0,
      budgetedFixedExpenses: Number(row.budgeted_fixed_expenses) || 0,
      budgetedVariableExpenses: Number(row.budgeted_variable_expenses) || 0,
      dailyAntLimit: Number(row.daily_ant_limit) || 150,
    };
  } else {
    currentBudget = {
      id: budgetId,
      month,
      year,
      budgetedIncome: 25000,
      budgetedFixedExpenses: 10000,
      budgetedVariableExpenses: 8000,
      dailyAntLimit: 150,
    };
  }

  // 2. Process Transactions
  const todayStr = getTodayDateStr();

  let totalExpensesThisMonth = 0;
  let totalIncomeThisMonth = 0;
  let totalFixedExpensesThisMonth = 0;
  let totalVariableExpensesThisMonth = 0;
  let totalAntExpensesToday = 0;
  let totalAntExpensesThisMonth = 0;

  const categoryMap: Record<string, { total: number; count: number }> = {};

  const transactions: Transaction[] = transactionRows.map((r) => {
    const amt = Number(r.amount);
    const isAnt = Boolean(r.is_ant_expense);
    const dateStr = toDateStr(r.date);

    if (r.type === "expense") {
      totalExpensesThisMonth += amt;
      const cat = (r.category || "general").toLowerCase();

      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
      categoryMap[cat].total += amt;
      categoryMap[cat].count += 1;

      if (cat === "fijo" || cat === "renta" || cat === "servicios" || cat === "suscripciones") {
        totalFixedExpensesThisMonth += amt;
      } else {
        totalVariableExpensesThisMonth += amt;
      }

      if (isAnt) {
        totalAntExpensesThisMonth += amt;
        if (dateStr === todayStr) {
          totalAntExpensesToday += amt;
        }
      }
    } else if (r.type === "income") {
      totalIncomeThisMonth += amt;
    }

    return {
      id: r.id,
      amount: amt,
      type: r.type as TransactionType,
      category: r.category,
      account: r.account,
      notes: r.notes,
      isAntExpense: isAnt,
      date: dateStr,
      createdAt: r.created_at?.toString(),
    };
  });

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalExpensesThisMonth > 0 ? Math.round((data.total / totalExpensesThisMonth) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 3. Process Savings Goals
  const savingsGoals: SavingsGoal[] = goalsRows.map((g) => ({
    id: g.id,
    title: g.title,
    targetAmount: Number(g.target_amount),
    currentAmount: Number(g.current_amount),
    deadline: g.deadline ? toDateStr(g.deadline) : undefined,
    category: g.category || "general",
    color: g.color || "#6366f1",
    createdAt: g.created_at?.toString(),
  }));

  const remainingDailyAntBudget = Math.max(0, currentBudget.dailyAntLimit - totalAntExpensesToday);
  const remainingMonthlyVariableBudget = currentBudget.budgetedVariableExpenses - totalVariableExpensesThisMonth;

  // 4. Process Commitments
  const commitments: FinanceCommitment[] = (commitmentRows as unknown as CommitmentDbRow[]).map(mapCommitmentRow);
  const commitmentsStats = calculateCommitmentStats(commitments);

  // 5. Process Wishlist Anti-Impulso data
  const nowMs = Date.now();
  const wishlistItems = (wishlistRows as unknown as WishlistDbRow[]).map((r) => {
    const createdAt = r.created_at
      ? typeof r.created_at === "string"
        ? r.created_at
        : new Date(r.created_at).toISOString()
      : new Date().toISOString();
    const createdMs = new Date(createdAt).getTime();
    const daysElapsed = Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)));
    const coolingDaysTotal = Number(r.cooling_days_total) || 30;
    const daysRemaining = Math.max(0, coolingDaysTotal - daysElapsed);
    const isCoolingFinished = daysRemaining === 0;

    let computedStatus = r.status;
    if (computedStatus === "cooling" && isCoolingFinished) {
      computedStatus = "ready";
    }

    return {
      id: r.id,
      title: r.title,
      priceEstimated: Number(r.price_estimated) || 0,
      category: r.category || "General",
      priority: (r.priority as "high" | "medium" | "low") || "medium",
      url: r.url || undefined,
      imageUrl: r.image_url || undefined,
      reasonOrNotes: r.reason_or_notes || undefined,
      status: (computedStatus === "bought" ? "purchased" : computedStatus) as WishlistStatus,
      coolingDaysTotal,
      daysElapsed,
      daysRemaining,
      isCoolingFinished,
      createdAt,
      resolvedAt: r.resolved_at?.toString(),
    };
  });


  const activeWishlist = wishlistItems.filter((i) => i.status === "cooling" || i.status === "ready");
  const dismissedWishlist = wishlistItems.filter((i) => i.status === "dismissed");

  const wishlistData = {
    items: wishlistItems,
    stats: {
      totalWishlistValue: Number(activeWishlist.reduce((sum, i) => sum + i.priceEstimated, 0).toFixed(2)),
      totalSavedImpulseValue: Number(dismissedWishlist.reduce((sum, i) => sum + i.priceEstimated, 0).toFixed(2)),
      coolingCount: wishlistItems.filter((i) => i.status === "cooling").length,
      readyCount: wishlistItems.filter((i) => i.status === "ready").length,
      purchasedCount: wishlistItems.filter((i) => i.status === "purchased").length,
      dismissedCount: dismissedWishlist.length,
    },
  };

  return {
    currentBudget,
    totalExpensesThisMonth,
    totalIncomeThisMonth,
    totalFixedExpensesThisMonth,
    totalVariableExpensesThisMonth,
    totalAntExpensesToday,
    totalAntExpensesThisMonth,
    remainingDailyAntBudget,
    remainingMonthlyVariableBudget,
    recentTransactions: transactions,
    savingsGoals,
    categoryBreakdown,
    wishlistData,
    categories: catalog.categories,
    accounts: catalog.accounts,
    commitments,
    commitmentsStats,
  };
}

/**
 * Server Action: Creates a new financial transaction in Neon PostgreSQL.
 */
export async function createTransactionAction(payload: {
  amount: number;
  type: TransactionType;
  concept?: string;
  category?: string;
  account?: string;
  isAntExpense?: boolean;
  notes?: string;
  date?: string;
}): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  try {
    const sql = getDb();

    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const date = toDateStr(payload.date);
    const category = (payload.category || "general").toLowerCase().trim();
    const account = (payload.account || "default").toLowerCase().trim();
    const isAnt = Boolean(payload.isAntExpense);
    const notes = [payload.concept, payload.notes].filter(Boolean).join(" - ");

    await sql`
      INSERT INTO transactions (id, amount, type, category, account, notes, is_ant_expense, date)
      VALUES (${id}, ${payload.amount}, ${payload.type}, ${category}, ${account}, ${notes}, ${isAnt}, ${date});
    `;

    // Increment daily activity log for expenses
    await sql`
      INSERT INTO daily_activity_logs (date, expenses_count)
      VALUES (${date}, 1)
      ON CONFLICT (date) DO UPDATE
      SET expenses_count = daily_activity_logs.expenses_count + 1,
          updated_at = NOW();
    `;

    // Award Habitica XP for logging transactions
    await awardHabiticaEvent("DAILY_EXPENSES_LOGGED", {
      customNotes: `${payload.type === "expense" ? "Gasto" : "Ingreso"}: $${payload.amount} • ${payload.concept || category}`,
    });

    revalidatePath("/");

    return {
      success: true,
      transaction: {
        id,
        amount: payload.amount,
        type: payload.type,
        category,
        account,
        notes,
        isAntExpense: isAnt,
        date,
      },
    };
  } catch (error) {
    console.error("[Create Transaction Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error creating transaction",
    };
  }
}

/**
 * Server Action: Deletes a transaction.
 */
export async function deleteTransactionAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`DELETE FROM transactions WHERE id = ${id};`;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Transaction Error]:", error);
    return { success: false, error: "Failed to delete transaction" };
  }
}

/**
 * Server Action: Updates an existing transaction.
 */
export async function updateTransactionAction(
  id: string,
  updates: {
    amount?: number;
    type?: TransactionType;
    category?: string;
    account?: string;
    notes?: string;
    isAntExpense?: boolean;
    date?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const existingRows = await sql`SELECT * FROM transactions WHERE id = ${id} LIMIT 1;`;
    if (existingRows.length === 0) return { success: false, error: "Transacción no encontrada" };

    const row = existingRows[0] as any;
    const amount = updates.amount !== undefined ? Number(updates.amount) : Number(row.amount);
    const type = updates.type !== undefined ? updates.type : row.type;
    const category = updates.category !== undefined ? updates.category.toLowerCase().trim() : row.category;
    const account = updates.account !== undefined ? updates.account.toLowerCase().trim() : row.account;
    const notes = updates.notes !== undefined ? updates.notes.trim() : row.notes;
    const isAntExpense = updates.isAntExpense !== undefined ? Boolean(updates.isAntExpense) : Boolean(row.is_ant_expense);
    const date = updates.date !== undefined ? toDateStr(updates.date) : toDateStr(row.date);

    await sql`
      UPDATE transactions
      SET amount = ${amount},
          type = ${type},
          category = ${category},
          account = ${account},
          notes = ${notes},
          is_ant_expense = ${isAntExpense},
          date = ${date}
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Transaction Error]:", error);
    return { success: false, error: "Error al actualizar la transacción" };
  }
}

/**
 * Server Action: Updates the monthly budget targets.
 */
export async function updateMonthlyBudgetAction(payload: {
  month: number;
  year: number;
  budgetedIncome: number;
  budgetedFixedExpenses: number;
  budgetedVariableExpenses: number;
  dailyAntLimit: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const id = `${payload.year}-${String(payload.month).padStart(2, "0")}`;

    await sql`
      INSERT INTO monthly_budgets (id, month, year, budgeted_income, budgeted_fixed_expenses, budgeted_variable_expenses, daily_ant_limit, updated_at)
      VALUES (${id}, ${payload.month}, ${payload.year}, ${payload.budgetedIncome}, ${payload.budgetedFixedExpenses}, ${payload.budgetedVariableExpenses}, ${payload.dailyAntLimit}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET budgeted_income = ${payload.budgetedIncome},
          budgeted_fixed_expenses = ${payload.budgetedFixedExpenses},
          budgeted_variable_expenses = ${payload.budgetedVariableExpenses},
          daily_ant_limit = ${payload.dailyAntLimit},
          updated_at = NOW();
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Budget Error]:", error);
    return { success: false, error: "Failed to update monthly budget" };
  }
}

/**
 * Server Action: Creates or contributes to a Savings Goal.
 */
export async function createSavingsGoalAction(payload: {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  category?: string;
  color?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const id = `goal-${Date.now()}`;

    await sql`
      INSERT INTO savings_goals (id, title, target_amount, current_amount, deadline, category, color)
      VALUES (${id}, ${payload.title}, ${payload.targetAmount}, ${payload.currentAmount || 0}, ${payload.deadline || null}, ${payload.category || "general"}, ${payload.color || "#6366f1"});
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Create Goal Error]:", error);
    return { success: false, error: "Failed to create savings goal" };
  }
}

export async function contributeToSavingsGoalAction(
  goalId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`
      UPDATE savings_goals
      SET current_amount = current_amount + ${amount}
      WHERE id = ${goalId};
    `;

    // Award Habitica XP for saving money
    await awardHabiticaEvent("SAVINGS_CONTRIBUTION", {
      customNotes: `Aporte de $${amount} a meta de ahorro`,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Contribute Goal Error]:", error);
    return { success: false, error: "Failed to contribute to goal" };
  }
}

export async function updateSavingsGoalAction(
  goalId: string,
  updates: Partial<SavingsGoal>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    const existing = await sql`SELECT * FROM savings_goals WHERE id = ${goalId} LIMIT 1;`;
    if (existing.length === 0) return { success: false, error: "Meta no encontrada" };

    const row = existing[0];
    const title = updates.title !== undefined ? updates.title.trim() : row.title;
    const targetAmount = updates.targetAmount !== undefined ? Number(updates.targetAmount) : Number(row.target_amount);
    const currentAmount = updates.currentAmount !== undefined ? Number(updates.currentAmount) : Number(row.current_amount);
    const deadline = updates.deadline !== undefined ? (updates.deadline ? toDateStr(updates.deadline) : null) : row.deadline;
    const category = updates.category !== undefined ? updates.category : row.category;
    const color = updates.color !== undefined ? updates.color : row.color;

    await sql`
      UPDATE savings_goals
      SET title = ${title},
          target_amount = ${targetAmount},
          current_amount = ${currentAmount},
          deadline = ${deadline},
          category = ${category},
          color = ${color}
      WHERE id = ${goalId};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Goal Error]:", error);
    return { success: false, error: "Error al actualizar la meta de ahorro" };
  }
}

export async function deleteSavingsGoalAction(goalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`DELETE FROM savings_goals WHERE id = ${goalId};`;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Goal Error]:", error);
    return { success: false, error: "Error al eliminar la meta de ahorro" };
  }
}

/**
 * Server Actions: Categorías de Finanzas
 */
export async function createFinanceCategoryAction(payload: {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  isAntDefault?: boolean;
  isFixed?: boolean;
  orderIndex?: number;
}): Promise<{ success: boolean; category?: FinanceCategory; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);

    const name = payload.name.trim();
    if (!name) return { success: false, error: "El nombre de la categoría es requerido" };

    const id = (payload.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim() || `cat-${Date.now()}`;
    const icon = payload.icon?.trim() || "🏷️";
    const color = payload.color?.trim() || "#f59e0b";
    const isAnt = Boolean(payload.isAntDefault);
    const isFixed = Boolean(payload.isFixed);
    const orderIndex = Number(payload.orderIndex) || 0;

    await sql`
      INSERT INTO finance_categories (id, name, icon, color, is_ant_default, is_fixed, order_index, is_active)
      VALUES (${id}, ${name}, ${icon}, ${color}, ${isAnt}, ${isFixed}, ${orderIndex}, TRUE)
      ON CONFLICT (id) DO UPDATE
      SET name = ${name},
          icon = ${icon},
          color = ${color},
          is_ant_default = ${isAnt},
          is_fixed = ${isFixed},
          is_active = TRUE;
    `;

    revalidatePath("/");
    return {
      success: true,
      category: { id, name, icon, color, isAntDefault: isAnt, isFixed, orderIndex, isActive: true },
    };
  } catch (error) {
    console.error("[Create Category Error]:", error);
    return { success: false, error: "Error al crear la categoría" };
  }
}

export async function updateFinanceCategoryAction(
  id: string,
  updates: Partial<FinanceCategory>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);

    const existingRows = await sql`SELECT * FROM finance_categories WHERE id = ${id} LIMIT 1;`;
    if (existingRows.length === 0) return { success: false, error: "Categoría no encontrada" };

    const row = existingRows[0] as unknown as CategoryDbRow;
    const name = updates.name !== undefined ? updates.name.trim() : row.name;
    const icon = updates.icon !== undefined ? updates.icon.trim() : row.icon;
    const color = updates.color !== undefined ? updates.color.trim() : row.color;
    const isAnt = updates.isAntDefault !== undefined ? Boolean(updates.isAntDefault) : Boolean(row.is_ant_default);
    const isFixed = updates.isFixed !== undefined ? Boolean(updates.isFixed) : Boolean(row.is_fixed);
    const orderIndex = updates.orderIndex !== undefined ? Number(updates.orderIndex) : Number(row.order_index);
    const isActive = updates.isActive !== undefined ? Boolean(updates.isActive) : (row.is_active ?? true);

    await sql`
      UPDATE finance_categories
      SET name = ${name},
          icon = ${icon},
          color = ${color},
          is_ant_default = ${isAnt},
          is_fixed = ${isFixed},
          order_index = ${orderIndex},
          is_active = ${isActive}
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Category Error]:", error);
    return { success: false, error: "Error al actualizar la categoría" };
  }
}

export async function deleteFinanceCategoryAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);
    await sql`DELETE FROM finance_categories WHERE id = ${id};`;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Category Error]:", error);
    return { success: false, error: "Error al eliminar la categoría" };
  }
}

/**
 * Server Actions: Tarjetas y Cuentas de Finanzas
 */
export async function createFinanceAccountAction(payload: {
  id?: string;
  name: string;
  type?: string;
  icon?: string;
  color?: string;
  orderIndex?: number;
}): Promise<{ success: boolean; account?: FinanceAccount; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);

    const name = payload.name.trim();
    if (!name) return { success: false, error: "El nombre de la cuenta/tarjeta es requerido" };

    const id = (payload.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim() || `acc-${Date.now()}`;
    const type = payload.type?.trim() || "credit";
    const icon = payload.icon?.trim() || (type === "cash" ? "💵" : type === "debit" || type === "bank" ? "🏦" : "💳");
    const color = payload.color?.trim() || "#6366f1";
    const orderIndex = Number(payload.orderIndex) || 0;

    await sql`
      INSERT INTO finance_accounts (id, name, type, icon, color, order_index, is_active)
      VALUES (${id}, ${name}, ${type}, ${icon}, ${color}, ${orderIndex}, TRUE)
      ON CONFLICT (id) DO UPDATE
      SET name = ${name},
          type = ${type},
          icon = ${icon},
          color = ${color},
          is_active = TRUE;
    `;

    revalidatePath("/");
    return {
      success: true,
      account: { id, name, type, icon, color, orderIndex, isActive: true },
    };
  } catch (error) {
    console.error("[Create Account Error]:", error);
    return { success: false, error: "Error al crear la cuenta o tarjeta" };
  }
}

export async function updateFinanceAccountAction(
  id: string,
  updates: Partial<FinanceAccount>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);

    const existingRows = await sql`SELECT * FROM finance_accounts WHERE id = ${id} LIMIT 1;`;
    if (existingRows.length === 0) return { success: false, error: "Cuenta no encontrada" };

    const row = existingRows[0] as unknown as AccountDbRow;
    const name = updates.name !== undefined ? updates.name.trim() : row.name;
    const type = updates.type !== undefined ? updates.type.trim() : (row.type || "credit");
    const icon = updates.icon !== undefined ? updates.icon.trim() : row.icon;
    const color = updates.color !== undefined ? updates.color.trim() : row.color;
    const orderIndex = updates.orderIndex !== undefined ? Number(updates.orderIndex) : Number(row.order_index);
    const isActive = updates.isActive !== undefined ? Boolean(updates.isActive) : (row.is_active ?? true);

    await sql`
      UPDATE finance_accounts
      SET name = ${name},
          type = ${type},
          icon = ${icon},
          color = ${color},
          order_index = ${orderIndex},
          is_active = ${isActive}
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Account Error]:", error);
    return { success: false, error: "Error al actualizar la cuenta o tarjeta" };
  }
}

export async function deleteFinanceAccountAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);
    await sql`DELETE FROM finance_accounts WHERE id = ${id};`;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Account Error]:", error);
    return { success: false, error: "Error al eliminar la cuenta o tarjeta" };
  }
}

// ----------------------------------------------------
// Finance Commitments Server Actions
// ----------------------------------------------------

export async function fetchFinanceCommitmentsAction(): Promise<FinanceCommitment[]> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);
    const rows = await sql`
      SELECT * FROM finance_commitments 
      ORDER BY 
        CASE status 
          WHEN 'active' THEN 1 
          WHEN 'paused' THEN 2 
          WHEN 'completed' THEN 3 
          ELSE 4 
        END ASC,
        next_due_date ASC NULLS LAST, 
        created_at DESC;
    `;
    return (rows as unknown as CommitmentDbRow[]).map(mapCommitmentRow);
  } catch (error) {
    console.error("[fetchFinanceCommitmentsAction Error]:", error);
    return [];
  }
}

export async function createFinanceCommitmentAction(payload: {
  title: string;
  type: CommitmentType;
  category?: string;
  defaultAccount?: string;
  totalAmount?: number;
  installmentAmount?: number;
  installmentsTotal?: number;
  installmentsPaid?: number;
  frequency?: CommitmentFrequency;
  nextDueDate?: string;
  variableSchedule?: VariablePaymentScheduleItem[];
  notes?: string;
}): Promise<{ success: boolean; commitment?: FinanceCommitment; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);

    const title = payload.title?.trim();
    if (!title) return { success: false, error: "El título o concepto del compromiso es requerido." };

    const id = `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const type = payload.type || "installment";
    const category = (payload.category || "servicios").toLowerCase().trim();
    const defaultAccount = (payload.defaultAccount || "dolarapp").toLowerCase().trim();
    const totalAmount = payload.totalAmount !== undefined && payload.totalAmount !== null ? Number(payload.totalAmount) : null;
    const installmentAmount = payload.installmentAmount !== undefined && payload.installmentAmount !== null ? Number(payload.installmentAmount) : null;
    const installmentsTotal = payload.installmentsTotal !== undefined && payload.installmentsTotal !== null ? Number(payload.installmentsTotal) : null;
    const installmentsPaid = Number(payload.installmentsPaid) || 0;
    const frequency = payload.frequency || "monthly";
    const nextDueDate = payload.nextDueDate ? toDateStr(payload.nextDueDate) : null;
    const variableSchedule = JSON.stringify(payload.variableSchedule || []);
    const notes = payload.notes?.trim() || null;

    await sql`
      INSERT INTO finance_commitments (
        id, title, type, category, default_account, total_amount, installment_amount,
        installments_total, installments_paid, frequency, next_due_date,
        variable_schedule, status, notes, created_at, updated_at
      ) VALUES (
        ${id}, ${title}, ${type}, ${category}, ${defaultAccount}, ${totalAmount}, ${installmentAmount},
        ${installmentsTotal}, ${installmentsPaid}, ${frequency}, ${nextDueDate},
        ${variableSchedule}::jsonb, 'active', ${notes}, NOW(), NOW()
      );
    `;

    revalidatePath("/");
    return {
      success: true,
      commitment: mapCommitmentRow({
        id,
        title,
        type,
        category,
        default_account: defaultAccount,
        total_amount: totalAmount,
        installment_amount: installmentAmount,
        installments_total: installmentsTotal,
        installments_paid: installmentsPaid,
        frequency,
        next_due_date: nextDueDate,
        variable_schedule: payload.variableSchedule || [],
        status: "active",
        notes,
        created_at: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("[Create Commitment Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al registrar compromiso",
    };
  }
}

export async function updateFinanceCommitmentAction(
  id: string,
  updates: Partial<FinanceCommitment>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);

    const existingRows = await sql`SELECT * FROM finance_commitments WHERE id = ${id} LIMIT 1;`;
    if (existingRows.length === 0) return { success: false, error: "Compromiso no encontrado" };

    const row = existingRows[0] as unknown as CommitmentDbRow;
    const title = updates.title !== undefined ? updates.title.trim() : row.title;
    const type = updates.type !== undefined ? updates.type : row.type;
    const category = updates.category !== undefined ? updates.category.trim() : row.category;
    const defaultAccount = updates.defaultAccount !== undefined ? updates.defaultAccount.trim() : row.default_account;
    const totalAmount = updates.totalAmount !== undefined ? Number(updates.totalAmount) : (row.total_amount ? Number(row.total_amount) : null);
    const installmentAmount = updates.installmentAmount !== undefined ? Number(updates.installmentAmount) : (row.installment_amount ? Number(row.installment_amount) : null);
    const installmentsTotal = updates.installmentsTotal !== undefined ? Number(updates.installmentsTotal) : (row.installments_total ? Number(row.installments_total) : null);
    const installmentsPaid = updates.installmentsPaid !== undefined ? Number(updates.installmentsPaid) : (row.installments_paid ? Number(row.installments_paid) : 0);
    const frequency = updates.frequency !== undefined ? updates.frequency : row.frequency;
    const nextDueDate = updates.nextDueDate !== undefined ? (updates.nextDueDate ? toDateStr(updates.nextDueDate) : null) : (row.next_due_date ? toDateStr(row.next_due_date) : null);
    const variableSchedule = updates.variableSchedule !== undefined
      ? JSON.stringify(updates.variableSchedule)
      : (typeof row.variable_schedule === "string" ? row.variable_schedule : JSON.stringify(row.variable_schedule || []));
    const status = updates.status !== undefined ? updates.status : row.status;
    const notes = updates.notes !== undefined ? updates.notes?.trim() || null : row.notes;

    await sql`
      UPDATE finance_commitments
      SET title = ${title},
          type = ${type},
          category = ${category},
          default_account = ${defaultAccount},
          total_amount = ${totalAmount},
          installment_amount = ${installmentAmount},
          installments_total = ${installmentsTotal},
          installments_paid = ${installmentsPaid},
          frequency = ${frequency},
          next_due_date = ${nextDueDate},
          variable_schedule = ${variableSchedule}::jsonb,
          status = ${status},
          notes = ${notes},
          updated_at = NOW()
      WHERE id = ${id};
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Update Commitment Error]:", error);
    return { success: false, error: "Error al actualizar el compromiso" };
  }
}

export async function deleteFinanceCommitmentAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);
    await sql`DELETE FROM finance_commitments WHERE id = ${id};`;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Delete Commitment Error]:", error);
    return { success: false, error: "Error al eliminar el compromiso" };
  }
}

/**
 * Server Action: Settles a payment for a commitment.
 * Generates an expense transaction, advances progress/due date, and records activity.
 */
export async function settleCommitmentPaymentAction(payload: {
  commitmentId: string;
  amount: number;
  account: string;
  date?: string;
  notes?: string;
  scheduleItemId?: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const sql = getDb();
    await ensureFinanceTables(sql);

    const commitmentRows = await sql`
      SELECT * FROM finance_commitments WHERE id = ${payload.commitmentId} LIMIT 1;
    `;
    if (commitmentRows.length === 0) {
      return { success: false, error: "Compromiso no encontrado." };
    }

    const commitment = commitmentRows[0] as unknown as CommitmentDbRow;
    const txId = `tx-cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const txDate = toDateStr(payload.date || getTodayDateStr());
    const account = (payload.account || commitment.default_account || "dolarapp").toLowerCase().trim();
    const category = (commitment.category || "servicios").toLowerCase().trim();

    let txNotes = `Pago compromiso: ${commitment.title}`;
    if (commitment.type === "installment") {
      const nextInst = (Number(commitment.installments_paid) || 0) + 1;
      const totalInst = Number(commitment.installments_total) || "?";
      txNotes = `Cuota ${nextInst}/${totalInst} - ${commitment.title}`;
    } else if (payload.notes) {
      txNotes = `${commitment.title} - ${payload.notes}`;
    }

    // 1. Insert transaction into Neon DB
    await sql`
      INSERT INTO transactions (id, amount, type, category, account, notes, is_ant_expense, date)
      VALUES (${txId}, ${payload.amount}, 'expense', ${category}, ${account}, ${txNotes}, FALSE, ${txDate});
    `;

    // 2. Increment daily activity log
    await sql`
      INSERT INTO daily_activity_logs (date, expenses_count)
      VALUES (${txDate}, 1)
      ON CONFLICT (date) DO UPDATE
      SET expenses_count = daily_activity_logs.expenses_count + 1,
          updated_at = NOW();
    `;

    // 3. Update commitment state
    let newStatus = commitment.status || "active";
    let newPaidCount = Number(commitment.installments_paid) || 0;
    let newDueDate = commitment.next_due_date ? toDateStr(commitment.next_due_date) : null;
    let newScheduleJson = typeof commitment.variable_schedule === "string" 
      ? commitment.variable_schedule 
      : JSON.stringify(commitment.variable_schedule || []);

    if (commitment.type === "installment") {
      newPaidCount += 1;
      const total = Number(commitment.installments_total) || 0;
      if (total > 0 && newPaidCount >= total) {
        newStatus = "completed";
      }
      // Advance due date by 1 month if present
      if (newDueDate) {
        const d = new Date(newDueDate + "T00:00:00");
        d.setMonth(d.getMonth() + 1);
        newDueDate = toDateStr(d.toISOString());
      }
    } else if (commitment.type === "variable_schedule") {
      let schedule: VariablePaymentScheduleItem[] = [];
      try {
        schedule = JSON.parse(newScheduleJson);
      } catch {
        schedule = [];
      }

      let found = false;
      if (payload.scheduleItemId) {
        schedule = schedule.map((item) => {
          if (item.id === payload.scheduleItemId) {
            found = true;
            return { ...item, isPaid: true, paidAt: txDate, transactionId: txId };
          }
          return item;
        });
      }

      if (!found) {
        const firstUnpaid = schedule.findIndex((item) => !item.isPaid);
        if (firstUnpaid !== -1) {
          schedule[firstUnpaid] = {
            ...schedule[firstUnpaid],
            isPaid: true,
            paidAt: txDate,
            transactionId: txId,
          };
        }
      }

      const nextUnpaid = schedule.find((item) => !item.isPaid);
      if (nextUnpaid) {
        newDueDate = nextUnpaid.date;
      } else {
        newStatus = "completed";
      }
      newScheduleJson = JSON.stringify(schedule);
    } else if (commitment.type === "recurring") {
      // Advance due date by frequency
      if (newDueDate) {
        const d = new Date(newDueDate + "T00:00:00");
        if (commitment.frequency === "biweekly") {
          d.setDate(d.getDate() + 14);
        } else if (commitment.frequency === "weekly") {
          d.setDate(d.getDate() + 7);
        } else if (commitment.frequency === "annual") {
          d.setFullYear(d.getFullYear() + 1);
        } else {
          d.setMonth(d.getMonth() + 1);
        }
        newDueDate = toDateStr(d.toISOString());
      }
    } else if (commitment.type === "one_time") {
      newStatus = "completed";
    }

    await sql`
      UPDATE finance_commitments
      SET installments_paid = ${newPaidCount},
          status = ${newStatus},
          next_due_date = ${newDueDate},
          variable_schedule = ${newScheduleJson}::jsonb,
          updated_at = NOW()
      WHERE id = ${payload.commitmentId};
    `;

    // 4. Award Habitica XP
    await awardHabiticaEvent("DAILY_EXPENSES_LOGGED", {
      customNotes: `Liquidación de compromiso: $${payload.amount} • ${commitment.title}`,
    });

    revalidatePath("/");
    return { success: true, transactionId: txId };
  } catch (error) {
    console.error("[Settle Commitment Payment Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar el pago del compromiso",
    };
  }
}

