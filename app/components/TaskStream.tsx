"use client";

import { deleteTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
import {
  Calendar,
  CheckCircle2,
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
  tags?: HabiticaTag[];
  selectedTaskId: string | null;
  onSelectTask: (task: HabiticaTask | null) => void;
  activeTab: "all" | "dailies" | "todos" | "habits";
  onTabChange: (tab: "all" | "dailies" | "todos" | "habits") => void;
  activeTagFilter: string | null;
  onClearTagFilter: () => void;
}

export function TaskStream({
  tasks,
  tags = [],
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

  const tagsMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (tags) {
      for (const t of tags) {
        map[t.id] = t.name;
      }
    }
    return map;
  }, [tags]);

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
      if (activeTagFilter) {
        const filterLower = activeTagFilter.toLowerCase();
        const matchesActiveTag = task.tags?.some((tagId) => {
          const tagName = tagsMap[tagId] || tagId;
          return (
            tagId.toLowerCase() === filterLower ||
            tagName.toLowerCase() === filterLower
          );
        });
        if (!matchesActiveTag) return false;
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
        const matchesTags = task.tags?.some((tagId) => {
          const tagName = tagsMap[tagId] || tagId;
          return (
            tagId.toLowerCase().includes(query) ||
            tagName.toLowerCase().includes(query)
          );
        });
        return matchesText || matchesNotes || matchesTags;
      }

      return true;
    });
  }, [tasks, tagsMap, activeTab, activeTagFilter, hideCompleted, searchQuery]);

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
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#2A2723] bg-[#181715] p-1">
          <button
            onClick={() => onTabChange("all")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-[#282622] text-[#F5F2EB] border border-[#3D3831] shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <span>All</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px] text-[#8E867B]">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("dailies")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "dailies"
                ? "bg-[#3D3425] text-[#E8AF59] border border-[#D99B43]/40 shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Dailies</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px]">
              {dailies.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("todos")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "todos"
                ? "bg-[#1E2825] text-[#4EAB9E] border border-[#4EAB9E]/40 shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <ListTodo className="h-3 w-3" />
            <span>To-Dos</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px]">
              {todos.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("habits")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "habits"
                ? "bg-[#1D2619] text-[#7EA35A] border border-[#7EA35A]/40 shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Habits</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px]">
              {habits.length}
            </span>
          </button>
        </div>

        {/* Active Tag Filter Indicator & Search */}
        <div className="flex items-center gap-2">
          {activeTagFilter && (
            <div className="flex items-center gap-1 rounded-lg border border-[#3D3425] bg-[#221D16] px-2.5 py-1 text-xs text-[#D99B43]">
              <Hash className="h-3 w-3" />
              <span>{activeTagFilter}</span>
              <button
                onClick={onClearTagFilter}
                className="ml-1 hover:text-[#F5F2EB]"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8E867B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter list..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] py-1.5 pl-8 pr-3 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={() => setHideCompleted((prev) => !prev)}
            title={hideCompleted ? "Show completed" : "Hide completed"}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors ${
              hideCompleted
                ? "border-[#D99B43]/50 bg-[#D99B43]/15 text-[#E8AF59]"
                : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] hover:border-[#38332D]"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Active</span>
          </button>
        </div>
      </div>

      {/* Task Stream Grid / List */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {filteredTasks.map((task, idx) => (
            <TaskItem
              key={task.id}
              task={task}
              tagsMap={tagsMap}
              isSelected={selectedTaskId === task.id || selectedIndex === idx}
              onSelect={() => onSelectTask(task)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2A2723] bg-[#141311] py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C1A17] text-[#8E867B]">
            <Sparkles className="h-5 w-5 text-[#D99B43]" />
          </div>
          <h3 className="mt-3 font-serif text-sm font-semibold text-[#F5F2EB]">
            No tasks found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#8E867B]">
            {searchQuery || activeTagFilter
              ? "No tasks match your active filters."
              : "Use the Quick Omnibar or press 'C' to batch capture tasks."}
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Helper Ribbon */}
      <div className="hidden lg:flex items-center justify-between border-t border-[#2A2723] pt-2 text-[11px] font-mono text-[#8E867B]">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              j
            </kbd>
            /
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              k
            </kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              Space
            </kbd>{" "}
            toggle
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              Enter
            </kbd>{" "}
            inspect
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              d
            </kbd>{" "}
            delete
          </span>
        </div>
        <span>
          <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
            ⌘K
          </kbd>{" "}
          command palette
        </span>
      </div>
    </section>
  );
}
