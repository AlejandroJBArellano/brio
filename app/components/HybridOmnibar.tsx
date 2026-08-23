"use client";

import { createTransactionAction } from "@/app/actions/finance";
import { createSingleTaskAction } from "@/app/actions/tasks";
import { parseFinancialInput } from "@/lib/parser";
import { HabiticaTag } from "@/lib/types";
import {
  CheckCircle2,
  Layers,
  Plus,
  Send,
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
    <div className="relative rounded-xl border border-[#2A2723] bg-[#181715] p-2.5 shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Rapid Capture Input */}
        <div className="relative flex-1 w-full flex items-center">
          <div
            className={`absolute left-3 flex items-center pointer-events-none transition-colors ${
              financialParse.isFinancial
                ? financialParse.type === "income"
                  ? "text-[#7EA35A]"
                  : "text-[#D99B43]"
                : "text-[#D99B43]"
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
            className={`w-full rounded-lg border py-2.5 pl-9 pr-24 font-sans text-xs sm:text-sm text-[#F5F2EB] placeholder:text-[#8E867B] bg-[#121110] focus:outline-none transition-all ${
              financialParse.isFinancial
                ? "border-[#D99B43]/50 focus:border-[#D99B43]"
                : "border-[#2A2723] focus:border-[#D99B43]"
            }`}
          />

          {/* Quick Submit or Key Hint */}
          <div className="absolute right-2.5 flex items-center gap-1.5">
            {input.trim() ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-[#121110] bg-[#D99B43] hover:bg-[#E8AF59] transition-all active:scale-95 disabled:opacity-40 shadow-xs"
              >
                {isPending ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-[#121110] border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>{financialParse.isFinancial ? "Guardar $" : "Add"}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#8E867B] font-mono">
                <kbd className="rounded border border-[#2A2723] bg-[#181715] px-1 text-[10px] text-[#8E867B]">
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
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-[#2A2723] bg-[#121110] px-3.5 py-2.5 text-xs font-semibold text-[#DDD6C9] transition-all hover:border-[#38332D] hover:bg-[#22201D] hover:text-[#F5F2EB]"
        >
          <Layers className="h-4 w-4 text-[#D99B43]" />
          <span>Batch Tasks</span>
          <kbd className="hidden sm:inline-block rounded bg-[#181715] px-1.5 py-0.5 font-mono text-[10px] text-[#8E867B] border border-[#2A2723]">
            ⌘B
          </kbd>
        </button>
      </div>

      {/* Financial Detection Helper Pill */}
      {financialParse.isFinancial && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#E8AF59] font-mono px-2 animate-in fade-in duration-150">
          <span>✨ Detectado Brio Finanzas:</span>
          <strong>{financialParse.type === "income" ? "+ Ingreso" : "- Gasto"} ${financialParse.amount}</strong>
          <span>• #{financialParse.category}</span>
          <span>• @{financialParse.account}</span>
          {financialParse.isAntExpense && <span className="text-[#E05D52] font-bold">(Gasto Hormiga ☕)</span>}
        </div>
      )}

      {/* Success Toast */}
      {feedbackToast && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-[#7EA35A]/40 bg-[#121110]/95 px-3.5 py-1 text-xs font-medium text-[#7EA35A] shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#7EA35A]" />
          <span>{feedbackToast}</span>
        </div>
      )}
    </div>
  );
}
