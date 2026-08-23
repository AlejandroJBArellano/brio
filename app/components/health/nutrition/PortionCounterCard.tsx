"use client";

import { FoodGroupMeta } from "@/lib/types";
import { Check, Minus, Plus } from "lucide-react";

interface PortionCounterCardProps {
  meta: FoodGroupMeta;
  current: number;
  target: number;
  onAdjust: (delta: number) => void;
  disabled?: boolean;
}

export function PortionCounterCard({
  meta,
  current,
  target,
  onAdjust,
  disabled = false,
}: PortionCounterCardProps) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const isCompleted = current >= target && target > 0;
  const isOver = current > target;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all duration-150 font-sans ${
        isCompleted
          ? "border-[#7EA35A]/40 bg-[#121110]"
          : "border-[#2A2723] bg-[#121110] hover:border-[#38332D]"
      }`}
    >
      {/* Top row: Icon + Label + Target Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#181715] border border-[#2A2723] text-lg">
            {meta.icon}
          </span>
          <div>
            <h4 className="text-sm font-bold text-[#F5F2EB] tracking-tight flex items-center gap-1.5 font-serif">
              <span>{meta.label}</span>
              {isCompleted && (
                <span className="flex h-4 w-4 items-center justify-center rounded bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30">
                  <Check className="h-2.5 w-2.5 stroke-3" />
                </span>
              )}
            </h4>
            <p className="text-[11px] text-[#8E867B] leading-tight mt-0.5 line-clamp-1 font-mono" title={meta.standardPortionDesc}>
              {meta.standardPortionDesc}
            </p>
          </div>
        </div>

        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono border ${
            isCompleted
              ? "bg-[#1C2219] border-[#7EA35A]/30 text-[#7EA35A]"
              : "bg-[#181715] border-[#2A2723] text-[#8E867B]"
          }`}
        >
          Meta: {target} {meta.unit}
        </span>
      </div>

      {/* Middle row: Progress Bar & Numeric Display */}
      <div className="my-3 space-y-1.5">
        <div className="flex items-baseline justify-between text-xs font-mono">
          <span className="text-lg font-bold text-[#F5F2EB]">
            {current}{" "}
            <span className="text-xs font-normal text-[#8E867B]">/ {target}</span>
          </span>
          <span
            className={`text-xs font-semibold ${
              isCompleted ? "text-[#7EA35A]" : "text-[#8E867B]"
            }`}
          >
            {percent}%
          </span>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded bg-[#181715] border border-[#2A2723]">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? "bg-[#7EA35A]" : "bg-[#D99B43]"
            }`}
            style={{
              width: `${Math.min(100, percent)}%`,
            }}
          />
        </div>
      </div>

      {/* Bottom row: Quick action buttons */}
      <div className="flex items-center gap-1.5 pt-1 font-mono">
        <button
          type="button"
          onClick={() => onAdjust(-0.5)}
          disabled={disabled || current <= 0}
          className="flex-1 py-1.5 rounded border border-[#2A2723] bg-[#181715] text-xs font-bold text-[#8E867B] hover:bg-[#22201D] hover:text-[#DDD6C9] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          title="Restar 0.5 porción"
        >
          <Minus className="h-3 w-3" />
          <span>0.5</span>
        </button>

        <button
          type="button"
          onClick={() => onAdjust(0.5)}
          disabled={disabled}
          className="flex-1 py-1.5 rounded border border-[#2A2723] bg-[#181715] text-xs font-bold text-[#DDD6C9] hover:bg-[#22201D] hover:text-[#F5F2EB] disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          title="Sumar 0.5 porción"
        >
          <Plus className="h-3 w-3" />
          <span>0.5</span>
        </button>

        <button
          type="button"
          onClick={() => onAdjust(1.0)}
          disabled={disabled}
          className="flex-1 py-1.5 rounded border border-[#D99B43]/30 bg-[#221D16] text-xs font-bold text-[#D99B43] hover:bg-[#2A241C] transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          title="Sumar 1 porción completa"
        >
          <Plus className="h-3.5 w-3.5 stroke-3" />
          <span>1.0</span>
        </button>
      </div>
    </div>
  );
}
