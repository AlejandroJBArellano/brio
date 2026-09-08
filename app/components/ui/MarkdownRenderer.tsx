"use client";

import {
  Check,
  Copy,
  ExternalLink,
  FileCode,
  Maximize2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  maxTextLines?: number;
}

// ----------------------------------------------------------------------
// AST / Token Types
// ----------------------------------------------------------------------

type BlockToken =
  | { type: "heading"; level: number; content: string }
  | { type: "code"; language: string; code: string }
  | { type: "blockquote"; content: string }
  | { type: "hr" }
  | {
      type: "task_item";
      checked: boolean;
      content: string;
      indent: number;
    }
  | { type: "ul_item"; content: string; indent: number }
  | {
      type: "ol_item";
      number: string;
      content: string;
      indent: number;
    }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; alt: string; url: string }
  | { type: "paragraph"; content: string }
  | { type: "spacer" };

// ----------------------------------------------------------------------
// Block Parser
// ----------------------------------------------------------------------

function parseMarkdownBlocks(raw: string): BlockToken[] {
  const lines = raw.split(/\r?\n/);
  const blocks: BlockToken[] = [];

  let inCode = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Code Block Fence
    const codeFenceMatch = line.match(/^(?:```|~~~)([a-zA-Z0-9_-]*)\s*$/);
    if (codeFenceMatch) {
      if (!inCode) {
        inCode = true;
        codeLang = codeFenceMatch[1] || "";
        codeBuffer = [];
      } else {
        inCode = false;
        blocks.push({
          type: "code",
          language: codeLang,
          code: codeBuffer.join("\n"),
        });
        codeBuffer = [];
        codeLang = "";
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Empty line / Spacer
    if (!line.trim()) {
      // Avoid duplicate consecutive spacers
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== "spacer") {
        blocks.push({ type: "spacer" });
      }
      continue;
    }

    // 3. Headings (# H1 to ###### H6)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });
      continue;
    }

    // 4. Horizontal Rule (---, ***, ___)
    if (/^(?:---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      continue;
    }

    // 5. Blockquote (> ...)
    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.type === "blockquote") {
        lastBlock.content += "\n" + bqMatch[1];
      } else {
        blocks.push({ type: "blockquote", content: bqMatch[1] });
      }
      continue;
    }

    // 6. Checklist Item (- [ ] or - [x])
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      blocks.push({
        type: "task_item",
        indent: Math.min(Math.floor(taskMatch[1].length / 2), 4),
        checked: taskMatch[2].toLowerCase() === "x",
        content: taskMatch[3].trim(),
      });
      continue;
    }

    // 7. Unordered List Item (* or - or +)
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ulMatch) {
      blocks.push({
        type: "ul_item",
        indent: Math.min(Math.floor(ulMatch[1].length / 2), 4),
        content: ulMatch[2].trim(),
      });
      continue;
    }

    // 8. Ordered List Item (1. ...)
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      blocks.push({
        type: "ol_item",
        indent: Math.min(Math.floor(olMatch[1].length / 2), 4),
        number: olMatch[2],
        content: olMatch[3].trim(),
      });
      continue;
    }

    // 9. Standalone Image (![alt](url)) or bare image URL
    const standaloneImgMatch = line.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
    if (standaloneImgMatch) {
      blocks.push({
        type: "image",
        alt: standaloneImgMatch[1] || "Imagen",
        url: standaloneImgMatch[2].trim(),
      });
      continue;
    }

    // 9b. Bare image URL (including /api/vault/file?...)
    const bareImgMatch = line.match(
      /^(https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.webp|\.gif)[^\s]*|\/api\/vault\/file\?[^\s]+)$/i
    );
    if (bareImgMatch) {
      blocks.push({
        type: "image",
        alt: "Imagen adjunta",
        url: bareImgMatch[1].trim(),
      });
      continue;
    }

    // 10. Table (simple detection of | col | col | followed by separator)
    if (line.includes("|") && line.trim().startsWith("|") && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (/^\|?(\s*:?-+:?\s*\|)+\s*$/.test(nextLine)) {
        const parseRow = (r: string) =>
          r
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());

        const headers = parseRow(line);
        const rows: string[][] = [];
        i += 1; // skip separator

        while (i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].trim().startsWith("|")) {
          i += 1;
          rows.push(parseRow(lines[i]));
        }

        blocks.push({ type: "table", headers, rows });
        continue;
      }
    }

    // 11. Regular paragraph line
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock && lastBlock.type === "paragraph") {
      lastBlock.content += "\n" + line;
    } else {
      blocks.push({ type: "paragraph", content: line });
    }
  }

  // Handle unclosed code fence
  if (inCode) {
    blocks.push({
      type: "code",
      language: codeLang,
      code: codeBuffer.join("\n"),
    });
  }

  return blocks;
}

// ----------------------------------------------------------------------
// Inline Parser & Sub-components
// ----------------------------------------------------------------------

interface InlineParserOptions {
  onImageClick?: (img: { alt: string; url: string }) => void;
  onCopyPath?: (path: string) => void;
}

function renderInlineMarkdown(
  text: string,
  options?: InlineParserOptions
): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1. Images: ![alt](url)
  // 2. Links: [label](url) - label can contain inline code `code`
  // 3. Inline code: `code`
  // 4. Bold + Italic: ***text***
  // 5. Bold: **text** or __text__
  // 6. Italic: *text* or _text_
  // 7. Strikethrough: ~~text~~
  const TOKEN_REGEX =
    /(!\[(?:[^\]]*)\]\([^)]+\)|\[(?:[^\[\]]|`[^`]*`)+\]\([^)]+\)|`[^`]+`|\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*\n]+?\*|~~[^~]+?~~)/g;

  const parts = text.split(TOKEN_REGEX);
  const elements: React.ReactNode[] = [];

  parts.forEach((part, idx) => {
    if (!part) return;

    // 1. Markdown Image ![alt](url)
    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1] || "Imagen";
      const url = imgMatch[2].trim();
      elements.push(
        <button
          key={idx}
          type="button"
          onClick={() => options?.onImageClick?.({ alt, url })}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-md border border-[#2A2723] bg-[#181715] hover:border-[#D99B43] text-xs font-mono text-[#D99B43] transition-colors cursor-zoom-in group"
        >
          <Maximize2 className="h-3 w-3 group-hover:scale-110 transition-transform" />
          <span className="truncate max-w-50">{alt}</span>
        </button>
      );
      return;
    }

    // 2. Link [label](url)
    const linkMatch = part.match(/^\[((?:[^\[\]]|`[^`]*`)+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2].trim();

      // Check if it's a local file URI (file:///...)
      if (url.startsWith("file://")) {
        elements.push(
          <FileLinkItem
            key={idx}
            url={url}
            onCopyPath={options?.onCopyPath}
          >
            {renderInlineMarkdown(label, options)}
          </FileLinkItem>
        );
        return;
      }

      // External link
      elements.push(
        <a
          key={idx}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#4EAB9E] hover:text-[#68C4B8] hover:underline underline-offset-2 break-all transition-colors inline-flex items-center gap-0.5"
        >
          <span>{renderInlineMarkdown(label, options)}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      );
      return;
    }

    // 3. Inline Code `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      elements.push(
        <code
          key={idx}
          className="rounded bg-[#22201D] px-1.5 py-0.5 text-[11px] font-mono text-[#E5D7AB] border border-[#2A2723] select-all"
        >
          {part.slice(1, -1)}
        </code>
      );
      return;
    }

    // 4. Bold + Italic ***text***
    if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
      elements.push(
        <strong key={idx} className="font-bold text-[#F5F2EB]">
          <em className="italic">{part.slice(3, -3)}</em>
        </strong>
      );
      return;
    }

    // 5. Bold **text** or __text__
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      elements.push(
        <strong key={idx} className="font-bold text-[#F5F2EB]">
          {renderInlineMarkdown(part.slice(2, -2), options)}
        </strong>
      );
      return;
    }

    // 6. Italic *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      elements.push(
        <em key={idx} className="italic text-[#E5D7AB]">
          {renderInlineMarkdown(part.slice(1, -1), options)}
        </em>
      );
      return;
    }

    // 7. Strikethrough ~~text~~
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      elements.push(
        <del key={idx} className="line-through text-[#8E867B]">
          {renderInlineMarkdown(part.slice(2, -2), options)}
        </del>
      );
      return;
    }

    // Plain text
    elements.push(<React.Fragment key={idx}>{part}</React.Fragment>);
  });

  return elements;
}

