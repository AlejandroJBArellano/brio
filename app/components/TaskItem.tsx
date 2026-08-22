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
import { useOptimistic, useTransition } from "react";

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

  const [optimisticState, setOptimisticState] = useOptimistic(
    {
      completed: task.completed || false,
      counterUp: task.counterUp || 0,
      counterDown: task.counterDown || 0,
    },
    (current, action: "up" | "down") => {
      if (task.type === "todo" || task.type === "daily") {
        return { ...current, completed: !current.completed };
      }
      if (task.type === "habit") {
        return {
          ...current,
          counterUp: action === "up" ? current.counterUp + 1 : current.counterUp,
          counterDown: action === "down" ? current.counterDown + 1 : current.counterDown,
        };
      }
      return current;
    }
  );

  const valueStyle = getTaskValueColor(task.value || 0);

  const handleScore = (
    e: React.MouseEvent,
    direction: "up" | "down" = "up"
  ) => {
    e.stopPropagation();
    if (isPending) return;

    startTransition(async () => {
      setOptimisticState(direction);
      await toggleTaskAction(task.id, direction);
    });
  };

  const completedChecklistCount =
    task.checklist?.filter((c) => c.completed).length || 0;
  const totalChecklistCount = task.checklist?.length || 0;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between rounded-2xl border p-3.5 sm:p-4 transition-all cursor-pointer select-none ${
        isSelected
          ? "border-indigo-500/80 bg-neutral-900 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50"
          : "border-white/6 bg-neutral-900/60 hover:border-white/20 hover:bg-neutral-900/90"
      } ${optimisticState.completed ? "opacity-40" : "opacity-100"}`}
    >
      {/* Left Column: Checkbox / Counter + Text & Meta */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Checkbox (Todos & Dailies) */}
        {(task.type === "todo" || task.type === "daily") && (
          <button
            type="button"
            onClick={(e) => handleScore(e, "up")}
            aria-label={optimisticState.completed ? "Mark as uncompleted" : "Mark as completed"}
            className={`flex size-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
              optimisticState.completed
                ? "border-emerald-500 bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/30"
                : "border-white/20 bg-neutral-950/60 hover:border-indigo-400 hover:bg-indigo-500/10"
            }`}
          >
            {optimisticState.completed && <Check className="size-3.5 stroke-3" />}
          </button>
        )}

        {/* Counters (Habits) */}
        {task.type === "habit" && (
          <div className="flex items-center gap-1 shrink-0">
            {task.up !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "up")}
                aria-label="Score habit up"
                className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-neutral-950/80 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/20 active:scale-95 transition-all"
              >
                <Plus className="size-3.5" />
              </button>
            )}
            {task.down !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "down")}
                aria-label="Score habit down"
                className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-neutral-950/80 text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/20 active:scale-95 transition-all"
              >
                <Minus className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Task Title & Tags */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium leading-snug tracking-tight text-neutral-100 truncate ${
                optimisticState.completed ? "line-through text-neutral-500" : ""
              }`}
            >
              {task.text}
            </span>

            {/* Streak Flame Badge for Dailies */}
            {task.type === "daily" && (task.streak || 0) > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[10px] font-bold text-amber-400 border border-amber-500/20 shrink-0">
                <Flame className="size-2.5 fill-amber-500" />
                {task.streak}
              </span>
            )}
          </div>

          {/* Subtitle / Notes preview / Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            {totalChecklistCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
                <CheckSquare className="size-3 text-neutral-500" />
                {completedChecklistCount}/{totalChecklistCount}
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                {task.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-0.5 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 border border-white/5 truncate max-w-24"
                  >
                    <Tag className="size-2.5 text-neutral-400" />
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="text-[10px] text-neutral-400">
                    +{task.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Habitica RPG Value Badge */}
      <div className="ml-3 flex items-center gap-2 shrink-0">
        {task.type === "habit" && (
          <div className="font-mono text-xs text-neutral-400 hidden sm:block">
            +{optimisticState.counterUp} / -{optimisticState.counterDown}
          </div>
        )}

        <div
          className={`size-2.5 rounded-full border ${valueStyle.badge} transition-transform group-hover:scale-125`}
          title={`Value Score: ${task.value?.toFixed(1) || 0}`}
        />
      </div>
    </div>
  );
}
