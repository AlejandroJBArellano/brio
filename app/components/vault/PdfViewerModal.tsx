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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className={`flex flex-col rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full max-w-5xl h-[88vh]"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2A2723] bg-[#121110]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB] truncate">
                {title}
              </h3>
              {authorOrCreator && (
                <p className="text-xs text-[#8E867B] truncate">
                  {authorOrCreator}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 font-mono">
            <a
              href={
                fileUrl.includes("/api/vault/file")
                  ? `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}download=true`
                  : fileUrl
              }
              download={fileName || title}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181715] hover:bg-[#22201D] border border-[#2A2723] text-xs font-semibold text-[#DDD6C9] hover:text-[#F5F2EB] transition-all cursor-pointer"
              title="Descargar archivo"
            >
              <Download className="h-3.5 w-3.5 text-[#D99B43]" />
              <span className="hidden sm:inline">Descargar</span>
            </a>

            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] border border-[#2A2723] transition-all"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] border border-[#2A2723] transition-all cursor-pointer"
              title={isFullscreen ? "Restaurar" : "Pantalla completa"}
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] border border-[#2A2723] transition-all ml-1 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Embedded View */}
        <div className="flex-1 w-full bg-[#121110] relative">
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
