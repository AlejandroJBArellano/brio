"use client";

import { createTransactionAction } from "@/app/actions/finance";
import { createSingleTaskAction } from "@/app/actions/tasks";
import { parseFinancialInput } from "@/lib/parser";
import { HabiticaTag } from "@/lib/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Layers,
  Plus,
  Send,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { TagAutocomplete } from "./TagAutocomplete";

interface HybridOmnibarProps {
  tags: HabiticaTag[];
  onOpenBatchModal: () => void;
  onOpenFinanceModal?: () => void;
  onRefreshFinance?: () => void;
}

export function HybridOmnibar({
  tags,
  onOpenBatchModal,
  onOpenFinanceModal,
  onRefreshFinance,
}: HybridOmnibarProps) {
  const [input, setInput] = useState("");
  const [tagQuery, setTagQuery] = useState<string | null>(null);
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const financialParse = useMemo(() => {
    return parseFinancialInput(input);
  }, [input]);

  // Global key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      if (e.key === "/" && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (
        (e.key.toLowerCase() === "c" && !isInputActive && !e.metaKey && !e.ctrlKey) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b")
      ) {
        e.preventDefault();
        onOpenBatchModal();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f" && !isInputActive) {
        if (onOpenFinanceModal) {
          e.preventDefault();
          onOpenFinanceModal();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenBatchModal, onOpenFinanceModal]);

  // Detect hashtag being typed
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const lastHashIndex = textBeforeCursor.lastIndexOf("#");

    if (
      lastHashIndex !== -1 &&
      (lastHashIndex === 0 || textBeforeCursor[lastHashIndex - 1] === " ")
    ) {
      const possibleTag = textBeforeCursor.slice(lastHashIndex + 1);
      if (!possibleTag.includes(" ")) {
        setTagQuery(possibleTag);
        setSelectedTagIndex(0);
        return;
      }
    }

    setTagQuery(null);
  };

  const handleSelectTag = (tagName: string) => {
    if (!inputRef.current) return;
    const cursor = inputRef.current.selectionStart || input.length;
    const textBeforeCursor = input.slice(0, cursor);
    const lastHashIndex = textBeforeCursor.lastIndexOf("#");

    if (lastHashIndex !== -1) {
      const before = input.slice(0, lastHashIndex);
      const after = input.slice(cursor);
      const updated = `${before}#${tagName} ${after}`;
      setInput(updated);
      setTagQuery(null);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newPos = lastHashIndex + tagName.length + 2;
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (tagQuery !== null) {
      const filtered = tags.filter((t) =>
        t.name.toLowerCase().includes(tagQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedTagIndex((prev) => (prev + 1) % filtered.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedTagIndex(
            (prev) => (prev - 1 + filtered.length) % filtered.length
          );
          return;
        }
        if (e.key === "Tab" || (e.key === "Enter" && tagQuery.length > 0)) {
          e.preventDefault();
          const tag = filtered[selectedTagIndex];
          if (tag) {
            handleSelectTag(tag.name);
            return;
          }
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isPending) return;

    startTransition(async () => {
      if (financialParse.isFinancial && financialParse.amount && financialParse.type) {
        // Financial capture to Neon PostgreSQL
        const res = await createTransactionAction({
          amount: financialParse.amount,
          type: financialParse.type,
          concept: financialParse.concept || "Gasto rápido",
          category: financialParse.category || "general",
          account: financialParse.account || "default",
          isAntExpense: financialParse.isAntExpense,
          notes: financialParse.notes,
        });

        if (res.success) {
          setInput("");
          setTagQuery(null);
          setFeedbackToast(`💰 Movimiento guardado: ${financialParse.type === "income" ? "+" : "-"}$${financialParse.amount} (${financialParse.concept})`);
          setTimeout(() => setFeedbackToast(null), 3500);
          if (onRefreshFinance) onRefreshFinance();
        }
      } else {
        // Habitica Task Capture
        const res = await createSingleTaskAction(input);
        if (res.success) {
          setInput("");
          setTagQuery(null);
          setFeedbackToast(`⚡ Tarea creada en Habitica`);
          setTimeout(() => setFeedbackToast(null), 3000);
        }
      }
    });
  };

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-2.5 backdrop-blur-xl shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Rapid Capture Input */}
        <div className="relative flex-1 w-full flex items-center">
          <div
            className={`absolute left-3 flex items-center pointer-events-none transition-colors ${
              financialParse.isFinancial
                ? financialParse.type === "income"
                  ? "text-emerald-400"
                  : "text-amber-400"
                : "text-indigo-400"
            }`}
          >
            {financialParse.isFinancial ? (
              <Wallet className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Captura rápida: -$85 Café #antojo @nu, * Daily 20m, + Ejercicio, Comprar super !urgent..."
            className={`w-full rounded-xl border bg-neutral-950/70 py-2.5 pl-9 pr-24 font-sans text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-all ${
              financialParse.isFinancial
                ? "border-amber-500/50 focus:border-amber-400"
                : "border-white/10 focus:border-indigo-500"
            }`}
          />

          {/* Quick Submit or Key Hint */}
          <div className="absolute right-2.5 flex items-center gap-1.5">
            {input.trim() ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-neutral-950 transition-all active:scale-95 disabled:opacity-40 shadow-md ${
                  financialParse.isFinancial
                    ? "bg-amber-400 hover:bg-amber-300 shadow-amber-500/20"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                }`}
              >
                {isPending ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-neutral-950 border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>{financialParse.isFinancial ? "Guardar $" : "Add"}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
                <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1 text-[10px] text-neutral-400">
                  /
                </kbd>
                <span>focus</span>
              </div>
            )}
          </div>

          {/* Tag Autocomplete Popup */}
          {tagQuery !== null && (
            <TagAutocomplete
              tags={tags}
              query={tagQuery}
              onSelectTag={handleSelectTag}
              selectedIndex={selectedTagIndex}
            />
          )}
        </div>

        {/* Batch Capture Toggle Button */}
        <button
          type="button"
          onClick={onOpenBatchModal}
          title="Open Multiline Batch Capture (⌘B or C)"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-neutral-800/80 px-3.5 py-2.5 text-xs font-semibold text-neutral-200 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white"
        >
          <Layers className="h-4 w-4 text-indigo-400" />
          <span>Batch Tasks</span>
          <kbd className="hidden sm:inline-block rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 border border-white/5">
            ⌘B
          </kbd>
        </button>
      </div>

      {/* Financial Detection Helper Pill */}
      {financialParse.isFinancial && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-300 font-mono px-2 animate-in fade-in duration-150">
          <span>✨ Detectado Brio Finanzas:</span>
          <strong>{financialParse.type === "income" ? "+ Ingreso" : "- Gasto"} ${financialParse.amount}</strong>
          <span>• #{financialParse.category}</span>
          <span>• @{financialParse.account}</span>
          {financialParse.isAntExpense && <span className="text-amber-400 font-bold">(Gasto Hormiga ☕)</span>}
        </div>
      )}

      {/* Success Toast */}
      {feedbackToast && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-neutral-950/90 px-3.5 py-1 text-xs font-medium text-emerald-300 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}
    </div>
  );
}
