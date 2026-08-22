"use client";

import { HabiticaTag } from "@/lib/types";
import { Hash } from "lucide-react";

interface TagAutocompleteProps {
  tags: HabiticaTag[];
  query: string;
  onSelectTag: (tagName: string) => void;
  selectedIndex: number;
}

export function TagAutocomplete({
  tags,
  query,
  onSelectTag,
  selectedIndex,
}: TagAutocompleteProps) {
  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredTags.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        Suggested Tags
      </div>
      <div className="space-y-0.5">
        {filteredTags.map((tag, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectTag(tag.name)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                isSelected
                  ? "bg-indigo-500 text-white"
                  : "text-neutral-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Hash
                className={`h-3.5 w-3.5 ${
                  isSelected ? "text-white" : "text-indigo-400"
                }`}
              />
              <span className="font-mono font-medium">#{tag.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
