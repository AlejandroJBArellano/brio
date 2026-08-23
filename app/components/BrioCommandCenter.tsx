"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import {
  CommandCenterProvider,
  useCommandCenter,
} from "@/app/components/context/CommandCenterContext";
import { ModalManager } from "@/app/components/modals/ModalManager";
import {
  AnalyticsDashboardData,
  CalendarDaySchedule,
  FinanceDashboardData,
  HabiticaTag,
  HabiticaTask,
  HabiticaUser,
  HealthDashboardData,
  ProjectsDashboardData,
  RitualLog,
  VaultDashboardData,
} from "@/lib/types";
import { Plus } from "lucide-react";
import { useEffect, useTransition } from "react";
import { AnalyticsView } from "./analytics/AnalyticsView";
import { DailyFocusRibbon } from "./DailyFocusRibbon";
import { DayScheduleView } from "./DayScheduleView";
import { FinanceView } from "./finance/FinanceView";
import { HeaderStatsRibbon } from "./HeaderStatsRibbon";
import { HealthView } from "./health/HealthView";
import { HybridOmnibar } from "./HybridOmnibar";
import { MobileQuickDashboard } from "./mobile/MobileQuickDashboard";
import { NotificationManager } from "./notifications/NotificationManager";
import { SetupNotice } from "./SetupNotice";
import { TaskInspectorPane } from "./TaskInspectorPane";
import { TaskStream } from "./TaskStream";
import { VaultView } from "./vault/VaultView";

interface BrioCommandCenterProps {
  user: HabiticaUser;
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  isConfigured: boolean;
  financeData: FinanceDashboardData;
  analyticsData: AnalyticsDashboardData;
  calendarSchedule: CalendarDaySchedule;
  isCalendarConfigured: boolean;
  todayRitual: RitualLog | null;
  healthData: HealthDashboardData;
  projectsData: ProjectsDashboardData;
  vaultData: VaultDashboardData;
}

export function BrioCommandCenter(props: BrioCommandCenterProps) {
  return (
    <CommandCenterProvider initialMustWins={props.todayRitual?.mustWinTasks || []}>
      <BrioCommandCenterContent {...props} />
    </CommandCenterProvider>
  );
}

