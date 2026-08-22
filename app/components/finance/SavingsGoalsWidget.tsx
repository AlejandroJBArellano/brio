"use client";

import { contributeToSavingsGoalAction, createSavingsGoalAction } from "@/app/actions/finance";
import { SavingsGoal } from "@/lib/types";
import { Plus, Target } from "lucide-react";
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

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Metas de Ahorro & Patrimonio
            </h3>
            <p className="text-xs text-neutral-400">
              Construye tu fondo de libertad y objetivos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
        >
          <Plus className="h-3 w-3" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Inline Goal Creator Form */}
      {isCreating && (
        <form onSubmit={handleCreateGoal} className="mt-4 p-3.5 rounded-xl bg-neutral-950/80 border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-white">Definir Nueva Meta de Ahorro</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nombre (ej. Viaje Japón ✈️)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Monto Objetivo ($)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              required
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white placeholder:text-neutral-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Ahorro Inicial ($)"
              value={newCurrent}
              onChange={(e) => setNewCurrent(e.target.value)}
              className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-white placeholder:text-neutral-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-3.5 py-1 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              {isPending ? "Guardando..." : "Crear Meta"}
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          return (
            <div
              key={goal.id}
              className="rounded-xl border border-white/6 bg-neutral-950/60 p-4 transition-all hover:border-white/12"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-tight">
                  {goal.title}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {percent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 relative h-2 w-full overflow-hidden rounded-full bg-neutral-900">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted
                      ? "bg-emerald-400 shadow-lg shadow-emerald-500/20"
                      : "bg-gradient-to-r from-indigo-500 to-violet-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>
                  Actual: <strong className="text-neutral-200">${goal.currentAmount.toLocaleString()}</strong>
                </span>
                <span>
                  Meta: <strong className="text-neutral-200">${goal.targetAmount.toLocaleString()}</strong>
                </span>
              </div>

              {/* Quick Deposit Actions */}
              <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-white/4">
                <span className="text-[10px] text-neutral-500">Aporte rápido:</span>
                <button
                  type="button"
                  onClick={() => handleQuickContribute(goal.id, 100)}
                  disabled={isPending}
                  className="rounded-md border border-neutral-800 bg-neutral-900/80 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-300 hover:border-indigo-500/30 hover:text-indigo-300"
                >
                  +$100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickContribute(goal.id, 500)}
                  disabled={isPending}
                  className="rounded-md border border-neutral-800 bg-neutral-900/80 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-300 hover:border-indigo-500/30 hover:text-indigo-300"
                >
                  +$500
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickContribute(goal.id, 1000)}
                  disabled={isPending}
                  className="rounded-md border border-neutral-800 bg-neutral-900/80 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-300 hover:border-indigo-500/30 hover:text-indigo-300"
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
