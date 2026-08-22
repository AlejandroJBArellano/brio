"use client";

import { saveScratchpadAction } from "@/app/actions/projects";
import { submitBatchCaptureAction } from "@/app/actions/tasks";
import { Check, Edit3, X, Zap } from "lucide-react";
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
  initialContent,
  onSuccess,
}: ScratchpadModalProps) {
  if (!isOpen) return null;

  return (
    <ScratchpadModalContent
      key={initialContent}
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
  const [isSaved, setIsSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Debounced auto-save to Neon DB
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        await saveScratchpadAction(content);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [content]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Scratchpad & Brain Vault (⌘J)
              </h3>
              <p className="text-xs text-neutral-400">
                Bloc de notas rápido con autoguardado en Neon PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
              {isSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Guardado</span>
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
              className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="mt-4">
          <textarea
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Mis notas del día..."
            className="w-full rounded-2xl border border-white/8 bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-200 placeholder:text-neutral-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Quick Task Extraction Helpers */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/6">
          <span className="text-[11px] text-neutral-500">
            Tip: Escribe tus notas libremente. Las líneas con `-` o `*` se pueden convertir en tareas.
          </span>

          <button
            type="button"
            onClick={handleConvertTasks}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 transition-all"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Convertir líneas a Habitica</span>
          </button>
        </div>
      </div>
    </div>
  );
}
