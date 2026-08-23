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
    <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#2A2723] bg-[#181715] p-1 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 font-mono">
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8E867B]">
        Etiquetas sugeridas
      </div>
      <div className="space-y-0.5">
        {filteredTags.map((tag, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectTag(tag.name)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[#221D16] text-[#D99B43] font-bold border border-[#D99B43]/30"
                  : "text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB]"
              }`}
            >
              <Hash
                className={`h-3.5 w-3.5 ${
                  isSelected ? "text-[#D99B43]" : "text-[#8E867B]"
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
