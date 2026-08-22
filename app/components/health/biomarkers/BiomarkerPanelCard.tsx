"use client";

import { BiomarkerLog } from "@/lib/types";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  Info,
} from "lucide-react";
import { useState } from "react";

interface BiomarkerPanelCardProps {
  biomarker: BiomarkerLog;
  accentColor?: string;
}

export function BiomarkerPanelCard({
  biomarker,
  accentColor = "emerald",
}: BiomarkerPanelCardProps) {
  const [showNotes, setShowNotes] = useState(false);

  const {
    name,
    code,
    valueNumeric,
    valueText,
    unit,
    refMin,
    refMax,
    refText,
    status,
    notes,
  } = biomarker;

  // Determine badge styling and icon
  const isHigh = status === "high" || status === "critical";
  const isLow = status === "low";
  const isOptimal = status === "optimal";
  const isNormal = status === "normal";

  const badgeConfig = isHigh
    ? {
        label: "Sobre Rango",
        bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        indicatorColor: "bg-rose-500",
        icon: ArrowUpRight,
      }
    : isLow
    ? {
        label: "Bajo Rango",
        bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        indicatorColor: "bg-amber-500",
        icon: ArrowDownRight,
      }
    : isOptimal
    ? {
        label: "Óptimo",
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        indicatorColor: "bg-emerald-400",
        icon: CheckCircle2,
      }
    : {
        label: "Normal",
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        indicatorColor: "bg-emerald-400",
        icon: CheckCircle2,
      };

  const BadgeIcon = badgeConfig.icon;

  // Linear range gauge calculations
  let positionPct = 50;
  let minPct = 20;
  let maxPct = 80;

  if (
    valueNumeric !== undefined &&
    refMin !== undefined &&
    refMax !== undefined &&
    refMax > refMin
  ) {
    const rangeSpan = refMax - refMin;
    const margin = rangeSpan * 0.35; // 35% margin on each side for graph bounds
    const graphMin = Math.max(0, refMin - margin);
    const graphMax = refMax + margin;
    const totalSpan = graphMax - graphMin;

    minPct = Math.max(5, Math.min(95, ((refMin - graphMin) / totalSpan) * 100));
    maxPct = Math.max(5, Math.min(95, ((refMax - graphMin) / totalSpan) * 100));
    positionPct = Math.max(
      3,
      Math.min(97, ((valueNumeric - graphMin) / totalSpan) * 100)
    );
  }

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 p-4 ${
        isHigh
          ? "border-rose-500/25 bg-rose-950/10 hover:border-rose-500/40"
          : isLow
          ? "border-amber-500/25 bg-amber-950/10 hover:border-amber-500/40"
          : "border-white/[0.08] bg-neutral-900/50 hover:border-white/[0.15] hover:bg-neutral-900/80"
      } backdrop-blur-xl shadow-lg`}
    >
      {/* 1. Header: Name, Code & Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs sm:text-sm font-semibold text-neutral-100 group-hover:text-white transition-colors">
              {name}
            </h4>
            {code && (
              <span className="rounded bg-white/[0.06] px-1.5 py-0.2 text-[9px] font-mono text-neutral-400">
                {code}
              </span>
            )}
          </div>
          {refText && (
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Ref: <span className="text-neutral-300">{refText}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${badgeConfig.bg}`}
          >
            <BadgeIcon className="h-3 w-3" />
            <span>{badgeConfig.label}</span>
          </span>

          {notes && (
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`p-1 rounded-lg transition-colors ${
                showNotes
                  ? "bg-white/10 text-white"
                  : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05]"
              }`}
              title="Ver notas clínicas y contexto deportivo"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Value Display */}
      <div className="my-2.5 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
              isHigh
                ? "text-rose-400"
                : isLow
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {valueNumeric !== undefined ? valueNumeric : valueText || "—"}
          </span>
          {unit && (
            <span className="text-xs font-mono text-neutral-400">{unit}</span>
          )}
        </div>

        {refMin !== undefined && refMax !== undefined && (
          <div className="text-right text-[10px] font-mono text-neutral-500">
            <span>
              {refMin} – {refMax} {unit}
            </span>
          </div>
        )}
      </div>

      {/* 3. Range Gauge Semáforo (for numerical biomarkers) */}
      {valueNumeric !== undefined && refMin !== undefined && refMax !== undefined && (
        <div className="mt-3 pt-2 border-t border-white/[0.05]">
          <div className="relative h-2 w-full rounded-full bg-neutral-950/80 border border-white/[0.06] overflow-hidden">
            {/* Optimal reference target zone */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
              style={{
                left: `${minPct}%`,
                width: `${maxPct - minPct}%`,
              }}
            />

            {/* Current value pin point */}
            <div
              className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full shadow-md ${badgeConfig.indicatorColor} ring-2 ring-white/20`}
              style={{
                left: `${positionPct}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-[9px] font-mono text-neutral-500 mt-1">
            <span>Bajo</span>
            <span className="text-emerald-400/80">Rango Clínico Ideal</span>
            <span>Alto</span>
          </div>
        </div>
      )}

      {/* 4. Qualitative / Descriptive notes banner */}
      {showNotes && notes && (
        <div className="mt-3 p-2.5 rounded-xl bg-neutral-950/90 border border-white/[0.08] text-[11px] text-neutral-300 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p>{notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
