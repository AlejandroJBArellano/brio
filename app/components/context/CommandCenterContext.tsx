"use client";

import { HabiticaTask } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
  useTransition,
} from "react";

export type DashboardMainTab =
  | "today"
  | "quick"
  | "tasks"
  | "finance"
  | "analytics"
  | "calendar"
  | "health"
  | "projects";

export type TaskStreamTab = "all" | "dailies" | "todos" | "habits";

export type ModalType =
  | "batch"
  | "commandPalette"
  | "morningRitual"
  | "eveningReview"
  | "finance"
  | "auth"
  | "focus"
  | "scratchpad"
  | "notificationSettings"
  | "bottomSheet"
  | "smartFit"
  | "manageSupplements"
  | "manageFinanceCatalog"
  | "addLabReport";

export interface ModalPayloadMap {
  bottomSheet: { tab?: "expense" | "task" | "water" | "nutrition" };
  // Other modals can have custom payloads if needed
  [key: string]: unknown;
}

interface CommandCenterContextValue {
  // Navigation & Tabs
  activeMainTab: DashboardMainTab;
  setActiveMainTab: (tab: DashboardMainTab) => void;
  activeTaskTab: TaskStreamTab;
  setActiveTaskTab: (tab: TaskStreamTab) => void;
  activeTagFilter: string | null;
  setActiveTagFilter: (tag: string | null) => void;

  // Selected Task & Must-Wins
  selectedTask: HabiticaTask | null;
  setSelectedTask: (task: HabiticaTask | null) => void;
  mustWinTaskIds: string[];
  setMustWinTaskIds: (ids: string[]) => void;

  // Centralized Modal Management
  activeModal: ModalType | null;
  modalPayload: unknown;
  openModal: (modal: ModalType, payload?: unknown) => void;
  closeModal: () => void;

  // Server Refresh Transition
  isRefreshing: boolean;
  refreshData: () => void;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

interface CommandCenterProviderProps {
  children: ReactNode;
  initialMustWins?: string[];
}

export function CommandCenterProvider({
  children,
  initialMustWins = [],
}: CommandCenterProviderProps) {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<DashboardMainTab>("today");
  const [activeTaskTab, setActiveTaskTab] = useState<TaskStreamTab>("all");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<HabiticaTask | null>(null);
  const [mustWinTaskIds, setMustWinTaskIds] = useState<string[]>(initialMustWins);

  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [modalPayload, setModalPayload] = useState<unknown>(null);

  const [isRefreshing, startTransition] = useTransition();

  const openModal = useCallback((modal: ModalType, payload: unknown = null) => {
    setActiveModal(modal);
    setModalPayload(payload);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalPayload(null);
  }, []);

  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const { syncHabiticaDataAction } = await import("@/app/actions/tasks");
        await syncHabiticaDataAction();
      } catch {
        // Continue with router refresh even if network sync action fails
      }
      router.refresh();
    });
  }, [router]);

  return (
    <CommandCenterContext.Provider
      value={{
        activeMainTab,
        setActiveMainTab,
        activeTaskTab,
        setActiveTaskTab,
        activeTagFilter,
        setActiveTagFilter,
        selectedTask,
        setSelectedTask,
        mustWinTaskIds,
        setMustWinTaskIds,
        activeModal,
        modalPayload,
        openModal,
        closeModal,
        isRefreshing,
        refreshData,
      }}
    >
      {children}
    </CommandCenterContext.Provider>
  );
}

export function useCommandCenter(): CommandCenterContextValue {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error(
      "useCommandCenter must be used within a CommandCenterProvider"
    );
  }
  return context;
}
