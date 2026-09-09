"use client";

import { useEffect, useMemo, useState } from "react";
import { FoodGroupKey } from "@/lib/types";
import {
  MARIANA_MONT_PORTION_EQUIVALENTS,
  PortionEquivalentItem,
} from "@/lib/nutritionPresets";
import { soundFx } from "@/lib/soundFx";
import {
  Apple,
  CookingPot,
  Leaf,
  Minus,
  Plus,
  Salad,
  Search,
  Sparkles,
  UtensilsCrossed,
  Wheat,
  X,
} from "lucide-react";

interface PortionEquivalentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupKey: FoodGroupKey | null;
  currentPortions: number;
  targetPortions: number;
  onPortionAdjust: (group: FoodGroupKey, delta: number) => void;
}

interface GroupConfig {
  label: string;
  unit: string;
  icon: typeof Wheat;
  color: string;
  borderColor: string;
  bgColor: string;
}

const GROUP_CONFIGS: Record<FoodGroupKey, GroupConfig> = {
  cereals: {
    label: "Cereales Integrales",
    unit: "raciones",
    icon: Wheat,
    color: "text-[#D99B43]",
    borderColor: "border-[#D99B43]/40",
    bgColor: "bg-[#221D16]",
  },
  fats_seeds: {
    label: "Grasas & Semillas",
    unit: "raciones",
    icon: Sparkles,
    color: "text-[#84cc16]",
    borderColor: "border-[#84cc16]/40",
    bgColor: "bg-[#1B2213]",
  },
  legumes: {
    label: "Legumbres & Tofu",
    unit: "porciones",
    icon: CookingPot,
    color: "text-[#9F7AEA]",
    borderColor: "border-[#9F7AEA]/40",
    bgColor: "bg-[#1E1725]",
  },
  vegetables: {
    label: "Verduras & Hongos",
    unit: "tazas",
    icon: Salad,
    color: "text-[#7EA35A]",
    borderColor: "border-[#7EA35A]/40",
    bgColor: "bg-[#141813]",
  },
  leafy_greens: {
    label: "Hojas Verdes",
    unit: "tazas",
    icon: Leaf,
    color: "text-[#4EAB9E]",
    borderColor: "border-[#4EAB9E]/40",
    bgColor: "bg-[#141C1A]",
  },
  fruits: {
    label: "Frutas",
    unit: "tazas",
    icon: Apple,
    color: "text-[#E05D52]",
    borderColor: "border-[#E05D52]/40",
    bgColor: "bg-[#221716]",
  },
  tubers: {
    label: "Tubérculos",
    unit: "ración",
    icon: UtensilsCrossed,
    color: "text-[#D99B43]",
    borderColor: "border-[#D99B43]/40",
    bgColor: "bg-[#221D16]",
  },
};

