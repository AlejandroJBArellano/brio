"use client";

import { HabiticaTask } from "@/lib/types";
import { CheckCircle2, Circle, Target } from "lucide-react";

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
      <div className="rounded-xl border border-[#3D3425] bg-[#1A1815] p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D99B43]/15 text-[#D99B43]">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
              ¿Cuáles son tus 3 Must-Win Tasks de hoy?
            </h4>
            <p className="text-[11px] text-[#8E867B]">
              Inicia el Ritual Matutino para fijar tus 3 prioridades clave del día
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMorningRitual}
          className="px-3.5 py-1.5 rounded-lg bg-[#D99B43] font-sans font-semibold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-md"
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
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#D99B43]/15 text-[#D99B43]">
            <Target className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight flex items-center gap-1.5">
              <span>🎯 Top 3 Must-Win Focus de Hoy</span>
              {isAllDone && (
                <span className="rounded bg-[#7EA35A]/15 text-[#7EA35A] border border-[#7EA35A]/30 px-1.5 py-0.2 font-mono text-[10px] font-bold">
                  3/3 Logradas 🏆
                </span>
              )}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#D99B43]">
            {completedCount}/{focusTasks.length} hechas
          </span>
          <button
            type="button"
            onClick={onOpenMorningRitual}
            className="text-[11px] text-[#8E867B] hover:text-[#DDD6C9] underline decoration-[#38332D]"
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
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                isDone
                  ? "border-[#7EA35A]/30 bg-[#151814] text-[#8E867B]"
                  : "border-[#2A2723] bg-[#121110] hover:border-[#D99B43]/40 text-[#F5F2EB]"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7EA35A]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[#8E867B] hover:text-[#D99B43]" />
              )}
              <span
                className={`text-xs font-medium truncate ${
                  isDone ? "line-through text-[#8E867B]" : ""
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
