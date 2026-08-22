"use client";

import { createTransactionAction } from "@/app/actions/finance";
import { TransactionType } from "@/lib/types";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Coffee,
  DollarSign,
  Plus,
  Sparkles,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_CATEGORIES = [
  { id: "comida", name: "Comida & Restaurantes", icon: "🍔" },
  { id: "antojo", name: "Antojo / Gustito (Hormiga)", icon: "☕" },
  { id: "transporte", name: "Transporte / Gasolina", icon: "🚗" },
  { id: "servicios", name: "Servicios & Renta", icon: "🏠" },
  { id: "suscripciones", name: "Suscripciones & Software", icon: "💻" },
  { id: "salud", name: "Salud & Farmacia", icon: "💊" },
  { id: "compras", name: "Compras & Ropa", icon: "🛍️" },
  { id: "ingreso", name: "Sueldo / Freelance", icon: "💰" },
];

const COMMON_ACCOUNTS = [
  { id: "nu", name: "Tarjeta Nu" },
  { id: "bbva", name: "BBVA Débito" },
  { id: "santander", name: "Santander" },
  { id: "efectivo", name: "Efectivo 💵" },
  { id: "hey", name: "Hey Banco" },
  { id: "default", name: "Cuenta Principal" },
];

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState("comida");
  const [account, setAccount] = useState("nu");
  const [isAntExpense, setIsAntExpense] = useState(false);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (cat === "antojo") {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Registrar Movimiento en Brio Finanzas
              </h2>
              <p className="text-xs text-neutral-400">
                Guarda tus gastos e ingresos con latencia cero en Neon DB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Toggle: Gasto vs Ingreso */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-950/60 border border-white/6">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                type === "expense"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Gasto (-)</span>
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                type === "income"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Ingreso (+)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Monto (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-neutral-400">
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
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 pl-8 pr-4 py-2.5 font-mono text-lg font-bold text-white placeholder:text-neutral-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Concept Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Concepto / Descripción
            </label>
            <input
              type="text"
              placeholder="Ej: Café con pan, Supermercado semanal, Pago de cliente..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Cuenta / Tarjeta
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {COMMON_ACCOUNTS.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gasto Hormiga Switch (Only for Expenses) */}
          {type === "expense" && (
            <label className="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors">
              <div className="flex items-center gap-2.5">
                <Coffee className="h-4 w-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-amber-300">
                    Es un Gasto Hormiga / Antojo
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Se descontará de tu presupuesto diario de gustitos ($150/día)
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAntExpense}
                onChange={(e) => setIsAntExpense(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/20"
              />
            </label>
          )}

          {/* Date & Optional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Notas adicionales (opcional)
              </label>
              <input
                type="text"
                placeholder="Detalle o lugar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 font-semibold text-xs text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
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
