"use client";

import {
  createScratchpadNoteAction,
  deleteScratchpadNoteAction,
  fetchScratchpadNotesAction,
  saveScratchpadAction,
} from "@/app/actions/projects";
import { submitBatchCaptureAction } from "@/app/actions/tasks";
import { MarkdownRenderer } from "@/app/components/ui/MarkdownRenderer";
import { ScratchpadNoteItem } from "@/lib/types";
import {
  Check,
  Edit3,
  FileText,
  FolderOpen,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSuccess?: () => void;
}

export function ScratchpadModal({
  isOpen,
  onClose,
  initialContent = "",
  onSuccess,
}: ScratchpadModalProps) {
  if (!isOpen) return null;

  return (
    <ScratchpadModalContent
      onClose={onClose}
      initialContent={initialContent}
      onSuccess={onSuccess}
    />
  );
}

function ScratchpadModalContent({
  onClose,
  initialContent,
  onSuccess,
}: {
  onClose: () => void;
  initialContent: string;
  onSuccess?: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [activeNoteId, setActiveNoteId] = useState("default");
  const [notesList, setNotesList] = useState<ScratchpadNoteItem[]>([]);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(false);

  // Load notes on mount
  useEffect(() => {
    let isMounted = true;
    async function loadNotes() {
      try {
        const notes = await fetchScratchpadNotesAction();
        if (isMounted) {
          setNotesList(notes);
          const defaultNote = notes.find((n) => n.id === "default");
          if (defaultNote && !initialContent) {
            setContent(defaultNote.content);
          } else if (initialContent) {
            setContent(initialContent);
          }
        }
      } catch (err) {
        console.error("[Scratchpad] Failed to load notes:", err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    }
    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [initialContent]);

  // Debounced auto-save to Neon DB per active note
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        await saveScratchpadAction(content, activeNoteId);
        setIsSaved(true);
        // Update in-memory notes list content
        setNotesList((prev) =>
          prev.map((n) => (n.id === activeNoteId ? { ...n, content, updatedAt: new Date().toISOString() } : n))
        );
        setTimeout(() => setIsSaved(false), 2000);
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [content, activeNoteId, isInitialized]);

  const handleSelectNote = (note: ScratchpadNoteItem) => {
    setActiveNoteId(note.id);
    setContent(note.content);
    setShowNotesDrawer(false);
  };

  const handleCreateNewNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    startTransition(async () => {
      const res = await createScratchpadNoteAction(newTitle.trim(), "");
      if (res.success && res.note) {
        setNotesList((prev) => [res.note!, ...prev]);
        setActiveNoteId(res.note.id);
        setContent(res.note.content);
        setNewTitle("");
        setIsCreatingNew(false);
        setShowNotesDrawer(false);
      }
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    startTransition(async () => {
      await deleteScratchpadNoteAction(noteId);
      setNotesList((prev) => prev.filter((n) => n.id !== noteId));
      if (activeNoteId === noteId) {
        setActiveNoteId("default");
        const defaultNote = notesList.find((n) => n.id === "default");
        setContent(defaultNote?.content || "");
      }
    });
  };

  const handleConvertTasks = () => {
    const lines = content.split("\n");
    const taskLines = lines.filter(
      (l) =>
        l.trim().startsWith("- [ ]") ||
        l.trim().startsWith("-") ||
        l.trim().startsWith("*") ||
        l.trim().startsWith("+")
    );

    if (taskLines.length === 0) return;

    startTransition(async () => {
      await submitBatchCaptureAction(taskLines.join("\n"));
      if (onSuccess) onSuccess();
      onClose();
    });
  };

  const activeNote = notesList.find((n) => n.id === activeNoteId);
  const currentTitle = activeNote?.title || (activeNoteId === "default" ? "Bloc principal" : "Nota");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4EAB9E]/15 text-[#4EAB9E] border border-[#4EAB9E]/30">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                  Scratchpad & Brain Vault (⌘J)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-[#22201D] text-[#D99B43] border border-[#2A2723] font-mono truncate max-w-xs">
                  {currentTitle}
                </span>
              </div>
              <p className="text-xs text-[#8E867B]">
                Bloc de notas con autoguardado en Neon PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notes List / History Toggle */}
            <button
              type="button"
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                showNotesDrawer
                  ? "border-[#D99B43] bg-[#D99B43]/10 text-[#D99B43]"
                  : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Notas guardadas</span>
              <span className="px-1.5 py-0.2 rounded bg-[#181715] text-[10px]">
                {notesList.length}
              </span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-[#2A2723] bg-[#121110] p-0.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  !showPreview
                    ? "bg-[#22201D] text-[#D99B43] font-semibold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  showPreview
                    ? "bg-[#22201D] text-[#D99B43] font-semibold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                Previa
              </button>
            </div>

            <span className="text-[11px] font-mono text-[#8E867B] hidden sm:flex items-center gap-1">
              {isSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#7EA35A]" />
                  <span className="text-[#7EA35A] font-semibold">Guardado</span>
                </>
              ) : isPending ? (
                "Guardando..."
              ) : (
                "Autoguardado activo"
              )}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notes Drawer / Selector */}
        {showNotesDrawer && (
          <div className="mt-3 p-3 rounded-lg border border-[#2A2723] bg-[#121110] animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#2A2723]">
              <span className="text-xs font-semibold text-[#DDD6C9]">Tus notas en la base de datos</span>
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="flex items-center gap-1 text-[11px] text-[#D99B43] hover:underline cursor-pointer font-mono"
                >
                  <Plus className="h-3 w-3" />
                  <span>Crear nueva nota</span>
                </button>
              )}
            </div>

            {isCreatingNew && (
              <form onSubmit={handleCreateNewNote} className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título de la nueva nota..."
                  className="flex-1 bg-[#181715] border border-[#2A2723] rounded-md px-2.5 py-1 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-2.5 py-1 rounded-md bg-[#D99B43] text-[#121110] text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewTitle("");
                  }}
                  className="px-2 py-1 text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {notesList.map((n) => {
                const isCurrent = n.id === activeNoteId;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleSelectNote(n)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isCurrent
                        ? "border-[#D99B43] bg-[#22201D] text-[#F5F2EB]"
                        : "border-[#2A2723] bg-[#181715] text-[#8E867B] hover:border-[#38332D] hover:text-[#DDD6C9]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[#D99B43]" />
                      <span className="truncate font-medium">{n.title}</span>
                    </div>

                    {n.id !== "default" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(n.id);
                        }}
                        className="p-1 text-[#8E867B] hover:text-[#EF4444] transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area: Editor or Markdown Preview */}
        <div className="mt-4">
          {showPreview ? (
            <div className="w-full h-80 overflow-y-auto rounded-lg border border-[#2A2723] bg-[#121110] p-4">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <span className="text-xs text-[#8E867B] italic font-mono">
                  Sin notas escritas aún.
                </span>
              )}
            </div>
          ) : (
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Mis notas del día..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-4 font-mono text-xs leading-relaxed text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
            />
          )}
        </div>

        {/* Quick Task Extraction Helpers */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2A2723]">
          <span className="text-[11px] text-[#8E867B]">
            Tip: Las líneas con `-` o `*` se pueden convertir directamente en tareas.
          </span>

          <button
            type="button"
            onClick={handleConvertTasks}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-semibold text-[#121110] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Convertir líneas a tareas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
