"use client";

import { saveContextualNoteAction } from "@/app/actions/notes";
import { toggleChecklistItemAction, toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import { ContextualNote, HabiticaTask } from "@/lib/types";
import {
  Check,
  CheckCircle2,
  FileText,
  ListTodo,
  Plus,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface TaskDetailDrawerProps {
  task: HabiticaTask | null;
  projectId: string;
  projectNotes: ContextualNote[];
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export function TaskDetailDrawer({
  task,
  projectId,
  projectNotes,
  isOpen,
  onClose,
  onRefreshData,
}: TaskDetailDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  if (!isOpen || !task) return null;

  // Filter notes linked specifically to this task
  const linkedNotes = projectNotes.filter((n) => n.taskId === task.id);

  const handleToggleChecklist = (itemId: string) => {
    soundFx.taskComplete();
    startTransition(async () => {
      await toggleChecklistItemAction(task.id, itemId);
      if (onRefreshData) onRefreshData();
    });
  };

  const handleCompleteTask = () => {
    soundFx.taskComplete();
    startTransition(async () => {
      await toggleTaskAction(task.id, "up");
      if (onRefreshData) onRefreshData();
      onClose();
    });
  };

  const handleCreateTaskNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    soundFx.taskComplete();

    startTransition(async () => {
      await saveContextualNoteAction({
        projectId,
        taskId: task.id,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        category: "technical",
      });
      setNoteTitle("");
      setNoteContent("");
      setIsAddingNote(false);
      if (onRefreshData) onRefreshData();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full sm:w-[50vw] xl:w-[48vw] min-w-85 max-w-225 h-full bg-[#181715] border-l border-[#2A2723] p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 space-y-6 z-10"
        role="dialog"
      >
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#D99B43] bg-[#221D16] px-2.5 py-1 rounded-md border border-[#D99B43]/30">
                {task.type}
              </span>
              {task.value && (
                <span className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-2.5 py-1 rounded-md border border-[#2A2723]">
                  +{Math.round(task.value * 10)} XP
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Title */}
          <div>
            <h3
              className={`font-serif text-lg sm:text-xl font-bold text-[#F5F2EB] ${
                task.completed ? "line-through text-[#8E867B]" : ""
              }`}
            >
              {task.text}
            </h3>
          </div>

          {/* Notes / Description from Habitica */}
          {task.notes && (
            <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8E867B]">
                <FileText className="h-3.5 w-3.5" />
                <span>Descripción / Notas de Habitica:</span>
              </div>
              <p className="text-xs text-[#DDD6C9] whitespace-pre-wrap leading-relaxed">
                {task.notes}
              </p>
            </div>
          )}

          {/* Sub-checklist Items */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
                <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#F5F2EB]">
                  <ListTodo className="h-4 w-4 text-[#D99B43]" />
                  <span>Subtareas / Checklist ({task.checklist.filter((c) => c.completed).length}/{task.checklist.length})</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.id && handleToggleChecklist(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      item.completed
                        ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                        : "bg-[#181715] border-[#2A2723] hover:border-[#38332D] text-[#F5F2EB]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                          item.completed
                            ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                            : "border-[#38332D] bg-[#121110]"
                        }`}
                      >
                        {item.completed && <Check className="h-3 w-3 stroke-3" />}
                      </div>
                      <span
                        className={`text-xs ${
                          item.completed
                            ? "line-through text-[#8E867B]"
                            : "text-[#F5F2EB]"
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Notes for this Task */}
          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
              <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#F5F2EB]">
                <FileText className="h-4 w-4 text-[#4EAB9E]" />
                <span>Notas Contextuales de esta Tarea ({linkedNotes.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="text-[11px] font-mono text-[#4EAB9E] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>{isAddingNote ? "Cancelar" : "Nueva Nota"}</span>
              </button>
            </div>

            {/* Inline Note Creation Form */}
            {isAddingNote && (
              <form
                onSubmit={handleCreateTaskNote}
                className="space-y-2.5 p-3 rounded-xl bg-[#181715] border border-[#4EAB9E]/30 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  placeholder="Título de la nota (ej. Endpoint bug, Criterio)..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none"
                  autoFocus
                />
                <textarea
                  rows={3}
                  placeholder="Escribe detalles técnicos, decisiones o apuntes..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none resize-none font-sans"
                />
                <button
                  type="submit"
                  disabled={!noteTitle.trim() || !noteContent.trim() || isPending}
                  className="w-full py-2 rounded-lg bg-[#4EAB9E] hover:bg-[#5BBDAF] text-[#121110] font-bold text-xs font-mono cursor-pointer transition-all disabled:opacity-50"
                >
                  Guardar Nota en esta Tarea
                </button>
              </form>
            )}

            {/* List of Linked Notes */}
            {linkedNotes.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {linkedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg border border-[#2A2723] bg-[#181715] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xs font-bold text-[#F5F2EB] truncate">
                        {note.title}
                      </span>
                      <span className="font-mono text-[9px] text-[#4EAB9E] bg-[#141C1A] px-1.5 py-0.5 rounded border border-[#4EAB9E]/30">
                        {note.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E867B] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              !isAddingNote && (
                <p className="text-[11px] text-[#8E867B] font-mono italic">
                  Sin notas vinculadas aún. Agrega apuntes para no perder contexto.
                </p>
              )
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-[#2A2723]">
          <button
            type="button"
            disabled={task.completed || isPending}
            onClick={handleCompleteTask}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm font-sans transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              task.completed
                ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40 opacity-75 cursor-not-allowed"
                : "bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110] active:scale-[0.99]"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {task.completed
                ? "✓ Tarea Completada"
                : "Completar Tarea (+XP)"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
