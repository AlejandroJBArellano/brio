"use server";

import { getDb } from "@/lib/db";
import {
  CategoryBreakdown,
  DEFAULT_FINANCE_ACCOUNTS,
  DEFAULT_FINANCE_CATEGORIES,
  FinanceAccount,
  FinanceCategory,
  FinanceDashboardData,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
  TransactionType,
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

/**
 * Server Action: Fetches all financial metrics, budget thermometer, transactions, and savings goals.
 * Uses Promise.all to fetch budget, transactions, savings goals, wishlist, and catalogs concurrently.
 */
export async function fetchFinanceDashboardDataAction(
  targetMonth?: number,
  targetYear?: number
): Promise<FinanceDashboardData> {
  const sql = getDb();

  const now = new Date();
  const month = targetMonth || now.getMonth() + 1;
  const year = targetYear || now.getFullYear();
  const budgetId = `${year}-${String(month).padStart(2, "0")}`;

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  // Parallel execution of all 5 independent queries
  const [budgetRows, transactionRows, goalsRows, wishlistRows, catalog] = await Promise.all([
    sql`SELECT * FROM monthly_budgets WHERE id = ${budgetId} LIMIT 1;`,
    sql`SELECT * FROM transactions WHERE date >= ${startDate} AND date < ${endDate} ORDER BY date DESC, created_at DESC;`,
    sql`SELECT * FROM savings_goals ORDER BY created_at ASC;`,
    sql`SELECT * FROM wishlist_items ORDER BY created_at DESC;`,
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

  // 4. Process Wishlist Anti-Impulso data
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
