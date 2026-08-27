"use client";

import {
  contributeToSavingsGoalAction,
  createSavingsGoalAction,
  deleteSavingsGoalAction,
  updateSavingsGoalAction,
} from "@/app/actions/finance";
import { SavingsGoal } from "@/lib/types";
import { Check, Edit2, Plus, Target, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

interface SavingsGoalsWidgetProps {
  goals: SavingsGoal[];
  onRefresh?: () => void;
}

export function SavingsGoalsWidget({ goals, onRefresh }: SavingsGoalsWidgetProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newCurrent, setNewCurrent] = useState("");

  // Editing state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editCurrent, setEditCurrent] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleQuickContribute = (goalId: string, amount: number) => {
    startTransition(async () => {
      await contributeToSavingsGoalAction(goalId, amount);
      if (onRefresh) onRefresh();
    });
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newTarget);
    if (!newTitle.trim() || isNaN(target) || target <= 0) return;

    startTransition(async () => {
      await createSavingsGoalAction({
        title: newTitle.trim(),
        targetAmount: target,
        currentAmount: parseFloat(newCurrent) || 0,
      });
      setNewTitle("");
      setNewTarget("");
      setNewCurrent("");
      setIsCreating(false);
      if (onRefresh) onRefresh();
    });
  };

  const handleStartEdit = (goal: SavingsGoal) => {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditTarget(goal.targetAmount.toString());
    setEditCurrent(goal.currentAmount.toString());
  };

  const handleSaveEdit = (goalId: string) => {
    const target = parseFloat(editTarget);
    const current = parseFloat(editCurrent);
    if (!editTitle.trim() || isNaN(target) || target <= 0) return;

    startTransition(async () => {
      await updateSavingsGoalAction(goalId, {
        title: editTitle.trim(),
        targetAmount: target,
        currentAmount: isNaN(current) ? 0 : Math.max(0, current),
      });
      setEditingGoalId(null);
      if (onRefresh) onRefresh();
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta meta de ahorro?")) return;
    startTransition(async () => {
      await deleteSavingsGoalAction(goalId);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
              Metas de Ahorro & Patrimonio
            </h3>
            <p className="text-xs text-[#8E867B]">
              Construye tu fondo de libertad y objetivos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-[#D99B43] bg-[#221D16] border border-[#D99B43]/30 hover:bg-[#3D3425] transition-all cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Inline Goal Creator Form */}
      {isCreating && (
        <form onSubmit={handleCreateGoal} className="mt-4 p-3.5 rounded-lg bg-[#121110] border border-[#2A2723] space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-[#F5F2EB] font-serif">Definir Nueva Meta de Ahorro</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nombre (ej. Viaje Japón ✈️)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="rounded-md border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-hidden focus:border-[#D99B43]"
            />
            <input
              type="number"
              placeholder="Monto Objetivo ($)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              required
              className="rounded-md border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs font-mono text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-hidden focus:border-[#D99B43]"
            />
            <input
              type="number"
              placeholder="Ahorro Inicial ($)"
              value={newCurrent}
              onChange={(e) => setNewCurrent(e.target.value)}
              className="rounded-md border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs font-mono text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-hidden focus:border-[#D99B43]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1 text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-3.5 py-1 rounded-md bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-semibold text-[#121110] cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Crear Meta"}
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {goals.map((goal) => {
          const isEditingThis = editingGoalId === goal.id;
          const percent = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          if (isEditingThis) {
            return (
              <div key={goal.id} className="rounded-lg border border-[#D99B43]/50 bg-[#181715] p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-[#F5F2EB]">
                  <span>Editar Meta</span>
                  <button
                    type="button"
                    onClick={() => setEditingGoalId(null)}
                    className="text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-mono text-[#8E867B] mb-0.5">Título / Concepto</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded border border-[#2A2723] bg-[#121110] px-2.5 py-1 text-xs text-[#F5F2EB]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-[#8E867B] mb-0.5">Monto Actual ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={editCurrent}
                        onChange={(e) => setEditCurrent(e.target.value)}
                        className="w-full rounded border border-[#2A2723] bg-[#121110] px-2.5 py-1 text-xs font-mono text-[#F5F2EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-[#8E867B] mb-0.5">Meta Objetivo ($)</label>
                      <input
                        type="number"
                        step="any"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="w-full rounded border border-[#2A2723] bg-[#121110] px-2.5 py-1 text-xs font-mono text-[#F5F2EB]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#2A2723]">
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    disabled={isPending}
                    className="flex items-center gap-1 text-[11px] text-[#E05D52] hover:underline cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                    <span>Eliminar</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingGoalId(null)}
                      className="px-2.5 py-1 rounded bg-transparent border border-[#2A2723] text-[11px] text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(goal.id)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-3 py-1 rounded bg-[#D99B43] hover:bg-[#E8AF59] text-[11px] font-bold text-[#121110] cursor-pointer disabled:opacity-50"
                    >
                      <Check className="size-3" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={goal.id}
              className="rounded-lg border border-[#2A2723] bg-[#121110] p-4 transition-all hover:border-[#38332D]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F2EB] tracking-tight truncate max-w-[200px]">
                  {goal.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#D99B43]">
                    {percent}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(goal)}
                    className="p-1 rounded text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#181715] transition-all cursor-pointer"
                    title="Editar meta o monto"
                  >
                    <Edit2 className="size-3" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 relative h-2 w-full overflow-hidden rounded-full bg-[#181715] border border-[#2A2723]">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted
                      ? "bg-[#7EA35A]"
                      : "bg-[#D99B43]"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#8E867B]">
                <span>
                  Actual: <strong className="text-[#DDD6C9]">${goal.currentAmount.toLocaleString()}</strong>
                </span>
                <span>
                  Meta: <strong className="text-[#DDD6C9]">${goal.targetAmount.toLocaleString()}</strong>
                </span>
              </div>

              {/* Quick Deposit Actions */}
              <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-[#2A2723]">
                <span className="text-[10px] text-[#8E867B] font-mono">Aporte rápido:</span>
                <button
                  type="button"
                  onClick={() => handleQuickContribute(goal.id, 100)}
                  disabled={isPending}
                  className="rounded border border-[#2A2723] bg-[#181715] px-2 py-0.5 text-[10px] font-mono font-medium text-[#DDD6C9] hover:border-[#D99B43] hover:text-[#D99B43] transition-colors cursor-pointer"
                >
                  +$100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickContribute(goal.id, 500)}
                  disabled={isPending}
                  className="rounded border border-[#2A2723] bg-[#181715] px-2 py-0.5 text-[10px] font-mono font-medium text-[#DDD6C9] hover:border-[#D99B43] hover:text-[#D99B43] transition-colors cursor-pointer"
                >
                  +$500
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickContribute(goal.id, 1000)}
                  disabled={isPending}
                  className="rounded border border-[#2A2723] bg-[#181715] px-2 py-0.5 text-[10px] font-mono font-medium text-[#DDD6C9] hover:border-[#D99B43] hover:text-[#D99B43] transition-colors cursor-pointer"
                >
                  +$1,000
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
