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
  Trash2
} from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";

const SAMPLE_BATCH = `Design Brio system architecture #engineering !urgent // Zero-latency focus
* Morning 20m sprint review #daily
+ Drink 500ml water #health
- Check social media during deep work
Ship Habitica batch sync feature #release // Push to prod`;

export function BatchCaptureInput() {
  const [rawText, setRawText] = useState("");
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [lastResult, setLastResult] = useState<BatchActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live parsed telemetry as the user types
  const liveParsed = useMemo(() => {
    return parseBatchInput(rawText);
  }, [rawText]);

  // Handle Command + Enter / Ctrl + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      }
    });
  };

  const handleInsertSample = () => {
    setRawText(SAMPLE_BATCH);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClear = () => {
    setRawText("");
    setLastResult(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSyntaxInsert = (prefix: string) => {
    setRawText((prev) => {
      const separator = prev.length > 0 && !prev.endsWith("\n") ? "\n" : "";
      return `${prev}${separator}${prefix} `;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <section className="relative rounded-2xl border border-white/8 bg-neutral-900/70 p-4 sm:p-5 backdrop-blur-xl shadow-2xl transition-all">
      {/* Top Bar: Title, Live Syntax Preview, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400">
            <Send className="h-3.5 w-3.5 rotate-45" />
          </div>
          <h2 className="text-sm font-semibold tracking-wide text-white">
            Rapid Batch Capture
          </h2>
          <span className="hidden sm:inline-flex rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
            Zero Latency
          </span>
        </div>

        {/* Live Syntax Counters */}
        <div className="flex items-center gap-2">
          {liveParsed.stats.total > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-neutral-950/80 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
              {liveParsed.stats.todos > 0 && (
                <span className="text-sky-400">
                  {liveParsed.stats.todos} Todo
                  {liveParsed.stats.todos > 1 ? "s" : ""}
                </span>
              )}
              {liveParsed.stats.dailies > 0 && (
                <span className="text-amber-400">
                  {liveParsed.stats.dailies} Daily
                  {liveParsed.stats.dailies > 1 ? "s" : ""}
                </span>
              )}
              {liveParsed.stats.habits > 0 && (
                <span className="text-emerald-400">
                  {liveParsed.stats.habits} Habit
                  {liveParsed.stats.habits > 1 ? "s" : ""}
                </span>
              )}
              {liveParsed.stats.tagsExtracted > 0 && (
                <span className="text-violet-400">
                  #{liveParsed.stats.tagsExtracted}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCheatsheet((prev) => !prev)}
            aria-label="Toggle syntax guide"
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-neutral-800/80 px-2 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
          >
            <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Syntax</span>
          </button>
        </div>
      </div>

      {/* Expandable Quick Syntax Pill Bar */}
      {showCheatsheet && (
        <div className="mb-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs text-neutral-300 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between pb-2 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
            <span>Frictionless Syntax Rules</span>
            <span className="text-[10px] text-neutral-400">Click to insert</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => handleSyntaxInsert("")}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-900/90 px-2.5 py-1.5 text-left text-neutral-300 hover:border-sky-500/40 hover:text-sky-300"
            >
              <span className="font-mono text-sky-400">Standard</span>
              <span className="text-[11px] text-neutral-400">Todo</span>
            </button>
            <button
              onClick={() => handleSyntaxInsert("*")}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-900/90 px-2.5 py-1.5 text-left text-neutral-300 hover:border-amber-500/40 hover:text-amber-300"
            >
              <span className="font-mono text-amber-400">* Daily</span>
              <span className="text-[11px] text-neutral-400">Recurring</span>
            </button>
            <button
              onClick={() => handleSyntaxInsert("+")}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-900/90 px-2.5 py-1.5 text-left text-neutral-300 hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <span className="font-mono text-emerald-400">+ / - Habit</span>
              <span className="text-[11px] text-neutral-400">Up/Down</span>
            </button>
            <button
              onClick={() => handleSyntaxInsert("#work // Note")}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-neutral-900/90 px-2.5 py-1.5 text-left text-neutral-300 hover:border-violet-500/40 hover:text-violet-300"
            >
              <span className="font-mono text-violet-400">#tag // note</span>
              <span className="text-[11px] text-neutral-400">Tags & Notes</span>
            </button>
          </div>
        </div>
      )}

      {/* Multiline Input Area */}
      <div className="relative rounded-xl border border-white/10 bg-neutral-950/80 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
        <textarea
          ref={textareaRef}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type or paste tasks line by line...\nExample:\nReview sprint tasks #work !urgent\n* 30m reading #growth\n+ Hydration 500ml\nDeploy hotfix // Check bug #104`}
          rows={5}
          className="w-full resize-y bg-transparent p-3.5 font-mono text-sm leading-relaxed text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
        />

        {/* Action Toolbar Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/6 bg-neutral-900/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsertSample}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Sample Batch</span>
            </button>
            {rawText && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-rose-400"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard shortcut hint */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
              <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                Enter
              </kbd>
            </div>

            {/* Dispatch Button */}
            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={!rawText.trim() || isPending}
              className="flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
                    Batch Capture{" "}
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

      {/* Result / Telemetry Toast Banner */}
      {lastResult && (
        <div
          className={`mt-3 flex items-start gap-3 rounded-xl border p-3 text-xs backdrop-blur-md transition-all ${lastResult.success
            ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
            : "border-rose-500/30 bg-rose-950/20 text-rose-300"
            }`}
        >
          {lastResult.success ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between font-semibold">
              <span>{lastResult.summary}</span>
              {lastResult.isDemo && (
                <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-amber-300">
                  Demo Mode
                </span>
              )}
            </div>
            {lastResult.errors && lastResult.errors.length > 0 && (
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] opacity-90">
                {lastResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
