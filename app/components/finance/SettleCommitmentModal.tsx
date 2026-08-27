"use client";

import { settleCommitmentPaymentAction } from "@/app/actions/finance";
import { FinanceAccount, FinanceCommitment } from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import { AlertCircle, ArrowRight, CheckCircle2, X } from "lucide-react";
import { useState, useTransition } from "react";

interface SettleCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: FinanceCommitment | null;
  accounts: FinanceAccount[];
  onSuccess?: () => void;
}

export function SettleCommitmentModal({
  isOpen,
  onClose,
  commitment,
  accounts = [],
  onSuccess,
}: SettleCommitmentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Default values from commitment
  const initialAmount = commitment?.nextPaymentAmount || commitment?.installmentAmount || commitment?.totalAmount || 0;
  const [amount, setAmount] = useState<number>(initialAmount);
  const [account, setAccount] = useState<string>(commitment?.defaultAccount || "dolarapp");
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [notes, setNotes] = useState<string>("");
  const [selectedScheduleItemId, _setSelectedScheduleItemId] = useState<string | undefined>(undefined);

  if (!isOpen || !commitment) return null;

  // Next installment preview
  const currentPaid = commitment.installmentsPaid || 0;
  const totalInst = commitment.installmentsTotal || 0;
  const isInstallment = commitment.type === "installment";

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError("El monto a pagar debe ser mayor a 0");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await settleCommitmentPaymentAction({
        commitmentId: commitment.id,
        amount: Number(amount),
        account,
        date,
        notes: notes.trim() || undefined,
        scheduleItemId: selectedScheduleItemId,
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "Error al registrar el pago");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2723] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB]">Liquidar / Registrar Pago</h3>
              <p className="text-xs text-[#8E867B] truncate max-w-65">{commitment.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#DDD6C9] transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-[#E05D52] bg-[#221716] border border-[#E05D52]/30 rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="p-3.5 rounded-lg bg-[#121110] border border-[#2A2723] space-y-2 text-xs">
          <div className="flex justify-between items-center text-[#8E867B]">
            <span>Esquema:</span>
            <span className="font-semibold text-[#DDD6C9] capitalize">
              {commitment.type === "installment" && "Cuota Fija (X de Y)"}
              {commitment.type === "variable_schedule" && "Cronograma Variable"}
              {commitment.type === "recurring" && "Recurrente Periódico"}
              {commitment.type === "one_time" && "Pago Único"}
            </span>
          </div>

          {isInstallment && totalInst > 0 && (
            <div className="flex justify-between items-center text-[#8E867B]">
              <span>Progreso tras este pago:</span>
              <span className="font-mono font-bold text-[#7EA35A] flex items-center gap-1.5">
                <span>{currentPaid} / {totalInst}</span>
                <ArrowRight className="size-3 text-[#D99B43]" />
                <span className="text-[#F5F2EB]">{currentPaid + 1} / {totalInst}</span>
              </span>
            </div>
          )}

          {commitment.remainingBalance !== undefined && commitment.remainingBalance > 0 && (
            <div className="flex justify-between items-center text-[#8E867B]">
              <span>Saldo restante actual:</span>
              <span className="font-mono text-[#D99B43]">
                ${commitment.remainingBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSettle} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-mono text-[#8E867B] mb-1.5">
              Monto a Pagar (MXN) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#8E867B]">$</span>
              <input
                type="number"
                step="any"
                required
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-sm font-mono text-[#F5F2EB] focus:outline-hidden focus:border-[#7EA35A] transition-all"
              />
            </div>
          </div>

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-mono text-[#8E867B] mb-1.5">
              Cuenta de Pago (Se descontará de aquí) *
            </label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs font-medium text-[#F5F2EB] focus:outline-hidden focus:border-[#7EA35A] transition-all cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.icon || "💳"} {acc.name} ({acc.type || "cuenta"})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-mono text-[#8E867B] mb-1.5">
              Fecha del Pago *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs font-mono text-[#F5F2EB] focus:outline-hidden focus:border-[#7EA35A] transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono text-[#8E867B] mb-1.5">
              Notas / Referencia (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Transferencia SPEI #1234, Folio..."
              className="w-full px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs text-[#F5F2EB] focus:outline-hidden focus:border-[#7EA35A] transition-all"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2A2723]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg border border-[#2A2723] bg-transparent text-xs font-semibold text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7EA35A] text-[#121110] font-bold text-xs hover:bg-[#8eb865] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isPending ? "Registrando..." : "Confirmar Pago & Descontar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
