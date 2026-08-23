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
          glow: "rgba(239, 68, 68, 0.5)",
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
          glow: "rgba(245, 158, 11, 0.4)",
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
          glow: "rgba(16, 185, 129, 0.4)",
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
          glow: "rgba(14, 165, 233, 0.3)",
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

  const getMuscleGlow = (mId: MuscleGroupId) => {
    const m = recoverySummary.muscles[mId];
    if (!m) return "none";
    const colors = getStateColor(m.state);
    const isSelected = selectedMuscleId === mId;
    return isSelected
      ? `drop-shadow(0 0 10px ${colors.fill}) drop-shadow(0 0 4px ${colors.fill})`
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

          {/* SVG Anatomical Mannequin */}
          <div className="relative w-full max-w-65 py-4 flex items-center justify-center">
            {viewMode === "anterior" ? (
              /* ANTERIOR / FRONTAL VIEW SVG */
              <svg
                viewBox="0 0 200 360"
                className="w-full h-auto max-h-85 drop-shadow-md select-none"
              >
                <defs>
                  {/* Head & Body outline glow */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Head / Neck Base (Neutral) */}
                <circle cx="100" cy="28" r="14" fill="#22201D" stroke="#38332B" strokeWidth="1.5" />
                <path d="M93 42 L107 42 L109 52 L91 52 Z" fill="#22201D" stroke="#38332B" strokeWidth="1" />

                {/* Chest / Pectorales */}
                <g
                  onClick={() => setSelectedMuscleId("chest")}
                  className="cursor-pointer transition-transform hover:scale-[1.02] transform-origin-center"
                  style={{ filter: getMuscleGlow("chest") }}
                >
                  <path
                    d="M74 54 C82 54, 98 57, 98 78 C98 84, 84 89, 74 89 C64 89, 61 78, 62 67 C63 58, 68 54, 74 54 Z"
                    fill={getMuscleFill("chest")}
                    opacity={selectedMuscleId === "chest" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M126 54 C118 54, 102 57, 102 78 C102 84, 116 89, 126 89 C136 89, 139 78, 138 67 C137 58, 132 54, 126 54 Z"
                    fill={getMuscleFill("chest")}
                    opacity={selectedMuscleId === "chest" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Shoulders / Deltoides (Anterior) */}
                <g
                  onClick={() => setSelectedMuscleId("shoulders")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("shoulders") }}
                >
                  <path
                    d="M58 54 C63 54, 65 64, 60 76 C55 78, 48 72, 46 64 C44 56, 52 54, 58 54 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M142 54 C137 54, 135 64, 140 76 C145 78, 152 72, 154 64 C156 56, 148 54, 142 54 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Biceps */}
                <g
                  onClick={() => setSelectedMuscleId("biceps")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("biceps") }}
                >
                  <path
                    d="M45 76 C53 78, 55 98, 47 114 C40 112, 38 94, 40 82 Z"
                    fill={getMuscleFill("biceps")}
                    opacity={selectedMuscleId === "biceps" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M155 76 C147 78, 145 98, 153 114 C160 112, 162 94, 160 82 Z"
                    fill={getMuscleFill("biceps")}
                    opacity={selectedMuscleId === "biceps" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Forearms / Antebrazos */}
                <g
                  onClick={() => setSelectedMuscleId("forearms")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("forearms") }}
                >
                  <path
                    d="M43 118 C48 120, 48 145, 42 165 C37 165, 34 140, 36 122 Z"
                    fill={getMuscleFill("forearms")}
                    opacity={selectedMuscleId === "forearms" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M157 118 C152 120, 152 145, 158 165 C163 165, 166 140, 164 122 Z"
                    fill={getMuscleFill("forearms")}
                    opacity={selectedMuscleId === "forearms" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Abs / Abdominales & Core */}
                <g
                  onClick={() => setSelectedMuscleId("abs")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("abs") }}
                >
                  <rect
                    x="84"
                    y="92"
                    width="14"
                    height="14"
                    rx="3"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                  <rect
                    x="102"
                    y="92"
                    width="14"
                    height="14"
                    rx="3"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                  <rect
                    x="84"
                    y="110"
                    width="14"
                    height="15"
                    rx="3"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                  <rect
                    x="102"
                    y="110"
                    width="14"
                    height="15"
                    rx="3"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                  <path
                    d="M84 129 L98 129 L97 148 L87 148 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                  <path
                    d="M102 129 L116 129 L113 148 L103 148 Z"
                    fill={getMuscleFill("abs")}
                    opacity={selectedMuscleId === "abs" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1"
                  />
                </g>

                {/* Quads / Cuádriceps */}
                <g
                  onClick={() => setSelectedMuscleId("quads")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("quads") }}
                >
                  <path
                    d="M72 155 C82 155, 96 165, 94 220 C88 230, 72 230, 68 215 C62 195, 64 165, 72 155 Z"
                    fill={getMuscleFill("quads")}
                    opacity={selectedMuscleId === "quads" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M128 155 C118 155, 104 165, 106 220 C112 230, 128 230, 132 215 C138 195, 136 165, 128 155 Z"
                    fill={getMuscleFill("quads")}
                    opacity={selectedMuscleId === "quads" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Calves / Gemelos (Frontal) */}
                <g
                  onClick={() => setSelectedMuscleId("calves")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("calves") }}
                >
                  <path
                    d="M70 245 C80 245, 88 260, 84 310 C76 320, 68 315, 66 295 C64 275, 66 250, 70 245 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M130 245 C120 245, 112 260, 116 310 C124 320, 132 315, 134 295 C136 275, 134 250, 130 245 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>
              </svg>
            ) : (
              /* POSTERIOR / DORSAL VIEW SVG */
              <svg
                viewBox="0 0 200 360"
                className="w-full h-auto max-h-85 drop-shadow-md select-none"
              >
                {/* Head (Posterior) */}
                <circle cx="100" cy="28" r="14" fill="#22201D" stroke="#38332B" strokeWidth="1.5" />

                {/* Traps / Upper Back */}
                <g
                  onClick={() => setSelectedMuscleId("upper_back")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("upper_back") }}
                >
                  <path
                    d="M100 45 L130 65 L115 105 L100 115 L85 105 L70 65 Z"
                    fill={getMuscleFill("upper_back")}
                    opacity={selectedMuscleId === "upper_back" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Shoulders (Posterior / Rear Delts) */}
                <g
                  onClick={() => setSelectedMuscleId("shoulders")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("shoulders") }}
                >
                  <path
                    d="M58 54 C64 54, 68 66, 62 76 C56 78, 48 72, 46 64 C44 56, 52 54, 58 54 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M142 54 C136 54, 132 66, 138 76 C144 78, 152 72, 154 64 C156 56, 148 54, 142 54 Z"
                    fill={getMuscleFill("shoulders")}
                    opacity={selectedMuscleId === "shoulders" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Triceps (Posterior) */}
                <g
                  onClick={() => setSelectedMuscleId("triceps")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("triceps") }}
                >
                  <path
                    d="M44 76 C52 78, 54 100, 46 116 C38 114, 36 96, 38 82 Z"
                    fill={getMuscleFill("triceps")}
                    opacity={selectedMuscleId === "triceps" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M156 76 C148 78, 146 100, 154 116 C162 114, 164 96, 162 82 Z"
                    fill={getMuscleFill("triceps")}
                    opacity={selectedMuscleId === "triceps" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Lats / Dorsales */}
                <g
                  onClick={() => setSelectedMuscleId("lats")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("lats") }}
                >
                  <path
                    d="M68 76 C80 84, 85 110, 80 135 C70 128, 62 108, 60 90 Z"
                    fill={getMuscleFill("lats")}
                    opacity={selectedMuscleId === "lats" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M132 76 C120 84, 115 110, 120 135 C130 128, 138 108, 140 90 Z"
                    fill={getMuscleFill("lats")}
                    opacity={selectedMuscleId === "lats" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Glutes / Glúteos */}
                <g
                  onClick={() => setSelectedMuscleId("glutes")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("glutes") }}
                >
                  <path
                    d="M68 145 C82 145, 96 150, 96 182 C96 195, 78 198, 68 190 C60 182, 60 155, 68 145 Z"
                    fill={getMuscleFill("glutes")}
                    opacity={selectedMuscleId === "glutes" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M132 145 C118 145, 104 150, 104 182 C104 195, 122 198, 132 190 C140 182, 140 155, 132 145 Z"
                    fill={getMuscleFill("glutes")}
                    opacity={selectedMuscleId === "glutes" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Hamstrings / Femorales */}
                <g
                  onClick={() => setSelectedMuscleId("hamstrings")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("hamstrings") }}
                >
                  <path
                    d="M70 196 C84 196, 94 206, 92 245 C86 250, 72 250, 68 240 C62 225, 64 205, 70 196 Z"
                    fill={getMuscleFill("hamstrings")}
                    opacity={selectedMuscleId === "hamstrings" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M130 196 C116 196, 106 206, 108 245 C114 250, 128 250, 132 240 C138 225, 136 205, 130 196 Z"
                    fill={getMuscleFill("hamstrings")}
                    opacity={selectedMuscleId === "hamstrings" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Calves / Gemelos (Posterior) */}
                <g
                  onClick={() => setSelectedMuscleId("calves")}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ filter: getMuscleGlow("calves") }}
                >
                  <path
                    d="M68 255 C82 255, 90 270, 86 312 C78 322, 68 318, 64 298 C62 278, 64 260, 68 255 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.85}
                    stroke="#121110"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M132 255 C118 255, 110 270, 114 312 C122 322, 132 318, 136 298 C138 278, 136 260, 132 255 Z"
                    fill={getMuscleFill("calves")}
                    opacity={selectedMuscleId === "calves" ? 1 : 0.85}
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
