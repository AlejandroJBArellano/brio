"use client";

import {
  createTransactionAction,
  fetchFinanceCatalogAction,
  updateTransactionAction,
} from "@/app/actions/finance";
import { getTodayDateStr } from "@/lib/dateUtils";
import { soundFx } from "@/lib/soundFx";
import {
  DEFAULT_FINANCE_ACCOUNTS,
  DEFAULT_FINANCE_CATEGORIES,
  FinanceAccount,
  FinanceCategory,
  Transaction,
  TransactionType,
} from "@/lib/types";
import { calculateWorkTimeForExpense } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Coffee,
  Edit2,
  Plus,
  Settings2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categories?: FinanceCategory[];
  accounts?: FinanceAccount[];
  transactionToEdit?: Transaction | null;
  budgetedIncome?: number;
  onOpenManageCatalog?: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
  accounts = [],
  transactionToEdit,
  budgetedIncome,
  onOpenManageCatalog,
}: TransactionModalProps) {
  if (!isOpen) return null;

  const key = transactionToEdit ? `edit-${transactionToEdit.id}` : "new-tx";

  return (
    <TransactionModalContent
      key={key}
      onClose={onClose}
      onSuccess={onSuccess}
      categories={categories}
      accounts={accounts}
      transactionToEdit={transactionToEdit}
      budgetedIncome={budgetedIncome}
      onOpenManageCatalog={onOpenManageCatalog}
    />
  );
}

