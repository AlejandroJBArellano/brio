"use client";

import { submitBatchCaptureAction } from "@/app/actions/tasks";
import { parseBatchInput } from "@/lib/parser";
import { BatchActionResult } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle2,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

interface BatchCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_BATCH = `Diseñar arquitectura de Brio #ingenieria !urgente // Máximo enfoque
* Revisión de sprint 20m #daily
+ Tomar 500ml de agua #salud
- Distraerme en redes sociales durante deep work
Publicar versión de Brio #release // Desplegar a producción`;

export function BatchCaptureModal({
  isOpen,
  onClose,
}: BatchCaptureModalProps) {
  const [rawText, setRawText] = useState("");
  const [_showCheatsheet, _setShowCheatsheet] = useState(false);
  const [lastResult, setLastResult] = useState<BatchActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const liveParsed = useMemo(() => {
    return parseBatchInput(rawText);
  }, [rawText]);

  const handleKeyDownInTextarea = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleBatchSubmit();
    }
  };

  const handleBatchSubmit = () => {
    if (!rawText.trim() || isPending) return;

    startTransition(async () => {
      const result = await submitBatchCaptureAction(rawText);
      setLastResult(result);
      if (result.success) {
        setRawText("");
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    });
  };

  const handleInsertSample = () => {
    setRawText(SAMPLE_BATCH);
    textareaRef.current?.focus();
  };

  const handleSyntaxInsert = (prefix: string) => {
    setRawText((prev) => {
      const separator = prev.length > 0 && !prev.endsWith("\n") ? "\n" : "";
      return `${prev}${separator}${prefix} `;
    });
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs bg-black/80 animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2723] px-4 py-3 bg-[#121110]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Send className="h-4 w-4 rotate-45" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-semibold text-[#F5F2EB]">
                Captura Rápida en Lote
              </h3>
              <p className="text-[11px] text-[#8E867B]">
                Escribe o pega múltiples tareas y envíalas simultáneamente a Habitica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-lg p-1 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 font-mono">
          {/* Quick Syntax Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                type="button"
                onClick={() => handleSyntaxInsert("")}
                className="rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-[#DDD6C9] hover:text-[#4EAB9E] hover:border-[#4EAB9E]/40 cursor-pointer"
              >
                <span className="text-[#4EAB9E]">To-Do</span> Estándar
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("*")}
                className="rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-[#DDD6C9] hover:text-[#D99B43] hover:border-[#D99B43]/40 cursor-pointer"
              >
                <span className="text-[#D99B43]">* Daily</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("+")}
                className="rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-[#DDD6C9] hover:text-[#7EA35A] hover:border-[#7EA35A]/40 cursor-pointer"
              >
                <span className="text-[#7EA35A]">+ Hábito</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("-")}
                className="rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-[#DDD6C9] hover:text-[#E05D52] hover:border-[#E05D52]/40 cursor-pointer"
              >
                <span className="text-[#E05D52]">- Hábito</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("#trabajo // Nota !urgente")}
                className="rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-[#DDD6C9] hover:text-[#D99B43] hover:border-[#D99B43]/40 cursor-pointer"
              >
                <span className="text-[#D99B43]">#tags //notas !prioridad</span>
              </button>
            </div>

            {liveParsed.stats.total > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-[#8E867B]">
                <span>
                  {liveParsed.stats.total} detectadas (
                  {liveParsed.stats.todos} to-dos, {liveParsed.stats.dailies} dailies,{" "}
                  {liveParsed.stats.habits} hábitos)
                </span>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="relative rounded-lg border border-[#2A2723] bg-[#121110] focus-within:border-[#D99B43] transition-all">
            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onKeyDown={handleKeyDownInTextarea}
              placeholder={`Comprar despensa #casa\n* Lectura matutina 30m #estudio\n+ Tomar 2L de agua #salud\nDeploy hotfix !urgente // Revisar logs primero`}
              rows={7}
              className="w-full resize-none bg-transparent p-3.5 font-mono text-sm leading-relaxed text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none"
            />
          </div>

          {/* Result Alert */}
          {lastResult && (
            <div
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs transition-all ${
                lastResult.success
                  ? "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]"
                  : "border-[#E05D52]/30 bg-[#2A1715] text-[#E05D52]"
              }`}
            >
              {lastResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7EA35A] mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-[#E05D52] mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{lastResult.summary}</span>
                {lastResult.errors && lastResult.errors.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-[11px]">
                    {lastResult.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#2A2723] bg-[#121110] px-4 py-3 font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsertSample}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#D99B43]" />
              <span>Cargar Ejemplo</span>
            </button>
            {rawText && (
              <button
                type="button"
                onClick={() => setRawText("")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#8E867B] hover:text-[#E05D52] cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8E867B] font-mono">
              <kbd className="rounded border border-[#2A2723] bg-[#181715] px-1 py-0.5 text-[10px]">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="rounded border border-[#2A2723] bg-[#181715] px-1 py-0.5 text-[10px]">
                Enter
              </kbd>
            </div>

            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={!rawText.trim() || isPending}
              className="flex items-center gap-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] px-4 py-2 text-xs font-bold text-[#121110] shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer font-sans"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#121110] border-t-transparent" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    Enviar Tareas{" "}
                    {liveParsed.stats.total > 0
                      ? `(${liveParsed.stats.total})`
                      : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
