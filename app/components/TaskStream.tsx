"use client";

import { HabiticaTask } from "@/lib/types";
import {
  Calendar,
  CheckCircle2,
  ListTodo,
  Search,
  Sparkles,
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { TaskItem } from "./TaskItem";

interface TaskStreamProps {
  tasks: HabiticaTask[];
}

type TabType = "all" | "dailies" | "todos" | "habits";

export function TaskStream({ tasks }: TaskStreamProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);

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

      // Completed filter
      if (hideCompleted && task.completed) return false;

      // Search query filter (matches title, notes, or tags)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesText = task.text.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        const matchesTags = task.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        return matchesText || matchesNotes || matchesTags;
      }

      return true;
    });
  }, [tasks, activeTab, hideCompleted, searchQuery]);

  return (
    <section className="space-y-4">
      {/* Stream Controls: Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-white/8 bg-neutral-900/60 p-1 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === "all"
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
            onClick={() => setActiveTab("dailies")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === "dailies"
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
            onClick={() => setActiveTab("todos")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === "todos"
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
            onClick={() => setActiveTab("habits")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeTab === "habits"
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

        {/* Search & Hide Completed */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks or #tags..."
              className="w-full rounded-xl border border-white/10 bg-neutral-900/60 py-1.5 pl-8 pr-3 text-xs text-neutral-100 placeholder:text-neutral-500 backdrop-blur-md focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setHideCompleted((prev) => !prev)}
            title={hideCompleted ? "Show completed" : "Hide completed"}
            className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs transition-colors ${hideCompleted
                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                : "border-white/10 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200"
              }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Active Only</span>
          </button>
        </div>
      </div>

      {/* Task List Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
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
            {searchQuery
              ? "No tasks match your search filter."
              : "Use the Rapid Batch Capture box above to dispatch tasks instantly."}
          </p>
        </div>
      )}
    </section>
  );
}
