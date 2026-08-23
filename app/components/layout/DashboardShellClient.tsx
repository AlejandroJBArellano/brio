"use client";

import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { HeaderStatsRibbon } from "@/app/components/HeaderStatsRibbon";
import { HybridOmnibar } from "@/app/components/HybridOmnibar";
import { ModalManager } from "@/app/components/modals/ModalManager";
import { SetupNotice } from "@/app/components/SetupNotice";
import { registerServiceWorker } from "@/lib/notifications";
import { HabiticaTag, HabiticaUser } from "@/lib/types";
import { Plus } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface DashboardShellClientProps {
  user: HabiticaUser;
  tags: HabiticaTag[];
  isConfigured: boolean;
  children: ReactNode;
}

export function DashboardShellClient({
  user,
  tags,
  isConfigured,
  children,
}: DashboardShellClientProps) {
  const { openModal, refreshData } = useCommandCenter();

  // Register Service Worker for Android Chrome PWA and Web Push
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8 relative">
      {/* 1. Habitica RPG Stats & Header Navigation with Prefetched Links */}
      <HeaderStatsRibbon user={user} isConfigured={isConfigured} />

      {/* 2. Setup Guide Banner (Shown only when Habitica credentials absent) */}
      <SetupNotice isConfigured={isConfigured} />

      {/* 3. Global Hybrid Omnibar */}
      <HybridOmnibar
        tags={tags}
        onOpenBatchModal={() => openModal("batch")}
        onOpenFinanceModal={() => openModal("finance")}
        onRefreshFinance={refreshData}
      />

      {/* 4. Active Route Content (Rendered inside independent Suspense streaming boundary) */}
      <main className="flex-1 w-full flex flex-col">{children}</main>

      {/* Floating Action Button (+) for Instant Mobile/Tablet Capture */}
      <button
        type="button"
        onClick={() => openModal("bottomSheet", { tab: "expense" })}
        aria-label="Captura Rápida Móvil"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all border border-white/20 bottom-safe"
      >
        <Plus className="size-6 stroke-3" />
      </button>

      {/* Dynamic Modal Manager (next/dynamic lazy loading for all modals) */}
      <ModalManager user={user} tags={tags} />

      {/* Footer */}
      <footer className="mt-auto border-t border-white/6 pt-6 pb-2 text-center text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
          <span>Brio OS v1.2 • App Router Streaming • Habitica + Neon DB</span>
          <span>•</span>
          <span>
            Vistas: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘0</kbd> Hoy • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘1</kbd> Tareas • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘2</kbd> Finanzas • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘3</kbd> Balance • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘4</kbd> Agenda • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘5</kbd> Salud • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘6</kbd> Proyectos
          </span>
          <span>•</span>
          <span>
            Atajos: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘P</kbd> Focus • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘J</kbd> Scratchpad • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘M</kbd> AM • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘E</kbd> PM
          </span>
        </div>
      </footer>
    </div>
  );
}
