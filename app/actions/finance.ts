"use server";

import { ensureDatabaseSchema, getDb } from "@/lib/db";
import {
  CategoryBreakdown,
  FinanceDashboardData,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
  TransactionType,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Fetches all financial metrics, budget thermometer, transactions, and savings goals.
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

  // 1. Fetch or create default monthly budget
  const budgetRows = await sql`
    SELECT * FROM monthly_budgets WHERE id = ${budgetId} LIMIT 1;
  `;

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
    // Default initial budget for new months (in memory)
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

  // 2. Fetch all transactions for this month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const transactionRows = await sql`
    SELECT * FROM transactions
    WHERE date >= ${startDate} AND date < ${endDate}
    ORDER BY date DESC, created_at DESC;
  `;

  const todayStr = now.toISOString().split("T")[0];

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
    const dateStr = typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toISOString().split("T")[0];

    if (r.type === "expense") {
      totalExpensesThisMonth += amt;
      const cat = (r.category || "general").toLowerCase();

      // Track categories
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
      categoryMap[cat].total += amt;
      categoryMap[cat].count += 1;

      // Fixed vs Variable
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

  // Calculate category breakdowns
  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalExpensesThisMonth > 0 ? Math.round((data.total / totalExpensesThisMonth) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 3. Fetch savings goals
  const goalsRows = await sql`
    SELECT * FROM savings_goals ORDER BY created_at ASC;
  `;

  const savingsGoals: SavingsGoal[] = goalsRows.map((g) => ({
    id: g.id,
    title: g.title,
    targetAmount: Number(g.target_amount),
    currentAmount: Number(g.current_amount),
    deadline: g.deadline ? g.deadline.toString().split("T")[0] : undefined,
    category: g.category || "general",
    color: g.color || "#6366f1",
    createdAt: g.created_at?.toString(),
  }));

  const remainingDailyAntBudget = Math.max(0, currentBudget.dailyAntLimit - totalAntExpensesToday);
  const remainingMonthlyVariableBudget = currentBudget.budgetedVariableExpenses - totalVariableExpensesThisMonth;

  // 4. Fetch Wishlist Anti-Impulso data
  const wishlistRows = await sql`
    SELECT * FROM wishlist_items ORDER BY created_at DESC;
  `;

  const nowMs = Date.now();
  const wishlistItems = wishlistRows.map((r: any) => {
    const createdAt = r.created_at?.toISOString
      ? r.created_at.toISOString()
      : r.created_at?.toString() || new Date().toISOString();
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
      priority: r.priority || "medium",
      url: r.url || undefined,
      imageUrl: r.image_url || undefined,
      reasonOrNotes: r.reason_or_notes || undefined,
      status: computedStatus,
      coolingDaysTotal,
      daysElapsed,
      daysRemaining,
      isCoolingFinished,
      createdAt,
      resolvedAt: r.resolved_at?.toString(),
    };
  });

  const activeWishlist = wishlistItems.filter((i: any) => i.status === "cooling" || i.status === "ready");
  const dismissedWishlist = wishlistItems.filter((i: any) => i.status === "dismissed");

  const wishlistData = {
    items: wishlistItems,
    stats: {
      totalWishlistValue: Number(activeWishlist.reduce((sum: number, i: any) => sum + i.priceEstimated, 0).toFixed(2)),
      totalSavedImpulseValue: Number(dismissedWishlist.reduce((sum: number, i: any) => sum + i.priceEstimated, 0).toFixed(2)),
      coolingCount: wishlistItems.filter((i: any) => i.status === "cooling").length,
      readyCount: wishlistItems.filter((i: any) => i.status === "ready").length,
      purchasedCount: wishlistItems.filter((i: any) => i.status === "purchased").length,
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
    await ensureDatabaseSchema();
    const sql = getDb();

    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const date = payload.date || new Date().toISOString().split("T")[0];
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
    await ensureDatabaseSchema();
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
    await ensureDatabaseSchema();
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
    await ensureDatabaseSchema();
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
    await ensureDatabaseSchema();
    const sql = getDb();
    await sql`
      UPDATE savings_goals
      SET current_amount = current_amount + ${amount}
      WHERE id = ${goalId};
    `;
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Contribute Goal Error]:", error);
    return { success: false, error: "Failed to contribute to goal" };
  }
}
