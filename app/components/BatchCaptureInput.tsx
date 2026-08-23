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
    <section className="relative rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm transition-all font-sans">
      {/* Top Bar: Title, Live Syntax Preview, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
            <Send className="h-3.5 w-3.5 rotate-45" />
          </div>
          <h2 className="font-serif text-sm font-semibold tracking-wide text-[#F5F2EB]">
            Rapid Batch Capture
          </h2>
          <span className="hidden sm:inline-flex rounded bg-[#121110] border border-[#2A2723] px-2 py-0.5 text-[10px] font-mono text-[#8E867B]">
            Zero Latency
          </span>
        </div>

        {/* Live Syntax Counters */}
        <div className="flex items-center gap-2 font-mono">
          {liveParsed.stats.total > 0 && (
            <div className="flex items-center gap-1.5 rounded-md border border-[#2A2723] bg-[#121110] px-2.5 py-1 text-[11px] font-medium text-[#DDD6C9]">
              {liveParsed.stats.todos > 0 && (
                <span className="text-[#4EAB9E]">
                  {liveParsed.stats.todos} Todo
                  {liveParsed.stats.todos > 1 ? "s" : ""}
                </span>
              )}
              {liveParsed.stats.dailies > 0 && (
                <span className="text-[#D99B43]">
                  {liveParsed.stats.dailies} Daily
                  {liveParsed.stats.dailies > 1 ? "s" : ""}
                </span>
              )}
              {liveParsed.stats.habits > 0 && (
                <span className="text-[#7EA35A]">
                  {liveParsed.stats.habits} Habit
                  {liveParsed.stats.habits > 1 ? "s" : ""}
                </span>
              )}
              {liveParsed.stats.tagsExtracted > 0 && (
                <span className="text-[#D99B43]">
                  #{liveParsed.stats.tagsExtracted}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCheatsheet((prev) => !prev)}
            aria-label="Toggle syntax guide"
            className="flex items-center gap-1 rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-xs text-[#DDD6C9] transition-colors hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
          >
            <HelpCircle className="h-3.5 w-3.5 text-[#D99B43]" />
            <span className="hidden sm:inline">Syntax</span>
          </button>
        </div>
      </div>

      {/* Expandable Quick Syntax Pill Bar */}
      {showCheatsheet && (
        <div className="mb-3 rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-xs text-[#DDD6C9] animate-in fade-in slide-in-from-top-1 duration-200 font-mono">
          <div className="flex items-center justify-between pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#D99B43]">
            <span>Frictionless Syntax Rules</span>
            <span className="text-[10px] text-[#8E867B]">Click to insert</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => handleSyntaxInsert("")}
              className="flex items-center justify-between rounded-md border border-[#2A2723] bg-[#181715] px-2.5 py-1.5 text-left text-[#DDD6C9] hover:border-[#4EAB9E]/40 hover:text-[#4EAB9E] cursor-pointer"
            >
              <span className="font-mono text-[#4EAB9E]">Standard</span>
              <span className="text-[11px] text-[#8E867B]">Todo</span>
            </button>
            <button
              onClick={() => handleSyntaxInsert("*")}
              className="flex items-center justify-between rounded-md border border-[#2A2723] bg-[#181715] px-2.5 py-1.5 text-left text-[#DDD6C9] hover:border-[#D99B43]/40 hover:text-[#D99B43] cursor-pointer"
            >
              <span className="font-mono text-[#D99B43]">* Daily</span>
              <span className="text-[11px] text-[#8E867B]">Recurring</span>
            </button>
            <button
              onClick={() => handleSyntaxInsert("+")}
              className="flex items-center justify-between rounded-md border border-[#2A2723] bg-[#181715] px-2.5 py-1.5 text-left text-[#DDD6C9] hover:border-[#7EA35A]/40 hover:text-[#7EA35A] cursor-pointer"
            >
              <span className="font-mono text-[#7EA35A]">+ / - Habit</span>
              <span className="text-[11px] text-[#8E867B]">Up/Down</span>
            </button>
            <button
              onClick={() => handleSyntaxInsert("#work // Note")}
              className="flex items-center justify-between rounded-md border border-[#2A2723] bg-[#181715] px-2.5 py-1.5 text-left text-[#DDD6C9] hover:border-[#D99B43]/40 hover:text-[#D99B43] cursor-pointer"
            >
              <span className="font-mono text-[#D99B43]">#tag // note</span>
              <span className="text-[11px] text-[#8E867B]">Tags & Notes</span>
            </button>
          </div>
        </div>
      )}

      {/* Multiline Input Area */}
      <div className="relative rounded-lg border border-[#2A2723] bg-[#121110] focus-within:border-[#D99B43] transition-all">
        <textarea
          ref={textareaRef}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type or paste tasks line by line...\nExample:\nReview sprint tasks #work !urgent\n* 30m reading #growth\n+ Hydration 500ml\nDeploy hotfix // Check bug #104`}
          rows={5}
          className="w-full resize-y bg-transparent p-3.5 font-mono text-sm leading-relaxed text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none"
        />

        {/* Action Toolbar Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2A2723] bg-[#181715] px-3 py-2 font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsertSample}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#8E867B] transition-colors hover:text-[#F5F2EB] cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#D99B43]" />
              <span>Sample Batch</span>
            </button>
            {rawText && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#8E867B] transition-colors hover:text-[#E05D52] cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard shortcut hint */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8E867B] font-mono">
              <kbd className="rounded border border-[#2A2723] bg-[#121110] px-1.5 py-0.5 text-[10px] text-[#DDD6C9]">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="rounded border border-[#2A2723] bg-[#121110] px-1.5 py-0.5 text-[10px] text-[#DDD6C9]">
                Enter
              </kbd>
            </div>

            {/* Dispatch Button */}
            <button
              type="button"
              onClick={handleBatchSubmit}
              disabled={!rawText.trim() || isPending}
              className="flex items-center gap-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] px-4 py-2 text-xs font-bold text-[#121110] shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer font-sans"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#121110] border-t-transparent" />
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
          className={`mt-3 flex items-start gap-3 rounded-lg border p-3 text-xs transition-all ${lastResult.success
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
            <div className="flex items-center justify-between font-semibold">
              <span>{lastResult.summary}</span>
              {lastResult.isDemo && (
                <span className="rounded bg-[#121110] border border-[#2A2723] px-1.5 py-0.5 text-[10px] text-[#D99B43] font-mono">
                  Demo Mode
                </span>
              )}
            </div>
            {lastResult.errors && lastResult.errors.length > 0 && (
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[11px] opacity-90 font-mono">
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
