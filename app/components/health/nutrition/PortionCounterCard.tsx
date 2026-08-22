"use client";

import { FoodGroupMeta } from "@/lib/types";
import { Check, Minus, Plus, Sparkles } from "lucide-react";

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
      className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 backdrop-blur-xl ${
        isCompleted
          ? "border-emerald-500/30 bg-neutral-900/80 shadow-lg shadow-emerald-500/5"
          : "border-white/[0.08] bg-neutral-900/60 hover:border-white/[0.14]"
      }`}
    >
      {/* Top row: Icon + Label + Target Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950/80 border border-white/[0.08] text-lg shadow-inner">
            {meta.icon}
          </span>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{meta.label}</span>
              {isCompleted && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
            </h4>
            <p className="text-[11px] text-neutral-400 leading-tight mt-0.5 line-clamp-1" title={meta.standardPortionDesc}>
              {meta.standardPortionDesc}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-mono border ${
            isCompleted
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-neutral-950/60 border-white/[0.06] text-neutral-400"
          }`}
        >
          Meta: {target} {meta.unit}
        </span>
      </div>

      {/* Middle row: Progress Bar & Numeric Display */}
      <div className="my-3 space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-mono text-lg font-extrabold text-white">
            {current}{" "}
            <span className="text-xs font-normal text-neutral-400">/ {target}</span>
          </span>
          <span
            className={`font-mono text-xs font-semibold ${
              isCompleted ? "text-emerald-400" : "text-neutral-400"
            }`}
          >
            {percent}%
          </span>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-950 border border-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(100, percent)}%`,
              backgroundColor: meta.color,
              boxShadow: isCompleted ? `0 0 12px ${meta.color}` : "none",
            }}
          />
        </div>
      </div>

      {/* Bottom row: Quick action buttons */}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onAdjust(-0.5)}
          disabled={disabled || current <= 0}
          className="flex-1 py-1.5 rounded-xl border border-white/[0.06] bg-neutral-950/60 text-xs font-bold text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center justify-center gap-1"
          title="Restar 0.5 porción"
        >
          <Minus className="h-3 w-3" />
          <span>0.5</span>
        </button>

        <button
          type="button"
          onClick={() => onAdjust(0.5)}
          disabled={disabled}
          className="flex-1 py-1.5 rounded-xl border border-white/[0.08] bg-neutral-950/80 text-xs font-bold text-neutral-200 hover:bg-neutral-800 hover:text-white disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-1"
          title="Sumar 0.5 porción"
        >
          <Plus className="h-3 w-3" />
          <span>0.5</span>
        </button>

        <button
          type="button"
          onClick={() => onAdjust(1.0)}
          disabled={disabled}
          className="flex-1 py-1.5 rounded-xl border text-xs font-extrabold text-white transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
          style={{
            backgroundColor: `${meta.color}20`,
            borderColor: `${meta.color}50`,
            color: "#ffffff",
          }}
          title="Sumar 1 porción completa"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
          <span>1.0</span>
        </button>
      </div>
    </div>
  );
}