export function PortionEquivalentsModal({
  isOpen,
  onClose,
  groupKey,
  currentPortions,
  targetPortions,
  onPortionAdjust,
}: PortionEquivalentsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionAdditions, setSessionAdditions] = useState<Record<string, number>>({});

  // Reset search and session counts on open/close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSessionAdditions({});
    }
  }, [isOpen, groupKey]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const groupConfig = groupKey ? GROUP_CONFIGS[groupKey] : null;
  const rawItems = groupKey ? MARIANA_MONT_PORTION_EQUIVALENTS[groupKey] || [] : [];

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rawItems;
    return rawItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.portionDesc.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
    );
  }, [rawItems, searchQuery]);

  if (!isOpen || !groupKey || !groupConfig) return null;

  const GroupIcon = groupConfig.icon;
  const isGoalMet = currentPortions >= targetPortions && targetPortions > 0;

  const handleAddItem = (item: PortionEquivalentItem) => {
    soundFx.taskComplete();
    setSessionAdditions((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    onPortionAdjust(groupKey, 1);
  };

  const handleSubtractItem = (
    item: PortionEquivalentItem,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if ((sessionAdditions[item.id] || 0) <= 0) return;

    soundFx.click();
    setSessionAdditions((prev) => ({
      ...prev,
      [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
    }));
    onPortionAdjust(groupKey, -1);
  };

  const handleDirectAdjust = (delta: number) => {
    if (delta < 0 && currentPortions <= 0) return;
    if (delta > 0) {
      soundFx.taskComplete();
    } else {
      soundFx.click();
    }
    onPortionAdjust(groupKey, delta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div
        className="w-full max-w-lg rounded-2xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${groupConfig.borderColor} ${groupConfig.bgColor} ${groupConfig.color}`}
            >
              <GroupIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB]">
                {groupConfig.label}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`font-mono text-xs font-bold ${
                    isGoalMet ? "text-[#7EA35A]" : "text-[#DDD6C9]"
                  }`}
                >
                  {currentPortions} / {targetPortions} {groupConfig.unit}
                </span>
                <span className="text-[10px] text-[#8E867B] font-mono">
                  • Plan Mariana Mont
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Header Stepper */}
            <div className="flex items-center rounded-lg border border-[#2A2723] bg-[#121110] p-0.5 font-mono">
              <button
                type="button"
                onClick={() => handleDirectAdjust(-1)}
                disabled={currentPortions <= 0}
                className="p-1 rounded text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#1C1A17] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Restar 1 porción"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-1.5 text-xs font-bold text-[#F5F2EB] tabular-nums">
                {currentPortions}
              </span>
              <button
                type="button"
                onClick={() => handleDirectAdjust(1)}
                className="p-1 rounded text-[#7EA35A] hover:bg-[#141813] transition-colors cursor-pointer"
                title="Sumar 1 porción libre"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="pt-3.5 pb-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#8E867B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Buscar en ${groupConfig.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 rounded-xl text-xs bg-[#121110] border border-[#2A2723] text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Instruction Note */}
        <div className="pb-2.5">
          <p className="text-[11px] text-[#8E867B] font-mono leading-relaxed">
            Toca un alimento para sumar 1 porción. Cada opción muestra la medida clínica equivalente:
          </p>
        </div>

        {/* Equivalents List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[55vh]">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const addedCount = sessionAdditions[item.id] || 0;
              const hasAdded = addedCount > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className={`group rounded-xl border p-3 transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.99] ${
                    hasAdded
                      ? "border-[#7EA35A]/50 bg-[#141813]"
                      : "border-[#2A2723] bg-[#121110] hover:border-[#38332D] hover:bg-[#151412]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#F5F2EB] font-sans truncate">
                        {item.name}
                      </span>
                      {hasAdded && (
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[#7EA35A]/20 text-[#7EA35A] border border-[#7EA35A]/40 shrink-0">
                          +{addedCount} {addedCount === 1 ? "porción" : "porciones"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#D99B43] font-mono font-medium mt-0.5">
                      {item.portionDesc}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-[#8E867B] font-mono mt-0.5">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasAdded && (
                      <button
                        type="button"
                        onClick={(e) => handleSubtractItem(item, e)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E05D52]/40 bg-[#221716] text-[#E05D52] hover:bg-[#E05D52]/20 active:scale-95 transition-all cursor-pointer"
                        title="Restar 1 porción"
                      >
                        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                        hasAdded
                          ? "border-[#7EA35A] bg-[#7EA35A] text-[#121110] shadow-xs"
                          : "border-[#38332D] bg-[#181715] text-[#DDD6C9] group-hover:border-[#7EA35A]/70 group-hover:text-[#7EA35A]"
                      }`}
                      title="Sumar 1 porción"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-[#8E867B] font-mono text-xs">
              No se encontraron alimentos con &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-[#2A2723] flex items-center justify-between">
          <div className="text-[11px] font-mono text-[#8E867B]">
            Total hoy:{" "}
            <span className="font-bold text-[#F5F2EB]">{currentPortions}</span> /{" "}
            {targetPortions}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#22201D] hover:bg-[#2A2723] border border-[#38332D] text-xs font-mono font-bold text-[#F5F2EB] transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
