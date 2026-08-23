"use client";

import { deleteTransactionAction } from "@/app/actions/finance";
import { FinanceDashboardData } from "@/lib/types";
import { calculateWorkTimeForExpense } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Coffee,
  PieChart,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { AntExpenseThermometer } from "./AntExpenseThermometer";
import { ManageFinanceCatalogModal } from "./ManageFinanceCatalogModal";
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
  const [isManageCatalogOpen, setIsManageCatalogOpen] = useState(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2723] pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#181715] rounded-lg border border-[#2A2723]">
          <button
            type="button"
            onClick={() => setSubTab("budget")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              subTab === "budget"
                ? "bg-[#D99B43] text-[#121110] shadow-xs font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Presupuesto & Movimientos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("wishlist")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              subTab === "wishlist"
                ? "bg-[#4EAB9E] text-[#121110] shadow-xs font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Wishlist Anti-Impulso</span>
            {data.wishlistData?.stats.coolingCount ? (
              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-[#121110] text-[#4EAB9E] border border-[#4EAB9E]/30">
                {data.wishlistData.stats.coolingCount}
              </span>
            ) : null}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsManageCatalogOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#2A2723] bg-[#181715] hover:bg-[#22201D] text-xs font-semibold text-[#DDD6C9] hover:text-[#F5F2EB] transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Settings className="size-3.5 text-[#D99B43]" />
          <span>Configurar Cuentas & Categorías</span>
        </button>
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
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
                <span>Ingresos del Mes</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#7EA35A] tracking-tight">
                +${data.totalIncomeThisMonth.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
                Presupuestado: ${data.currentBudget.budgetedIncome.toLocaleString()}
              </div>
            </div>

            {/* Total Expenses */}
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
                <span>Gastos Acumulados</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#221716] text-[#E05D52] border border-[#E05D52]/30">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#E05D52] tracking-tight">
                -${data.totalExpensesThisMonth.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
                Fijos: ${data.totalFixedExpensesThisMonth.toLocaleString()} • Variables: ${data.totalVariableExpensesThisMonth.toLocaleString()}
              </div>
            </div>

            {/* Net Balance */}
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
                <span>Balance Neto</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#162121] text-[#4EAB9E] border border-[#4EAB9E]/30">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div
                className={`mt-2 text-2xl font-bold font-mono tracking-tight ${
                  isHealthyBalance ? "text-[#F5F2EB]" : "text-[#E05D52]"
                }`}
              >
                {isHealthyBalance ? "+" : ""}
                ${netBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] font-mono text-[#8E867B] flex items-center gap-1">
                {isHealthyBalance ? (
                  <span className="text-[#7EA35A] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Flujo positivo
                  </span>
                ) : (
                  <span className="text-[#E05D52] font-semibold flex items-center gap-1">
                    <AlertCircle className="size-3" /> Déficit del mes
                  </span>
                )}
              </div>
            </div>

            {/* Variable Budget Remaining */}
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
                <span>Presupuesto Variable Restante</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-[#D99B43] tracking-tight">
                ${Math.max(0, data.remainingMonthlyVariableBudget).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
                De ${data.currentBudget.budgetedVariableExpenses.toLocaleString()} presupuestados
              </div>
            </div>
          </div>

          {/* 2. Monthly Budget Thermometer Card */}
          <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                    Termómetro de Presupuesto del Mes
                  </h3>
                  <span className="rounded bg-[#121110] border border-[#2A2723] px-2 py-0.5 text-xs font-mono text-[#DDD6C9]">
                    {budgetSpentPercent}% utilizado
                  </span>
                </div>
                <p className="text-xs text-[#8E867B] mt-0.5">
                  Control de gastos contra el presupuesto límite de ${totalBudgetedExpenses.toLocaleString()} MXN
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D99B43] text-[#121110] font-semibold text-xs hover:bg-[#E8AF59] shadow-xs transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Movimiento (⌘F)</span>
              </button>
            </div>

            {/* Big Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
                <div
                  className={`h-full transition-all duration-700 ${
                    budgetSpentPercent > 90
                      ? "bg-[#E05D52]"
                      : budgetSpentPercent > 70
                      ? "bg-[#D99B43]"
                      : "bg-[#7EA35A]"
                  }`}
                  style={{ width: `${budgetSpentPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-[#8E867B]">
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
            <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="h-4 w-4 text-[#D99B43]" />
                <h4 className="text-xs font-semibold text-[#8E867B] uppercase tracking-wider font-mono">
                  Distribución de Gastos por Categoría
                </h4>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {data.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2A2723] bg-[#121110] text-xs font-mono"
                  >
                    <span className="font-semibold text-[#DDD6C9] capitalize">
                      #{cat.category}
                    </span>
                    <span className="text-[#8E867B]">
                      ${cat.total.toLocaleString()}
                    </span>
                    <span className="rounded bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 px-1.5 py-0.5 text-[10px] font-bold">
                      {cat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Transactions Log & Search Stream */}
          <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22201D] text-[#DDD6C9] border border-[#2A2723]">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                    Bitácora de Transacciones Recientes
                  </h3>
                  <p className="text-xs text-[#8E867B] font-mono">
                    {filteredTransactions.length} movimiento(s) registrado(s)
                  </p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E867B]" />
                  <input
                    type="text"
                    placeholder="Buscar por concepto o cuenta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-[#2A2723] bg-[#121110] pl-8 pr-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121110] border border-[#2A2723] text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      activeFilter === "all" ? "bg-[#22201D] text-[#F5F2EB] border border-[#38332D]" : "text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("expenses")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      activeFilter === "expenses" ? "bg-[#221716] text-[#E05D52] border border-[#E05D52]/40" : "text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  >
                    Gastos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("incomes")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      activeFilter === "incomes" ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40" : "text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  >
                    Ingresos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("ant")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activeFilter === "ant" ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/40" : "text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  >
                    <Coffee className="size-3 text-[#D99B43]" />
                    <span>Hormiga</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="mt-4 divide-y divide-[#2A2723]">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8E867B] font-mono">
                  No hay movimientos registrados con los filtros seleccionados.
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-[#22201D]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono font-bold text-xs ${
                          tx.type === "income"
                            ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30"
                            : "bg-[#221716] text-[#E05D52] border border-[#E05D52]/30"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F5F2EB]">
                            {tx.notes || (tx.type === "income" ? "Ingreso" : "Gasto")}
                          </span>
                          {tx.isAntExpense && (
                            <span className="rounded bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] text-[10px] px-1.5 py-0.2 font-mono font-medium flex items-center gap-1">
                              <Coffee className="size-2.5 text-[#D99B43]" />
                              <span>Hormiga</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#8E867B] font-mono mt-0.5">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="text-[#D99B43]">#{tx.category}</span>
                          <span>•</span>
                          <span>@{tx.account}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-mono text-sm font-bold ${
                            tx.type === "income" ? "text-[#7EA35A]" : "text-[#F5F2EB]"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                        {tx.type === "expense" && (
                          <span className="text-[10px] font-mono text-[#D99B43]/80">
                            ~{calculateWorkTimeForExpense(tx.amount).formattedTime}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#8E867B] hover:text-[#E05D52] hover:bg-[#221716] rounded-md transition-all cursor-pointer"
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
        categories={data.categories}
        accounts={data.accounts}
        onOpenManageCatalog={() => setIsManageCatalogOpen(true)}
      />

      {/* Manage Finance Catalog Modal */}
      <ManageFinanceCatalogModal
        isOpen={isManageCatalogOpen}
        onClose={() => setIsManageCatalogOpen(false)}
        categories={data.categories || []}
        accounts={data.accounts || []}
        onSuccess={onRefresh}
      />
    </div>
  );
}