function TransactionModalContent({
  onClose,
  onSuccess,
  categories = [],
  accounts = [],
  transactionToEdit,
  budgetedIncome,
  onOpenManageCatalog,
}: Omit<TransactionModalProps, "isOpen">) {
  const isEditing = Boolean(transactionToEdit);

  const [dbCategories, setDbCategories] = useState<FinanceCategory[]>(categories);
  const [dbAccounts, setDbAccounts] = useState<FinanceAccount[]>(accounts);

  useEffect(() => {
    if (categories.length > 0) setDbCategories(categories);
    if (accounts.length > 0) setDbAccounts(accounts);

    if (categories.length === 0 || accounts.length === 0) {
      fetchFinanceCatalogAction()
        .then((catalog) => {
          if (catalog.categories && catalog.categories.length > 0) {
            setDbCategories(catalog.categories);
          }
          if (catalog.accounts && catalog.accounts.length > 0) {
            setDbAccounts(catalog.accounts);
          }
        })
        .catch((err) => {
          console.error("[TransactionModal] Failed to load finance catalog:", err);
        });
    }
  }, [categories, accounts]);

  const effectiveCategories =
    dbCategories.length > 0 ? dbCategories : DEFAULT_FINANCE_CATEGORIES;
  const effectiveAccounts =
    dbAccounts.length > 0 ? dbAccounts : DEFAULT_FINANCE_ACCOUNTS;

  const [type, setType] = useState<TransactionType>(
    transactionToEdit?.type || "expense"
  );
  const [amount, setAmount] = useState(
    transactionToEdit?.amount?.toString() || ""
  );
  const [concept, setConcept] = useState(transactionToEdit?.notes || "");
  const [category, setCategory] = useState(
    transactionToEdit?.category || effectiveCategories[0]?.id || "comida"
  );
  const [account, setAccount] = useState(
    transactionToEdit?.account || effectiveAccounts[0]?.id || "nu"
  );
  const [isAntExpense, setIsAntExpense] = useState(
    Boolean(transactionToEdit?.isAntExpense)
  );

  useEffect(() => {
    if (!transactionToEdit && effectiveCategories.length > 0 && !effectiveCategories.some((c) => c.id === category)) {
      setCategory(effectiveCategories[0].id);
    }
  }, [effectiveCategories, category, transactionToEdit]);

  useEffect(() => {
    if (!transactionToEdit && effectiveAccounts.length > 0 && !effectiveAccounts.some((a) => a.id === account)) {
      setAccount(effectiveAccounts[0].id);
    }
  }, [effectiveAccounts, account, transactionToEdit]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(
    transactionToEdit?.date || getTodayDateStr()
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCategoryChange = (catId: string) => {
    setCategory(catId);
    const catObj = effectiveCategories.find((c) => c.id === catId);
    if (catObj?.isAntDefault || catId === "antojo") {
      setIsAntExpense(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Por favor ingresa un monto válido mayor a 0");
      return;
    }

    if (!concept.trim()) {
      setError("Por favor escribe un concepto o descripción");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (isEditing && transactionToEdit) {
        const res = await updateTransactionAction(transactionToEdit.id, {
          amount: numAmount,
          type,
          category,
          account,
          notes: concept.trim(),
          isAntExpense: type === "expense" ? isAntExpense : false,
          date,
        });

        if (res.success) {
          soundFx.click();
          onClose();
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || "Error al actualizar la transacción");
        }
      } else {
        const res = await createTransactionAction({
          amount: numAmount,
          type,
          category,
          account,
          notes: concept.trim(),
          isAntExpense: type === "expense" ? isAntExpense : false,
          date,
        });

        if (res.success) {
          soundFx.click();
          onClose();
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || "Error al registrar la transacción");
        }
      }
    });
  };

  // Life Energy calculation for expenses
  const numAmount = parseFloat(amount) || 0;
  const lifeEnergy =
    type === "expense" && numAmount > 0
      ? calculateWorkTimeForExpense(numAmount, budgetedIncome || 25000)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              {isEditing ? (
                <Edit2 className="h-5 w-5" />
              ) : (
                <Wallet className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB]">
                {isEditing ? "Editar Transacción" : "Registrar Transacción"}
              </h3>
              <p className="text-xs text-[#8E867B] font-mono">
                {isEditing ? "Modifica los detalles" : "Ingreso o Gasto manual"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-[#221716] border border-[#E05D52]/30 p-3 text-xs text-[#E05D52] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#121110] border border-[#2A2723]">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                soundFx.click();
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-[#221716] text-[#E05D52] border border-[#E05D52]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Gasto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("income");
                soundFx.click();
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "income"
                  ? "bg-[#162218] text-[#7EA35A] border border-[#7EA35A]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Ingreso</span>
            </button>
          </div>

          {/* Amount and Life Energy */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Monto ($ MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-[#8E867B]">
                $
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] py-2.5 pl-8 pr-4 text-base font-mono text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
              />
            </div>

            {/* Life Energy Indicator */}
            {lifeEnergy && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#2A2723] bg-[#141311] px-3 py-1.5 text-xs text-[#8E867B]">
                <Clock className="h-3.5 w-3.5 text-[#D99B43]" />
                <span>
                  Equivale a:{" "}
                  <strong className="text-[#DDD6C9] font-mono">
                    {lifeEnergy.formattedTime}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Concept / Description */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Concepto / Descripción
            </label>
            <input
              type="text"
              required
              placeholder="p. ej. Despensa semanal, Café americano, Salario..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
            />
          </div>

          {/* Category and Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-sans font-medium text-[#DDD6C9]">
                  Categoría
                </label>
                {onOpenManageCatalog && (
                  <button
                    type="button"
                    onClick={onOpenManageCatalog}
                    className="text-[10px] text-[#8E867B] hover:text-[#D99B43] inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <Settings2 className="size-2.5" />
                    <span>Catálogo</span>
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none capitalize"
              >
                {effectiveCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || "🏷️"} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-sans font-medium text-[#DDD6C9]">
                  Cuenta / Medio de Pago
                </label>
                {onOpenManageCatalog && (
                  <button
                    type="button"
                    onClick={onOpenManageCatalog}
                    className="text-[10px] text-[#8E867B] hover:text-[#D99B43] inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <Settings2 className="size-2.5" />
                    <span>Catálogo</span>
                  </button>
                )}
              </div>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none capitalize"
              >
                {effectiveAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon || "💳"} {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ant Expense Toggle (Only for expenses) */}
          {type === "expense" && (
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#141311] border border-[#2A2723] cursor-pointer hover:border-[#38332D] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-[#D99B43]/15 text-[#D99B43]">
                  <Coffee className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-[#F5F2EB] block">
                    ¿Es un Gasto Hormiga?
                  </span>
                  <span className="text-[10px] text-[#8E867B] block">
                    Antojos, cafés, suscripciones prescindibles, etc.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAntExpense}
                onChange={(e) => setIsAntExpense(e.target.checked)}
                className="h-4 w-4 rounded border-[#2A2723] bg-[#181715] text-[#D99B43] focus:ring-[#D99B43]/20 cursor-pointer"
              />
            </label>
          )}

          {/* Date & Optional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Notas adicionales (opcional)
              </label>
              <input
                type="text"
                placeholder="Detalle o lugar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2723]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-sans font-medium text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isPending ? "Guardando..." : "Registrar en Neon DB"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
