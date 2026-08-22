"use client";

import { deleteTransactionAction } from "@/app/actions/finance";
import { FinanceDashboardData, Transaction } from "@/lib/types";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Filter,
  Flame,
  PieChart,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { AntExpenseThermometer } from "./AntExpenseThermometer";
import { SavingsGoalsWidget } from "./SavingsGoalsWidget";
import { TransactionModal } from "./TransactionModal";
import { WishlistView } from "./WishlistView";

interface FinanceViewProps {
  data: FinanceDashboardData;
  onRefresh?: () => void;
}

export function FinanceView({ data, onRefresh }: FinanceViewProps) {
  const [subTab, setSubTab] = useState<"budget" | "wishlist">("budget");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "expenses" | "incomes" | "ant">("all");
  const [isPending, startTransition] = useTransition();

  const defaultWishlistData = {
    items: [],
    stats: {
      totalWishlistValue: 0,
      totalSavedImpulseValue: 0,
      coolingCount: 0,
      readyCount: 0,
      purchasedCount: 0,
      dismissedCount: 0,
    },
  };

  const netBalance = data.totalIncomeThisMonth - data.totalExpensesThisMonth;
  const isHealthyBalance = netBalance >= 0;

  const totalBudgetedExpenses =
    data.currentBudget.budgetedFixedExpenses + data.currentBudget.budgetedVariableExpenses;
  const budgetSpentPercent = Math.min(
    100,
    Math.round((data.totalExpensesThisMonth / (totalBudgetedExpenses || 1)) * 100)
  );

  const filteredTransactions = useMemo(() => {
    return data.recentTransactions.filter((tx) => {
      if (activeFilter === "expenses" && tx.type !== "expense") return false;
      if (activeFilter === "incomes" && tx.type !== "income") return false;
      if (activeFilter === "ant" && !tx.isAntExpense) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCategory = tx.category?.toLowerCase().includes(q);
        const matchesAccount = tx.account?.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        return matchesCategory || matchesAccount || matchesNotes;
      }

      return true;
    });
  }, [data.recentTransactions, activeFilter, searchQuery]);

  const handleDeleteTransaction = (id: string) => {
    startTransition(async () => {
      await deleteTransactionAction(id);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2 p-1 bg-neutral-950/80 rounded-2xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setSubTab("budget")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === "budget"
                ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Presupuesto & Movimientos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("wishlist")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === "wishlist"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Wishlist Anti-Impulso</span>
            {data.wishlistData?.stats.coolingCount ? (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 text-[10px] font-mono">
                {data.wishlistData.stats.coolingCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {subTab === "wishlist" ? (
        <WishlistView
          data={data.wishlistData || defaultWishlistData}
          onRefresh={onRefresh}
        />
      ) : (
        <>
          {/* 1. Header Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Incomes */}
            <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Ingresos del Mes</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                +${data.totalIncomeThisMonth.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Presupuestado: ${data.currentBudget.budgetedIncome.toLocaleString()}
              </div>
            </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-rose-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Gastos Acumulados</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400 tracking-tight">
            -${data.totalExpensesThisMonth.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Fijos: ${data.totalFixedExpensesThisMonth.toLocaleString()} • Variables: ${data.totalVariableExpensesThisMonth.toLocaleString()}
          </div>
        </div>

        {/* Net Balance */}
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Balance Neto</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-2xl font-bold font-mono tracking-tight ${
              isHealthyBalance ? "text-white" : "text-rose-400"
            }`}
          >
            {isHealthyBalance ? "+" : ""}
            ${netBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400 flex items-center gap-1">
            {isHealthyBalance ? (
              <span className="text-emerald-400 font-semibold">✓ Flujo positivo</span>
            ) : (
              <span className="text-rose-400 font-semibold">⚠️ Déficit del mes</span>
            )}
          </div>
        </div>

        {/* Variable Budget Remaining */}
        <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Presupuesto Variable Restante</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400 tracking-tight">
            ${Math.max(0, data.remainingMonthlyVariableBudget).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            De ${data.currentBudget.budgetedVariableExpenses.toLocaleString()} presupuestados
          </div>
        </div>
      </div>

      {/* 2. Monthly Budget Thermometer Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Termómetro de Presupuesto del Mes
              </h3>
              <span className="rounded-md border border-white/[0.1] bg-neutral-800 px-2 py-0.5 text-xs font-mono text-neutral-300">
                {budgetSpentPercent}% utilizado
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Control de gastos contra el presupuesto límite de ${totalBudgetedExpenses.toLocaleString()} MXN
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Movimiento (⌘F)</span>
          </button>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-neutral-950 border border-white/[0.06]">
            <div
              className={`h-full transition-all duration-700 ${
                budgetSpentPercent > 90
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : budgetSpentPercent > 70
                  ? "bg-gradient-to-r from-indigo-500 to-amber-500"
                  : "bg-gradient-to-r from-emerald-500 to-indigo-500"
              }`}
              style={{ width: `${budgetSpentPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span>$0</span>
            <span>Gastado: ${data.totalExpensesThisMonth.toLocaleString()}</span>
            <span>Límite: ${totalBudgetedExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 3. Side by Side: Ant Expense Gauge & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AntExpenseThermometer
          spentToday={data.totalAntExpensesToday}
          dailyLimit={data.currentBudget.dailyAntLimit}
          spentThisMonth={data.totalAntExpensesThisMonth}
          onOpenNewTransaction={() => setIsModalOpen(true)}
        />

        <SavingsGoalsWidget
          goals={data.savingsGoals}
          onRefresh={onRefresh}
        />
      </div>

      {/* 4. Category Breakdown Chips */}
      {data.categoryBreakdown.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Distribución de Gastos por Categoría
            </h4>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {data.categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.06] bg-neutral-950/60 text-xs"
              >
                <span className="font-semibold text-neutral-300 capitalize">
                  #{cat.category}
                </span>
                <span className="font-mono text-neutral-400">
                  ${cat.total.toLocaleString()}
                </span>
                <span className="rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] px-1.5 py-0.5 font-bold">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Transactions Log & Search Stream */}
      <div className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Bitácora de Transacciones Recientes
              </h3>
              <p className="text-xs text-neutral-400">
                {filteredTransactions.length} movimiento(s) registrado(s)
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar por concepto o cuenta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-neutral-950/80 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950/60 border border-white/[0.06] text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeFilter === "all" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("expenses")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeFilter === "expenses" ? "bg-rose-500/20 text-rose-300 font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("incomes")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeFilter === "incomes" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Ingresos
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("ant")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeFilter === "ant" ? "bg-amber-500/20 text-amber-300 font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Hormiga ☕
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="mt-4 divide-y divide-white/[0.04]">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No hay movimientos registrados con los filtros seleccionados.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                      tx.type === "income"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {tx.notes || (tx.type === "income" ? "Ingreso" : "Gasto")}
                      </span>
                      {tx.isAntExpense && (
                        <span className="rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.2 font-medium">
                          Hormiga ☕
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="text-indigo-400 font-mono">#{tx.category}</span>
                      <span>•</span>
                      <span className="text-neutral-400 font-mono">@{tx.account}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-sm font-bold ${
                      tx.type === "income" ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(tx.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-all"
                    title="Eliminar transacción"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
