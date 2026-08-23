"use client";

import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { HeaderStatsRibbon } from "@/app/components/HeaderStatsRibbon";
import { HybridOmnibar } from "@/app/components/HybridOmnibar";
import { ModalManager } from "@/app/components/modals/ModalManager";
import { SetupNotice } from "@/app/components/SetupNotice";
import { registerServiceWorker } from "@/lib/notifications";
import { HabiticaTag, HabiticaTask, HabiticaUser } from "@/lib/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface DashboardShellClientProps {
  user: HabiticaUser;
  tasks?: HabiticaTask[];
  tags: HabiticaTag[];
  isConfigured: boolean;
  children: ReactNode;
}

export function DashboardShellClient({
  user,
  tasks = [],
  tags,
  isConfigured,
  children,
}: DashboardShellClientProps) {
  const { openModal, refreshData } = useCommandCenter();
  const router = useRouter();

  // Register Service Worker for Android Chrome PWA and Web Push
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Global keybindings for shortcuts & rituals (⌘P, ⌘J, ⌘M, ⌘E, ⌘F, ⌘B, ⌘K, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      if (e.metaKey || e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (key === "p" && !isInputActive) {
          e.preventDefault();
          openModal("focus");
        } else if (key === "j" && !isInputActive) {
          e.preventDefault();
          openModal("scratchpad");
        } else if (key === "m" && !isInputActive) {
          e.preventDefault();
          openModal("morningRitual");
        } else if (key === "e" && !isInputActive) {
          e.preventDefault();
          openModal("eveningReview");
        } else if (key === "f" && !isInputActive) {
          e.preventDefault();
          openModal("finance");
        } else if (key === "b" && !isInputActive) {
          e.preventDefault();
          openModal("batch");
        } else if (key === "k" && !isInputActive) {
          e.preventDefault();
          openModal("commandPalette");
        } else if (key === "0" && !isInputActive) {
          e.preventDefault();
          router.push("/today");
        } else if (key === "1" && !isInputActive) {
          e.preventDefault();
          router.push("/tasks");
        } else if (key === "2" && !isInputActive) {
          e.preventDefault();
          router.push("/finance");
        } else if (key === "3" && !isInputActive) {
          e.preventDefault();
          router.push("/analytics");
        } else if (key === "4" && !isInputActive) {
          e.preventDefault();
          router.push("/calendar");
        } else if (key === "5" && !isInputActive) {
          e.preventDefault();
          router.push("/health");
        } else if (key === "6" && !isInputActive) {
          e.preventDefault();
          router.push("/vault");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openModal, router]);

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
        className="fixed bottom-6 right-6 z-40 flex size-13 items-center justify-center rounded-full bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] shadow-xl shadow-black/60 hover:scale-105 active:scale-95 transition-all border border-[#E8AF59]/40 bottom-safe cursor-pointer"
      >
        <Plus className="size-6 stroke-3" />
      </button>

      {/* Dynamic Modal Manager (next/dynamic lazy loading for all modals) */}
      <ModalManager user={user} tasks={tasks} tags={tags} />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#2A2723] pt-6 pb-2 text-center text-xs text-[#8E867B]">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
          <span>Brio OS • Habitica + Neon DB</span>
          <span>•</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <span>Vistas:</span>
            <Link href="/today" className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5">
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘0</kbd> Hoy
            </Link>
            •
            <Link href="/tasks" className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5">
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘1</kbd> Tareas
            </Link>
            •
            <Link href="/finance" className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5">
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘2</kbd> Finanzas
            </Link>
            •
            <Link href="/analytics" className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5">
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘3</kbd> Balance
            </Link>
            •
            <Link href="/calendar" className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5">
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘4</kbd> Agenda
            </Link>
            •
            <Link href="/health" className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5">
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘5</kbd> Salud
            </Link>
            •
            <Link href="/vault" className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5">
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘6</kbd> Proyectos
            </Link>
          </span>
          <span>•</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <span>Atajos:</span>
            <button
              type="button"
              onClick={() => openModal("focus")}
              className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5 cursor-pointer"
            >
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘P</kbd> Focus
            </button>
            •
            <button
              type="button"
              onClick={() => openModal("scratchpad")}
              className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5 cursor-pointer"
            >
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘J</kbd> Scratchpad
            </button>
            •
            <button
              type="button"
              onClick={() => openModal("morningRitual")}
              className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5 cursor-pointer"
            >
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘M</kbd> AM
            </button>
            •
            <button
              type="button"
              onClick={() => openModal("eveningReview")}
              className="hover:text-[#F5F2EB] inline-flex items-center gap-0.5 cursor-pointer"
            >
              <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">⌘E</kbd> PM
            </button>
          </span>
        </div>
      </footer>
    </div>
  );
}
