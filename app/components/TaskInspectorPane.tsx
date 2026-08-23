"use client";

import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  deleteTaskAction,
  toggleChecklistItemAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
import { capitalize, getTaskValueColor } from "@/lib/utils";
import {
  Check,
  Flame,
  Save,
  Tag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useState, useTransition } from "react";

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
    <aside className="relative flex flex-col h-full w-full rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl transition-all">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-[#2A2723] px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[11px] font-mono font-semibold border ${
              task.type === "daily"
                ? "border-[#3D3425] bg-[#221D16] text-[#D99B43]"
                : task.type === "habit"
                ? "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]"
                : "border-[#4EAB9E]/30 bg-[#162121] text-[#4EAB9E]"
            }`}
          >
            {capitalize(task.type)}
          </span>
          <span className="text-xs text-[#8E867B] font-mono">
            ID: {task.id.slice(0, 8)}...
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSaveDetails}
            disabled={isPending}
            className="flex items-center gap-1 rounded-lg bg-[#D99B43] px-2.5 py-1 text-xs font-semibold text-[#121110] transition-all hover:bg-[#E8AF59] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {hasSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#121110] stroke-3" />
                <span>Guardado</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Guardar</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar inspector"
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Editable Title */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E867B] mb-1 font-mono">
            Título de la Tarea
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveDetails}
            className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-sm font-medium text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
          />
        </div>

        {/* Priority & Difficulty */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E867B] mb-1 font-mono">
              Dificultad / Prioridad
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
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#DDD6C9] focus:border-[#D99B43] focus:outline-none"
            >
              <option value="0.1">Trivial (0.1x)</option>
              <option value="1">Fácil (1.0x)</option>
              <option value="1.5">Media (1.5x)</option>
              <option value="2">Difícil (2.0x)</option>
            </select>
          </div>

          {/* Habitica Health Value Metric */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E867B] mb-1 font-mono">
              Valor de Hábito
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${valueStyle.dot}`}
              />
              <span className="font-mono text-[#DDD6C9]">
                {task.value?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Streak & Habit Counter badges */}
        {task.type === "daily" && (
          <div className="flex items-center justify-between rounded-lg border border-[#3D3425] bg-[#221D16] p-2.5 text-xs text-[#D99B43]">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 fill-[#D99B43] text-[#D99B43]" />
              <span className="font-semibold">Racha Diaria</span>
            </div>
            <span className="font-mono font-bold text-[#E8AF59]">
              {task.streak || 0} días consecutivos
            </span>
          </div>
        )}

        {task.type === "habit" && (
          <div className="flex items-center justify-between rounded-lg border border-[#7EA35A]/30 bg-[#1C2219] p-2.5 text-xs text-[#7EA35A]">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#7EA35A]" />
              <span className="font-semibold">Historial de Hábito</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#7EA35A]">+{task.counterUp || 0}</span>
              <span className="text-[#8E867B]">/</span>
              <span className="text-[#E05D52]">-{task.counterDown || 0}</span>
            </div>
          </div>
        )}

        {/* Markdown Notes / Description */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E867B] mb-1 font-mono">
            Notas & Contexto (Markdown)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveDetails}
            rows={4}
            placeholder="Añadir notas markdown, referencias o instrucciones detalladas..."
            className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 font-mono text-xs leading-relaxed text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
          />
        </div>

        {/* Subtask Checklists (For Todos and Dailies) */}
        {(task.type === "todo" || task.type === "daily") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8E867B] font-mono">
                Subtareas / Checklist
              </label>
              {task.checklist && task.checklist.length > 0 && (
                <span className="font-mono text-[10px] text-[#8E867B]">
                  {task.checklist.filter((c) => c.completed).length} /{" "}
                  {task.checklist.length} completadas
                </span>
              )}
            </div>

            {/* Checklist Items List */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => item.id && handleToggleChecklist(item.id)}
                      disabled={isPending}
                      className="flex items-center gap-2 flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.completed
                            ? "border-[#7EA35A] bg-[#7EA35A] text-[#121110]"
                            : "border-[#38332D] bg-[#181715]"
                        }`}
                      >
                        {item.completed && (
                          <Check className="h-3 w-3 stroke-3" />
                        )}
                      </div>
                      <span
                        className={`truncate ${
                          item.completed
                            ? "text-[#8E867B] line-through"
                            : "text-[#DDD6C9]"
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => item.id && handleDeleteChecklist(item.id)}
                      disabled={isPending}
                      className="text-[#8E867B] hover:text-[#E05D52] ml-2 cursor-pointer transition-colors"
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
                placeholder="Añadir paso..."
                className="flex-1 rounded-lg border border-[#2A2723] bg-[#121110] px-2.5 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!newChecklistText.trim() || isPending}
                className="rounded-lg bg-[#22201D] border border-[#2A2723] px-3 py-1.5 text-xs font-medium text-[#DDD6C9] hover:bg-[#282622] hover:text-[#F5F2EB] disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </form>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8E867B] mb-1.5 font-mono">
            Etiquetas
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tags && task.tags.length > 0 ? (
              task.tags.map((tagId) => {
                const found = tags.find((t) => t.id === tagId);
                const tagName = found ? found.name : tagId;

                return (
                  <span
                    key={tagId}
                    title={tagName}
                    className="inline-flex items-center gap-1 rounded bg-[#121110] px-2 py-0.5 font-mono text-[11px] text-[#DDD6C9] border border-[#2A2723]"
                  >
                    <Tag className="h-2.5 w-2.5 text-[#D99B43]" />
                    {tagName}
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-[#8E867B] italic font-mono">
                Sin etiquetas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-[#2A2723] bg-[#141312] p-3">
        <button
          type="button"
          onClick={handleDeleteTask}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#E05D52] transition-colors hover:bg-[#221716] cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Eliminar Tarea</span>
        </button>

        <span className="text-[11px] text-[#8E867B] font-mono">
          Pulsa <kbd className="rounded bg-[#181715] border border-[#2A2723] px-1 py-0.5 text-[#DDD6C9]">Esc</kbd> para cerrar
        </span>
      </div>
    </aside>
  );
}
