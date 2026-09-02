"use client";

import { ExternalLink, Maximize2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface NoteContentRendererProps {
  content: string;
  className?: string;
  maxTextLines?: number;
}

interface ParsedNote {
  cleanText: string;
  images: Array<{ alt: string; url: string }>;
}

/**
 * Extracts markdown images ![alt](url) and bare image URLs from content.
 */
function parseNoteContent(rawContent: string): ParsedNote {
  const images: Array<{ alt: string; url: string }> = [];
  
  // 1. Match markdown images: ![alt](url)
  const mdImgRegex = /!\[(.*?)\]\((.*?)\)/g;
  let text = rawContent.replace(mdImgRegex, (_, alt, url) => {
    images.push({ alt: alt || "Captura adjunta", url: url.trim() });
    return ""; // Strip image from plain text
  });

  // 2. Match standalone image URLs (including /api/vault/file?key=...)
  const urlRegex = /(https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.webp|\.gif)[^\s]*|\/api\/vault\/file\?[^\s]+)/gi;
  text = text.replace(urlRegex, (url) => {
    // Avoid re-adding if already extracted
    if (!images.some((img) => img.url === url)) {
      images.push({ alt: "Imagen adjunta", url: url.trim() });
    }
    return "";
  });

  return {
    cleanText: text.trim(),
    images,
  };
}

export function NoteContentRenderer({
  content,
  className = "",
  maxTextLines,
}: NoteContentRendererProps) {
  const [activeImageModal, setActiveImageModal] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const { cleanText, images } = useMemo(() => parseNoteContent(content), [content]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!activeImageModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveImageModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageModal]);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Plain Text Body */}
      {cleanText && (
        <p
          className={`text-xs text-[#DDD6C9] whitespace-pre-wrap leading-relaxed font-sans ${
            maxTextLines ? `line-clamp-${maxTextLines}` : ""
          }`}
        >
          {cleanText}
        </p>
      )}

      {/* Image Gallery / Thumbnails */}
      {images.length > 0 && (
        <div
          className={`grid gap-2 pt-1 ${
            images.length === 1
              ? "grid-cols-1"
              : images.length === 2
              ? "grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageModal(img);
              }}
              className="group relative rounded-lg overflow-hidden border border-[#2A2723] bg-[#121110] hover:border-[#D99B43]/60 transition-all cursor-zoom-in max-h-44 sm:max-h-48 flex items-center justify-center shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-[#F5F2EB] font-mono">
                <Maximize2 className="h-3.5 w-3.5 text-[#D99B43]" />
                <span className="text-[10px] font-bold">Ampliar</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-150"
          onClick={() => setActiveImageModal(null)}
        >
          <div
            className="relative max-w-[92vw] max-h-[90vh] flex flex-col items-center gap-3 bg-[#181715] border border-[#2A2723] rounded-2xl p-3 sm:p-4 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between gap-4 px-1">
              <span className="font-mono text-xs text-[#8E867B] truncate max-w-sm">
                {activeImageModal.alt}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activeImageModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#D99B43] hover:bg-[#22201D] transition-colors"
                  title="Abrir original en pestaña nueva"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setActiveImageModal(null)}
                  className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* High-res Image display */}
            <div className="overflow-auto max-h-[80vh] rounded-xl flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImageModal.url}
                alt={activeImageModal.alt}
                className="max-w-full max-h-[78vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
