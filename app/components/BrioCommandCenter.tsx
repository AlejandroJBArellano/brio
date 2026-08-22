"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
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
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AnalyticsView } from "./analytics/AnalyticsView";
import { AuthModal } from "./auth/AuthModal";
import { BatchCaptureModal } from "./BatchCaptureModal";
import { CommandPalette } from "./CommandPalette";
import { DailyFocusRibbon } from "./DailyFocusRibbon";
import { DayScheduleView } from "./DayScheduleView";
import { EveningReviewModal } from "./EveningReviewModal";
import { FinanceView } from "./finance/FinanceView";
import { TransactionModal } from "./finance/TransactionModal";
import { FocusModal } from "./focus/FocusModal";
import { DashboardMainTab, HeaderStatsRibbon } from "./HeaderStatsRibbon";
import { HealthView } from "./health/HealthView";
import { HybridOmnibar } from "./HybridOmnibar";
import { MorningRitualModal } from "./MorningRitualModal";
import { ProjectsView } from "./projects/ProjectsView";
import { ScratchpadModal } from "./projects/ScratchpadModal";
import { SetupNotice } from "./SetupNotice";
import { TaskInspectorPane } from "./TaskInspectorPane";
import { TaskStream } from "./TaskStream";

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
}

export function BrioCommandCenter({
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
}: BrioCommandCenterProps) {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<DashboardMainTab>("tasks");
  const [selectedTask, setSelectedTask] = useState<HabiticaTask | null>(null);
  const [mustWinTaskIds, setMustWinTaskIds] = useState<string[]>(
    todayRitual?.mustWinTasks || []
  );

  // Modals state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMorningRitualOpen, setIsMorningRitualOpen] = useState(false);
  const [isEveningReviewOpen, setIsEveningReviewOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Task stream filters
  const [activeTab, setActiveTab] = useState<
    "all" | "dailies" | "todos" | "habits"
  >("all");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Keep selected task updated
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
        if (e.key === "1") {
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
          setIsFocusModalOpen(true);
        } else if (e.key.toLowerCase() === "j" && !isInputActive) {
          e.preventDefault();
          setIsScratchpadOpen(true);
        } else if (e.key.toLowerCase() === "m" && !isInputActive) {
          e.preventDefault();
          setIsMorningRitualOpen(true);
        } else if (e.key.toLowerCase() === "e" && !isInputActive) {
          e.preventDefault();
          setIsEveningReviewOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleToggleMustWin = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    startTransition(async () => {
      await toggleTaskAction(taskId, "up");
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
      {/* 1. Habitica RPG Stats & Master Header with Tab Switcher */}
      <HeaderStatsRibbon
        user={user}
        isConfigured={isConfigured}
        activeMainTab={activeMainTab}
        onTabChange={setActiveMainTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenMorningRitual={() => setIsMorningRitualOpen(true)}
        onOpenEveningReview={() => setIsEveningReviewOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenFocusModal={() => setIsFocusModalOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
      />

      {/* 2. Setup Guide Banner (Shown only when Habitica credentials absent) */}
      <SetupNotice isConfigured={isConfigured} />

      {/* 3. Global Hybrid Omnibar (Captures Tasks or Brio Finanzas with #tags and @accounts) */}
      <HybridOmnibar
        tags={tags}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenFinanceModal={() => setIsFinanceModalOpen(true)}
        onRefreshFinance={handleRefresh}
      />

      {/* 4. Tab Views Switcher */}
      {activeMainTab === "tasks" && (
        <div className="flex flex-col gap-5">
          {/* Daily Must-Win Focus Ribbon */}
          <DailyFocusRibbon
            mustWinTaskIds={mustWinTaskIds}
            tasks={tasks}
            onToggleTask={handleToggleMustWin}
            onOpenMorningRitual={() => setIsMorningRitualOpen(true)}
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
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
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
        <FinanceView data={financeData} onRefresh={handleRefresh} />
      )}

      {activeMainTab === "analytics" && (
        <AnalyticsView data={analyticsData} />
      )}

      {activeMainTab === "calendar" && (
        <DayScheduleView
          schedule={calendarSchedule}
          isConfigured={isCalendarConfigured}
          onRefresh={handleRefresh}
          onSaveCalendarUrl={(url) => {
            handleRefresh();
          }}
        />
      )}

      {activeMainTab === "health" && (
        <HealthView data={healthData} onRefresh={handleRefresh} />
      )}

      {activeMainTab === "projects" && (
        <ProjectsView
          data={projectsData}
          onRefresh={handleRefresh}
          onOpenScratchpad={() => setIsScratchpadOpen(true)}
        />
      )}

      {/* 5. Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        tags={tags}
        isResting={user.flags?.rest}
        onOpenBatchCapture={() => setIsBatchModalOpen(true)}
        onOpenMorningRitual={() => setIsMorningRitualOpen(true)}
        onOpenEveningReview={() => setIsEveningReviewOpen(true)}
        onOpenFinanceModal={() => setIsFinanceModalOpen(true)}
        onSelectMainTab={setActiveMainTab}
        onSelectTask={(task) => {
          setActiveMainTab("tasks");
          setSelectedTask(task);
        }}
        onFilterType={(type) => {
          setActiveMainTab("tasks");
          setActiveTab(type);
          setActiveTagFilter(null);
        }}
        onFilterTag={(tagName) => {
          setActiveMainTab("tasks");
          setActiveTagFilter(tagName);
          setActiveTab("all");
        }}
      />

      {/* 6. Batch Tasks Capture Modal (⌘B) */}
      <BatchCaptureModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      {/* 7. Morning Kickoff Ritual Modal (⌘M) */}
      <MorningRitualModal
        isOpen={isMorningRitualOpen}
        onClose={() => setIsMorningRitualOpen(false)}
        user={user}
        tasks={tasks}
        schedule={calendarSchedule}
        currentMustWins={mustWinTaskIds}
        onSuccess={(newMustWins) => {
          setMustWinTaskIds(newMustWins);
          handleRefresh();
        }}
      />

      {/* 8. Evening Review Ritual Modal (⌘E) */}
      <EveningReviewModal
        isOpen={isEveningReviewOpen}
        onClose={() => setIsEveningReviewOpen(false)}
        user={user}
        tasks={tasks}
        mustWinTaskIds={mustWinTaskIds}
        totalAntSpentToday={financeData.totalAntExpensesToday}
        dailyAntLimit={financeData.currentBudget.dailyAntLimit}
        onSuccess={handleRefresh}
        onOpenNewTransaction={() => setIsFinanceModalOpen(true)}
      />

      {/* 9. Brio Finanzas Quick Transaction Modal (⌘F) */}
      <TransactionModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* 10. Neon Auth / Better Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* 11. Focus Zen & Deep Work Modal (⌘P) */}
      <FocusModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        tasks={tasks}
        onCompleteSession={handleRefresh}
      />

      {/* 12. Floating Scratchpad (⌘J) */}
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        initialContent={projectsData.scratchpadContent}
        onSuccess={handleRefresh}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.06] pt-6 pb-2 text-center text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
          <span>Brio OS v1.0 • Habitica + Neon DB + Google Calendar</span>
          <span>•</span>
          <span>
            Vistas: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘1</kbd> Tareas • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘2</kbd> Finanzas • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘3</kbd> Balance • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘4</kbd> Agenda • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘5</kbd> Salud • <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘6</kbd> Proyectos
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
