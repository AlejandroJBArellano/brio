"use client";

import { submitBatchCaptureAction } from "@/app/actions/tasks";
import { parseBatchInput } from "@/lib/parser";
import { BatchActionResult } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
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

const SAMPLE_BATCH = `Design Brio system architecture #engineering !urgent // Zero-latency focus
* Morning 20m sprint review #daily
+ Drink 500ml water #health
- Check social media during deep work
Ship Habitica batch sync feature #release // Push to prod`;

export function BatchCaptureModal({
  isOpen,
  onClose,
}: BatchCaptureModalProps) {
  const [rawText, setRawText] = useState("");
  const [showCheatsheet, setShowCheatsheet] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Send className="h-4 w-4 rotate-45" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Frictionless Batch Capture
              </h3>
              <p className="text-[11px] text-neutral-400">
                Type or paste multiple tasks and dispatch them concurrently
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Quick Syntax Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                type="button"
                onClick={() => handleSyntaxInsert("")}
                className="rounded-md border border-white/5 bg-neutral-800/80 px-2 py-1 text-neutral-300 hover:text-sky-300 hover:border-sky-500/40"
              >
                <span className="text-sky-400">Todo</span> Standard
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("*")}
                className="rounded-md border border-white/5 bg-neutral-800/80 px-2 py-1 text-neutral-300 hover:text-amber-300 hover:border-amber-500/40"
              >
                <span className="text-amber-400">* Daily</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("+")}
                className="rounded-md border border-white/5 bg-neutral-800/80 px-2 py-1 text-neutral-300 hover:text-emerald-300 hover:border-emerald-500/40"
              >
                <span className="text-emerald-400">+ Habit</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("-")}
                className="rounded-md border border-white/5 bg-neutral-800/80 px-2 py-1 text-neutral-300 hover:text-rose-300 hover:border-rose-500/40"
              >
                <span className="text-rose-400">- Habit</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyntaxInsert("#work // Note !urgent")}
                className="rounded-md border border-white/5 bg-neutral-800/80 px-2 py-1 text-neutral-300 hover:text-violet-300 hover:border-violet-500/40"
              >
                <span className="text-violet-400">#tags //notes !priority</span>
              </button>
            </div>

            {liveParsed.stats.total > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                <span>
                  {liveParsed.stats.total} parsed (
                  {liveParsed.stats.todos}t, {liveParsed.stats.dailies}d,{" "}
                  {liveParsed.stats.habits}h)
                </span>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="relative rounded-xl border border-white/10 bg-neutral-950/80 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onKeyDown={handleKeyDownInTextarea}
              placeholder={`Buy groceries #errands\n* Morning 30m reading #growth\n+ Hydration 2L\nDeploy hotfix !urgent // Review logs first`}
              rows={7}
              className="w-full resize-none bg-transparent p-3.5 font-mono text-sm leading-relaxed text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>

          {/* Result Alert */}
          {lastResult && (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs backdrop-blur-md transition-all ${
                lastResult.success
                  ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                  : "border-rose-500/30 bg-rose-950/30 text-rose-300"
              }`}
            >
              {lastResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
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
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-neutral-950/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsertSample}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Sample Batch</span>
            </button>
            {rawText && (
              <button
                type="button"
                onClick={() => setRawText("")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 hover:text-rose-400"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
              <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-[10px]">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-[10px]">
                Enter
              </kbd>
            </div>

            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={!rawText.trim() || isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    Batch Dispatch{" "}
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