// ----------------------------------------------------------------------
// Sub-components: Code Block, File Link, Image Lightbox
// ----------------------------------------------------------------------

function CodeBlockItem({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2.5 rounded-xl border border-[#2A2723] bg-[#0E0D0C] overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141312] border-b border-[#2A2723] text-[10px] font-mono text-[#8E867B]">
        <span className="uppercase tracking-wider font-semibold text-[#8E867B]">
          {language || "código"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[#8E867B] hover:text-[#F5F2EB] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[#7EA35A]" />
              <span className="text-[#7EA35A]">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono leading-relaxed text-[#DDD6C9] overflow-x-auto selection:bg-[#D99B43]/30">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FileLinkItem({
  url,
  children,
  onCopyPath,
}: {
  url: string;
  children: React.ReactNode;
  onCopyPath?: (path: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const rawPath = url.replace(/^file:\/\//, "");

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(rawPath);
    setCopied(true);
    if (onCopyPath) onCopyPath(rawPath);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      onClick={handleCopy}
      title={`Copiar ruta: ${rawPath}`}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-md bg-[#181715] hover:bg-[#22201D] border border-[#2A2723] hover:border-[#4EAB9E]/50 text-[#4EAB9E] cursor-pointer transition-colors text-xs font-mono group"
    >
      <FileCode className="h-3.5 w-3.5 shrink-0 text-[#4EAB9E]" />
      <span className="truncate max-w-xs">{children}</span>
      {copied ? (
        <span className="text-[10px] text-[#7EA35A] font-sans font-semibold">
          Copiado
        </span>
      ) : (
        <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-70 shrink-0 text-[#8E867B]" />
      )}
    </span>
  );
}

// ----------------------------------------------------------------------
// Main MarkdownRenderer Component
// ----------------------------------------------------------------------

export function MarkdownRenderer({
  content,
  className = "",
  maxTextLines,
}: MarkdownRendererProps) {
  const [activeImageModal, setActiveImageModal] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  // Close lightbox on ESC
  useEffect(() => {
    if (!activeImageModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveImageModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageModal]);

  const blocks = useMemo(() => parseMarkdownBlocks(content || ""), [content]);

  const inlineOptions: InlineParserOptions = useMemo(
    () => ({
      onImageClick: (img) => setActiveImageModal(img),
    }),
    []
  );

  return (
    <div
      className={`space-y-2 text-xs leading-relaxed text-[#DDD6C9] ${
        maxTextLines ? `line-clamp-${maxTextLines}` : ""
      } ${className}`}
    >
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading": {
            const inlineHeading = renderInlineMarkdown(block.content, inlineOptions);
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB] tracking-tight pb-1.5 mb-2 mt-3.5 border-b border-[#2A2723] first:mt-0"
                >
                  {inlineHeading}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB] tracking-tight pb-1 mb-1.5 mt-3 border-b border-[#2A2723]/60 first:mt-0"
                >
                  {inlineHeading}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3
                  key={idx}
                  className="font-sans text-xs sm:text-sm font-semibold text-[#F5F2EB] mb-1 mt-2.5 first:mt-0"
                >
                  {inlineHeading}
                </h3>
              );
            }
            return (
              <h4
                key={idx}
                className="font-mono text-[11px] font-semibold text-[#D99B43] uppercase tracking-wider mb-0.5 mt-2 first:mt-0"
              >
                {inlineHeading}
              </h4>
            );
          }

          case "code":
            return (
              <CodeBlockItem
                key={idx}
                language={block.language}
                code={block.code}
              />
            );

          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-[#D99B43] bg-[#181715]/70 px-3 py-2 my-2 rounded-r text-xs text-[#DDD6C9] leading-relaxed italic"
              >
                {renderInlineMarkdown(block.content, inlineOptions)}
              </blockquote>
            );

          case "hr":
            return <hr key={idx} className="border-t border-[#2A2723] my-2.5" />;

          case "task_item":
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 py-0.5 text-xs ${
                  block.indent > 0 ? "ml-4" : ""
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 transition-colors ${
                    block.checked
                      ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                      : "border-[#38332D] bg-[#141312]"
                  }`}
                >
                  {block.checked && <Check className="h-3 w-3 stroke-3" />}
                </div>
                <div
                  className={`flex-1 ${
                    block.checked ? "line-through text-[#8E867B]" : "text-[#DDD6C9]"
                  }`}
                >
                  {renderInlineMarkdown(block.content, inlineOptions)}
                </div>
              </div>
            );

          case "ul_item":
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 py-0.5 text-xs ${
                  block.indent > 0 ? "ml-4" : ""
                }`}
              >
                <span className="text-[#D99B43] shrink-0 text-sm leading-none select-none mt-1">
                  •
                </span>
                <div className="flex-1">
                  {renderInlineMarkdown(block.content, inlineOptions)}
                </div>
              </div>
            );

          case "ol_item":
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 py-0.5 text-xs ${
                  block.indent > 0 ? "ml-4" : ""
                }`}
              >
                <span className="font-mono text-[11px] font-semibold text-[#D99B43] shrink-0 select-none min-w-4">
                  {block.number}.
                </span>
                <div className="flex-1">
                  {renderInlineMarkdown(block.content, inlineOptions)}
                </div>
              </div>
            );

          case "table":
            return (
              <div
                key={idx}
                className="my-2.5 overflow-x-auto rounded-lg border border-[#2A2723]"
              >
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141312] border-b border-[#2A2723] text-[#F5F2EB] font-mono text-[11px]">
                    <tr>
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-2 font-semibold">
                          {renderInlineMarkdown(h, inlineOptions)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2723] bg-[#121110] text-[#DDD6C9]">
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-[#181715]/60 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2">
                            {renderInlineMarkdown(cell, inlineOptions)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "image":
            return (
              <div
                key={idx}
                onClick={() =>
                  setActiveImageModal({ alt: block.alt, url: block.url })
                }
                className="group relative rounded-xl overflow-hidden border border-[#2A2723] bg-[#121110] hover:border-[#D99B43]/60 transition-all cursor-zoom-in my-2 max-h-56 sm:max-h-64 flex items-center justify-center shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.alt}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs text-[#F5F2EB] font-mono">
                  <Maximize2 className="h-4 w-4 text-[#D99B43]" />
                  <span className="text-[11px] font-bold">Ampliar</span>
                </div>
              </div>
            );

          case "paragraph":
            return (
              <p key={idx} className="whitespace-pre-wrap leading-relaxed">
                {renderInlineMarkdown(block.content, inlineOptions)}
              </p>
            );

          case "spacer":
            return <div key={idx} className="h-1.5" />;

          default:
            return null;
        }
      })}

      {/* Lightbox / Image Zoom Modal */}
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
                  title="Abrir original"
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
