"use client";

import { toggleSleepAction } from "@/app/actions/tasks";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
import { capitalize } from "@/lib/utils";
import {
  Bed,
  Calendar,
  Check,
  CheckCircle2,
  CornerDownLeft,
  Flame,
  Hash,
  Layers,
  ListTodo,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  isResting?: boolean;
  onOpenBatchCapture: () => void;
  onSelectTask: (task: HabiticaTask) => void;
  onFilterType: (type: "all" | "dailies" | "todos" | "habits") => void;
  onFilterTag: (tag: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  tasks,
  tags,
  isResting = false,
  onOpenBatchCapture,
  onSelectTask,
  onFilterType,
  onFilterTag,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // Controlled by parent
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Command items
  const staticActions = useMemo(() => {
    return [
      {
        id: "action-batch",
        title: "Open Batch Capture",
        subtitle: "Rapid multiline task creation",
        icon: Plus,
        badge: "⌘B",
        run: () => {
          onClose();
          onOpenBatchCapture();
        },
      },
      {
        id: "action-rest",
        title: isResting ? "Wake up from the Inn" : "Rest at the Inn",
        subtitle: isResting
          ? "Resume daily damage"
          : "Pause damage from uncompleted dailies",
        icon: Bed,
        badge: isResting ? "Resting" : "Active",
        run: () => {
          startTransition(async () => {
            await toggleSleepAction();
            onClose();
          });
        },
      },
      {
        id: "action-sync",
        title: "Sync Habitica State",
        subtitle: "Refresh HP, MP, EXP, and active tasks",
        icon: RotateCw,
        badge: "Sync",
        run: () => {
          startTransition(() => {
            router.refresh();
            onClose();
          });
        },
      },
      {
        id: "action-view-dailies",
        title: "Filter by Dailies",
        subtitle: "Show recurring daily commitments",
        icon: Calendar,
        badge: "View",
        run: () => {
          onFilterType("dailies");
          onClose();
        },
      },
      {
        id: "action-view-todos",
        title: "Filter by To-Dos",
        subtitle: "Show active to-do list",
        icon: ListTodo,
        badge: "View",
        run: () => {
          onFilterType("todos");
          onClose();
        },
      },
      {
        id: "action-view-habits",
        title: "Filter by Habits",
        subtitle: "Show good & bad habits",
        icon: Zap,
        badge: "View",
        run: () => {
          onFilterType("habits");
          onClose();
        },
      },
    ];
  }, [isResting, onClose, onOpenBatchCapture, onFilterType, router]);

  // Filter tasks based on query
  const filteredTasks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return tasks
      .filter((t) => {
        const matchTitle = t.text.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        return matchTitle || matchNotes || matchTags;
      })
      .slice(0, 8);
  }, [tasks, query]);

  // Filter tags based on query
  const filteredTags = useMemo(() => {
    if (!query.trim() || !query.startsWith("#")) return [];
    const cleanQ = query.replace(/^#/, "").toLowerCase();
    return tags
      .filter((t) => t.name.toLowerCase().includes(cleanQ))
      .slice(0, 5);
  }, [tags, query]);

  // Filtered action list
  const filteredActions = useMemo(() => {
    if (!query.trim() || query.startsWith("#")) return staticActions;
    const q = query.toLowerCase().trim();
    return staticActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );
  }, [staticActions, query]);

  // Total selectable items
  const allItems = useMemo(() => {
    return [
      ...filteredActions.map((a) => ({ type: "action" as const, data: a })),
      ...filteredTags.map((t) => ({ type: "tag" as const, data: t })),
      ...filteredTasks.map((t) => ({ type: "task" as const, data: t })),
    ];
  }, [filteredActions, filteredTags, filteredTasks]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + allItems.length) % allItems.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (!current) return;

      if (current.type === "action") {
        current.data.run();
      } else if (current.type === "tag") {
        onFilterTag(current.data.name);
        onClose();
      } else if (current.type === "task") {
        onSelectTask(current.data);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 backdrop-blur-md bg-black/60 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 shadow-2xl backdrop-blur-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="relative flex items-center border-b border-white/[0.08] px-4 py-3">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, task title, or #tag..."
            className="w-full bg-transparent pl-3 pr-8 font-sans text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
          <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* List of items */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {/* Actions Group */}
          {filteredActions.length > 0 && (
            <div className="mb-2">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Commands & Views
              </div>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${
                            isSelected ? "text-white" : "text-neutral-400"
                          }`}
                        />
                        <div>
                          <div className="font-medium">{action.title}</div>
                          <div
                            className={`text-[11px] ${
                              isSelected ? "text-indigo-100" : "text-neutral-500"
                            }`}
                          >
                            {action.subtitle}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {action.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags Group */}
          {filteredTags.length > 0 && (
            <div className="mb-2">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Filter by Tag
              </div>
              <div className="space-y-1">
                {filteredTags.map((tag, idx) => {
                  const itemIdx = filteredActions.length + idx;
                  const isSelected = selectedIndex === itemIdx;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        onFilterTag(tag.name);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIdx)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Hash
                          className={`h-3.5 w-3.5 ${
                            isSelected ? "text-white" : "text-indigo-400"
                          }`}
                        />
                        <span className="font-mono font-medium">#{tag.name}</span>
                      </div>
                      <span className="text-[10px] opacity-75">Select Tag</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks Match Group */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Matching Tasks
              </div>
              <div className="space-y-1">
                {filteredTasks.map((task, idx) => {
                  const itemIdx =
                    filteredActions.length + filteredTags.length + idx;
                  const isSelected = selectedIndex === itemIdx;
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        onSelectTask(task);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIdx)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {task.type === "daily" ? (
                          <Calendar
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-amber-400"
                            }`}
                          />
                        ) : task.type === "habit" ? (
                          <Zap
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-emerald-400"
                            }`}
                          />
                        ) : (
                          <ListTodo
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-sky-400"
                            }`}
                          />
                        )}
                        <span className="truncate font-medium">{task.text}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {capitalize(task.type)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allItems.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No matching commands or tasks found.
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-neutral-950/60 px-4 py-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              Select
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-500">
            Raycast / Linear Command Engine
          </span>
        </div>
      </div>
    </div>
  );
}
