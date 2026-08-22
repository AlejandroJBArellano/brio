"use client";

import { createSingleTaskAction } from "@/app/actions/tasks";
import { HabiticaTag } from "@/lib/types";
import {
  Calendar,
  CheckCircle2,
  CornerDownLeft,
  Hash,
  Layers,
  Plus,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { TagAutocomplete } from "./TagAutocomplete";

interface HybridOmnibarProps {
  tags: HabiticaTag[];
  onOpenBatchModal: () => void;
}

export function HybridOmnibar({
  tags,
  onOpenBatchModal,
}: HybridOmnibarProps) {
  const [input, setInput] = useState("");
  const [tagQuery, setTagQuery] = useState<string | null>(null);
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus omnibar when '/' is pressed outside of inputs
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenBatchModal]);

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
      handleSingleSubmit();
    }
  };

  const handleSingleSubmit = () => {
    if (!input.trim() || isPending) return;

    startTransition(async () => {
      const res = await createSingleTaskAction(input);
      if (res.success) {
        setInput("");
        setTagQuery(null);
      }
    });
  };

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-2.5 backdrop-blur-xl shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Rapid Single Capture Input */}
        <div className="relative flex-1 w-full flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none text-indigo-400">
            <Plus className="h-4 w-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Quick capture: Buy milk, * Daily workout, + Drink water, #work !urgent..."
            className="w-full rounded-xl border border-white/10 bg-neutral-950/70 py-2.5 pl-9 pr-24 font-sans text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-indigo-500 focus:outline-none transition-all"
          />

          {/* Quick Submit or Key Hint */}
          <div className="absolute right-2.5 flex items-center gap-1.5">
            {input.trim() ? (
              <button
                type="button"
                onClick={handleSingleSubmit}
                disabled={isPending}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-40"
              >
                {isPending ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="h-3 w-3" />
                    <span>Add</span>
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
          <span>Batch Capture</span>
          <kbd className="hidden sm:inline-block rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 border border-white/5">
            ⌘B
          </kbd>
        </button>
      </div>
    </div>
  );
}