function BrioCommandCenterContent({
  user,
  tasks,
  tags,
  isConfigured,
  financeData,
  analyticsData,
  calendarSchedule,
  isCalendarConfigured,
  todayRitual,
  healthData,
  projectsData,
  vaultData,
}: BrioCommandCenterProps) {
  const {
    activeMainTab,
    setActiveMainTab,
    activeTaskTab,
    setActiveTaskTab,
    activeTagFilter,
    setActiveTagFilter,
    selectedTask,
    setSelectedTask,
    mustWinTaskIds,
    openModal,
    refreshData,
  } = useCommandCenter();

  const [, startTransition] = useTransition();

  const currentSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) || selectedTask
    : null;

  // Global keybindings for tabs & rituals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      if (e.metaKey || e.ctrlKey) {
        if (e.key === "0") {
          e.preventDefault();
          setActiveMainTab("quick");
        } else if (e.key === "1") {
          e.preventDefault();
          setActiveMainTab("tasks");
        } else if (e.key === "2") {
          e.preventDefault();
          setActiveMainTab("finance");
        } else if (e.key === "3") {
          e.preventDefault();
          setActiveMainTab("analytics");
        } else if (e.key === "4") {
          e.preventDefault();
          setActiveMainTab("calendar");
        } else if (e.key === "5") {
          e.preventDefault();
          setActiveMainTab("health");
        } else if (e.key === "6") {
          e.preventDefault();
          setActiveMainTab("projects");
        } else if (e.key.toLowerCase() === "p" && !isInputActive) {
          e.preventDefault();
          openModal("focus");
        } else if (e.key.toLowerCase() === "j" && !isInputActive) {
          e.preventDefault();
          openModal("scratchpad");
        } else if (e.key.toLowerCase() === "m" && !isInputActive) {
          e.preventDefault();
          openModal("morningRitual");
        } else if (e.key.toLowerCase() === "e" && !isInputActive) {
          e.preventDefault();
          openModal("eveningReview");
        } else if (e.key.toLowerCase() === "f" && !isInputActive) {
          e.preventDefault();
          openModal("finance");
        } else if (e.key.toLowerCase() === "b" && !isInputActive) {
          e.preventDefault();
          openModal("batch");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveMainTab, openModal]);

  const handleToggleMustWin = (taskId: string) => {
    startTransition(async () => {
      await toggleTaskAction(taskId, "up");
    });
  };

  const handleOpenBottomSheetWithTab = (
    tab: "expense" | "task" | "water" | "weight" | "nutrition" = "expense"
  ) => {
    openModal("bottomSheet", { tab });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8 relative">
      {/* Background Notification Watcher */}
      <NotificationManager
        healthData={healthData}
        financeData={financeData}
        todayRitual={todayRitual}
      />

      {/* 1. Habitica RPG Stats & Master Header with Tab Switcher */}
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

      {/* 4. Tab Views Switcher */}
      {activeMainTab === "quick" && (
        <MobileQuickDashboard
          user={user}
          tasks={tasks}
          healthData={healthData}
          financeData={financeData}
          calendarSchedule={calendarSchedule}
          todayRitual={todayRitual}
          onOpenBottomSheet={handleOpenBottomSheetWithTab}
          onOpenNotificationSettings={() => openModal("notificationSettings")}
          onOpenMorningRitual={() => openModal("morningRitual")}
          onOpenEveningReview={() => openModal("eveningReview")}
          onOpenManageSupplements={() => openModal("manageSupplements")}
        />
      )}

      {activeMainTab === "tasks" && (
        <div className="flex flex-col gap-5">
          {/* Daily Must-Win Focus Ribbon */}
          <DailyFocusRibbon
            mustWinTaskIds={mustWinTaskIds}
            tasks={tasks}
            onToggleTask={handleToggleMustWin}
            onOpenMorningRitual={() => openModal("morningRitual")}
          />

          {/* Split-Pane Workspace (Task Stream Left + Linear Inspector Right) */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <div
              className={`w-full transition-all duration-300 ${
                currentSelectedTask ? "lg:w-[60%]" : "lg:w-full"
              }`}
            >
              <TaskStream
                tasks={tasks}
                selectedTaskId={currentSelectedTask?.id || null}
                onSelectTask={(task) => setSelectedTask(task)}
                activeTab={activeTaskTab}
                onTabChange={(tab) => {
                  setActiveTaskTab(tab);
                  setActiveTagFilter(null);
                }}
                activeTagFilter={activeTagFilter}
                onClearTagFilter={() => setActiveTagFilter(null)}
              />
            </div>

            {/* Right Linear Inspector Pane */}
            {currentSelectedTask && (
              <div className="w-full lg:w-[40%] sticky top-6 z-20 animate-in fade-in slide-in-from-right-4 duration-200">
                <TaskInspectorPane
                  task={currentSelectedTask}
                  tags={tags}
                  onClose={() => setSelectedTask(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeMainTab === "finance" && (
        <FinanceView data={financeData} onRefresh={refreshData} />
      )}

      {activeMainTab === "analytics" && (
        <AnalyticsView data={analyticsData} />
      )}

      {activeMainTab === "calendar" && (
        <DayScheduleView
          schedule={calendarSchedule}
          isConfigured={isCalendarConfigured}
          onRefresh={refreshData}
          onSaveCalendarUrl={() => {
            refreshData();
          }}
        />
      )}

      {activeMainTab === "health" && (
        <HealthView data={healthData} onRefresh={refreshData} />
      )}

      {activeMainTab === "projects" && (
        <VaultView
          data={vaultData}
          onRefresh={refreshData}
          onOpenScratchpad={() => openModal("scratchpad")}
        />
      )}

      {/* Floating Action Button (+) for Instant Mobile/Tablet Capture */}
      <button
        type="button"
        onClick={() => handleOpenBottomSheetWithTab("expense")}
        aria-label="Captura Rápida Móvil"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all border border-white/20 bottom-safe"
      >
        <Plus className="size-6 stroke-3" />
      </button>

      {/* Dynamic Modal Manager (next/dynamic lazy loading for all modals) */}
      <ModalManager
        user={user}
        tasks={tasks}
        tags={tags}
        calendarSchedule={calendarSchedule}
        financeData={financeData}
        healthData={healthData}
        projectsData={projectsData}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-white/6 pt-6 pb-2 text-center text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
          <span>Brio OS v1.1 • Habitica + Neon DB + PWA Mobile</span>
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
