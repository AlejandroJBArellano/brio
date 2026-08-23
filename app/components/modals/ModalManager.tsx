"use client";

import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import {
  CalendarDaySchedule,
  FinanceDashboardData,
  HabiticaTag,
  HabiticaTask,
  HabiticaUser,
  HealthDashboardData,
  ProjectsDashboardData,
} from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import dynamic from "next/dynamic";

// Dynamic imports for bundle optimization - components load only when requested
const CommandPalette = dynamic(
  () => import("@/app/components/CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

const BatchCaptureModal = dynamic(
  () => import("@/app/components/BatchCaptureModal").then((mod) => mod.BatchCaptureModal),
  { ssr: false }
);

const MorningRitualModal = dynamic(
  () => import("@/app/components/MorningRitualModal").then((mod) => mod.MorningRitualModal),
  { ssr: false }
);

const EveningReviewModal = dynamic(
  () => import("@/app/components/EveningReviewModal").then((mod) => mod.EveningReviewModal),
  { ssr: false }
);

const TransactionModal = dynamic(
  () => import("@/app/components/finance/TransactionModal").then((mod) => mod.TransactionModal),
  { ssr: false }
);

const AuthModal = dynamic(
  () => import("@/app/components/auth/AuthModal").then((mod) => mod.AuthModal),
  { ssr: false }
);

const FocusModal = dynamic(
  () => import("@/app/components/focus/FocusModal").then((mod) => mod.FocusModal),
  { ssr: false }
);

const ScratchpadModal = dynamic(
  () => import("@/app/components/projects/ScratchpadModal").then((mod) => mod.ScratchpadModal),
  { ssr: false }
);

const NotificationSettingsModal = dynamic(
  () =>
    import("@/app/components/notifications/NotificationSettingsModal").then(
      (mod) => mod.NotificationSettingsModal
    ),
  { ssr: false }
);

const MobileBottomSheet = dynamic(
  () => import("@/app/components/mobile/MobileBottomSheet").then((mod) => mod.MobileBottomSheet),
  { ssr: false }
);

const SmartFitModal = dynamic(
  () => import("@/app/components/health/SmartFitModal").then((mod) => mod.SmartFitModal),
  { ssr: false }
);

const ManageSupplementsModal = dynamic(
  () =>
    import("@/app/components/health/ManageSupplementsModal").then(
      (mod) => mod.ManageSupplementsModal
    ),
  { ssr: false }
);

const AddLabReportModal = dynamic(
  () =>
    import("@/app/components/health/biomarkers/AddLabReportModal").then(
      (mod) => mod.AddLabReportModal
    ),
  { ssr: false }
);

const ManageFinanceCatalogModal = dynamic(
  () =>
    import("@/app/components/finance/ManageFinanceCatalogModal").then(
      (mod) => mod.ManageFinanceCatalogModal
    ),
  { ssr: false }
);

interface ModalManagerProps {
  user: HabiticaUser;
  tasks?: HabiticaTask[];
  tags?: HabiticaTag[];
  calendarSchedule?: CalendarDaySchedule;
  financeData?: FinanceDashboardData;
  healthData?: HealthDashboardData;
  projectsData?: ProjectsDashboardData;
}

export function ModalManager({
  user,
  tasks = [],
  tags = [],
  calendarSchedule = {
    date: getTodayDateStr(),
    events: [],
    totalMeetingMinutes: 0,
  },
  financeData,
  healthData,
  projectsData,
}: ModalManagerProps) {
  const {
    activeModal,
    modalPayload,
    closeModal,
    openModal,
    setActiveMainTab,
    setSelectedTask,
    setActiveTaskTab,
    setActiveTagFilter,
    mustWinTaskIds,
    setMustWinTaskIds,
    refreshData,
  } = useCommandCenter();

  if (!activeModal) return null;

  const payload = modalPayload as Record<string, unknown> | null;

  return (
    <>
      {activeModal === "commandPalette" && (
        <CommandPalette
          isOpen={true}
          onClose={closeModal}
          tasks={tasks}
          tags={tags}
          isResting={user.flags?.rest}
          onOpenBatchCapture={() => openModal("batch")}
          onOpenMorningRitual={() => openModal("morningRitual")}
          onOpenEveningReview={() => openModal("eveningReview")}
          onOpenFinanceModal={() => openModal("finance")}
          onSelectMainTab={setActiveMainTab}
          onSelectTask={(task) => {
            setActiveMainTab("tasks");
            setSelectedTask(task);
          }}
          onFilterType={(type) => {
            setActiveMainTab("tasks");
            setActiveTaskTab(type);
            setActiveTagFilter(null);
          }}
          onFilterTag={(tagName) => {
            setActiveMainTab("tasks");
            setActiveTagFilter(tagName);
            setActiveTaskTab("all");
          }}
        />
      )}

      {activeModal === "batch" && (
        <BatchCaptureModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === "morningRitual" && (
        <MorningRitualModal
          isOpen={true}
          onClose={closeModal}
          user={user}
          tasks={tasks}
          schedule={calendarSchedule}
          currentMustWins={mustWinTaskIds}
          onSuccess={(newMustWins) => {
            setMustWinTaskIds(newMustWins);
            refreshData();
          }}
        />
      )}

      {activeModal === "eveningReview" && (
        <EveningReviewModal
          isOpen={true}
          onClose={closeModal}
          user={user}
          tasks={tasks}
          mustWinTaskIds={mustWinTaskIds}
          totalAntSpentToday={financeData?.totalAntExpensesToday || 0}
          dailyAntLimit={financeData?.currentBudget?.dailyAntLimit || 150}
          onSuccess={refreshData}
          onOpenNewTransaction={() => openModal("finance")}
        />
      )}

      {activeModal === "finance" && (
        <TransactionModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={refreshData}
          categories={financeData?.categories}
          accounts={financeData?.accounts}
          onOpenManageCatalog={() => openModal("manageFinanceCatalog")}
        />
      )}

      {activeModal === "manageFinanceCatalog" && (
        <ManageFinanceCatalogModal
          isOpen={true}
          onClose={closeModal}
          categories={financeData?.categories || []}
          accounts={financeData?.accounts || []}
          onSuccess={refreshData}
        />
      )}

      {activeModal === "auth" && (
        <AuthModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={refreshData}
        />
      )}

      {activeModal === "focus" && (
        <FocusModal
          isOpen={true}
          onClose={closeModal}
          tasks={tasks}
          onCompleteSession={refreshData}
        />
      )}

      {activeModal === "scratchpad" && (
        <ScratchpadModal
          isOpen={true}
          onClose={closeModal}
          initialContent={projectsData?.scratchpadContent || ""}
          onSuccess={refreshData}
        />
      )}

      {activeModal === "notificationSettings" && (
        <NotificationSettingsModal
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {activeModal === "bottomSheet" && (
        <MobileBottomSheet
          isOpen={true}
          onClose={closeModal}
          categories={financeData?.categories}
          accounts={financeData?.accounts}
          initialTab={
            (payload && typeof payload.tab === "string"
              ? (payload.tab as "expense" | "task" | "water" | "weight" | "nutrition")
              : "expense")
          }
          dailyAntRemaining={
            financeData?.remainingDailyAntBudget ??
            Math.max(
              0,
              (financeData?.currentBudget?.dailyAntLimit || 150) -
                (financeData?.totalAntExpensesToday || 0)
            )
          }
        />
      )}

      {activeModal === "smartFit" && (
        <SmartFitModal
          isOpen={true}
          onClose={closeModal}
          latestLog={healthData?.latestBodyComposition}
          onSuccess={refreshData}
        />
      )}

      {activeModal === "manageSupplements" && (
        <ManageSupplementsModal
          isOpen={true}
          onClose={closeModal}
          supplements={healthData?.supplementsCatalog || []}
          onSuccess={refreshData}
        />
      )}

      {activeModal === "addLabReport" && (
        <AddLabReportModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={refreshData}
        />
      )}
    </>
  );
}
