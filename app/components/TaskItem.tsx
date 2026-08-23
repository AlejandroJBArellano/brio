"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
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
  tags?: HabiticaTag[];
  tagsMap?: Record<string, string>;
}

export function TaskItem({
  task,
  isSelected = false,
  onSelect,
  tags,
  tagsMap,
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
      className={`group relative flex items-center justify-between rounded-xl border p-3.5 sm:p-4 transition-all cursor-pointer select-none ${
        isSelected
          ? "border-[#D99B43]/80 bg-[#1F1D1A] shadow-md ring-1 ring-[#D99B43]/40"
          : "border-[#2A2723] bg-[#181715] hover:border-[#38332D] hover:bg-[#1D1B18]"
      } ${optimisticState.completed ? "opacity-45" : "opacity-100"}`}
    >
      {/* Left Column: Checkbox / Counter + Text & Meta */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Checkbox (Todos & Dailies) */}
        {(task.type === "todo" || task.type === "daily") && (
          <button
            type="button"
            onClick={(e) => handleScore(e, "up")}
            aria-label={optimisticState.completed ? "Mark as uncompleted" : "Mark as completed"}
            className={`flex size-5.5 shrink-0 items-center justify-center rounded border transition-all ${
              optimisticState.completed
                ? "border-[#7EA35A] bg-[#7EA35A] text-[#121110] shadow-xs"
                : "border-[#38332D] bg-[#121110] hover:border-[#D99B43]/60 hover:bg-[#D99B43]/10"
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
                className="flex size-6 items-center justify-center rounded border border-[#2A2723] bg-[#121110] text-[#7EA35A] hover:border-[#7EA35A]/50 hover:bg-[#7EA35A]/15 active:scale-95 transition-all"
              >
                <Plus className="size-3.5" />
              </button>
            )}
            {task.down !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "down")}
                aria-label="Score habit down"
                className="flex size-6 items-center justify-center rounded border border-[#2A2723] bg-[#121110] text-[#E05D52] hover:border-[#E05D52]/50 hover:bg-[#E05D52]/15 active:scale-95 transition-all"
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
              className={`text-sm font-medium leading-snug tracking-tight text-[#F5F2EB] truncate ${
                optimisticState.completed ? "line-through text-[#8E867B]" : ""
              }`}
            >
              {task.text}
            </span>

            {/* Streak Flame Badge for Dailies */}
            {task.type === "daily" && (task.streak || 0) > 0 && (
              <span className="flex items-center gap-0.5 rounded border border-[#3D3425] bg-[#221D16] px-1.5 py-0.2 font-mono text-[10px] font-semibold text-[#D99B43] shrink-0">
                <Flame className="size-2.5 fill-[#D99B43]" />
                {task.streak}
              </span>
            )}
          </div>

          {/* Subtitle / Notes preview / Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#8E867B]">
            {totalChecklistCount > 0 && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-[#8E867B]">
                <CheckSquare className="size-3 text-[#8E867B]" />
                {completedChecklistCount}/{totalChecklistCount}
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                {task.tags.slice(0, 3).map((tagId, i) => {
                  const tagName =
                    tagsMap?.[tagId] ||
                    tags?.find((t) => t.id === tagId)?.name ||
                    tagId;

                  return (
                    <span
                      key={i}
                      title={tagName}
                      className="inline-flex items-center gap-0.5 rounded border border-[#2E2A25] bg-[#1C1A17] px-1.5 py-0.5 text-[10px] font-medium text-[#C2BAAD] truncate max-w-28"
                    >
                      <Tag className="size-2.5 text-[#8E867B] shrink-0" />
                      <span className="truncate">{tagName}</span>
                    </span>
                  );
                })}
                {task.tags.length > 3 && (
                  <span className="text-[10px] font-mono text-[#8E867B]">
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
          <div className="font-mono text-xs text-[#8E867B] hidden sm:block">
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
