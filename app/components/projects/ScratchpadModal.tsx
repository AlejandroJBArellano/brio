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
  const [isSaved, setIsSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isInitialized, setIsInitialized] = useState(Boolean(initialContent));

  // Fetch latest content from database on mount if initialContent was empty
  useEffect(() => {
    let isMounted = true;
    async function loadLatest() {
      try {
        const { fetchProjectsDashboardDataAction } = await import("@/app/actions/projects");
        const data = await fetchProjectsDashboardDataAction();
        if (isMounted && data.scratchpadContent) {
          setContent(data.scratchpadContent);
        }
      } catch (err) {
        console.error("Failed to load scratchpad", err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    }
    loadLatest();
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced auto-save to Neon DB (only after initialized and content changes)
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        await saveScratchpadAction(content);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [content, isInitialized]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4EAB9E]/15 text-[#4EAB9E] border border-[#4EAB9E]/30">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Scratchpad & Brain Vault (⌘J)
              </h3>
              <p className="text-xs text-[#8E867B]">
                Bloc de notas rápido con autoguardado en Neon PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#8E867B] flex items-center gap-1">
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
              className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors"
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
            className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-4 font-mono text-xs leading-relaxed text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
          />
        </div>

        {/* Quick Task Extraction Helpers */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2A2723]">
          <span className="text-[11px] text-[#8E867B]">
            Tip: Escribe tus notas libremente. Las líneas con `-` o `*` se pueden convertir en tareas.
          </span>

          <button
            type="button"
            onClick={handleConvertTasks}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-semibold text-[#121110] transition-all shadow-xs disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Convertir líneas a Habitica</span>
          </button>
        </div>
      </div>
    </div>
  );
}
