"use client";

import { HabiticaUser } from "@/lib/types";
import { calculatePercentage, capitalize } from "@/lib/utils";
import {
  Coins,
  Heart,
  RotateCw,
  Sparkles,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface HeaderStatsRibbonProps {
  user: HabiticaUser;
  isConfigured: boolean;
}

export function HeaderStatsRibbon({
  user,
  isConfigured,
}: HeaderStatsRibbonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const stats = user.stats;
  const hpPercent = calculatePercentage(stats.hp, stats.maxHealth || 50);
  const mpPercent = calculatePercentage(stats.mp, stats.maxMP || 100);
  const expPercent = calculatePercentage(stats.exp, stats.toNextLevel || 100);

  const isLowHp = stats.hp <= 15;

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <header className="rounded-2xl border border-white/8 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-2xl transition-all">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Branding & Character Identity */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-violet-600 to-indigo-500 font-mono font-bold text-white shadow-lg shadow-indigo-500/20">
              <span className="text-lg">B</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-neutral-900 bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  {user.profile.name || "Brio Commander"}
                </h1>
                <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400">
                  Lvl {stats.lvl}
                </span>
                <span className="rounded-md border border-neutral-700 bg-neutral-800/80 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                  {capitalize(stats.class || "warrior")}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Personal Command Center & Life Operating Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={handleRefresh}
              disabled={isPending}
              aria-label="Refresh stats"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCw
                className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-indigo-400" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Right: Interactive Stat Gauges (HP, MP, EXP, Gold) */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Health Bar (HP) */}
          <div className="min-w-32.5 flex-1 rounded-xl border border-white/6 bg-neutral-950/60 px-3 py-2 sm:flex-initial">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-rose-400">
                <Heart
                  className={`h-3.5 w-3.5 fill-rose-500/20 text-rose-500 ${isLowHp ? "animate-pulse text-rose-400" : ""
                    }`}
                />
                HP
              </span>
              <span className="font-mono text-[11px] text-neutral-300">
                {Math.round(stats.hp)} / {stats.maxHealth || 50}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full transition-all duration-500 ${isLowHp
                  ? "bg-rose-500"
                  : "bg-linear-to-r from-rose-500 to-red-400"
                  }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana Bar (MP) */}
          <div className="min-w-32.5 flex-1 rounded-xl border border-white/6 bg-neutral-950/60 px-3 py-2 sm:flex-initial">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-sky-400">
                <Zap className="h-3.5 w-3.5 fill-sky-500/20 text-sky-400" />
                MP
              </span>
              <span className="font-mono text-[11px] text-neutral-300">
                {Math.round(stats.mp)} / {stats.maxMP || 100}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-linear-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${mpPercent}%` }}
              />
            </div>
          </div>

          {/* Experience Bar (EXP) */}
          <div className="min-w-35 flex-1 rounded-xl border border-white/6 bg-neutral-950/60 px-3 py-2 sm:flex-initial">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                EXP
              </span>
              <span className="font-mono text-[11px] text-neutral-300">
                {Math.round(stats.exp)} / {stats.toNextLevel || 100}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>

          {/* Gold (GP) */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Coins className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-amber-400/80">
                Gold
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {stats.gp?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>

          {/* Desktop Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isPending}
            title="Sync Habitica state"
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-neutral-800/80 text-neutral-300 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white sm:flex"
          >
            <RotateCw
              className={`h-4 w-4 ${isPending ? "animate-spin text-indigo-400" : ""}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
