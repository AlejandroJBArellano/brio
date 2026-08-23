"use client";

import { HevyWorkout, MuscleGroupId, MuscleRecoveryItem } from "@/lib/types";
import { calculateMuscleRecovery } from "@/lib/muscleRecovery";
import {
  Activity,
  Dumbbell,
  Info,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

interface MuscleRecoveryWidgetProps {
  recentWorkouts?: HevyWorkout[];
}

export function MuscleRecoveryWidget({ recentWorkouts = [] }: MuscleRecoveryWidgetProps) {
  const [viewMode, setViewMode] = useState<"anterior" | "posterior">("anterior");
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleGroupId>("chest");
  const [hoveredMuscleId, setHoveredMuscleId] = useState<MuscleGroupId | null>(null);
  const [filterState, setFilterState] = useState<"all" | "ready" | "recovering" | "exhausted">("all");

  const recoverySummary = useMemo(() => {
    return calculateMuscleRecovery(recentWorkouts);
  }, [recentWorkouts]);

  const selectedMuscle: MuscleRecoveryItem =
    recoverySummary.muscles[selectedMuscleId] || recoverySummary.muscles.chest;

  // Helper color functions
  const getStateColor = (state: MuscleRecoveryItem["state"]) => {
    switch (state) {
      case "exhausted":
        return {
          fill: "#EF4444",
          stroke: "#DC2626",
          glow: "rgba(239, 68, 68, 0.75)",
          badgeBg: "bg-red-500/10 text-red-400 border-red-500/20",
          progressBg: "bg-red-500",
          text: "text-red-400",
          border: "border-red-500/30",
          label: "Fatiga Aguda",
        };
      case "recovering":
        return {
          fill: "#F59E0B",
          stroke: "#D97706",
          glow: "rgba(245, 158, 11, 0.65)",
          badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
          progressBg: "bg-amber-400",
          text: "text-amber-300",
          border: "border-amber-500/30",
          label: "En Recuperación",
        };
      case "recovered":
        return {
          fill: "#10B981",
          stroke: "#059669",
          glow: "rgba(16, 185, 129, 0.65)",
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          progressBg: "bg-emerald-400",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          label: "100% Recuperado",
        };
      case "rested":
      default:
        return {
          fill: "#0EA5E9",
          stroke: "#0284C7",
          glow: "rgba(14, 165, 233, 0.55)",
          badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
          progressBg: "bg-sky-400",
          text: "text-sky-400",
          border: "border-sky-500/30",
          label: "Descansado (>5d)",
        };
    }
  };

  const getMuscleFill = (mId: MuscleGroupId) => {
    const m = recoverySummary.muscles[mId];
    if (!m) return "#2A2723";
    const colors = getStateColor(m.state);
    return colors.fill;
  };

  const getMuscleOpacity = (mId: MuscleGroupId) => {
    if (selectedMuscleId === mId) return 1;
    if (hoveredMuscleId === mId) return 0.95;
    return 0.82;
  };

  const getMuscleStroke = (mId: MuscleGroupId) => {
    if (selectedMuscleId === mId) return "#F5F2EB";
    if (hoveredMuscleId === mId) return "#D99B43";
    return "#141311";
  };

  const getMuscleStrokeWidth = (mId: MuscleGroupId) => {
    if (selectedMuscleId === mId) return 0.28;
    if (hoveredMuscleId === mId) return 0.22;
    return 0.12;
  };

  const getMuscleFilter = (mId: MuscleGroupId) => {
    if (selectedMuscleId === mId) {
      const colors = getStateColor(recoverySummary.muscles[mId]?.state || "rested");
      return `drop-shadow(0 0 1.2px ${colors.fill}) drop-shadow(0 0 0.4px ${colors.fill})`;
    }
    if (hoveredMuscleId === mId) {
      return "drop-shadow(0 0 0.8px rgba(217, 155, 67, 0.8))";
    }
    return "none";
  };

  const allMusclesList = Object.values(recoverySummary.muscles);
  const filteredMuscles = allMusclesList.filter((m) => {
    if (filterState === "ready") return m.state === "recovered" || m.state === "rested";
    if (filterState === "recovering") return m.state === "recovering";
    if (filterState === "exhausted") return m.state === "exhausted";
    return true;
  });

  return (
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm font-sans flex flex-col gap-6">
      {/* 1. Header with Cyberpunk Recovery Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2723]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
                Heatmap de Recuperación Muscular
                <span className="inline-flex items-center gap-1 rounded-md bg-[#221D16] px-2 py-0.5 text-[10px] font-mono font-bold text-[#D99B43] border border-[#D99B43]/30">
                  <Zap className="h-3 w-3" /> HEVY ENGINE
                </span>
              </h3>
            </div>
            <p className="text-xs text-[#8E867B] mt-0.5">
              Estado biológico de fatiga, sobrecarga sistemática y síntesis proteica
            </p>
          </div>
        </div>

        {/* Global Recovery Metric */}
        <div className="flex items-center gap-4 bg-[#121110] border border-[#2A2723] rounded-xl px-4 py-2.5">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#8E867B]">
              Recuperación Sistémica
            </div>
            <div className="text-lg font-bold font-mono text-[#F5F2EB] flex items-center justify-end gap-1.5">
              <span>{recoverySummary.overallRecoveryPercent}%</span>
              <span className="text-xs font-normal text-emerald-400">
                {recoverySummary.overallRecoveryPercent >= 75 ? "Óptimo" : "En proceso"}
              </span>
            </div>
          </div>
          <div className="h-9 w-9 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold shadow-xs">
            {recoverySummary.readyToTrainCount}
            <span className="text-[8px] text-[#8E867B] font-normal">/12</span>
          </div>
        </div>
      </div>

      {/* 2. Target Recommendations Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#121110] border border-[#2A2723]">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="h-4 w-4 text-[#D99B43]" />
          <span className="text-[#8E867B]">Sugeridos para entrenar hoy:</span>
          <div className="flex flex-wrap gap-1.5">
            {recoverySummary.suggestedFocusToday.map((focus) => (
              <span
                key={focus}
                className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-300 font-mono"
              >
                {focus}
              </span>
            ))}
          </div>
        </div>

        {/* Quick status pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterState("ready")}
            className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
              filterState === "ready"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
            }`}
          >
            🟢 {recoverySummary.readyToTrainCount} Listos
          </button>
          <button
            type="button"
            onClick={() => setFilterState("recovering")}
            className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
              filterState === "recovering"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
            }`}
          >
            🟡 {recoverySummary.recoveringCount} Recuperando
          </button>
          {recoverySummary.exhaustedCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterState("exhausted")}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                filterState === "exhausted"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              🔴 {recoverySummary.exhaustedCount} Fatiga
            </button>
          )}
          {filterState !== "all" && (
            <button
              type="button"
              onClick={() => setFilterState("all")}
              className="text-[10px] text-[#8E867B] underline hover:text-[#DDD6C9] ml-1"
            >
              Ver todos
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Interactive View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Anatomical HUD */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between rounded-xl bg-[#121110] border border-[#2A2723] p-5">
          {/* View Switcher */}
          <div className="flex items-center justify-between w-full pb-3 border-b border-[#2A2723]/60">
            <span className="text-xs font-mono text-[#8E867B] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#D99B43]" />
              Proyección Anatómica
            </span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#181715] border border-[#2A2723]">
              <button
                type="button"
                onClick={() => setViewMode("anterior")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === "anterior"
                    ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                Frontal (Anterior)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("posterior")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === "posterior"
                    ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                Dorsal (Posterior)
              </button>
            </div>
          </div>

          {/* SVG Anatomical Vector Map (70+ Medical Grade Bellies) */}
          <div className="relative w-full max-w-65 py-4 flex items-center justify-center min-h-95">
            {viewMode === "anterior" ? (
              /* ========================================================================= */
              /* ANTERIOR / FRONTAL VIEW SVG (High-Definition Medical Anatomy Dataset)     */
              /* ========================================================================= */
              <svg
                viewBox="0 0 35 93"
                className="w-full h-auto max-h-90 select-none filter drop-shadow-md"
              >
                {/* HUD Matrix Lines */}
                <g opacity="0.1" stroke="#D99B43" strokeWidth="0.2" strokeDasharray="0.6,0.8">
                  <line x1="17.5" y1="2" x2="17.5" y2="91" />
                  <line x1="4" y1="18" x2="31" y2="18" />
                  <line x1="4" y1="36" x2="31" y2="36" />
                  <line x1="6" y1="65" x2="29" y2="65" />
                </g>

                {/* 1. Base Neutral Anatomical Structures (Head, Face, Neck, Joints, Hands, Feet) */}
                <g fill="#22201D" stroke="#38332B" strokeWidth="0.12">
                  {/* Head & Cranium */}
                  <path d="m 11.671635,6.3585449 -0.0482,-2.59085 4.20648,-2.46806 4.42769,2.95361 -0.0405,1.94408 0.24197,-3.34467 -2.03129,-2.31103004 -2.84508,-0.51629 -2.20423,0.52915 -1.9363,2.63077004 z" />
                  {/* Face */}
                  <path d="m 19.748825,6.7034949 0.0203,-2.20747 -3.96689,-2.7637 -3.74099,2.23559 -0.006,2.63528 -0.60741,0.0403 0.27408,1.82447 0.97635,0.33932 0.44244,2.1802901 1.82222,2.06556 2.03518,-0.0607 1.79223,-1.94408 0.35957,-2.2406601 0.97616,-0.33932 0.25159,-1.78416 z" />
                  {/* Neck Sternocleidomastoid Base */}
                  <path d="m 13.304665,11.910505 1.64975,2.35202 0.74426,2.62159 -1.73486,-1.38354 -0.86649,-2.97104 z" />
                  <path d="m 18.385135,11.910505 -1.64975,2.35202 -0.74538,2.62234 1.73486,-1.38354 0.86649,-2.97104 z" />
                  {/* Elbows */}
                  <path d="m 3.2054751,27.370125 0.005,3.09419 -0.57959,1.91184 -0.54539,-2.41185 z" />
                  <path d="m 28.325215,27.370125 -0.005,3.09419 0.57959,1.91184 0.54538,-2.41185 z" />
                  {/* Hands */}
                  <path d="m 4.3904451,43.563145 -1.5198,0.0506 -0.76631,-0.67112 -1.21261996,2.15767 -0.86245,3.32873 0.49386,0.22113 0.59814996,-2.20238 0.50016,0.25356 -0.35639,2.49422 0.62382,0.24345 0.41402,-2.49194 0.55839,0.17851 -0.2262,2.76603 0.76938,0.32268 0.25788,-2.86764 0.4578,-0.0181 0.16611,2.65239 0.65997,0.2633 0.0712,-4.56643 0.34158,-0.19428 1.35316,1.68367 0.32832,-0.34354 -0.72644,-2.0551 z" />
                  <path d="m 27.140245,43.563145 1.5198,0.0506 0.76631,-0.67111 1.21262,2.15766 0.86245,3.32873 -0.49386,0.22113 -0.59815,-2.20238 -0.50016,0.25356 0.35639,2.49422 -0.62382,0.24345 -0.41402,-2.49194 -0.55839,0.17851 0.2262,2.76603 -0.76938,0.32268 -0.25788,-2.86764 -0.4578,-0.0181 -0.16611,2.6524 -0.65997,0.26329 -0.0712,-4.56643 -0.34158,-0.19428 -1.35316,1.68368 -0.32832,-0.34355 0.72644,-2.0551 z" />
                  {/* Knees / Patella */}
                  <path d="m 10.284405,64.784375 -0.12448,1.12295 0.87118,1.08171 0.29058,1.70599 0.58116,0.24933 0.49774,-2.57866 0.33182,-0.91486 -0.29058,-0.58247 z m 3.85854,0.0832 -0.62241,1.74685 -1.32767,2.57867 0.33182,2.37095 0.95423,-2.66209 0.78832,-1.4964 z m -4.9786799,-2.37058 0.9542299,5.11609 -0.6223999,-0.33313 -0.49793,1.6638 z" />
                  <path d="m 21.404635,64.784375 0.1243,1.12295 -0.87118,1.08171 -0.29058,1.70599 -0.58116,0.24933 -0.49774,-2.57866 -0.33182,-0.91486 0.29058,-0.58247 z m -3.85853,0.0832 0.6224,1.74685 1.3273,2.57867 -0.33182,2.37095 -0.95423,-2.66209 -0.78738,-1.49734 z m 4.97811,-2.37039 -0.95423,5.11609 0.62241,-0.33295 0.49773,1.66381 z" />
                  {/* Feet */}
                  <path d="m 14.433335,87.868265 -0.12448,3.45228 -0.29058,1.20637 h -0.87118 l -0.24877,-0.83181 -0.29059,-0.0416 0.0623,0.83181 -1.09934,-0.33333 -0.29058,-0.16629 -1.2448,-0.27033 -0.0412,-0.97747 1.2031899,-2.03781 0.82975,-1.04009 2.03294,-0.83181 z" />
                  <path d="m 17.255895,87.868445 0.1243,3.45228 0.28983,1.20638 h 0.87136 l 0.24897,-0.83181 0.29058,-0.0416 -0.0624,0.83181 1.09914,-0.33332 0.29058,-0.16629 1.24444,-0.27033 0.0416,-0.97748 -1.20319,-2.03743 -0.82974,-1.0399 -2.03294,-0.83181 z" />
                </g>

                {/* 2. Interactive Anatomical Muscle Groups */}

                {/* CHEST (Pectoral Mayor: Haz Clavicular + Haz Esternal) */}
                <g
                  onClick={() => setSelectedMuscleId("chest")}
                  onMouseEnter={() => setHoveredMuscleId("chest")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("chest")}
                  fillOpacity={getMuscleOpacity("chest")}
                  stroke={getMuscleStroke("chest")}
                  strokeWidth={getMuscleStrokeWidth("chest")}
                  style={{ filter: getMuscleFilter("chest") }}
                >
                  <title>Pectorales (Pecho)</title>
                  {/* Right Upper & Lower Chest */}
                  <path d="m 11.351215,17.085495 -1.7294199,3.09103 -1.890,0.94 0.5,0.3 6.8,-2.1 z" />
                  <path d="m 15.03,19.72 -6.8,2.1 0.65,0.5 0.90586,2.63773 2.0996699,0.86537 3.34636,-1.655 -0.2,-3.8 z" />
                  {/* Left Upper & Lower Chest */}
                  <path d="m 20.337455,17.085495 1.72942,3.09103 1.890,0.94 -0.5,0.3 -6.8, -2.1 z" />
                  <path d="m 16.66,19.72 6.8,2.1 -0.65,0.5 -0.90604,2.63773 -2.09968,0.86537 -3.34524,-1.655 0.2,-3.8 z" />
                </g>

                {/* SHOULDERS (Deltoides Anterior y Lateral) */}
                <g
                  onClick={() => setSelectedMuscleId("shoulders")}
                  onMouseEnter={() => setHoveredMuscleId("shoulders")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("shoulders")}
                  fillOpacity={getMuscleOpacity("shoulders")}
                  stroke={getMuscleStroke("shoulders")}
                  strokeWidth={getMuscleStrokeWidth("shoulders")}
                  style={{ filter: getMuscleFilter("shoulders") }}
                >
                  <title>Hombros (Deltoides)</title>
                  {/* Right Deltoids */}
                  <path d="m 12.624785,13.248365 -3.5574599,1.97916 -0.72653,-0.35074 z m 0.107,0.43288 0.37119,1.73073 -2.18459,0.53561 -1.4011499,-0.49436 z" />
                  <path d="m 8.7502951,15.657195 -0.75814,-0.41 -2.40806,1.66799 -1.17364,1.50707 -0.62662,1.56259 0.0464,3.70195 1.3284,-1.72153 -0.0407,-2.59376 0.48843,-0.5005 c 0,0 3.09777,-3.19057 3.1437,-3.214 z m 0.2409,0.10873 c 0.002,0.0525 -3.32987,3.54733 -3.32987,3.54733 l -0.10067,3.10396 1.15426,-1.97782 2.22547,-0.94804 1.5657499,-2.88481 z" />
                  {/* Left Deltoids */}
                  <path d="m 19.047795,13.248365 3.55748,1.97916 0.72653,-0.35074 z m -0.107,0.43288 -0.37119,1.73073 2.1846,0.53561 1.40116,-0.49436 z" />
                  <path d="m 22.922305,15.657195 0.75814,-0.41 2.40806,1.66799 1.17364,1.50707 0.62662,1.5626 -0.0464,3.70194 -1.3284,-1.72153 0.0407,-2.59376 -0.48842,-0.50049 c 0,0 -3.09778,-3.19058 -3.14371,-3.21401 z m -0.2409,0.10873 c -0.001,0.0525 3.32987,3.54733 3.32987,3.54733 l 0.10067,3.10396 -1.15426,-1.97782 -2.22547,-0.94804 -1.56576,-2.88481 z" />
                </g>

                {/* BICEPS (Bíceps Braquial) */}
                <g
                  onClick={() => setSelectedMuscleId("biceps")}
                  onMouseEnter={() => setHoveredMuscleId("biceps")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("biceps")}
                  fillOpacity={getMuscleOpacity("biceps")}
                  stroke={getMuscleStroke("biceps")}
                  strokeWidth={getMuscleStrokeWidth("biceps")}
                  style={{ filter: getMuscleFilter("biceps") }}
                >
                  <title>Bíceps</title>
                  {/* Right Biceps */}
                  <path d="m 4.0746451,30.814715 0.33838,1.70499 1.81931,-2.54418 0.66289,-1.26895 z m 2.8527,-2.6096 c 0.0259,-0.0144 0.0536,-0.0254 0.0824,-0.0324 l 1.48332,-4.95503 -1.00455,-2.08428 -1.65509,1.74532 -2.23034,6.67667 -0.0415,0.93739 c 1.06528,-0.84215 2.18961,-1.60679 3.36433,-2.28803 z m -1.6945,-5.75654 -1.64891,6.43421 0.36468,-4.92266 z" />
                  {/* Left Biceps */}
                  <path d="m 27.621665,30.814715 -0.33838,1.70499 -1.81932,-2.54418 -0.6629,-1.26895 z m -2.85271,-2.6096 c -0.0259,-0.0144 -0.0536,-0.0254 -0.0824,-0.0324 l -1.48333,-4.95503 1.00456,-2.08428 1.65511,1.74532 2.23034,6.67667 0.0415,0.93739 c -1.06528,-0.84215 -2.18962,-1.60679 -3.36434,-2.28803 z m 1.6945,-5.75654 1.64893,6.43421 -0.36469,-4.92266 z" />
                </g>

                {/* FOREARMS (Antebrazos Anteriores) */}
                <g
                  onClick={() => setSelectedMuscleId("forearms")}
                  onMouseEnter={() => setHoveredMuscleId("forearms")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("forearms")}
                  fillOpacity={getMuscleOpacity("forearms")}
                  stroke={getMuscleStroke("forearms")}
                  strokeWidth={getMuscleStrokeWidth("forearms")}
                  style={{ filter: getMuscleFilter("forearms") }}
                >
                  <title>Antebrazos</title>
                  {/* Right Forearm */}
                  <path d="m 4.5752651,32.969125 -1.30083,10.28927 1.10778,0.01 1.89387,-7.99609 -0.19174,-4.53719 z m -1.21978,-1.94971 0.58728,2.58635 -1.11875,9.15614 -0.55849,-0.21663 -0.2304,-6.77018 z" />
                  {/* Left Forearm */}
                  <path d="m 26.955425,32.969125 1.30083,10.28927 -1.10778,0.01 -1.89387,-7.99609 0.19174,-4.53719 z m 1.21978,-1.94971 -0.58729,2.58635 1.11876,9.15614 0.55849,-0.21663 0.2304,-6.77018 z" />
                </g>

                {/* ABS, SERRATUS & OBLIQUES (Core & Pared Abdominal) */}
                <g
                  onClick={() => setSelectedMuscleId("abs")}
                  onMouseEnter={() => setHoveredMuscleId("abs")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("abs")}
                  fillOpacity={getMuscleOpacity("abs")}
                  stroke={getMuscleStroke("abs")}
                  strokeWidth={getMuscleStrokeWidth("abs")}
                  style={{ filter: getMuscleFilter("abs") }}
                >
                  <title>Abdominales & Oblicuos</title>
                  {/* Rectus Abdominis Superior e Inferior */}
                  <path d="m 12.045985,34.707615 -1.81341,-1.36479 -0.15748,1.83347 -1.2856799,2.37432 1.9804499,2.73595 1.03109,0.16554 0.37119,-3.88721 z" />
                  <path d="m 15.636055,44.919735 -0.60647,-5.91209 -0.015,-3.84879 -2.18479,-1.07533 -0.24746,7.03017 z" />
                  <path d="m 19.641935,34.707615 1.81341,-1.36479 0.15748,1.83347 1.28642,2.37338 -1.98044,2.73652 -1.03109,0.16554 -0.37026,-3.88816 z" />
                  <path d="m 16.051865,44.919165 0.60628,-5.91209 0.0154,-3.84915 2.18404,-1.07515 0.24746,7.03017 z" />

                  {/* Serratus Anterior (Dientes torácicos) */}
                  <path d="m 12.399365,26.152365 3.11202,-1.40603 -0.0937,2.27965 -2.80138,1.4364 z m -1.93508,1.6685 1.29355,0.72139 -0.14997,-1.70899 z m 1.05303,-1.637 -2.4793099,-1.03259 0.93361,2.52148 z m -1.5316399,1.73729 1.6900499,1.03372 0.28871,2.06743 -1.64881,-1.07515 z" />
                  <path d="M 19.289,26.152 l -3.11202 -1.40604 0.0937 2.27965 2.80119 1.43603 z M 21.224,27.820 l -1.29355 0.7212 0.14997 -1.70898 z M 20.171,26.183 l 2.47968 -1.03241 -0.9336 2.52093 z M 21.702,27.921 l -1.69005 1.03372 -0.28871 2.0678 1.64975 -1.07533 z" />

                  {/* Oblicuos Externos */}
                  <path d="M 12.897,29.025 l 0.0623 1.62387 2.30327 -0.49961 0.12448 -2.21703 z M 13.053,31.430 l -0.0309 1.99844 2.20973 0.59353 0.0311 -3.1227 z M 10.398,30.445 l 1.48384 1.0339 0.20622 2.10905 -1.64975 -1.32355 z" />
                  <path d="M 18.791,29.025 l -0.0622 1.62387 -2.30308 -0.49961 -0.12448 -2.21722 z M 18.635,31.429 l 0.0311 1.99844 -2.20953 0.59391 -0.0311 -3.1227 z M 21.290,30.444 l -1.48383 1.03372 -0.20622 2.10905 1.64862 -1.32355 z" />
                </g>

                {/* QUADS (Cuádriceps, Aductores y Flexores de Cadera) */}
                <g
                  onClick={() => setSelectedMuscleId("quads")}
                  onMouseEnter={() => setHoveredMuscleId("quads")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("quads")}
                  fillOpacity={getMuscleOpacity("quads")}
                  stroke={getMuscleStroke("quads")}
                  strokeWidth={getMuscleStrokeWidth("quads")}
                  style={{ filter: getMuscleFilter("quads") }}
                >
                  <title>Cuádriceps & Aductores</title>
                  {/* Right Quadriceps & Adductors */}
                  <path d="m 8.2694651,50.399125 0.15504,4.75053 2.4026299,6.60968 -0.73638,1.90021 -2.3640099,-8.34435 z m 0.58117,-11.60768 0.15503,4.00684 -1.31754,7.93154 -0.61978,-6.40308 z m 0.38769,5.1223 2.7515099,6.07239 0.61997,4.87425 -1.16232,6.85771 -2.5190499,-6.98163 -0.15504,-7.18801 z" />
                  <path d="m 9.6258251,39.369415 v 4.21363 l 2.9451699,5.8253 1.86028,5.78349 -0.19366,-4.0072 z m 3.2488699,13.42559 0.0647,0.15485 1.21294,2.90207 -0.78307,7.18803 -1.23618,-0.66102 1.0714,-6.69273 z" />
                  <path d="m 14.404465,45.040075 0.0221,-0.0277 -0.14866,-0.37945 -3.10172,-3.40449 -0.23283,-0.0825 2.05918,5.32009 z m -1.17263,2.01833 1.27705,3.29948 0.42631,-4.04862 -0.25196,-0.64303 z" />

                  {/* Left Quadriceps & Adductors */}
                  <path d="m 23.419015,50.399125 -0.15504,4.75091 -2.40263,6.60949 0.7362,1.90021 2.36401,-8.34435 z m -0.58154,-11.60825 -0.15485,4.00722 1.31793,7.93154 0.61977,-6.40308 z m -0.38731,5.12268 -2.75152,6.07258 -0.62015,4.87425 1.16232,6.85771 2.51886,-6.98144 0.15504,-7.18764 z" />
                  <path d="m 22.063225,39.369605 v 4.21363 l -2.94574,5.82511 -1.86027,5.78349 0.19365,-4.0072 z m -3.24944,13.42596 -0.0649,0.15467 -1.21294,2.90207 0.78325,7.18803 1.23619,-0.66122 -1.0714,-6.69272 z" />
                  <path d="m 17.284025,45.040455 -0.0221,-0.0281 0.14867,-0.37926 3.10171,-3.40449 0.23246,-0.0825 -2.05843,5.3199 z m 1.17263,2.01795 -1.27706,3.29948 -0.42631,-4.04843 0.25197,-0.64303 z" />
                </g>

                {/* CALVES (Tibialis Anterior & Gemelos Frontales) */}
                <g
                  onClick={() => setSelectedMuscleId("calves")}
                  onMouseEnter={() => setHoveredMuscleId("calves")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("calves")}
                  fillOpacity={getMuscleOpacity("calves")}
                  stroke={getMuscleStroke("calves")}
                  strokeWidth={getMuscleStrokeWidth("calves")}
                  style={{ filter: getMuscleFilter("calves") }}
                >
                  <title>Gemelos & Tibiales</title>
                  {/* Right Tibialis Anterior */}
                  <path d="m 13.437675,70.440945 -0.29058,0.91486 -0.62241,3.86828 -0.0829,5.15733 0.87174,5.03304 -0.0418,-6.44714 0.91298,-2.57848 0.1243,-2.82837 z m -1.99151,2.32914 0.20735,7.73637 1.65968,6.23904 -1.80497,-0.85299 -3.0079799,-10.83584 1.03728,-6.82095 z" />
                  {/* Left Tibialis Anterior */}
                  <path d="m 18.251375,70.441125 0.29058,0.91486 0.6224,3.8681 0.0829,5.15733 -0.87136,5.03304 0.0412,-6.44714 -0.91242,-2.57848 -0.12561,-2.82837 z m 1.9915,2.32915 -0.20753,7.73637 -1.65949,6.23904 1.80478,-0.853 3.00816,-10.83583 -1.03727,-6.82095 z" />
                </g>
              </svg>
            ) : (
              /* ========================================================================= */
              /* POSTERIOR / DORSAL VIEW SVG (High-Definition Medical Anatomy Dataset)     */
              /* ========================================================================= */
              <svg
                viewBox="37 0 35 93"
                className="w-full h-auto max-h-90 select-none filter drop-shadow-md"
              >
                {/* HUD Matrix Lines */}
                <g opacity="0.1" stroke="#D99B43" strokeWidth="0.2" strokeDasharray="0.6,0.8">
                  <line x1="54.5" y1="2" x2="54.5" y2="91" />
                  <line x1="41" y1="18" x2="68" y2="18" />
                  <line x1="41" y1="36" x2="68" y2="36" />
                  <line x1="43" y1="65" x2="66" y2="65" />
                </g>

                {/* 1. Base Neutral Anatomical Structures (Cranium, Nape, Spine, Joints, Hands, Feet) */}
                <g fill="#22201D" stroke="#38332B" strokeWidth="0.12">
                  {/* Posterior Head & Occipital Bone */}
                  <path d="m 48.157455,6.3585449 0.44208,-0.14964 0.16111,0.16427 1.48163,4.0475101 2.32401,1.45118 2.39971,-1.52387 0.97577,-3.6896901 0.52752,-0.55908 0.23367,0.0981 0.24198,-3.34467 -2.03129,-2.31103004 -2.84509,-0.51629 -2.20422,0.52915 -1.93631,2.63077004 z" />
                  {/* Nape / Nuca */}
                  <path d="m 52.369695,12.105075 -2.35767,-1.55045 -1.47119,-3.9514301 -0.60741,0.0403 0.27409,1.82447 0.97635,0.33932 0.7613,2.2157201 0.33017,1.06849 0.0895,2.14894 1.16448,0.008 0.10563,-0.70833 0.54716,-0.0606 z m 1.01793,1.47595 0.23768,0.64982 1.38107,-0.004 0.01,-2.38784 0.25971,-0.79061 0.57215,-2.1698001 0.76359,-0.41018 0.25158,-1.78416 -0.62859,0.0193 -1.08488,3.8998101 -2.39725,1.46684 0.2768,1.48507 z" />
                  {/* Columna Vertebral / Spine */}
                  <path d="m 51.733705,14.788555 0.53876,25.33066 0.48967,-0.0297 0.65658,-25.3387 -0.28147,-0.84188 -1.25059,-4.9e-4 z" />
                  {/* Posterior Hands */}
                  <path d="M 40.716955,42.424835 l -1.5182,0.0863 -0.78184,-0.65295 -1.16168,2.1855 -0.78414,3.34805 0.49892,0.20949 0.54632,-2.2158 0.50597,0.24175 -0.29779,2.5019 0.62936,0.22875 0.35546,-2.50096 0.56242,0.16536 -0.16126,2.77057 0.77674,0.30455 0.19056,-2.87291 0.45724,-0.0289 0.22827,2.64778 0.66597,0.24774 -0.0359,-4.56685 0.33693,-0.20224 1.39227,1.65147 0.32017,-0.35115 -0.77444,-2.03749 z" />
                  <path d="M 64.301385,42.592325 l 1.51839,0.0828 0.78033,-0.65476 1.16673,2.18281 0.79187,3.34623 -0.49843,0.21064 -0.55144,-2.21453 -0.50541,0.24292 0.30356,2.5012 -0.62882,0.23021 -0.36124,-2.50014 -0.56203,0.16666 0.16765,2.77019 -0.77603,0.30634 -0.19719,-2.87245 -0.45732,-0.0278 -0.22215,2.64829 -0.66539,0.24928 0.0254,-4.56692 -0.3374,-0.20146 -1.38845,1.65469 -0.32098,-0.35041 0.76973,-2.03928 z" />
                  {/* Posterior Knees */}
                  <path d="m 51.176145,64.073985 -1.20605,3.01461 0.70738,0.26558 0.89754,3.51771 -0.55801,-4.01191 z m -5.08496,-3.15003 0.63355,1.8609 0.16813,2.03261 0.61314,1.93117 -0.90585,-0.0851 -0.28534,2.15982 z" />
                  <path d="m 54.019305,64.073985 1.20605,3.01461 -0.70737,0.26558 -0.89755,3.51771 0.55802,-4.01191 z m 5.08496,-3.15003 -0.63355,1.8609 -0.16813,2.03261 -0.61313,1.93117 0.90584,-0.0851 0.28534,2.15982 z" />
                  {/* Posterior Feet & Calcaneus */}
                  <path d="M 50.933115,88.340995 l 0.85194,1.3581 0.37189,0.79238 -0.15588,1.21774 -0.76984,0.74446 -1.51185,0.12543 -1.1299,-0.29192 -0.24225,-0.95894 0.80765,-1.30405 -0.22562,-0.85987 0.29679,-0.84153 -0.0194,-1.81524 1.53568,-0.54817 z m -1.19598,0.4675 0.15943,1.25776 -0.6023,0.97431 m -0.54436,0.29544 1.06474,0.40084 1.55326,-0.65137 z" />
                  <path d="M 54.262335,88.340995 l -0.85194,1.3581 -0.37189,0.79238 0.15589,1.21774 0.76983,0.74446 1.51186,0.12543 1.12989,-0.29192 0.24225,-0.95894 -0.80765,-1.30405 0.22563,-0.85987 -0.29679,-0.84153 0.0194,-1.81524 -1.53568,-0.54817 z m 1.19598,0.4675 -0.15943,1.25776 0.6023,0.97431 m 0.54436,0.29544 -1.06474,0.40084 -1.55326,-0.65137 z" />
                </g>

                {/* 2. Interactive Posterior Muscle Groups */}

                {/* UPPER BACK (Trapecios en Diamante: Superior, Medio, Inferior + Erectores) */}
                <g
                  onClick={() => setSelectedMuscleId("upper_back")}
                  onMouseEnter={() => setHoveredMuscleId("upper_back")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("upper_back")}
                  fillOpacity={getMuscleOpacity("upper_back")}
                  stroke={getMuscleStroke("upper_back")}
                  strokeWidth={getMuscleStrokeWidth("upper_back")}
                  style={{ filter: getMuscleFilter("upper_back") }}
                >
                  <title>Espalda Alta & Trapecios</title>
                  {/* Left Trapezius */}
                  <path d="M 49.625,14.629 L 49.688,12.005 L 48.974,13.157 L 44.594,14.654 L 45.945,16.925 L 51.222,16.925 L 51.183,14.550 Z" />
                  <path d="M 46.034,17.075 L 48.920,21.925 L 51.303,21.925 L 51.224,17.075 Z" />
                  <path d="M 49.009,22.075 L 49.572,23.022 L 51.403,28.104 L 51.305,22.075 Z" />
                  {/* Right Trapezius */}
                  <path d="M 55.439,14.729 L 55.376,12.104 L 56.090,13.256 L 60.470,14.754 L 59.179,16.925 L 53.844,16.925 L 53.881,14.649 Z" />
                  <path d="M 59.089,17.075 L 56.204,21.925 L 53.763,21.925 L 53.842,17.075 Z" />
                  <path d="M 56.114,22.075 L 55.492,23.121 L 53.661,28.203 L 53.761,22.075 Z" />

                  {/* Erector Spinae & Quadratus Lumborum (Lower Back Base) */}
                  <path d="M 52.100,37.310 L 49.537,36.465 L 50.244,40.788 L 52.200,42.030 L 52.200,40.270 L 52.150,40.280 Z" />
                  <path d="M 49.389,36.490 L 46.240,35.460 L 44.720,39.420 L 50.096,40.812 Z" />
                  <path d="M 52.800,42.030 L 52.800,40.270 L 52.850,40.260 L 52.900,37.290 L 55.289,36.625 L 54.805,40.801 Z" />
                  <path d="M 55.439,36.643 L 55.980,36.470 L 58.320,35.720 L 59.660,39.450 L 54.955,40.819 Z" />
                </g>

                {/* REAR DELTOIDS (Deltoides Posterior) */}
                <g
                  onClick={() => setSelectedMuscleId("shoulders")}
                  onMouseEnter={() => setHoveredMuscleId("shoulders")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("shoulders")}
                  fillOpacity={getMuscleOpacity("shoulders")}
                  stroke={getMuscleStroke("shoulders")}
                  strokeWidth={getMuscleStrokeWidth("shoulders")}
                  style={{ filter: getMuscleFilter("shoulders") }}
                >
                  <title>Deltoides Posterior</title>
                  <path d="M 42.201,16.586 L 40.626,18.152 L 39.736,20.156 L 43.992,15.155 Z" />
                  <path d="M 62.863,16.686 L 64.438,18.251 L 65.328,20.255 L 61.073,15.254 Z" />
                </g>

                {/* LATS (Dorsal Ancho / V-Taper Wings) */}
                <g
                  onClick={() => setSelectedMuscleId("lats")}
                  onMouseEnter={() => setHoveredMuscleId("lats")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("lats")}
                  fillOpacity={getMuscleOpacity("lats")}
                  stroke={getMuscleStroke("lats")}
                  strokeWidth={getMuscleStrokeWidth("lats")}
                  style={{ filter: getMuscleFilter("lats") }}
                >
                  <title>Dorsales (Lats)</title>
                  {/* Left Latissimus */}
                  <path d="M 44.144,15.285 L 39.888,20.286 L 39.426,22.749 L 41.263,21.510 L 44.025,20.355 L 45.663,23.400 L 49.103,23.400 Z" />
                  <path d="M 45.771,23.600 L 45.872,23.789 L 47.009,29.286 L 47.023,30.400 L 51.080,30.400 L 51.053,28.314 L 49.185,23.600 Z" />
                  <path d="M 47.026,30.600 L 47.086,35.145 L 51.156,36.255 L 51.082,30.600 Z" />

                  {/* Right Latissimus */}
                  <path d="M 60.921,15.384 L 65.176,20.385 L 65.290,22.849 L 63.801,21.609 L 61.039,20.454 L 59.455,23.400 L 56.022,23.400 Z" />
                  <path d="M 59.347,23.600 L 59.192,23.888 L 58.055,29.385 L 58.042,30.400 L 53.986,30.400 L 54.012,28.413 L 55.918,23.600 Z" />
                  <path d="M 58.039,30.600 L 57.979,35.245 L 53.908,36.354 L 53.983,30.600 Z" />
                </g>

                {/* TRICEPS (Tríceps Braquial: Cabeza Larga y Cabeza Lateral) */}
                <g
                  onClick={() => setSelectedMuscleId("triceps")}
                  onMouseEnter={() => setHoveredMuscleId("triceps")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("triceps")}
                  fillOpacity={getMuscleOpacity("triceps")}
                  stroke={getMuscleStroke("triceps")}
                  strokeWidth={getMuscleStrokeWidth("triceps")}
                  style={{ filter: getMuscleFilter("triceps") }}
                >
                  <title>Tríceps</title>
                  {/* Left Triceps */}
                  <path d="M 43.593,21.039 L 44.920,23.967 L 43.615,25.653 L 43.186,27.069 L 39.209,29.802 Z" />
                  <path d="M 43.459,20.972 L 39.075,29.735 L 38.871,25.461 L 39.407,23.674 L 41.242,21.927 Z" />
                  {/* Right Triceps */}
                  <path d="M 61.376,21.213 L 60.056,24.145 L 61.330,26.199 L 61.657,27.251 L 65.780,29.966 Z" />
                  <path d="M 61.510,21.146 L 65.914,29.899 L 66.108,25.624 L 65.568,23.839 L 63.729,22.096 Z" />
                </g>

                {/* FOREARMS (Extensores & Flexores de Antebrazo Posterior) */}
                <g
                  onClick={() => setSelectedMuscleId("forearms")}
                  onMouseEnter={() => setHoveredMuscleId("forearms")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("forearms")}
                  fillOpacity={getMuscleOpacity("forearms")}
                  stroke={getMuscleStroke("forearms")}
                  strokeWidth={getMuscleStrokeWidth("forearms")}
                  style={{ filter: getMuscleFilter("forearms") }}
                >
                  <title>Antebrazos (Posterior)</title>
                  {/* Left Forearm Extensors/Flexors */}
                  <path d="M 40.775,29.006 L 42.870,27.644 L 42.187,29.635 L 42.603,34.383 L 40.799,42.081 L 39.814,42.253 Z" />
                  <path d="M 39.665,42.242 L 38.305,41.501 L 37.998,34.491 L 38.635,31.429 L 39.245,30.209 L 40.625,28.994 Z" />
                  {/* Right Forearm Extensors/Flexors */}
                  <path d="M 65.204,42.420 L 63.925,29.007 L 61.764,27.798 L 62.786,29.733 L 62.397,34.555 L 64.219,42.248 Z" />
                  <path d="M 64.075,28.993 L 65.353,42.405 L 66.712,41.663 L 67.002,34.653 L 66.358,31.591 L 65.745,30.373 Z" />
                </g>

                {/* GLUTES (Glúteo Mayor y Medio) */}
                <g
                  onClick={() => setSelectedMuscleId("glutes")}
                  onMouseEnter={() => setHoveredMuscleId("glutes")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("glutes")}
                  fillOpacity={getMuscleOpacity("glutes")}
                  stroke={getMuscleStroke("glutes")}
                  strokeWidth={getMuscleStrokeWidth("glutes")}
                  style={{ filter: getMuscleFilter("glutes") }}
                >
                  <title>Glúteos</title>
                  {/* Left Gluteus Medius & Maximus */}
                  <path d="M 50.191,41.481 L 44.740,39.690 L 43.830,41.580 L 43.431,44.301 Z" />
                  <path d="M 50.249,41.619 L 43.489,44.439 L 44.410,50.520 L 47.180,51.030 L 51.620,49.090 L 52.200,49.480 L 52.200,42.880 Z" />
                  {/* Right Gluteus Medius & Maximus */}
                  <path d="M 55.274,41.079 L 61.354,45.519 L 60.640,42.150 L 59.740,39.860 Z" />
                  <path d="M 55.186,41.201 L 52.800,42.880 L 52.800,49.480 L 53.570,49.090 L 57.680,50.760 L 60.500,50.600 L 61.266,45.641 Z" />
                </g>

                {/* HAMSTRINGS (Isquiotibiales: Semitendinoso, Semimembranoso, Bíceps Femoral) */}
                <g
                  onClick={() => setSelectedMuscleId("hamstrings")}
                  onMouseEnter={() => setHoveredMuscleId("hamstrings")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("hamstrings")}
                  fillOpacity={getMuscleOpacity("hamstrings")}
                  stroke={getMuscleStroke("hamstrings")}
                  strokeWidth={getMuscleStrokeWidth("hamstrings")}
                  style={{ filter: getMuscleFilter("hamstrings") }}
                >
                  <title>Isquiotibiales (Femorales)</title>
                  {/* Left Hamstrings */}
                  <path d="M 49.550,50.504 L 51.751,49.461 L 52.389,49.692 L 52.424,51.499 L 52.499,56.145 L 50.521,62.188 L 50.997,63.602 L 49.569,66.897 L 48.755,66.754 Z" />
                  <path d="M 49.400,50.496 L 48.605,66.746 L 47.803,66.596 L 47.302,64.480 L 47.133,62.723 L 44.712,54.565 L 44.369,50.918 L 47.200,51.500 Z" />
                  {/* Right Hamstrings */}
                  <path d="M 57.425,51.196 L 56.565,66.806 L 55.759,66.965 L 54.331,63.670 L 54.807,62.256 L 52.829,56.213 L 52.904,51.567 L 52.956,49.769 L 53.520,49.498 Z" />
                  <path d="M 57.575,51.204 L 60.625,50.950 L 60.616,54.633 L 58.195,62.791 L 58.026,64.547 L 57.525,66.663 L 56.715,66.814 Z" />
                </g>

                {/* CALVES (Gemelos Posteriores: Gastrocnemio Medial/Lateral y Sóleo) */}
                <g
                  onClick={() => setSelectedMuscleId("calves")}
                  onMouseEnter={() => setHoveredMuscleId("calves")}
                  onMouseLeave={() => setHoveredMuscleId(null)}
                  className="cursor-pointer transition-all duration-150"
                  fill={getMuscleFill("calves")}
                  fillOpacity={getMuscleOpacity("calves")}
                  stroke={getMuscleStroke("calves")}
                  strokeWidth={getMuscleStrokeWidth("calves")}
                  style={{ filter: getMuscleFilter("calves") }}
                >
                  <title>Gemelos & Sóleo</title>
                  {/* Left Gastrocnemius & Soleus */}
                  <path d="M 50.568,67.512 L 51.669,72.509 L 51.379,75.532 L 51.292,76.825 L 48.983,76.825 Z" />
                  <path d="M 50.218,67.512 L 48.633,76.825 L 46.283,76.825 L 45.533,74.263 L 46.783,67.088 Z" />
                  <path d="M 46.386,77.175 L 51.269,77.175 L 50.701,85.598 L 49.037,86.233 Z" />

                  {/* Right Gastrocnemius & Soleus */}
                  <path d="M 54.628,67.512 L 53.526,72.509 L 53.816,75.532 L 53.903,76.825 L 56.213,76.825 Z" />
                  <path d="M 54.978,67.512 L 56.563,76.825 L 58.912,76.825 L 59.662,74.263 L 58.412,67.088 Z" />
                  <path d="M 53.927,77.175 L 58.810,77.175 L 56.158,86.233 L 54.495,85.598 Z" />
                </g>
              </svg>
            )}
          </div>

          <div className="text-center text-[11px] text-[#8E867B] font-mono">
            {hoveredMuscleId
              ? `Inspeccionando: ${recoverySummary.muscles[hoveredMuscleId]?.name || hoveredMuscleId}`
              : "Toca cualquier músculo para inspeccionar su estado"}
          </div>
        </div>

        {/* Right Column: Muscle Inspector & Dynamic Biohacking Panel */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Active Muscle Card */}
          <div
            className={`rounded-xl border ${getStateColor(selectedMuscle.state).border} bg-[#121110] p-5 flex flex-col gap-4 shadow-sm`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2A2723]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-lg font-bold text-[#F5F2EB]">
                    {selectedMuscle.name}
                  </h4>
                  <span className="text-xs font-mono text-[#8E867B]">
                    ({selectedMuscle.nameEn})
                  </span>
                </div>
                <div className="text-xs text-[#8E867B] font-mono mt-0.5">
                  Categoría:{" "}
                  {selectedMuscle.category === "upper_push"
                    ? "Empuje Superior"
                    : selectedMuscle.category === "upper_pull"
                    ? "Tracción Superior"
                    : selectedMuscle.category === "lower"
                    ? "Tren Inferior / Pierna"
                    : "Core & Abdomen"}
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${
                  getStateColor(selectedMuscle.state).badgeBg
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    getStateColor(selectedMuscle.state).progressBg
                  } animate-pulse`}
                />
                <span>{getStateColor(selectedMuscle.state).label}</span>
              </div>
            </div>

            {/* Recovery Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E867B]">Nivel de Recuperación</span>
                <span className={`font-bold ${getStateColor(selectedMuscle.state).text}`}>
                  {selectedMuscle.recoveryPercent}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#181715] overflow-hidden border border-[#2A2723]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    getStateColor(selectedMuscle.state).progressBg
                  }`}
                  style={{ width: `${selectedMuscle.recoveryPercent}%` }}
                />
              </div>
            </div>

            {/* Recovery Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="rounded-lg bg-[#181715] border border-[#2A2723] p-2.5">
                <div className="text-[10px] font-mono text-[#8E867B] uppercase">Último Estímulo</div>
                <div className="text-xs font-mono font-bold text-[#F5F2EB] mt-0.5">
                  {selectedMuscle.hoursSinceLastTrained !== undefined
                    ? selectedMuscle.hoursSinceLastTrained < 24
                      ? `Hace ${selectedMuscle.hoursSinceLastTrained}h`
                      : `Hace ${Math.round(selectedMuscle.hoursSinceLastTrained / 24)}d`
                    : "Sin registro"}
                </div>
              </div>

              <div className="rounded-lg bg-[#181715] border border-[#2A2723] p-2.5">
                <div className="text-[10px] font-mono text-[#8E867B] uppercase">Tiempo a 100%</div>
                <div className="text-xs font-mono font-bold text-[#F5F2EB] mt-0.5">
                  {selectedMuscle.hoursToFullRecovery > 0
                    ? `~${selectedMuscle.hoursToFullRecovery} horas`
                    : "Listo ✅"}
                </div>
              </div>

              <div className="rounded-lg bg-[#181715] border border-[#2A2723] p-2.5">
                <div className="text-[10px] font-mono text-[#8E867B] uppercase">Series (7d)</div>
                <div className="text-xs font-mono font-bold text-[#F5F2EB] mt-0.5">
                  {selectedMuscle.totalSetsLast7Days} series
                </div>
              </div>

              <div className="rounded-lg bg-[#181715] border border-[#2A2723] p-2.5">
                <div className="text-[10px] font-mono text-[#8E867B] uppercase">Volumen (7d)</div>
                <div className="text-xs font-mono font-bold text-[#F5F2EB] mt-0.5">
                  {selectedMuscle.totalVolumeLast7Days.toLocaleString("es-MX")} kg
                </div>
              </div>
            </div>

            {/* Scientific Recommendation Alert */}
            <div className="rounded-lg bg-[#181715] border border-[#2A2723] p-3.5 flex items-start gap-3">
              <Info className="h-4 w-4 text-[#D99B43] mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed text-[#DDD6C9]">
                <span className="font-semibold text-[#F5F2EB]">Prescripción de Entrenamiento: </span>
                {selectedMuscle.recommendation}
              </div>
            </div>

            {/* Last workout & exercises involved */}
            {selectedMuscle.recentExercises.length > 0 && (
              <div className="pt-2 border-t border-[#2A2723]/60 flex flex-col gap-1.5">
                <div className="text-[11px] font-mono text-[#8E867B]">
                  Ejercicios recientes que activaron este grupo:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMuscle.recentExercises.map((ex) => (
                    <span
                      key={ex}
                      className="inline-flex items-center gap-1 rounded bg-[#221D16] border border-[#2A2723] px-2 py-0.5 text-[11px] font-mono text-[#DDD6C9]"
                    >
                      <Dumbbell className="h-3 w-3 text-[#D99B43]" />
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Muscle Selector Pills */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono text-[#8E867B] uppercase tracking-wider flex items-center justify-between">
              <span>Todos los Grupos Musculares</span>
              <span className="text-[10px] text-[#D99B43]">{filteredMuscles.length} grupos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredMuscles.map((m) => {
                const isSelected = m.id === selectedMuscleId;
                const stateConfig = getStateColor(m.state);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMuscleId(m.id);
                      if (
                        m.id === "upper_back" ||
                        m.id === "lats" ||
                        m.id === "triceps" ||
                        m.id === "glutes" ||
                        m.id === "hamstrings"
                      ) {
                        setViewMode("posterior");
                      } else {
                        setViewMode("anterior");
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#221D16] border-[#D99B43] shadow-xs"
                        : "bg-[#121110] border-[#2A2723] hover:border-[#3A3630]"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#F5F2EB]">{m.name}</span>
                      <span className="text-[10px] font-mono text-[#8E867B]">{m.nameEn}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono font-bold ${stateConfig.text}`}>
                        {m.recoveryPercent}%
                      </span>
                      <div className={`h-2 w-2 rounded-full ${stateConfig.progressBg}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
