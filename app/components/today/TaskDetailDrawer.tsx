"use client";

import {
  deleteContextualNoteAction,
  saveContextualNoteAction,
  uploadNoteImageAction,
} from "@/app/actions/notes";
import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  deleteTaskAction,
  toggleChecklistItemAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import { NoteContentRenderer } from "@/app/components/notes/NoteContentRenderer";
import { soundFx } from "@/lib/soundFx";
import { parseTaskMetadata } from "@/lib/taskMetadata";
import { ContextualNote, HabiticaTask } from "@/lib/types";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

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

  // Task Editing State
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState(task?.text || "");
  const [taskNotes, setTaskNotes] = useState(task?.notes || "");
  const [taskPriority, setTaskPriority] = useState<number>(task?.priority ?? 1.5);
  const [previewTaskNotes, setPreviewTaskNotes] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // New Checklist Subtask State
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  // Contextual Note State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Editing Note State
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditDragging, setIsEditDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize internal state when task changes
  useEffect(() => {
    if (task) {
      setTaskTitle(task.text);
      setTaskNotes(task.notes || "");
      setTaskPriority(task.priority ?? 1.5);
      setIsEditingTask(false);
      setPreviewTaskNotes(false);
    }
  }, [task?.id, task?.text, task?.notes, task?.priority]);

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

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    setIsAddingChecklist(true);
    soundFx.click();
    try {
      const res = await addChecklistItemAction(task.id, newChecklistText.trim());
      if (res.success) {
        setNewChecklistText("");
        if (onRefreshData) onRefreshData();
      }
    } finally {
      setIsAddingChecklist(false);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.click();
    await deleteChecklistItemAction(task.id, itemId);
    if (onRefreshData) onRefreshData();
  };

  const handleSaveTaskChanges = async () => {
    if (!taskTitle.trim()) return;
    setIsSavingTask(true);
    soundFx.click();
    try {
      const res = await updateTaskAction(task.id, {
        text: taskTitle.trim(),
        notes: taskNotes,
        priority: taskPriority,
      });
      if (res.success) {
        soundFx.taskComplete();
        setIsEditingTask(false);
        if (onRefreshData) onRefreshData();
      } else {
        soundFx.click();
      }
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("¿Eliminar esta tarea de Habitica/Brio?")) return;
    soundFx.click();
    await deleteTaskAction(task.id);
    if (onRefreshData) onRefreshData();
    onClose();
  };

  const handleCompleteTask = () => {
    soundFx.taskComplete();
    startTransition(async () => {
      await toggleTaskAction(task.id, "up");
      if (onRefreshData) onRefreshData();
      onClose();
    });
  };

  const handleUploadFile = async (file: File, isEdit: boolean = false) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Solo se permiten archivos de imagen (PNG, JPG, WEBP).");
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadNoteImageAction(formData);

      if (res.success && res.url) {
        soundFx.click();
        const altText = file.name.replace(/\.[^/.]+$/, "") || "Captura adjunta";
        const markdownImage = `\n![${altText}](${res.url})\n`;
        if (isEdit) {
          setEditNoteContent((prev) => (prev ? `${prev.trimEnd()}\n${markdownImage}` : markdownImage));
        } else {
          setNoteContent((prev) => (prev ? `${prev.trimEnd()}\n${markdownImage}` : markdownImage));
        }
      } else {
        setUploadError(res.error || "Error al subir la imagen");
      }
    } catch (err) {
      console.error("[Upload error]:", err);
      setUploadError("Error de conexión al subir la imagen.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Clipboard Paste handler for new note
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await handleUploadFile(file, false);
          return;
        }
      }
    }
  };

  // Clipboard Paste handler for editing note
  const handleEditPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await handleUploadFile(file, true);
          return;
        }
      }
    }
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

  const handleStartEdit = (note: ContextualNote) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setIsAddingNote(false);
    setUploadError(null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteTitle("");
    setEditNoteContent("");
    setUploadError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNoteTitle.trim() || !editNoteContent.trim() || !editingNoteId) return;
    soundFx.taskComplete();

    startTransition(async () => {
      await saveContextualNoteAction({
        id: editingNoteId,
        projectId,
        taskId: task.id,
        title: editNoteTitle.trim(),
        content: editNoteContent.trim(),
        category: "technical",
      });
      setEditingNoteId(null);
      setEditNoteTitle("");
      setEditNoteContent("");
      if (onRefreshData) onRefreshData();
    });
  };

  const handleDeleteTaskNote = (noteId: string) => {
    soundFx.click();
    startTransition(async () => {
      await deleteContextualNoteAction(noteId);
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
      }
      if (onRefreshData) onRefreshData();
    });
  };

  const meta = parseTaskMetadata(task);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full sm:w-[52vw] xl:w-[48vw] min-w-85 max-w-225 h-full bg-[#181715] border-l border-[#2A2723] p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 space-y-6 z-10"
        role="dialog"
      >
        {/* Header & Main Task Properties */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority Pill */}
              <span
                className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${meta.priorityColor.badge}`}
              >
                {meta.priorityLabel}
              </span>

              {/* Notion Status Pill */}
              {meta.notionStatus && (
                <span className="font-mono text-[10px] font-bold text-[#8E867B] bg-[#121110] px-2 py-0.5 rounded border border-[#2A2723]">
                  {meta.notionStatus}
                </span>
              )}

              {/* Notion Category Pill */}
              {meta.notionCategory && (
                <span className="font-mono text-[10px] font-semibold text-[#4EAB9E] bg-[#141C1A] px-2 py-0.5 rounded border border-[#4EAB9E]/30">
                  {meta.notionCategory}
                </span>
              )}

              {/* Notion Hours or Ticket */}
              {meta.notionTicketId && (
                <span className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-2 py-0.5 rounded border border-[#2A2723]">
                  #{meta.notionTicketId}
                </span>
              )}

              {/* Notion Direct Link */}
              {meta.notionUrl && (
                <a
                  href={meta.notionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-[10px] text-[#DDD6C9] hover:text-[#FFFFFF] bg-[#121110] hover:bg-[#1C1A17] px-2 py-0.5 rounded border border-[#2A2723] transition-colors"
                >
                  <ExternalLink className="h-3 w-3 text-[#B388FF]" />
                  <span>Notion</span>
                </a>
              )}

              {task.value && (
                <span className="font-mono text-[10px] text-[#8E867B] bg-[#121110] px-2 py-0.5 rounded border border-[#2A2723]">
                  +{Math.round(task.value * 10)} XP
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEditingTask && (
                <button
                  type="button"
                  onClick={() => {
                    setTaskTitle(task.text);
                    setTaskNotes(task.notes || "");
                    setTaskPriority(task.priority ?? 1.5);
                    setIsEditingTask(true);
                  }}
                  className="flex items-center gap-1 text-xs font-mono text-[#D99B43] hover:text-[#E8AF59] bg-[#221D16] px-2.5 py-1 rounded-md border border-[#D99B43]/30 transition-colors cursor-pointer"
                  title="Editar tarea"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* VIEW MODE vs EDIT MODE */}
          {!isEditingTask ? (
            <>
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
              <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#2A2723]/60 text-[11px] font-mono text-[#8E867B]">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#D99B43]" />
                    <span className="font-semibold text-[#DDD6C9]">Descripción / Especificación:</span>
                  </div>
                </div>
                {task.notes ? (
                  <NoteContentRenderer content={task.notes} />
                ) : (
                  <p className="text-xs text-[#8E867B] font-mono italic">
                    Sin descripción. Haz clic en &quot;Editar&quot; para añadir notas o especificación en Markdown.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* EDIT MODE */
            <div className="space-y-4 p-4 rounded-xl bg-[#141311] border border-[#D99B43]/40 animate-in fade-in duration-150">
              {/* Edit Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8E867B]">
                  Título de la tarea
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Título..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2.5 text-sm text-[#F5F2EB] font-serif font-bold focus:border-[#D99B43] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Edit Priority */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8E867B]">
                  Prioridad
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 1, label: "Baja", color: "border-[#7EA35A]/50 text-[#7EA35A] bg-[#141813]" },
                    { value: 1.5, label: "Media", color: "border-[#D99B43]/50 text-[#D99B43] bg-[#221D16]" },
                    { value: 2, label: "Alta", color: "border-[#E5484D]/50 text-[#FF6369] bg-[#251417]" },
                    { value: 0.1, label: "Trivial", color: "border-[#38332D] text-[#8E867B] bg-[#181715]" },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setTaskPriority(p.value)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer text-center ${
                        taskPriority === p.value
                          ? `${p.color} ring-1 ring-inset ring-current`
                          : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Description / Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8E867B]">
                    Descripción (Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewTaskNotes(!previewTaskNotes)}
                    className="text-[11px] font-mono text-[#D99B43] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{previewTaskNotes ? "Escribir" : "Previa"}</span>
                  </button>
                </div>

                {previewTaskNotes ? (
                  <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 min-h-36 max-h-72 overflow-y-auto">
                    {taskNotes.trim() ? (
                      <NoteContentRenderer content={taskNotes} />
                    ) : (
                      <p className="text-xs text-[#8E867B] italic">Sin contenido previo.</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    rows={8}
                    placeholder="Escribe la especificación, notas o criterios de aceptación en Markdown..."
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-xs text-[#F5F2EB] font-mono focus:border-[#D99B43] focus:outline-none resize-y"
                  />
                )}
              </div>

              {/* Save / Cancel / Delete Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2A2723]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveTaskChanges}
                    disabled={isSavingTask || !taskTitle.trim()}
                    className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingTask ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>{isSavingTask ? "Guardando..." : "Guardar"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingTask(false)}
                    className="px-3 py-2 rounded-lg bg-[#121110] hover:bg-[#1C1A17] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723] text-xs font-mono cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteTask}
                  className="px-3 py-2 rounded-lg bg-[#251417] hover:bg-[#381B1F] text-[#FF6369] border border-[#E5484D]/30 text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Eliminar tarea definitivamente"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-checklist Items */}
          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
              <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#F5F2EB]">
                <ListTodo className="h-4 w-4 text-[#D99B43]" />
                <span>
                  Subtareas / Checklist{" "}
                  {task.checklist && task.checklist.length > 0
                    ? `(${task.checklist.filter((c) => c.completed).length}/${task.checklist.length})`
                    : "(0)"}
                </span>
              </div>
            </div>

            {task.checklist && task.checklist.length > 0 && (
              <div className="space-y-1.5">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.id && handleToggleChecklist(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none group ${
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

                    {item.id && (
                      <button
                        type="button"
                        onClick={(e) => item.id && handleDeleteChecklistItem(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#8E867B] hover:text-[#FF6369] hover:bg-[#221D16] transition-opacity cursor-pointer"
                        title="Eliminar subtarea"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Checklist Subtask Form */}
            <form onSubmit={handleAddChecklist} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Nueva subtarea o criterio..."
                className="flex-1 rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none font-sans"
              />
              <button
                type="submit"
                disabled={isAddingChecklist || !newChecklistText.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#221D16] hover:bg-[#2C241B] text-[#D99B43] border border-[#D99B43]/30 text-xs font-mono font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                <span>Agregar</span>
              </button>
            </form>
          </div>

          {/* Contextual Notes for this Task */}
          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
              <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#F5F2EB]">
                <FileText className="h-4 w-4 text-[#4EAB9E]" />
                <span>Notas de la Tarea</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddingNote(!isAddingNote);
                  if (editingNoteId) setEditingNoteId(null);
                }}
                className="text-[11px] font-mono text-[#4EAB9E] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>{isAddingNote ? "Cancelar" : "Nueva Nota"}</span>
              </button>
            </div>

            {/* Inline Note Creation Form with Paste & Upload */}
            {isAddingNote && (
              <form
                onSubmit={handleCreateTaskNote}
                className="space-y-3 p-3.5 rounded-xl bg-[#181715] border border-[#4EAB9E]/30 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  placeholder="Título de la nota (ej. Gráfica de ilusión de velocidad)..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none"
                  autoFocus
                />

                {/* Dropzone & Textarea */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) await handleUploadFile(files[0], false);
                  }}
                  className={`relative rounded-lg border transition-all ${
                    isDragging
                      ? "border-[#4EAB9E] bg-[#141C1A]"
                      : "border-[#2A2723] bg-[#121110]"
                  }`}
                >
                  <textarea
                    rows={4}
                    placeholder="Escribe detalles o pega capturas de pantalla directamente aquí (⌘V)..."
                    value={noteContent}
                    onPaste={handlePaste}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full bg-transparent p-3 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none resize-none font-sans"
                  />

                  {/* Actions Bar inside composer */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-[#2A2723]/60 bg-[#141312]/60 rounded-b-lg">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) await handleUploadFile(files[0], false);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-2.5 py-1 rounded-md text-[11px] font-mono text-[#8E867B] hover:text-[#DDD6C9] bg-[#181715] hover:bg-[#22201D] border border-[#2A2723] transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Subir archivo de imagen"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4EAB9E]" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-[#4EAB9E]" />
                        )}
                        <span>{isUploadingImage ? "Subiendo..." : "Adjuntar imagen"}</span>
                      </button>

                      <span className="text-[10px] font-mono text-[#8E867B] hidden sm:inline">
                        o pega captura con <kbd className="px-1 py-0.5 rounded bg-[#22201D] text-[#DDD6C9]">⌘V</kbd>
                      </span>
                    </div>

                    {isDragging && (
                      <span className="text-[10px] font-mono text-[#4EAB9E] animate-pulse">
                        Suelta la imagen para adjuntar
                      </span>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <p className="text-[11px] font-mono text-[#E05D52]">
                    ⚠️ {uploadError}
                  </p>
                )}

                {/* Real-time Preview */}
                {noteContent && (
                  <div className="p-2.5 rounded-lg bg-[#121110] border border-[#2A2723] space-y-1">
                    <span className="font-mono text-[9px] text-[#8E867B] uppercase tracking-wider block">
                      Vista previa:
                    </span>
                    <NoteContentRenderer content={noteContent} maxTextLines={2} />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNote(false);
                      setNoteTitle("");
                      setNoteContent("");
                      setUploadError(null);
                    }}
                    className="px-3.5 py-2 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!noteTitle.trim() || !noteContent.trim() || isPending || isUploadingImage}
                    className="px-5 py-2 rounded-lg bg-[#4EAB9E] hover:bg-[#5BBDAF] text-[#121110] font-bold text-xs font-mono cursor-pointer transition-all disabled:opacity-50"
                  >
                    Guardar Nota
                  </button>
                </div>
              </form>
            )}

            {/* List of Linked Notes */}
            {linkedNotes.length > 0 ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {linkedNotes.map((note) => {
                  const isEditing = editingNoteId === note.id;

                  // Inline Edit Form for this specific note
                  if (isEditing) {
                    return (
                      <form
                        key={note.id}
                        onSubmit={handleSaveEdit}
                        className="space-y-3 p-3.5 rounded-xl bg-[#181715] border border-[#D99B43]/50 shadow-md animate-in zoom-in-95 duration-150"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-[#D99B43] font-bold uppercase tracking-wider">
                            ✏️ Editando Nota
                          </span>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1 rounded text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={editNoteTitle}
                          onChange={(e) => setEditNoteTitle(e.target.value)}
                          placeholder="Título de la nota..."
                          className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none font-bold"
                          autoFocus
                        />

                        {/* Dropzone & Textarea for Edit */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsEditDragging(true);
                          }}
                          onDragLeave={() => setIsEditDragging(false)}
                          onDrop={async (e) => {
                            e.preventDefault();
                            setIsEditDragging(false);
                            const files = e.dataTransfer.files;
                            if (files && files.length > 0) await handleUploadFile(files[0], true);
                          }}
                          className={`relative rounded-lg border transition-all ${
                            isEditDragging
                              ? "border-[#D99B43] bg-[#221D16]"
                              : "border-[#2A2723] bg-[#121110]"
                          }`}
                        >
                          <textarea
                            rows={5}
                            value={editNoteContent}
                            onPaste={handleEditPaste}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            placeholder="Contenido de la nota (puedes pegar capturas con ⌘V)..."
                            className="w-full bg-transparent p-3 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none resize-none font-sans leading-relaxed"
                          />

                          {/* Action Bar for Edit */}
                          <div className="flex items-center justify-between px-3 py-2 border-t border-[#2A2723]/60 bg-[#141312]/60 rounded-b-lg">
                            <div className="flex items-center gap-2">
                              <input
                                ref={editFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) await handleUploadFile(files[0], true);
                                  if (editFileInputRef.current) editFileInputRef.current.value = "";
                                }}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => editFileInputRef.current?.click()}
                                disabled={isUploadingImage}
                                className="px-2.5 py-1 rounded-md text-[11px] font-mono text-[#8E867B] hover:text-[#DDD6C9] bg-[#181715] hover:bg-[#22201D] border border-[#2A2723] transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Adjuntar otra imagen"
                              >
                                {isUploadingImage ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D99B43]" />
                                ) : (
                                  <ImageIcon className="h-3.5 w-3.5 text-[#D99B43]" />
                                )}
                                <span>{isUploadingImage ? "Subiendo..." : "Adjuntar imagen"}</span>
                              </button>

                              <span className="text-[10px] font-mono text-[#8E867B] hidden sm:inline">
                                o pega captura con <kbd className="px-1 py-0.5 rounded bg-[#22201D] text-[#DDD6C9]">⌘V</kbd>
                              </span>
                            </div>

                            {isEditDragging && (
                              <span className="text-[10px] font-mono text-[#D99B43] animate-pulse">
                                Suelta la imagen aquí
                              </span>
                            )}
                          </div>
                        </div>

                        {uploadError && (
                          <p className="text-[11px] font-mono text-[#E05D52]">
                            ⚠️ {uploadError}
                          </p>
                        )}

                        {/* Live Preview for Edit */}
                        {editNoteContent && (
                          <div className="p-2.5 rounded-lg bg-[#121110] border border-[#2A2723] space-y-1">
                            <span className="font-mono text-[9px] text-[#8E867B] uppercase tracking-wider block">
                              Vista previa:
                            </span>
                            <NoteContentRenderer content={editNoteContent} maxTextLines={3} />
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={!editNoteTitle.trim() || !editNoteContent.trim() || isPending || isUploadingImage}
                            className="px-4 py-1.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs font-mono cursor-pointer transition-all disabled:opacity-50"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </form>
                    );
                  }

                  // Default Display Card
                  return (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl border border-[#2A2723] bg-[#181715] space-y-2 group hover:border-[#4EAB9E]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB] truncate">
                            {note.title}
                          </span>
                          <span className="font-mono text-[9px] text-[#4EAB9E] bg-[#141C1A] px-1.5 py-0.5 rounded border border-[#4EAB9E]/30 shrink-0">
                            {note.category}
                          </span>
                        </div>

                        {/* Action buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(note)}
                            className="p-1 rounded text-[#8E867B] hover:text-[#D99B43] hover:bg-[#22201D] transition-colors cursor-pointer"
                            title="Editar nota"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTaskNote(note.id)}
                            className="p-1 rounded text-[#8E867B] hover:text-[#E05D52] hover:bg-[#22201D] transition-colors cursor-pointer"
                            title="Eliminar nota"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rich Content Renderer */}
                      <NoteContentRenderer content={note.content} />
                    </div>
                  );
                })}
              </div>
            ) : (
              !isAddingNote && (
                <div className="rounded-xl border border-dashed border-[#2A2723] p-5 text-center space-y-1">
                  <p className="text-xs text-[#8E867B] font-mono">
                    No hay notas en esta tarea.
                  </p>
                  <p className="text-[10px] text-[#8E867B]/70 font-mono">
                    Haz clic en &quot;+ Nueva Nota&quot; para registrar ideas o pegar capturas (⌘V).
                  </p>
                </div>
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
            <span>{task.completed ? "Completada" : "Completar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
