"use client";

import { deleteTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { HabiticaTask } from "@/lib/types";
import {
  Calendar,
  CheckCircle2,
  Filter,
  Flame,
  Hash,
  ListTodo,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { TaskItem } from "./TaskItem";

interface TaskStreamProps {
  tasks: HabiticaTask[];
  selectedTaskId: string | null;
  onSelectTask: (task: HabiticaTask | null) => void;
  activeTab: "all" | "dailies" | "todos" | "habits";
  onTabChange: (tab: "all" | "dailies" | "todos" | "habits") => void;
  activeTagFilter: string | null;
  onClearTagFilter: () => void;
}

export function TaskStream({
  tasks,
  selectedTaskId,
  onSelectTask,
  activeTab,
  onTabChange,
  activeTagFilter,
  onClearTagFilter,
}: TaskStreamProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dailies = useMemo(
    () => tasks.filter((t) => t.type === "daily"),
    [tasks]
  );
  const todos = useMemo(
    () => tasks.filter((t) => t.type === "todo"),
    [tasks]
  );
  const habits = useMemo(
    () => tasks.filter((t) => t.type === "habit"),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "dailies" && task.type !== "daily") return false;
      if (activeTab === "todos" && task.type !== "todo") return false;
      if (activeTab === "habits" && task.type !== "habit") return false;

      // Tag filter
      if (
        activeTagFilter &&
        !task.tags?.some(
          (t) => t.toLowerCase() === activeTagFilter.toLowerCase()
        )
      ) {
        return false;
      }

      // Hide completed dailies
      if (hideCompleted && task.type === "daily" && task.completed) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = task.text.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        const matchesTags = task.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        return matchesText || matchesNotes || matchesTags;
      }

      return true;
    });
  }, [tasks, activeTab, activeTagFilter, hideCompleted, searchQuery]);

  // Derived selected index from selectedTaskId
  const selectedIndex = selectedTaskId
    ? Math.max(0, filteredTasks.findIndex((t) => t.id === selectedTaskId))
    : -1;

  // Vim-style keyboard navigation: j/k, Space/x, +/-, Enter, d
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      if (isInputActive) return;

      if (filteredTasks.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = selectedIndex < filteredTasks.length - 1 ? selectedIndex + 1 : 0;
        onSelectTask(filteredTasks[next] || null);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = selectedIndex > 0 ? selectedIndex - 1 : filteredTasks.length - 1;
        onSelectTask(filteredTasks[next] || null);
      } else if (e.key === " " || e.key === "x") {
        e.preventDefault();
        const curTask = filteredTasks[selectedIndex];
        if (curTask) {
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "up");
          });
        }
      } else if (e.key === "+" || e.key === "=") {
        const curTask = filteredTasks[selectedIndex];
        if (curTask && curTask.type === "habit") {
          e.preventDefault();
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "up");
          });
        }
      } else if (e.key === "-") {
        const curTask = filteredTasks[selectedIndex];
        if (curTask && curTask.type === "habit") {
          e.preventDefault();
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "down");
          });
        }
      } else if (e.key === "Enter" || e.key === "e") {
        e.preventDefault();
        const curTask = filteredTasks[selectedIndex];
        if (curTask) {
          onSelectTask(curTask);
        }
      } else if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
        const curTask = filteredTasks[selectedIndex];
        if (curTask && window.confirm(`Delete "${curTask.text}"?`)) {
          e.preventDefault();
          startTransition(async () => {
            await deleteTaskAction(curTask.id);
            onSelectTask(null);
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredTasks, selectedIndex, onSelectTask]);

  return (
    <section className="space-y-4">
      {/* Stream Controls: Tabs, Tag pill & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/[0.08] bg-neutral-900/60 p-1 backdrop-blur-xl">
          <button
            onClick={() => onTabChange("all")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>All</span>
            <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px]">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("dailies")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "dailies"
                ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Dailies</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
              {dailies.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("todos")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "todos"
                ? "bg-sky-500 text-neutral-950 font-bold shadow-md shadow-sky-500/20"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ListTodo className="h-3 w-3" />
            <span>To-Dos</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
              {todos.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("habits")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "habits"
                ? "bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20"
                : "text-neutral-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Habits</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
              {habits.length}
            </span>
          </button>
        </div>

        {/* Active Tag Filter Indicator & Search */}
        <div className="flex items-center gap-2">
          {activeTagFilter && (
            <div className="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300">
              <Hash className="h-3 w-3" />
              <span>{activeTagFilter}</span>
              <button
                onClick={onClearTagFilter}
                className="ml-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter list..."
              className="w-full rounded-xl border border-white/10 bg-neutral-900/60 py-1.5 pl-8 pr-3 text-xs text-neutral-100 placeholder:text-neutral-500 backdrop-blur-md focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setHideCompleted((prev) => !prev)}
            title={hideCompleted ? "Show completed" : "Hide completed"}
            className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs transition-colors ${
              hideCompleted
                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                : "border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Active</span>
          </button>
        </div>
      </div>

      {/* Task Stream Grid / List */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5">
          {filteredTasks.map((task, idx) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id || selectedIndex === idx}
              onSelect={() => onSelectTask(task)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-neutral-950/40 py-12 text-center backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-neutral-400">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-neutral-200">
            No tasks found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-400">
            {searchQuery || activeTagFilter
              ? "No tasks match your active filters."
              : "Use the Quick Omnibar or press 'C' to batch capture tasks."}
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Helper Ribbon */}
      <div className="hidden lg:flex items-center justify-between border-t border-white/[0.04] pt-2 text-[11px] font-mono text-neutral-500">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">
              j
            </kbd>
            /
            <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">
              k
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">
              Space
            </kbd>{" "}
            toggle
          </span>
          <span>
            <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">
              Enter
            </kbd>{" "}
            inspect
          </span>
          <span>
            <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">
              d
            </kbd>{" "}
            delete
          </span>
        </div>
        <span>
          <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">
            ⌘K
          </kbd>{" "}
          command palette
        </span>
      </div>
    </section>
  );
}
