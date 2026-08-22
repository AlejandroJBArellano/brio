import React from "react";

/**
 * High-fidelity, ultra-polished dark glassmorphism skeleton for Brio Command Center.
 * Renders instantly while Server Components stream data from Neon and external APIs.
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8 relative animate-pulse">
      {/* 1. Header & RPG Stats Ribbon Skeleton */}
      <header className="rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-4 sm:p-5 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
        {/* Top row: Brand + Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & User profile */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center">
              <div className="size-5 rounded-md bg-indigo-500/20" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-28 rounded-md bg-neutral-800" />
              <div className="h-3 w-36 rounded-md bg-neutral-800/60" />
            </div>
          </div>

          {/* Action pills skeleton */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex h-8 w-24 rounded-lg bg-neutral-800/60 border border-neutral-700/30" />
            <div className="hidden sm:flex h-8 w-24 rounded-lg bg-neutral-800/60 border border-neutral-700/30" />
            <div className="h-8 w-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30" />
            <div className="h-8 w-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30" />
            <div className="h-8 w-8 rounded-lg bg-neutral-800/60 border border-neutral-700/30" />
          </div>
        </div>

        {/* Middle row: RPG Stats Badges (HP, MP, EXP, GP, Streak, Level) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          {[
            { label: "HP", color: "bg-rose-500/10 border-rose-500/20" },
            { label: "MP", color: "bg-indigo-500/10 border-indigo-500/20" },
            { label: "EXP", color: "bg-amber-500/10 border-amber-500/20" },
            { label: "GP", color: "bg-yellow-500/10 border-yellow-500/20" },
            { label: "Racha", color: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Nivel", color: "bg-purple-500/10 border-purple-500/20" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`rounded-xl border ${item.color} bg-neutral-950/40 p-2.5 flex flex-col gap-1.5`}
            >
              <div className="flex justify-between items-center">
                <div className="h-2.5 w-8 rounded bg-neutral-800" />
                <div className="h-2.5 w-10 rounded bg-neutral-800/70" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-neutral-700/80" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: Master Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-neutral-800/60">
          {[
            "Tareas & Foco",
            "Finanzas",
            "Analytics",
            "Agenda",
            "Salud & Gym",
            "Bóveda & Vault",
            "Proyectos",
          ].map((tab, idx) => (
            <div
              key={idx}
              className={`h-9 px-4 rounded-lg flex items-center gap-2 ${
                idx === 0
                  ? "bg-indigo-600/20 border border-indigo-500/40"
                  : "bg-neutral-800/40 border border-neutral-800/60"
              }`}
            >
              <div className="size-3.5 rounded bg-neutral-700/60" />
              <div className="h-3 w-16 rounded bg-neutral-700/60" />
            </div>
          ))}
        </div>
      </header>

      {/* 2. Global Hybrid Omnibar Skeleton */}
      <div className="relative rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-3 sm:p-4 backdrop-blur-xl shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="size-5 rounded-full bg-neutral-800 flex items-center justify-center">
            <div className="size-2 rounded-full bg-indigo-400/40" />
          </div>
          <div className="h-4 w-64 max-w-[60%] rounded bg-neutral-800/80" />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-6 px-2 rounded bg-neutral-800/70 border border-neutral-700/30 text-[10px]" />
          <div className="h-6 px-2 rounded bg-neutral-800/70 border border-neutral-700/30 text-[10px]" />
          <div className="h-6 px-2 rounded bg-neutral-800/70 border border-neutral-700/30 text-[10px]" />
        </div>
      </div>

      {/* 3. Daily Must-Win Focus Ribbon Skeleton */}
      <div className="rounded-2xl border border-neutral-800/80 bg-linear-to-r from-neutral-900/80 via-neutral-900/60 to-neutral-900/80 p-4 backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-indigo-500 animate-ping" />
            <div className="h-3.5 w-32 rounded bg-neutral-800" />
          </div>
          <div className="h-3 w-20 rounded bg-neutral-800/60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="rounded-xl border border-neutral-800/60 bg-neutral-950/40 p-3 flex items-center gap-3"
            >
              <div className="size-5 rounded-full bg-neutral-800" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3.5 w-full rounded bg-neutral-800" />
                <div className="h-2.5 w-20 rounded bg-neutral-800/50" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Split-Pane Workspace: Task Stream Left + Inspector Right */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Column: Task Stream */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4">
          {/* Sub-tabs filter */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            {["Todas", "Dailies", "To-Dos", "Hábitos"].map((subtab, i) => (
              <div
                key={i}
                className={`h-8 px-3 rounded-lg ${
                  i === 0
                    ? "bg-neutral-800 border border-neutral-700"
                    : "bg-neutral-900/50"
                }`}
              >
                <div className="h-full w-12 rounded" />
              </div>
            ))}
          </div>

          {/* Task cards list */}
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="rounded-xl border border-neutral-800/70 bg-neutral-900/40 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="size-5 rounded-md bg-neutral-800/80 border border-neutral-700/40" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 w-3/4 rounded bg-neutral-800" />
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-12 rounded bg-neutral-800/60" />
                      <div className="h-3 w-16 rounded bg-neutral-800/40" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-neutral-800/60" />
                  <div className="size-7 rounded-lg bg-neutral-800/60" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Inspector Pane Skeleton */}
        <div className="hidden lg:flex w-full lg:w-[40%] sticky top-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-5 backdrop-blur-xl flex-col gap-4 min-h-120">
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
            <div className="h-4 w-32 rounded bg-neutral-800" />
            <div className="size-6 rounded bg-neutral-800/60" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-4/5 rounded bg-neutral-800" />
            <div className="h-3.5 w-2/3 rounded bg-neutral-800/60" />
          </div>
          <div className="h-20 w-full rounded-xl bg-neutral-950/40 border border-neutral-800/50 p-3 flex flex-col gap-2">
            <div className="h-3 w-16 rounded bg-neutral-800/70" />
            <div className="h-3 w-full rounded bg-neutral-800/40" />
            <div className="h-3 w-3/4 rounded bg-neutral-800/40" />
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="h-3.5 w-24 rounded bg-neutral-800" />
            {[1, 2, 3].map((chk) => (
              <div key={chk} className="flex items-center gap-2">
                <div className="size-4 rounded bg-neutral-800" />
                <div className="h-3 w-48 rounded bg-neutral-800/70" />
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-neutral-800/60 flex items-center justify-between">
            <div className="h-8 w-20 rounded-lg bg-neutral-800/60" />
            <div className="h-8 w-28 rounded-lg bg-rose-500/10 border border-rose-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
