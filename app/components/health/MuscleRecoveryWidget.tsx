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
          glow: "rgba(239, 68, 68, 0.65)",
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
          glow: "rgba(245, 158, 11, 0.55)",
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
          glow: "rgba(16, 185, 129, 0.55)",
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
          glow: "rgba(14, 165, 233, 0.45)",
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
    if (!m) return "#22201D";
    const colors = getStateColor(m.state);
    return colors.fill;
  };

  const getMuscleGlow = (mId: MuscleGroupId) => {
    const m = recoverySummary.muscles[mId];
    if (!m) return "none";
    const colors = getStateColor(m.state);
    const isSelected = selectedMuscleId === mId;
    return isSelected
      ? `drop-shadow(0 0 12px ${colors.fill}) drop-shadow(0 0 4px ${colors.fill})`
      : `drop-shadow(0 0 4px ${colors.glow})`;
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
              Estado de fatiga biológica, sobrecarga y tiempo restante de síntesis proteica
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

          {/* SVG Anatomical Mannequin with High-Definition Biomechanical Paths */}
          <div className="relative w-full max-w-70 py-3 flex items-center justify-center">
            {viewMode === "anterior" ? (
              /* ANTERIOR / FRONTAL VIEW SVG */
              <svg
                viewBox="0 0 240 380"
                className="w-full h-auto max-h-90 drop-shadow-lg select-none"
              >
                {/* Background HUD Grid Lines */}
                <g opacity="0.15" stroke="#D99B43" strokeWidth="0.5" strokeDasharray="2,4">
                  <line x1="120" y1="10" x2="120" y2="370" />
                  <line x1="30" y1="95" x2="210" y2="95" />
                  <line x1="30" y1="170" x2="210" y2="170" />
                  <line x1="40" y1="260" x2="200" y2="260" />
                </g>

                {/* Body Base Silhouette (Athletic Mannequin Outline) */}
                <path
                  d="M 120 12 C 129 12, 136 18, 136 28 C 136 38, 130 46, 126 48 L 126 54 C 146 54, 172 58, 184 66 C 196 74, 198 94, 192 116 C 188 132, 198 164, 194 198 C 192 208, 184 212, 178 206 C 172 198, 174 176, 170 162 L 160 160 C 168 184, 172 220, 166 250 C 160 274, 154 274, 156 294 C 160 320, 158 350, 150 366 C 144 372, 134 372, 136 358 C 138 336, 134 300, 134 276 L 124 200 L 116 200 L 106 276 C 106 300, 102 336, 104 358 C 106 372, 96 372, 90 366 C 82 350, 80 320, 84 294 C 86 274, 80 274, 74 250 C 68 220, 72 184, 80 160 L 70 162 C 66 176, 68 198, 62 206 C 56 212, 48 208, 46 198 C 42 164, 52 132, 48 116 C 42 94, 44 74, 56 66 C 68 58, 94 54, 114 54 L 114 48 C 110 46, 104 38, 104 28 C 104 18, 111 12, 120 12 Z"
                  fill="#1B1916"
                  stroke="#2D2822"
                  strokeWidth="1.2"
                />

                {/* Head, Chin & Neck Structure */}
                <ellipse cx="120" cy="27" rx="12" ry="14" fill="#22201D" stroke="#38332B" strokeWidth="1.2" />
                <path d="M 114 39 L 126 39 L 128 50 L 112 50 Z" fill="#22201D" stroke="#38332B" strokeWidth="1" />
                {/* Clavicles (Collarbones) */}
                <path d="M 118 52 C 104 53, 86 57, 72 61" stroke="#38332B" strokeWidth="1" fill="none" />
                <path d="M 122 52 C 136 53, 154 57, 168 61" stroke="#38332B" strokeWidth="1" fill="none" />

                {/* CHEST / PECTORALES */}
                <g
                  onClick={() => setSelectedMuscleId("chest")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02] transform-origin-center"
                  style={{ filter: getMuscleGlow("chest") }}
                >
                  {/* Left Pec */}
                  <path
                    d="M 118 55 C 105 54, 82 58, 75 66 C 68 74, 72 96, 92 98 C 108 100, 118 92, 118 80 Z"
                    fill={getMuscleFill("chest")}
                    opacity={selectedMuscleId === "chest" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Pec */}
                  <path
                    d="M 122 55 C 135 54, 158 58, 165 66 C 172 74, 168 96, 148 98 C 132 100, 122 92, 122 80 Z"
                    fill={getMuscleFill("chest")}
                    opacity={selectedMuscleId === "chest" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* SHOULDERS / DELTOIDES (ANTERIOR & LATERAL HEADS) */}
                <g
                  onClick={() => setSelectedMuscleId("shoulders")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("shoulders") }}
                >
                  {/* Left Deltoid */}
                  <path
                    d="M 72 61 C 60 62, 48 72, 46 86 C 44 98, 54 106, 62 100 C 68 94, 72 82, 74 69 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Deltoid */}
                  <path
                    d="M 168 61 C 180 62, 192 72, 194 86 C 196 98, 186 106, 178 100 C 172 94, 168 82, 166 69 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* BICEPS BRACHII */}
                <g
                  onClick={() => setSelectedMuscleId("biceps")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("biceps") }}
                >
                  {/* Left Bicep */}
                  <path
                    d="M 60 102 C 52 106, 48 124, 54 140 C 60 144, 68 138, 70 124 C 72 112, 68 104, 60 102 Z"
                    fill={getMuscleFill("biceps")}
                    opacity={selectedMuscleId === "biceps" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Bicep */}
                  <path
                    d="M 180 102 C 188 106, 192 124, 186 140 C 180 144, 172 138, 170 124 C 168 112, 172 104, 180 102 Z"
                    fill={getMuscleFill("biceps")}
                    opacity={selectedMuscleId === "biceps" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* FOREARMS / ANTEBRAZOS */}
                <g
                  onClick={() => setSelectedMuscleId("forearms")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("forearms") }}
                >
                  {/* Left Forearm */}
                  <path
                    d="M 52 144 C 44 150, 42 178, 48 200 C 54 204, 60 196, 62 176 C 64 158, 60 148, 52 144 Z"
                    fill={getMuscleFill("forearms")}
                    opacity={selectedMuscleId === "forearms" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Forearm */}
                  <path
                    d="M 188 144 C 196 150, 198 178, 192 200 C 186 204, 180 196, 178 176 C 176 158, 180 148, 188 144 Z"
                    fill={getMuscleFill("forearms")}
                    opacity={selectedMuscleId === "forearms" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* ABS & OBLIQUES (ANTERIOR CORE) */}
                <g
                  onClick={() => setSelectedMuscleId("abs")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("abs") }}
                >
                  {/* Upper Abs (Pair 1) */}
                  <path
                    d="M 104 104 C 104 101, 116 101, 117 104 L 117 119 C 117 122, 104 122, 104 119 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 123 104 C 123 101, 135 101, 136 104 L 136 119 C 136 122, 123 122, 123 119 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.2"
                  />

                  {/* Mid Abs (Pair 2) */}
                  <path
                    d="M 104 123 C 104 120, 116 120, 117 123 L 117 139 C 117 142, 104 142, 104 139 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 123 123 C 123 120, 135 120, 136 123 L 136 139 C 136 142, 123 142, 123 139 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.2"
                  />

                  {/* Lower Abs & Iliac V-Taper (Pair 3) */}
                  <path
                    d="M 104 143 C 104 141, 116 141, 117 143 L 116 164 C 112 168, 106 164, 104 158 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 123 143 C 123 141, 135 141, 136 143 L 136 158 C 134 164, 128 168, 124 164 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.2"
                  />

                  {/* External Obliques / Serratus */}
                  <path
                    d="M 88 108 C 82 120, 84 142, 98 156 C 100 152, 98 136, 100 120 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 0.9 : 0.75}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                  <path
                    d="M 152 108 C 158 120, 156 142, 142 156 C 140 152, 142 136, 140 120 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 0.9 : 0.75}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                </g>

                {/* QUADS / CUÁDRICEPS (RECTUS FEMORIS & VASTUS) */}
                <g
                  onClick={() => setSelectedMuscleId("quads")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("quads") }}
                >
                  {/* Left Quad */}
                  <path
                    d="M 88 174 C 76 182, 70 216, 76 248 C 82 258, 96 260, 104 246 C 108 238, 110 212, 110 186 C 104 178, 94 174, 88 174 Z"
                    fill={getMuscleFill("quads")}
                    opacity={selectedMuscleId === "quads" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Quad */}
                  <path
                    d="M 152 174 C 164 182, 170 216, 164 248 C 158 258, 144 260, 136 246 C 132 238, 130 212, 130 186 C 136 178, 146 174, 152 174 Z"
                    fill={getMuscleFill("quads")}
                    opacity={selectedMuscleId === "quads" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Knee Caps (Patella Bones) */}
                <circle cx="89" cy="262" r="5" fill="#22201D" stroke="#38332B" strokeWidth="1" />
                <circle cx="151" cy="262" r="5" fill="#22201D" stroke="#38332B" strokeWidth="1" />

                {/* CALVES / GEMELOS & TIBIALIS (ANTERIOR) */}
                <g
                  onClick={() => setSelectedMuscleId("calves")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("calves") }}
                >
                  {/* Left Calf */}
                  <path
                    d="M 84 274 C 74 286, 76 318, 84 348 C 92 354, 98 348, 100 326 C 102 304, 98 284, 90 274 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Calf */}
                  <path
                    d="M 156 274 C 166 286, 164 318, 156 348 C 148 354, 142 348, 140 326 C 138 304, 142 284, 150 274 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>
              </svg>
            ) : (
              /* POSTERIOR / DORSAL VIEW SVG */
              <svg
                viewBox="0 0 240 380"
                className="w-full h-auto max-h-90 drop-shadow-lg select-none"
              >
                {/* Background HUD Grid Lines */}
                <g opacity="0.15" stroke="#D99B43" strokeWidth="0.5" strokeDasharray="2,4">
                  <line x1="120" y1="10" x2="120" y2="370" />
                  <line x1="30" y1="95" x2="210" y2="95" />
                  <line x1="30" y1="170" x2="210" y2="170" />
                  <line x1="40" y1="260" x2="200" y2="260" />
                </g>

                {/* Body Base Silhouette (Posterior Mannequin Outline) */}
                <path
                  d="M 120 12 C 129 12, 136 18, 136 28 C 136 38, 130 46, 126 48 L 126 54 C 146 54, 172 58, 184 66 C 196 74, 198 94, 192 116 C 188 132, 198 164, 194 198 C 192 208, 184 212, 178 206 C 172 198, 174 176, 170 162 L 160 160 C 168 184, 172 220, 166 250 C 160 274, 154 274, 156 294 C 160 320, 158 350, 150 366 C 144 372, 134 372, 136 358 C 138 336, 134 300, 134 276 L 124 200 L 116 200 L 106 276 C 106 300, 102 336, 104 358 C 106 372, 96 372, 90 366 C 82 350, 80 320, 84 294 C 86 274, 80 274, 74 250 C 68 220, 72 184, 80 160 L 70 162 C 66 176, 68 198, 62 206 C 56 212, 48 208, 46 198 C 42 164, 52 132, 48 116 C 42 94, 44 74, 56 66 C 68 58, 94 54, 114 54 L 114 48 C 110 46, 104 38, 104 28 C 104 18, 111 12, 120 12 Z"
                  fill="#1B1916"
                  stroke="#2D2822"
                  strokeWidth="1.2"
                />

                {/* Back of Head & Cervical Spine */}
                <ellipse cx="120" cy="27" rx="12" ry="14" fill="#22201D" stroke="#38332B" strokeWidth="1.2" />
                <path d="M 120 40 L 120 160" stroke="#38332B" strokeWidth="1.2" strokeDasharray="3,3" fill="none" />

                {/* TRAPS & UPPER BACK (DIAMOND TRAPEZIUS & RHOMBOIDS) */}
                <g
                  onClick={() => setSelectedMuscleId("upper_back")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("upper_back") }}
                >
                  <path
                    d="M 120 45 L 146 62 C 144 74, 138 98, 120 120 C 102 98, 96 74, 94 62 Z"
                    fill={getMuscleFill("upper_back")}
                    opacity={selectedMuscleId === "upper_back" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* REAR DELTS / DELTOIDES POSTERIOR */}
                <g
                  onClick={() => setSelectedMuscleId("shoulders")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("shoulders") }}
                >
                  {/* Left Rear Delt */}
                  <path
                    d="M 72 61 C 62 61, 48 72, 46 86 C 46 96, 58 102, 66 96 C 72 90, 74 78, 74 66 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Rear Delt */}
                  <path
                    d="M 168 61 C 178 61, 192 72, 194 86 C 194 96, 182 102, 174 96 C 168 90, 166 78, 166 66 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* TRICEPS (HORSESHOE & LATERAL/LONG HEADS) */}
                <g
                  onClick={() => setSelectedMuscleId("triceps")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("triceps") }}
                >
                  {/* Left Tricep */}
                  <path
                    d="M 58 98 C 48 102, 46 122, 52 142 C 58 144, 66 138, 68 122 C 70 108, 68 100, 58 98 Z"
                    fill={getMuscleFill("triceps")}
                    opacity={selectedMuscleId === "triceps" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Tricep */}
                  <path
                    d="M 182 98 C 192 102, 194 122, 188 142 C 182 144, 174 138, 172 122 C 170 108, 172 100, 182 98 Z"
                    fill={getMuscleFill("triceps")}
                    opacity={selectedMuscleId === "triceps" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* LATS / DORSALES (V-TAPER WINGS) */}
                <g
                  onClick={() => setSelectedMuscleId("lats")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("lats") }}
                >
                  {/* Left Lat */}
                  <path
                    d="M 92 78 C 80 88, 76 116, 82 144 C 94 150, 106 142, 108 126 C 108 106, 102 88, 92 78 Z"
                    fill={getMuscleFill("lats")}
                    opacity={selectedMuscleId === "lats" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Lat */}
                  <path
                    d="M 148 78 C 160 88, 164 116, 158 144 C 146 150, 134 142, 132 126 C 132 106, 138 88, 148 78 Z"
                    fill={getMuscleFill("lats")}
                    opacity={selectedMuscleId === "lats" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* GLUTES / GLÚTEOS */}
                <g
                  onClick={() => setSelectedMuscleId("glutes")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("glutes") }}
                >
                  {/* Left Glute */}
                  <path
                    d="M 84 158 C 72 164, 70 196, 82 214 C 94 220, 114 216, 118 196 C 120 180, 114 164, 100 156 Z"
                    fill={getMuscleFill("glutes")}
                    opacity={selectedMuscleId === "glutes" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Glute */}
                  <path
                    d="M 156 158 C 168 164, 170 196, 158 214 C 146 220, 126 216, 122 196 C 120 180, 126 164, 140 156 Z"
                    fill={getMuscleFill("glutes")}
                    opacity={selectedMuscleId === "glutes" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* HAMSTRINGS / FEMORALES & ISQUIOS */}
                <g
                  onClick={() => setSelectedMuscleId("hamstrings")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("hamstrings") }}
                >
                  {/* Left Hamstring */}
                  <path
                    d="M 82 222 C 74 234, 76 264, 84 286 C 94 290, 106 286, 110 268 C 114 246, 110 230, 102 222 Z"
                    fill={getMuscleFill("hamstrings")}
                    opacity={selectedMuscleId === "hamstrings" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Hamstring */}
                  <path
                    d="M 158 222 C 166 234, 164 264, 156 286 C 146 290, 134 286, 130 268 C 126 246, 130 230, 138 222 Z"
                    fill={getMuscleFill("hamstrings")}
                    opacity={selectedMuscleId === "hamstrings" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* CALVES / GEMELOS (POSTERIOR DOUBLE HEART GASTROCNEMIUS) */}
                <g
                  onClick={() => setSelectedMuscleId("calves")}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("calves") }}
                >
                  {/* Left Calf (Heart Bellies) */}
                  <path
                    d="M 82 298 C 70 308, 72 334, 82 358 C 90 364, 98 358, 102 338 C 104 318, 98 302, 88 296 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  {/* Right Calf */}
                  <path
                    d="M 158 298 C 170 308, 168 334, 158 358 C 150 364, 142 358, 138 338 C 136 318, 142 302, 152 296 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.88}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>
              </svg>
            )}
          </div>

          <div className="text-center text-[11px] text-[#8E867B] font-mono">
            Toca cualquier músculo para inspeccionar su estado
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
