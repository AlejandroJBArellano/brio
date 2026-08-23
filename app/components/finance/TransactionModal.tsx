"use client";

import { createTransactionAction } from "@/app/actions/finance";
import {
  DEFAULT_FINANCE_ACCOUNTS,
  DEFAULT_FINANCE_CATEGORIES,
  FinanceAccount,
  FinanceCategory,
  TransactionType,
} from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import { soundFx } from "@/lib/soundFx";
import { calculateWorkTimeForExpense } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Coffee,
  Plus,
  Settings2,
  Wallet,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categories?: FinanceCategory[];
  accounts?: FinanceAccount[];
  onOpenManageCatalog?: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  categories = [],
  accounts = [],
  onOpenManageCatalog,
}: TransactionModalProps) {
  const effectiveCategories = categories.length > 0 ? categories : DEFAULT_FINANCE_CATEGORIES;
  const effectiveAccounts = accounts.length > 0 ? accounts : DEFAULT_FINANCE_ACCOUNTS;

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState(effectiveCategories[0]?.id || "comida");
  const [account, setAccount] = useState(effectiveAccounts[0]?.id || "nu");
  const [isAntExpense, setIsAntExpense] = useState(false);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(getTodayDateStr());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

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
      const res = await createTransactionAction({
        amount: numAmount,
        type,
        concept: concept.trim(),
        category,
        account,
        isAntExpense: type === "expense" ? isAntExpense : false,
        notes: notes.trim() || undefined,
        date,
      });

      if (res.success) {
        soundFx.transactionAdded();
        setAmount("");
        setConcept("");
        setNotes("");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo guardar la transacción");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#F5F2EB] tracking-tight">
                Registrar Movimiento en Brio Finanzas
              </h2>
              <p className="text-xs text-[#8E867B]">
                Guarda tus gastos e ingresos con latencia cero en Neon DB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#E05D52]/40 bg-[#221716] p-3 text-xs text-[#E05D52] font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-mono">
          {/* Type Toggle: Gasto vs Ingreso */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#121110] border border-[#2A2723]">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-[#221716] text-[#E05D52] border border-[#E05D52]/40 shadow-xs font-bold"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Gasto (-)</span>
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                type === "income"
                  ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40 shadow-xs font-bold"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Ingreso (+)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Monto (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[#8E867B]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-8 pr-4 py-2.5 font-mono text-lg font-bold text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
              />
            </div>
            {type === "expense" && parseFloat(amount) > 0 && (() => {
              const workTime = calculateWorkTimeForExpense(parseFloat(amount));
              return (
                <div className={`mt-2 flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] font-sans animate-in fade-in duration-150 ${workTime.badgeBg}`}>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Equivale a <strong className="font-mono">{workTime.formattedTime}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[10px] opacity-80 uppercase tracking-wider">
                    {workTime.daysWorked > 0 ? `${workTime.daysWorked}d jornada` : "Energía de Vida"}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Concept Input */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Concepto / Descripción
            </label>
            <input
              type="text"
              placeholder="Ej: Café de especialidad, Supermercado semanal..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              required
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
            />
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5 font-sans">
                <label className="block text-xs font-medium text-[#DDD6C9]">
                  Categoría
                </label>
                {onOpenManageCatalog && (
                  <button
                    type="button"
                    onClick={onOpenManageCatalog}
                    className="text-[10px] text-[#D99B43] hover:text-[#E8AF59] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Settings2 className="size-3" />
                    <span>Configurar</span>
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
              >
                {effectiveCategories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#181715] text-[#F5F2EB]">
                    #{cat.id} — {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 font-sans">
                <label className="block text-xs font-medium text-[#DDD6C9]">
                  Cuenta / Tarjeta
                </label>
                {onOpenManageCatalog && (
                  <button
                    type="button"
                    onClick={onOpenManageCatalog}
                    className="text-[10px] text-[#D99B43] hover:text-[#E8AF59] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Settings2 className="size-3" />
                    <span>Configurar</span>
                  </button>
                )}
              </div>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
              >
                {effectiveAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#181715] text-[#F5F2EB]">
                    {acc.name} (@{acc.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gasto Hormiga Switch (Only for Expenses) */}
          {type === "expense" && (
            <label className="flex items-center justify-between p-3 rounded-lg border border-[#3D3425] bg-[#121110] cursor-pointer hover:bg-[#221D16] transition-colors">
              <div className="flex items-center gap-2.5">
                <Coffee className="h-4 w-4 text-[#D99B43]" />
                <div>
                  <div className="text-xs font-sans font-semibold text-[#D99B43]">
                    Es un Gasto Hormiga / Antojo
                  </div>
                  <div className="text-[11px] text-[#8E867B]">
                    Se descontará de tu presupuesto diario de gustitos ($150/día)
                  </div>
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
