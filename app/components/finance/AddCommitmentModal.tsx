"use client";

import { createFinanceCommitmentAction, updateFinanceCommitmentAction } from "@/app/actions/finance";
import {
  CommitmentFrequency,
  CommitmentType,
  FinanceAccount,
  FinanceCategory,
  FinanceCommitment,
  VariablePaymentScheduleItem,
} from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import {
  AlertCircle,
  Calendar,
  Check,
  Hash,
  Layers,
  Plus,
  Repeat,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";

interface AddCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentToEdit?: FinanceCommitment | null;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  onSuccess?: () => void;
}

export function AddCommitmentModal({
  isOpen,
  onClose,
  commitmentToEdit,
  categories = [],
  accounts = [],
  onSuccess,
}: AddCommitmentModalProps) {
  const isEditing = Boolean(commitmentToEdit);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>(commitmentToEdit?.title || "");
  const [type, setType] = useState<CommitmentType>(commitmentToEdit?.type || "installment");
  const [category, setCategory] = useState<string>(commitmentToEdit?.category || "servicios");
  const [defaultAccount, setDefaultAccount] = useState<string>(commitmentToEdit?.defaultAccount || "dolarapp");
  const [frequency, setFrequency] = useState<CommitmentFrequency>(commitmentToEdit?.frequency || "monthly");
  const [nextDueDate, setNextDueDate] = useState<string>(commitmentToEdit?.nextDueDate || getTodayDateStr());
  const [notes, setNotes] = useState<string>(commitmentToEdit?.notes || "");

  // Installment specific state
  const [installmentsTotal, setInstallmentsTotal] = useState<number>(commitmentToEdit?.installmentsTotal || 36);
  const [installmentsPaid, setInstallmentsPaid] = useState<number>(commitmentToEdit?.installmentsPaid || 0);
  const [installmentAmount, setInstallmentAmount] = useState<number>(commitmentToEdit?.installmentAmount || 2000);

  // One-time / General amount state
  const [totalAmount, setTotalAmount] = useState<number>(commitmentToEdit?.totalAmount || 0);

  // Variable Schedule specific state
  const [variableSchedule, setVariableSchedule] = useState<VariablePaymentScheduleItem[]>(
    commitmentToEdit?.variableSchedule || [
      { id: `sch-1`, date: getTodayDateStr(), amount: 1000, note: "Pago 1", isPaid: false },
    ]
  );

  if (!isOpen) return null;

  const handleAddScheduleItem = () => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + variableSchedule.length);
    const dateStr = nextDate.toISOString().split("T")[0];

    setVariableSchedule([
      ...variableSchedule,
      {
        id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        date: dateStr,
        amount: 1000,
        note: `Pago ${variableSchedule.length + 1}`,
        isPaid: false,
      },
    ]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    if (variableSchedule.length <= 1) return;
    setVariableSchedule(variableSchedule.filter((_, i) => i !== index));
  };

  const handleUpdateScheduleItem = (
    index: number,
    field: "date" | "amount" | "note",
    val: string | number | boolean
  ) => {
    const updated = [...variableSchedule];
    updated[index] = { ...updated[index], [field]: val };
    setVariableSchedule(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título del compromiso es obligatorio");
      return;
    }

    startTransition(async () => {
      setError(null);
      if (isEditing && commitmentToEdit) {
        const res = await updateFinanceCommitmentAction(commitmentToEdit.id, {
          title: title.trim(),
          type,
          category,
          defaultAccount,
          totalAmount: type === "one_time" ? Number(totalAmount) : (type === "installment" ? Number(installmentAmount) * Number(installmentsTotal) : undefined),
          installmentAmount: (type === "installment" || type === "recurring") ? Number(installmentAmount) : undefined,
          installmentsTotal: type === "installment" ? Number(installmentsTotal) : undefined,
          installmentsPaid: type === "installment" ? Number(installmentsPaid) : undefined,
          frequency,
          nextDueDate: nextDueDate || undefined,
          variableSchedule: type === "variable_schedule" ? variableSchedule : [],
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setError(res.error || "Error al actualizar compromiso");
        }
      } else {
        const res = await createFinanceCommitmentAction({
          title: title.trim(),
          type,
          category,
          defaultAccount,
          totalAmount: type === "one_time" ? Number(totalAmount) : (type === "installment" ? Number(installmentAmount) * Number(installmentsTotal) : undefined),
          installmentAmount: (type === "installment" || type === "recurring") ? Number(installmentAmount) : undefined,
          installmentsTotal: type === "installment" ? Number(installmentsTotal) : undefined,
          installmentsPaid: type === "installment" ? Number(installmentsPaid) : 0,
          frequency,
          nextDueDate: nextDueDate || undefined,
          variableSchedule: type === "variable_schedule" ? variableSchedule : [],
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setError(res.error || "Error al registrar compromiso");
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2723] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB]">
                {isEditing ? "Editar Compromiso" : "Nuevo Compromiso o Cuenta por Pagar"}
              </h3>
              <p className="text-xs text-[#8E867B]">
                Cuotas fijas, cronogramas variables, pagos recurrentes y cuentas por pagar
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-[#8E867B] mb-1.5">
              Título / Concepto del Compromiso *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Colegiatura Hybridge, Seguro Sofía, Préstamo..."
              className="w-full px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-sm text-[#F5F2EB] focus:outline-hidden focus:border-[#D99B43] transition-all"
            />
          </div>

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-mono text-[#8E867B] mb-1.5">
              Esquema de Pago *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#121110] rounded-lg border border-[#2A2723]">
              <button
                type="button"
                onClick={() => setType("installment")}
                className={`flex flex-col items-center justify-center p-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  type === "installment"
                    ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
                }`}
              >
                <Hash className="size-3.5 mb-1" />
                <span>Cuotas (X/Y)</span>
              </button>

              <button
                type="button"
                onClick={() => setType("variable_schedule")}
                className={`flex flex-col items-center justify-center p-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  type === "variable_schedule"
                    ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
                }`}
              >
                <Calendar className="size-3.5 mb-1" />
                <span>Cronograma</span>
              </button>

              <button
                type="button"
                onClick={() => setType("recurring")}
                className={`flex flex-col items-center justify-center p-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  type === "recurring"
                    ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
                }`}
              >
                <Repeat className="size-3.5 mb-1" />
                <span>Recurrente</span>
              </button>

              <button
                type="button"
                onClick={() => setType("one_time")}
                className={`flex flex-col items-center justify-center p-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  type === "one_time"
                    ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
                }`}
              >
                <Zap className="size-3.5 mb-1" />
                <span>Pago Único</span>
              </button>
            </div>
          </div>

          {/* Conditional Schema Section: 1. Installment (Cuotas) */}
          {type === "installment" && (
            <div className="p-4 rounded-lg bg-[#121110] border border-[#2A2723] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#D99B43]">
                <Hash className="size-3.5" />
                <span>Configuración de Cuotas Fijas (Ej. Hybridge 26 de 36)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8E867B] mb-1">Monto por Cuota ($) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={installmentAmount || ""}
                    onChange={(e) => setInstallmentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="2000"
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#181715] border border-[#2A2723] text-xs font-mono text-[#F5F2EB]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8E867B] mb-1">Cuotas Pagadas</label>
                  <input
                    type="number"
                    min="0"
                    value={installmentsPaid}
                    onChange={(e) => setInstallmentsPaid(parseInt(e.target.value) || 0)}
                    placeholder="26"
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#181715] border border-[#2A2723] text-xs font-mono text-[#F5F2EB]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#8E867B] mb-1">Total de Cuotas *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={installmentsTotal || ""}
                    onChange={(e) => setInstallmentsTotal(parseInt(e.target.value) || 1)}
                    placeholder="36"
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#181715] border border-[#2A2723] text-xs font-mono text-[#F5F2EB]"
                  />
                </div>
              </div>

              <div className="text-[11px] font-mono text-[#8E867B] flex justify-between pt-1 border-t border-[#2A2723]">
                <span>Restantes: <strong className="text-[#DDD6C9]">{Math.max(0, installmentsTotal - installmentsPaid)} cuotas</strong></span>
                <span>Saldo por pagar: <strong className="text-[#D99B43]">${(Math.max(0, installmentsTotal - installmentsPaid) * installmentAmount).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</strong></span>
              </div>
            </div>
          )}

          {/* Conditional Schema Section: 2. Variable Schedule */}
          {type === "variable_schedule" && (
            <div className="p-4 rounded-lg bg-[#121110] border border-[#2A2723] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#D99B43]">
                  <Calendar className="size-3.5" />
                  <span>Cronograma de Pagos por Fecha</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddScheduleItem}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#22201D] hover:bg-[#2A2723] text-[11px] font-semibold text-[#DDD6C9] cursor-pointer transition-all"
                >
                  <Plus className="size-3 text-[#7EA35A]" />
                  <span>Agregar Pago</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {variableSchedule.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-2 bg-[#181715] p-2 rounded-md border border-[#2A2723]">
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => handleUpdateScheduleItem(idx, "date", e.target.value)}
                      className="w-32 px-2 py-1 rounded bg-[#121110] border border-[#2A2723] text-[11px] font-mono text-[#F5F2EB]"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#8E867B]">$</span>
                      <input
                        type="number"
                        step="any"
                        value={item.amount}
                        onChange={(e) => handleUpdateScheduleItem(idx, "amount", parseFloat(e.target.value) || 0)}
                        placeholder="Monto"
                        className="w-full pl-5 pr-2 py-1 rounded bg-[#121110] border border-[#2A2723] text-[11px] font-mono text-[#F5F2EB]"
                      />
                    </div>
                    <input
                      type="text"
                      value={item.note || ""}
                      onChange={(e) => handleUpdateScheduleItem(idx, "note", e.target.value)}
                      placeholder="Nota / Hito"
                      className="flex-1 px-2 py-1 rounded bg-[#121110] border border-[#2A2723] text-[11px] text-[#F5F2EB]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleItem(idx)}
                      disabled={variableSchedule.length <= 1}
                      className="p-1 text-[#8E867B] hover:text-[#E05D52] disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-[11px] font-mono text-[#8E867B] flex justify-between pt-1 border-t border-[#2A2723]">
                <span>Total de Pagos: <strong className="text-[#DDD6C9]">{variableSchedule.length}</strong></span>
                <span>Monto Total: <strong className="text-[#D99B43]">${variableSchedule.reduce((sum, i) => sum + (Number(i.amount) || 0), 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</strong></span>
              </div>
            </div>
          )}

          {/* Conditional Schema Section: 3. Recurring */}
          {type === "recurring" && (
            <div className="p-4 rounded-lg bg-[#121110] border border-[#2A2723] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#D99B43]">
                <Repeat className="size-3.5" />
                <span>Pago Recurrente Periódico</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#8E867B] mb-1">Monto por Período ($) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={installmentAmount || ""}
                    onChange={(e) => setInstallmentAmount(parseFloat(e.target.value) || 0)}
                    placeholder="630.00"
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#181715] border border-[#2A2723] text-xs font-mono text-[#F5F2EB]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#8E867B] mb-1">Frecuencia *</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as CommitmentFrequency)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#181715] border border-[#2A2723] text-xs font-medium text-[#F5F2EB]"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="weekly">Semanal</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Schema Section: 4. One Time */}
          {type === "one_time" && (
            <div className="p-4 rounded-lg bg-[#121110] border border-[#2A2723] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#D99B43]">
                <Zap className="size-3.5" />
                <span>Pago Único / Vencimiento Puntual</span>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-[#8E867B] mb-1">Monto Total a Liquidar ($) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={totalAmount || ""}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  placeholder="1500.00"
                  className="w-full px-2.5 py-1.5 rounded-md bg-[#181715] border border-[#2A2723] text-xs font-mono text-[#F5F2EB]"
                />
              </div>
            </div>
          )}

          {/* General Properties: Due Date, Category, Default Account */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#8E867B] mb-1.5">Próximo Vencimiento *</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#121110] border border-[#2A2723] text-xs font-mono text-[#F5F2EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8E867B] mb-1.5">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#121110] border border-[#2A2723] text-xs text-[#F5F2EB]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || "🏷️"} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8E867B] mb-1.5">Cuenta Sugerida</label>
              <select
                value={defaultAccount}
                onChange={(e) => setDefaultAccount(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#121110] border border-[#2A2723] text-xs text-[#F5F2EB]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.icon || "💳"} {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono text-[#8E867B] mb-1.5">Notas Adicionales</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el contrato, cuenta CLABE de depósito, etc."
              className="w-full px-3 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs text-[#F5F2EB] focus:outline-hidden focus:border-[#D99B43] transition-all resize-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2A2723]">
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D99B43] text-[#121110] font-bold text-xs hover:bg-[#E8AF59] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isPending ? "Guardando..." : isEditing ? "Actualizar Compromiso" : "Crear Compromiso"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
