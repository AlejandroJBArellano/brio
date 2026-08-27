"use client";

import { updateMonthlyBudgetAction } from "@/app/actions/finance";
import { MonthlyBudget } from "@/lib/types";
import { Sliders, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: MonthlyBudget;
  onSuccess?: () => void;
}

export function EditBudgetModal({
  isOpen,
  onClose,
  currentBudget,
  onSuccess,
}: EditBudgetModalProps) {
  const [budgetedIncome, setBudgetedIncome] = useState(currentBudget.budgetedIncome.toString());
  const [budgetedFixed, setBudgetedFixed] = useState(currentBudget.budgetedFixedExpenses.toString());
  const [budgetedVariable, setBudgetedVariable] = useState(currentBudget.budgetedVariableExpenses.toString());
  const [dailyAntLimit, setDailyAntLimit] = useState(currentBudget.dailyAntLimit.toString());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setBudgetedIncome(currentBudget.budgetedIncome.toString());
      setBudgetedFixed(currentBudget.budgetedFixedExpenses.toString());
      setBudgetedVariable(currentBudget.budgetedVariableExpenses.toString());
      setDailyAntLimit(currentBudget.dailyAntLimit.toString());
      setError(null);
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const numIncome = parseFloat(budgetedIncome) || 0;
  const numFixed = parseFloat(budgetedFixed) || 0;
  const numVar = parseFloat(budgetedVariable) || 0;
  const numAnt = parseFloat(dailyAntLimit) || 0;
  const totalLimit = numFixed + numVar;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalLimit <= 0) {
      setError("El presupuesto total de gastos debe ser mayor a 0");
      return;
    }

    startTransition(async () => {
      const res = await updateMonthlyBudgetAction({
        month: currentBudget.month,
        year: currentBudget.year,
        budgetedIncome: numIncome,
        budgetedFixedExpenses: numFixed,
        budgetedVariableExpenses: numVar,
        dailyAntLimit: numAnt,
      });

      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo actualizar el presupuesto");
      }
    });
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const monthLabel = `${monthNames[(currentBudget.month || 1) - 1] || "Mes actual"} ${currentBudget.year}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB]">
                Ajustar Presupuesto del Mes
              </h3>
              <p className="text-xs text-[#8E867B] font-mono">{monthLabel}</p>
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
          <div className="mt-4 rounded-lg bg-[#221716] border border-[#E05D52]/30 p-3 text-xs text-[#E05D52]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#DDD6C9] mb-1">
              Ingresos Presupuestados del Mes ($ MXN)
            </label>
            <input
              type="number"
              step="any"
              value={budgetedIncome}
              onChange={(e) => setBudgetedIncome(e.target.value)}
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-sm font-mono text-[#7EA35A] focus:border-[#7EA35A] focus:outline-none font-bold"
              placeholder="0.00"
            />
            <span className="text-[10px] text-[#8E867B]">Ingresos netos esperados este mes</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#2A2723]">
            <div>
              <label className="block text-xs font-mono text-[#DDD6C9] mb-1">
                Gastos Fijos Límite ($)
              </label>
              <input
                type="number"
                step="any"
                value={budgetedFixed}
                onChange={(e) => setBudgetedFixed(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-sm font-mono text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
                placeholder="0.00"
              />
              <span className="text-[10px] text-[#8E867B]">Renta, servicios, etc.</span>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#DDD6C9] mb-1">
                Gastos Variables Límite ($)
              </label>
              <input
                type="number"
                step="any"
                value={budgetedVariable}
                onChange={(e) => setBudgetedVariable(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-sm font-mono text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
                placeholder="0.00"
              />
              <span className="text-[10px] text-[#8E867B]">Comida, salidas, etc.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#DDD6C9] mb-1">
              Límite Diario de Gasto Hormiga ($ MXN/día)
            </label>
            <input
              type="number"
              step="any"
              value={dailyAntLimit}
              onChange={(e) => setDailyAntLimit(e.target.value)}
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2 text-sm font-mono text-[#D99B43] focus:border-[#D99B43] focus:outline-none"
              placeholder="100.00"
            />
            <span className="text-[10px] text-[#8E867B]">Para calibrar el termómetro hormiga</span>
          </div>

          {/* Resulting Total Summary */}
          <div className="rounded-lg bg-[#121110] border border-[#2A2723] p-3 flex items-center justify-between">
            <span className="text-xs text-[#8E867B]">Presupuesto Límite Total:</span>
            <span className="text-sm font-mono font-bold text-[#D99B43]">
              ${totalLimit.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2A2723]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-bold text-[#121110] transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar Presupuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
