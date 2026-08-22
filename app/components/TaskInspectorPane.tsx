"use client";

import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  deleteTaskAction,
  toggleChecklistItemAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import { HabiticaTag, HabiticaTask, TaskType } from "@/lib/types";
import { capitalize, getTaskValueColor } from "@/lib/utils";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  Flame,
  Hash,
  Minus,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface TaskInspectorPaneProps {
  task: HabiticaTask | null;
  tags: HabiticaTag[];
  onClose: () => void;
}

export function TaskInspectorPane({
  task,
  tags,
  onClose,
}: TaskInspectorPaneProps) {
  if (!task) return null;

  return (
    <TaskInspectorPaneContent
      key={task.id}
      task={task}
      tags={tags}
      onClose={onClose}
    />
  );
}

function TaskInspectorPaneContent({
  task,
  tags,
  onClose,
}: {
  task: HabiticaTask;
  tags: HabiticaTag[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.text || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [priority, setPriority] = useState<number>(task.priority || 1);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [hasSaved, setHasSaved] = useState(false);

  const valueStyle = getTaskValueColor(task.value || 0);

  const handleSaveDetails = () => {
    if (!task || isPending) return;

    startTransition(async () => {
      const res = await updateTaskAction(task.id, {
        text: title,
        notes: notes,
        priority: priority,
      });
      if (res.success) {
        setHasSaved(true);
        setTimeout(() => setHasSaved(false), 2000);
      }
    });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || isPending || !task) return;

    const textToAdd = newChecklistText.trim();
    setNewChecklistText("");

    startTransition(async () => {
      await addChecklistItemAction(task.id, textToAdd);
    });
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!task || isPending) return;
    startTransition(async () => {
      await toggleChecklistItemAction(task.id, itemId);
    });
  };

  const handleDeleteChecklist = (itemId: string) => {
    if (!task || isPending) return;
    startTransition(async () => {
      await deleteChecklistItemAction(task.id, itemId);
    });
  };

  const handleDeleteTask = () => {
    if (!task || isPending) return;
    if (window.confirm(`Are you sure you want to delete "${task.text}"?`)) {
      startTransition(async () => {
        await deleteTaskAction(task.id);
        onClose();
      });
    }
  };

  return (
    <aside className="relative flex flex-col h-full w-full rounded-2xl border border-white/10 bg-neutral-900/90 shadow-2xl backdrop-blur-2xl transition-all">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
              task.type === "daily"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : task.type === "habit"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-sky-500/30 bg-sky-500/10 text-sky-300"
            }`}
          >
            {capitalize(task.type)}
          </span>
          <span className="text-xs text-neutral-400 font-mono">
            ID: {task.id.slice(0, 8)}...
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSaveDetails}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
          >
            {hasSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Editable Title */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Task Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveDetails}
            className="w-full rounded-xl border border-white/10 bg-neutral-950/60 p-2.5 text-sm font-medium text-neutral-100 placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Priority & Difficulty */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Difficulty / Priority
            </label>
            <select
              value={priority}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPriority(val);
                startTransition(async () => {
                  await updateTaskAction(task.id, { priority: val });
                });
              }}
              className="w-full rounded-xl border border-white/10 bg-neutral-950/60 p-2 text-xs text-neutral-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="0.1">Trivial (0.1x)</option>
              <option value="1">Easy (1.0x)</option>
              <option value="1.5">Medium (1.5x)</option>
              <option value="2">Hard (2.0x)</option>
            </select>
          </div>

          {/* Habitica Health Value Metric */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Habitica Value
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950/60 p-2 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${valueStyle.dot}`}
              />
              <span className="font-mono text-neutral-300">
                {task.value?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Streak & Habit Counter badges */}
        {task.type === "daily" && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="font-semibold">Daily Streak</span>
            </div>
            <span className="font-mono font-bold text-amber-200">
              {task.streak || 0} consecutive days
            </span>
          </div>
        )}

        {task.type === "habit" && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">Habit History</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-emerald-400">+{task.counterUp || 0}</span>
              <span className="text-neutral-500">/</span>
              <span className="text-rose-400">-{task.counterDown || 0}</span>
            </div>
          </div>
        )}

        {/* Markdown Notes / Description */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Notes & Context (Markdown)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveDetails}
            rows={4}
            placeholder="Add detailed markdown notes, references, or instructions..."
            className="w-full rounded-xl border border-white/10 bg-neutral-950/60 p-2.5 font-mono text-xs leading-relaxed text-neutral-200 placeholder:text-neutral-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Subtask Checklists (For Todos and Dailies) */}
        {(task.type === "todo" || task.type === "daily") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Checklist Subtasks
              </label>
              {task.checklist && task.checklist.length > 0 && (
                <span className="font-mono text-[10px] text-neutral-400">
                  {task.checklist.filter((c) => c.completed).length} /{" "}
                  {task.checklist.length} completed
                </span>
              )}
            </div>

            {/* Checklist Items List */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-950/40 p-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => item.id && handleToggleChecklist(item.id)}
                      disabled={isPending}
                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.completed
                            ? "border-emerald-500 bg-emerald-500 text-neutral-950"
                            : "border-neutral-700 bg-neutral-800"
                        }`}
                      >
                        {item.completed && (
                          <Check className="h-3 w-3 stroke-3" />
                        )}
                      </div>
                      <span
                        className={`truncate ${
                          item.completed
                            ? "text-neutral-500 line-through"
                            : "text-neutral-200"
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => item.id && handleDeleteChecklist(item.id)}
                      disabled={isPending}
                      className="text-neutral-500 hover:text-rose-400 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Checklist Item Input */}
            <form onSubmit={handleAddChecklistItem} className="flex gap-1.5">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add subtask step..."
                className="flex-1 rounded-lg border border-white/10 bg-neutral-950/60 px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim() || isPending}
                className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tags && task.tags.length > 0 ? (
              task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-white/6 px-2 py-1 font-mono text-xs text-neutral-300 border border-white/10"
                >
                  <Tag className="h-3 w-3 text-neutral-400" />
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-500 italic">
                No tags assigned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-white/8 bg-neutral-950/60 p-3">
        <button
          type="button"
          onClick={handleDeleteTask}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Task</span>
        </button>

        <span className="text-[11px] text-neutral-500 font-mono">
          Press <kbd className="rounded bg-neutral-800 px-1 py-0.5">Esc</kbd> to close
        </span>
      </div>
    </aside>
  );
}
