"use client";

import { HabiticaTask } from "@/lib/types";
import { CheckCircle2, Circle, Flame, Sparkles, Target, Zap } from "lucide-react";

interface DailyFocusRibbonProps {
  mustWinTaskIds: string[];
  tasks: HabiticaTask[];
  onToggleTask: (taskId: string) => void;
  onOpenMorningRitual: () => void;
}

export function DailyFocusRibbon({
  mustWinTaskIds,
  tasks,
  onToggleTask,
  onOpenMorningRitual,
}: DailyFocusRibbonProps) {
  if (!mustWinTaskIds || mustWinTaskIds.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-neutral-900/60 to-neutral-900/60 p-4 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">
              ¿Cuáles son tus 3 Must-Win Tasks de hoy?
            </h4>
            <p className="text-[11px] text-neutral-400">
              Inicia el Ritual Matutino para fijar tus 3 prioridades del día
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMorningRitual}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
        >
          🌅 Ritual Matutino (⌘M)
        </button>
      </div>
    );
  }

  const focusTasks = tasks.filter((t) => mustWinTaskIds.includes(t.id));
  const completedCount = focusTasks.filter((t) => t.completed || (t.type === "daily" && !t.isDue)).length;
  const isAllDone = focusTasks.length > 0 && completedCount === focusTasks.length;

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-neutral-900/80 to-neutral-900/80 p-4 backdrop-blur-xl shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
            <Target className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>🎯 Top 3 Must-Win Focus de Hoy</span>
              {isAllDone && (
                <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-bold">
                  ¡3/3 Logradas! 🏆
                </span>
              )}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-indigo-300">
            {completedCount}/{focusTasks.length} hechas
          </span>
          <button
            type="button"
            onClick={onOpenMorningRitual}
            className="text-[10px] text-neutral-400 hover:text-neutral-200 underline"
          >
            Editar foco
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {focusTasks.map((task) => {
          const isDone = task.completed || (task.type === "daily" && !task.isDue);

          return (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                isDone
                  ? "border-emerald-500/30 bg-emerald-500/10 text-neutral-400"
                  : "border-white/[0.08] bg-neutral-950/60 hover:border-indigo-500/40 text-white"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-neutral-500 hover:text-indigo-400" />
              )}
              <span
                className={`text-xs font-medium truncate ${
                  isDone ? "line-through text-neutral-400" : ""
                }`}
              >
                {task.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
