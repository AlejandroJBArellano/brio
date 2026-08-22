"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import { HabiticaTask } from "@/lib/types";
import { getTaskValueColor } from "@/lib/utils";
import {
  Check,
  CheckSquare,
  Flame,
  Minus,
  Plus,
  Tag,
} from "lucide-react";
import { useState, useTransition } from "react";

interface TaskItemProps {
  task: HabiticaTask;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function TaskItem({
  task,
  isSelected = false,
  onSelect,
}: TaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useState(
    task.completed || false
  );
  const [optimisticCountUp, setOptimisticCountUp] = useState(
    task.counterUp || 0
  );
  const [optimisticCountDown, setOptimisticCountDown] = useState(
    task.counterDown || 0
  );

  const valueStyle = getTaskValueColor(task.value || 0);

  const handleScore = (
    e: React.MouseEvent,
    direction: "up" | "down" = "up"
  ) => {
    e.stopPropagation();
    if (isPending) return;

    if (task.type === "todo" || task.type === "daily") {
      setOptimisticCompleted(!optimisticCompleted);
    } else if (task.type === "habit") {
      if (direction === "up") setOptimisticCountUp((prev) => prev + 1);
      if (direction === "down") setOptimisticCountDown((prev) => prev + 1);
    }

    startTransition(async () => {
      await toggleTaskAction(task.id, direction);
    });
  };

  const completedChecklistCount =
    task.checklist?.filter((c) => c.completed).length || 0;
  const totalChecklistCount = task.checklist?.length || 0;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-start gap-3 rounded-xl border p-3 sm:p-3.5 backdrop-blur-md cursor-pointer transition-all ${
        isSelected
          ? "border-indigo-500/80 bg-indigo-950/20 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
          : "border-white/[0.06] bg-neutral-900/50 hover:border-white/20 hover:bg-neutral-900/80"
      } ${optimisticCompleted ? "opacity-50" : ""}`}
    >
      {/* Type-Specific Action Control */}
      <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
        {task.type === "habit" ? (
          <div className="flex flex-col gap-1">
            {task.up !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "up")}
                disabled={isPending}
                title="Score positive habit"
                className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500/30 hover:text-emerald-200 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            {task.down !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "down")}
                disabled={isPending}
                title="Score negative habit"
                className="flex h-6 w-6 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-colors hover:bg-rose-500/30 hover:text-rose-200 active:scale-95"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => handleScore(e, "up")}
            disabled={isPending}
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
              optimisticCompleted
                ? "border-emerald-500 bg-emerald-500 text-neutral-950"
                : "border-neutral-700 bg-neutral-800/80 hover:border-indigo-400"
            }`}
          >
            {optimisticCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </button>
        )}
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-sm font-medium leading-snug break-words ${
              optimisticCompleted
                ? "text-neutral-400 line-through"
                : isSelected
                ? "text-white font-semibold"
                : "text-neutral-100"
            }`}
          >
            {task.text}
          </span>

          {/* Priority indicator */}
          {task.priority && task.priority > 1 && (
            <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
              {task.priority >= 2 ? "Urgent" : "Medium"}
            </span>
          )}

          {/* Checklist progress pill */}
          {totalChecklistCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-neutral-300 border border-white/10">
              <CheckSquare className="h-3 w-3 text-indigo-400" />
              {completedChecklistCount}/{totalChecklistCount}
            </span>
          )}

          {/* Habit counters */}
          {task.type === "habit" && (
            <span className="font-mono text-[11px] text-neutral-400">
              (+{optimisticCountUp} / -{optimisticCountDown})
            </span>
          )}

          {/* Daily streak indicator */}
          {task.type === "daily" && (task.streak || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
              <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
              {task.streak}d
            </span>
          )}
        </div>

        {/* Notes Preview */}
        {task.notes && (
          <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed font-sans">
            {task.notes}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 border border-white/5"
              >
                <Tag className="h-2.5 w-2.5 text-neutral-500" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selected Indicator Pill */}
      {isSelected && (
        <span className="absolute top-2 right-2 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono text-indigo-300 border border-indigo-500/30">
          ENTER to edit
        </span>
      )}
    </div>
  );
}
