import React from "react";

/**
 * High-fidelity, ultra-polished dark glassmorphism skeleton for Brio Command Center.
 * Renders instantly while Server Components stream data from Neon and external APIs.
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8 relative animate-pulse font-sans">
      {/* 1. Header & RPG Stats Ribbon Skeleton */}
      <header className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        {/* Top row: Brand + Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & User profile */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#221D16] border border-[#D99B43]/30 flex items-center justify-center">
              <div className="size-5 rounded-md bg-[#D99B43]/20" />
            </div>
            <div className="flex flex-col gap-1.5 font-mono">
              <div className="h-4 w-28 rounded-md bg-[#2A2723]" />
              <div className="h-3 w-36 rounded-md bg-[#2A2723]/60" />
            </div>
          </div>

          {/* Action pills skeleton */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex h-8 w-24 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="hidden sm:flex h-8 w-24 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="h-8 w-8 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="h-8 w-8 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="h-8 w-8 rounded-lg bg-[#121110] border border-[#2A2723]" />
          </div>
        </div>

        {/* Middle row: RPG Stats Badges (HP, MP, EXP, GP, Streak, Level) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          {[
            { label: "HP", color: "bg-[#2A1715] border-[#E05D52]/30" },
            { label: "MP", color: "bg-[#162322] border-[#4EAB9E]/30" },
            { label: "EXP", color: "bg-[#221D16] border-[#D99B43]/30" },
            { label: "GP", color: "bg-[#221D16] border-[#D99B43]/30" },
            { label: "Racha", color: "bg-[#1C2219] border-[#7EA35A]/30" },
            { label: "Nivel", color: "bg-[#181715] border-[#2A2723]" },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`rounded-lg border ${item.color} bg-[#121110] p-2.5 flex flex-col gap-1.5`}
            >
              <div className="flex justify-between items-center">
                <div className="h-2.5 w-8 rounded bg-[#2A2723]" />
                <div className="h-2.5 w-10 rounded bg-[#2A2723]/70" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#181715] overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-[#38332D]" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: Master Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-[#2A2723]">
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
                  ? "bg-[#221D16] border border-[#D99B43]/40"
                  : "bg-[#121110] border border-[#2A2723]"
              }`}
            >
              <div className="size-3.5 rounded bg-[#38332D]" />
              <div className="h-3 w-16 rounded bg-[#38332D]" />
            </div>
          ))}
        </div>
      </header>

      {/* 2. Global Hybrid Omnibar Skeleton */}
      <div className="relative rounded-xl border border-[#2A2723] bg-[#181715] p-3 sm:p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="size-5 rounded-full bg-[#121110] border border-[#2A2723] flex items-center justify-center">
            <div className="size-2 rounded-full bg-[#D99B43]/60" />
          </div>
          <div className="h-4 w-64 max-w-[60%] rounded bg-[#2A2723]" />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-6 px-2 rounded bg-[#121110] border border-[#2A2723] text-[10px]" />
          <div className="h-6 px-2 rounded bg-[#121110] border border-[#2A2723] text-[10px]" />
          <div className="h-6 px-2 rounded bg-[#121110] border border-[#2A2723] text-[10px]" />
        </div>
      </div>

      {/* 3. Daily Must-Win Focus Ribbon Skeleton */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-[#D99B43] animate-ping" />
            <div className="h-3.5 w-32 rounded bg-[#2A2723]" />
          </div>
          <div className="h-3 w-20 rounded bg-[#2A2723]/60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className="rounded-lg border border-[#2A2723] bg-[#121110] p-3 flex items-center gap-3"
            >
              <div className="size-5 rounded-full bg-[#2A2723]" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3.5 w-full rounded bg-[#2A2723]" />
                <div className="h-2.5 w-20 rounded bg-[#2A2723]/50" />
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
          <div className="flex items-center gap-2 border-b border-[#2A2723] pb-3">
            {["Todas", "Dailies", "To-Dos", "Hábitos"].map((subtab, i) => (
              <div
                key={i}
                className={`h-8 px-3 rounded-lg ${
                  i === 0
                    ? "bg-[#221D16] border border-[#D99B43]/30"
                    : "bg-[#121110] border border-[#2A2723]"
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
                className="rounded-lg border border-[#2A2723] bg-[#181715] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="size-5 rounded-md bg-[#121110] border border-[#2A2723]" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-4 w-3/4 rounded bg-[#2A2723]" />
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-12 rounded bg-[#2A2723]/60" />
                      <div className="h-3 w-16 rounded bg-[#2A2723]/40" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-[#121110] border border-[#2A2723]" />
                  <div className="size-7 rounded-lg bg-[#121110] border border-[#2A2723]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Inspector Pane Skeleton */}
        <div className="hidden lg:flex w-full lg:w-[40%] sticky top-6 rounded-xl border border-[#2A2723] bg-[#181715] p-5 flex-col gap-4 min-h-120">
          <div className="flex items-center justify-between border-b border-[#2A2723] pb-3">
            <div className="h-4 w-32 rounded bg-[#2A2723]" />
            <div className="size-6 rounded bg-[#2A2723]/60" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-4/5 rounded bg-[#2A2723]" />
            <div className="h-3.5 w-2/3 rounded bg-[#2A2723]/60" />
          </div>
          <div className="h-20 w-full rounded-lg bg-[#121110] border border-[#2A2723] p-3 flex flex-col gap-2">
            <div className="h-3 w-16 rounded bg-[#2A2723]/70" />
            <div className="h-3 w-full rounded bg-[#2A2723]/40" />
            <div className="h-3 w-3/4 rounded bg-[#2A2723]/40" />
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="h-3.5 w-24 rounded bg-[#2A2723]" />
            {[1, 2, 3].map((chk) => (
              <div key={chk} className="flex items-center gap-2">
                <div className="size-4 rounded bg-[#2A2723]" />
                <div className="h-3 w-48 rounded bg-[#2A2723]/70" />
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-[#2A2723] flex items-center justify-between">
            <div className="h-8 w-20 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="h-8 w-28 rounded-lg bg-[#2A1715] border border-[#E05D52]/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
