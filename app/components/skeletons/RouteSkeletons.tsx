import React from "react";

export function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse font-sans">
      {/* Must-Win Focus Ribbon Skeleton */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-36 rounded bg-[#22201D]" />
          <div className="h-4 w-20 rounded bg-[#22201D]/60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg border border-[#2A2723] bg-[#121110] p-3 flex items-center gap-3">
              <div className="size-5 rounded bg-[#22201D]" />
              <div className="h-3.5 w-3/4 rounded bg-[#22201D]" />
            </div>
          ))}
        </div>
      </div>

      {/* Task Stream Filter Tabs Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#181715] border border-[#2A2723]">
          <div className="h-8 w-16 rounded-md bg-[#22201D]" />
          <div className="h-8 w-16 rounded-md bg-[#22201D]/60" />
          <div className="h-8 w-16 rounded-md bg-[#22201D]/60" />
          <div className="h-8 w-16 rounded-md bg-[#22201D]/60" />
        </div>
        <div className="h-8 w-44 rounded-lg bg-[#181715] border border-[#2A2723]" />
      </div>

      {/* Task List Items Skeleton */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-[#2A2723] bg-[#181715] p-4"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="size-6 rounded bg-[#22201D]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-2/3 rounded bg-[#22201D]" />
                <div className="h-3 w-1/3 rounded bg-[#22201D]/60" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-12 rounded bg-[#22201D]/60" />
              <div className="h-5 w-8 rounded bg-[#22201D]/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-3">
            <div className="h-3.5 w-28 rounded bg-[#22201D]" />
            <div className="h-7 w-36 rounded bg-[#22201D]/80" />
            <div className="h-2 w-full rounded-full bg-[#22201D]" />
          </div>
        ))}
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4">
          <div className="h-5 w-40 rounded bg-[#22201D]" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-[#121110] border border-[#2A2723] p-3 flex justify-between items-center">
                <div className="h-3.5 w-32 rounded bg-[#22201D]" />
                <div className="h-3.5 w-16 rounded bg-[#22201D]" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4">
          <div className="h-5 w-40 rounded bg-[#22201D]" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-[#121110] border border-[#2A2723] p-3 flex justify-between items-center">
                <div className="h-3.5 w-32 rounded bg-[#22201D]" />
                <div className="h-3.5 w-16 rounded bg-[#22201D]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HealthSkeleton() {
  return <DailyHealthSkeleton />;
}

export function DailyHealthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Circadian Clock Widget Skeleton */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 rounded bg-[#22201D]" />
          <div className="h-7 w-28 rounded bg-[#22201D]/60" />
        </div>
        <div className="h-20 rounded-lg bg-[#121110] border border-[#2A2723]" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 space-y-2">
            <div className="h-3 w-24 rounded bg-[#22201D]" />
            <div className="h-6 w-32 rounded bg-[#22201D]/80" />
            <div className="h-2.5 w-20 rounded bg-[#22201D]/60" />
          </div>
        ))}
      </div>

      {/* 2 Glance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 space-y-3">
            <div className="h-4 w-36 rounded bg-[#22201D]" />
            <div className="h-3 w-48 rounded bg-[#22201D]/60" />
          </div>
        ))}
      </div>

      {/* 2 Column Water & Supplements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4">
          <div className="h-4 w-44 rounded bg-[#22201D]" />
          <div className="h-3 w-full rounded-full bg-[#22201D]" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-9 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="h-9 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="h-9 rounded-lg bg-[#121110] border border-[#2A2723]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-44 rounded bg-[#22201D]" />
            <div className="h-6 w-20 rounded bg-[#22201D]/60" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-[#121110] border border-[#2A2723]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrainingHealthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Sub Navigation Bar Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
        <div className="flex gap-1.5 p-1 bg-[#181715] rounded-lg border border-[#2A2723]">
          <div className="h-8 w-36 rounded-md bg-[#22201D]" />
          <div className="h-8 w-44 rounded-md bg-[#22201D]/60" />
        </div>
        <div className="h-5 w-24 rounded bg-[#22201D]/60" />
      </div>

      {/* Hevy Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 space-y-2">
            <div className="h-3 w-24 rounded bg-[#22201D]" />
            <div className="h-6 w-28 rounded bg-[#22201D]/80" />
          </div>
        ))}
      </div>

      {/* Workout History List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-40 rounded bg-[#22201D]" />
              <div className="h-4 w-20 rounded bg-[#22201D]/60" />
            </div>
            <div className="h-3 w-64 rounded bg-[#22201D]/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NutritionHealthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Sub Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
        <div className="flex gap-1.5 p-1 bg-[#181715] rounded-lg border border-[#2A2723]">
          <div className="h-8 w-28 rounded-md bg-[#22201D]" />
          <div className="h-8 w-28 rounded-md bg-[#22201D]/60" />
          <div className="h-8 w-28 rounded-md bg-[#22201D]/60" />
          <div className="h-8 w-28 rounded-md bg-[#22201D]/60" />
        </div>
      </div>

      {/* Macro Balance Overview */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4">
        <div className="h-5 w-48 rounded bg-[#22201D]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-[#121110] border border-[#2A2723]" />
          ))}
        </div>
      </div>

      {/* Portion counters grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-[#2A2723] bg-[#181715]" />
        ))}
      </div>
    </div>
  );
}

export function BiometricsHealthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Sub Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
        <div className="flex gap-1.5 p-1 bg-[#181715] rounded-lg border border-[#2A2723]">
          <div className="h-8 w-44 rounded-md bg-[#22201D]" />
          <div className="h-8 w-44 rounded-md bg-[#22201D]/60" />
        </div>
      </div>

      {/* Health Score Overview */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-52 rounded bg-[#22201D]" />
          <div className="h-8 w-24 rounded bg-[#22201D]/70" />
        </div>
        <div className="h-3 w-full rounded-full bg-[#22201D]" />
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 rounded-xl border border-[#2A2723] bg-[#181715] p-4 space-y-3">
            <div className="h-4 w-32 rounded bg-[#22201D]" />
            <div className="h-20 rounded bg-[#121110] border border-[#2A2723]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-6 space-y-4 animate-pulse font-sans">
      <div className="flex justify-between items-center pb-3 border-b border-[#2A2723]">
        <div className="h-5 w-48 rounded bg-[#22201D]" />
        <div className="h-8 w-24 rounded-lg bg-[#22201D]" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-[#121110] border border-[#2A2723]">
            <div className="h-4 w-16 rounded bg-[#22201D]" />
            <div className="h-4 flex-1 rounded bg-[#22201D]/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-2">
            <div className="h-3 w-28 rounded bg-[#22201D]" />
            <div className="h-8 w-20 rounded bg-[#22201D]" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-xl border border-[#2A2723] bg-[#181715] p-6 flex items-center justify-center">
        <div className="h-4 w-48 rounded bg-[#22201D]" />
      </div>
    </div>
  );
}

export function VaultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-[#2A2723] bg-[#181715] p-4 space-y-2">
            <div className="h-3 w-24 rounded bg-[#22201D]" />
            <div className="h-6 w-12 rounded bg-[#22201D]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((col) => (
          <div key={col} className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 space-y-3">
            <div className="h-4 w-28 rounded bg-[#22201D]" />
            <div className="space-y-2.5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 rounded-lg bg-[#121110] border border-[#2A2723] p-3 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-[#22201D]" />
                  <div className="h-3 w-1/2 rounded bg-[#22201D]/60" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
        <div className="space-y-1.5">
          <div className="h-6 w-48 rounded bg-[#22201D]" />
          <div className="h-3.5 w-72 rounded bg-[#22201D]/60" />
        </div>
        <div className="h-8 w-32 rounded-xl bg-[#22201D]" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 rounded-lg bg-[#22201D]" />
        <div className="h-8 w-28 rounded-lg bg-[#22201D]/60" />
        <div className="h-8 w-24 rounded-lg bg-[#22201D]/60" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-36 rounded-xl border border-[#2A2723] bg-[#181715] p-4 space-y-3">
            <div className="h-4 w-28 rounded bg-[#22201D]" />
            <div className="h-4 w-3/4 rounded bg-[#22201D]" />
            <div className="h-2 w-full rounded-full bg-[#22201D]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TodaySkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse font-sans">
      <div className="h-24 rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-3">
        <div className="h-4 w-32 rounded bg-[#22201D]" />
        <div className="h-6 w-48 rounded bg-[#22201D]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="h-72 rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4">
            <div className="h-5 w-40 rounded bg-[#22201D]" />
            <div className="h-28 rounded-lg bg-[#121110] border border-[#2A2723]" />
            <div className="h-10 rounded-lg bg-[#22201D]/60" />
          </div>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <div className="h-48 rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 space-y-3">
            <div className="h-4 w-32 rounded bg-[#22201D]" />
            <div className="h-24 rounded-lg bg-[#121110] border border-[#2A2723]" />
          </div>
          <div className="h-36 rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 space-y-3">
            <div className="h-4 w-28 rounded bg-[#22201D]" />
            <div className="h-16 rounded-lg bg-[#121110] border border-[#2A2723]" />
          </div>
          <div className="h-20 rounded-xl border border-[#2A2723] bg-[#181715] p-4" />
        </div>
      </div>
    </div>
  );
}
