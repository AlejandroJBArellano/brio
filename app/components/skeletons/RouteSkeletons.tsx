import React from "react";

export function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      {/* Must-Win Focus Ribbon Skeleton */}
      <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-36 rounded bg-neutral-800" />
          <div className="h-4 w-20 rounded bg-neutral-800/60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 flex items-center gap-3">
              <div className="size-5 rounded-md bg-neutral-800" />
              <div className="h-3.5 w-3/4 rounded bg-neutral-800" />
            </div>
          ))}
        </div>
      </div>

      {/* Task Stream Filter Tabs Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/60 border border-white/5">
          <div className="h-8 w-16 rounded-lg bg-neutral-800" />
          <div className="h-8 w-16 rounded-lg bg-neutral-800/60" />
          <div className="h-8 w-16 rounded-lg bg-neutral-800/60" />
          <div className="h-8 w-16 rounded-lg bg-neutral-800/60" />
        </div>
        <div className="h-8 w-44 rounded-xl bg-neutral-900/60 border border-white/5" />
      </div>

      {/* Task List Items Skeleton */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-4"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="size-6 rounded-lg bg-neutral-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-2/3 rounded bg-neutral-800" />
                <div className="h-3 w-1/3 rounded bg-neutral-800/60" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-12 rounded bg-neutral-800/60" />
              <div className="h-5 w-8 rounded bg-neutral-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
            <div className="h-3.5 w-28 rounded bg-neutral-800" />
            <div className="h-7 w-36 rounded bg-neutral-800/80" />
            <div className="h-2 w-full rounded-full bg-neutral-800" />
          </div>
        ))}
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="h-5 w-40 rounded bg-neutral-800" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-neutral-950/40 p-3 flex justify-between items-center">
                <div className="h-3.5 w-32 rounded bg-neutral-800" />
                <div className="h-3.5 w-16 rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="h-5 w-40 rounded bg-neutral-800" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-neutral-950/40 p-3 flex justify-between items-center">
                <div className="h-3.5 w-32 rounded bg-neutral-800" />
                <div className="h-3.5 w-16 rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HealthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Health Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-neutral-800" />
            <div className="h-6 w-24 rounded bg-neutral-800/80" />
          </div>
        ))}
      </div>

      {/* Workouts & Nutrition Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="h-5 w-44 rounded bg-neutral-800" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-neutral-950/50 p-3.5 space-y-2">
                <div className="h-4 w-40 rounded bg-neutral-800" />
                <div className="h-3 w-64 rounded bg-neutral-800/60" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="h-5 w-44 rounded bg-neutral-800" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-neutral-950/50 p-3.5 space-y-2">
                <div className="h-4 w-40 rounded bg-neutral-800" />
                <div className="h-3 w-64 rounded bg-neutral-800/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="rounded-3xl border border-white/8 bg-neutral-900/60 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <div className="h-5 w-48 rounded bg-neutral-800" />
        <div className="h-8 w-24 rounded-lg bg-neutral-800" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-neutral-950/40">
            <div className="h-4 w-16 rounded bg-neutral-800" />
            <div className="h-4 flex-1 rounded bg-neutral-800/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-2">
            <div className="h-3 w-28 rounded bg-neutral-800" />
            <div className="h-8 w-20 rounded bg-neutral-800" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex items-center justify-center">
        <div className="h-4 w-48 rounded bg-neutral-800" />
      </div>
    </div>
  );
}

export function VaultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
            <div className="h-3 w-24 rounded bg-neutral-800" />
            <div className="h-6 w-12 rounded bg-neutral-800" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((col) => (
          <div key={col} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="h-4 w-28 rounded bg-neutral-800" />
            <div className="space-y-2.5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 rounded-xl bg-neutral-950/40 p-3 space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-neutral-800" />
                  <div className="h-3 w-1/2 rounded bg-neutral-800/60" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TodaySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
        <div className="h-4 w-32 rounded bg-neutral-800" />
        <div className="h-6 w-48 rounded bg-neutral-800" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
          <div className="h-3 w-16 rounded bg-neutral-800" />
          <div className="h-5 w-20 rounded bg-neutral-800" />
        </div>
        <div className="h-24 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
          <div className="h-3 w-16 rounded bg-neutral-800" />
          <div className="h-5 w-20 rounded bg-neutral-800" />
        </div>
      </div>
      <div className="h-48 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
        <div className="h-4 w-28 rounded bg-neutral-800" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-neutral-950/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
