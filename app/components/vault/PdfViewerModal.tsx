"use client";

import { Download, ExternalLink, FileText, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  authorOrCreator?: string;
  fileUrl: string;
  fileName?: string;
}

export function PdfViewerModal({
  isOpen,
  onClose,
  title,
  authorOrCreator,
  fileUrl,
  fileName,
}: PdfViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`flex flex-col rounded-3xl border border-white/[0.12] bg-neutral-900 shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full max-w-5xl h-[88vh]"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-neutral-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {title}
              </h3>
              {authorOrCreator && (
                <p className="text-xs text-neutral-400 truncate">
                  {authorOrCreator}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={
                fileUrl.includes("/api/vault/file")
                  ? `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}download=true`
                  : fileUrl
              }
              download={fileName || title}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-200 transition-all cursor-pointer"
              title="Descargar archivo"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all"
              title={isFullscreen ? "Restaurar" : "Pantalla completa"}
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Embedded View */}
        <div className="flex-1 w-full bg-neutral-950 relative">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0`}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
