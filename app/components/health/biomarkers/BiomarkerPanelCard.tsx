"use client";

import { BiomarkerLog } from "@/lib/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useState } from "react";

interface BiomarkerPanelCardProps {
  biomarker: BiomarkerLog;
  accentColor?: string;
}

export function BiomarkerPanelCard({
  biomarker,
  accentColor: _accentColor = "emerald",
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
  const _isNormal = status === "normal";

  const badgeConfig = isHigh
    ? {
        label: "Sobre Rango",
        bg: "bg-[#2A1715] text-[#E05D52] border-[#E05D52]/30",
        indicatorColor: "bg-[#E05D52]",
        icon: ArrowUpRight,
      }
    : isLow
    ? {
        label: "Bajo Rango",
        bg: "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30",
        indicatorColor: "bg-[#D99B43]",
        icon: ArrowDownRight,
      }
    : isOptimal
    ? {
        label: "Óptimo",
        bg: "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/30",
        indicatorColor: "bg-[#7EA35A]",
        icon: CheckCircle2,
      }
    : {
        label: "Normal",
        bg: "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/30",
        indicatorColor: "bg-[#7EA35A]",
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
      className={`group relative rounded-lg border transition-all duration-150 p-4 font-sans ${
        isHigh
          ? "border-[#E05D52]/30 bg-[#121110] hover:border-[#E05D52]/50"
          : isLow
          ? "border-[#D99B43]/30 bg-[#121110] hover:border-[#D99B43]/50"
          : "border-[#2A2723] bg-[#121110] hover:border-[#38332D]"
      }`}
    >
      {/* 1. Header: Name, Code & Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs sm:text-sm font-semibold text-[#F5F2EB] group-hover:text-[#D99B43] transition-colors">
              {name}
            </h4>
            {code && (
              <span className="rounded bg-[#181715] px-1.5 py-0.2 text-[9px] font-mono text-[#8E867B] border border-[#2A2723]">
                {code}
              </span>
            )}
          </div>
          {refText && (
            <p className="text-[10px] text-[#8E867B] font-mono mt-0.5">
              Ref: <span className="text-[#DDD6C9]">{refText}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 font-mono">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${badgeConfig.bg}`}
          >
            <BadgeIcon className="h-3 w-3" />
            <span>{badgeConfig.label}</span>
          </span>

          {notes && (
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                showNotes
                  ? "bg-[#221D16] text-[#D99B43]"
                  : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#181715]"
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
        <div className="flex items-baseline gap-1.5 font-mono">
          <span
            className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
              isHigh
                ? "text-[#E05D52]"
                : isLow
                ? "text-[#D99B43]"
                : "text-[#7EA35A]"
            }`}
          >
            {valueNumeric !== undefined ? valueNumeric : valueText || "—"}
          </span>
          {unit && (
            <span className="text-xs font-mono text-[#8E867B]">{unit}</span>
          )}
        </div>

        {refMin !== undefined && refMax !== undefined && (
          <div className="text-right text-[10px] font-mono text-[#8E867B]">
            <span>
              {refMin} – {refMax} {unit}
            </span>
          </div>
        )}
      </div>

      {/* 3. Range Gauge Semáforo (for numerical biomarkers) */}
      {valueNumeric !== undefined && refMin !== undefined && refMax !== undefined && (
        <div className="mt-3 pt-2 border-t border-[#2A2723]">
          <div className="relative h-1.5 w-full rounded-full bg-[#181715] border border-[#2A2723] overflow-hidden">
            {/* Optimal reference target zone */}
            <div
              className="absolute top-0 bottom-0 bg-[#7EA35A]/20 border-x border-[#7EA35A]/40"
              style={{
                left: `${minPct}%`,
                width: `${maxPct - minPct}%`,
              }}
            />

            {/* Current value pin point */}
            <div
              className={`absolute top-0 bottom-0 w-2 -ml-1 rounded-full ${badgeConfig.indicatorColor}`}
              style={{
                left: `${positionPct}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-[9px] font-mono text-[#8E867B] mt-1">
            <span>Bajo</span>
            <span className="text-[#7EA35A]">Rango Clínico Ideal</span>
            <span>Alto</span>
          </div>
        </div>
      )}

      {/* 4. Qualitative / Descriptive notes banner */}
      {showNotes && notes && (
        <div className="mt-3 p-2.5 rounded-lg bg-[#181715] border border-[#2A2723] text-[11px] text-[#DDD6C9] leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#D99B43] shrink-0 mt-0.5" />
            <p>{notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
