"use client";

import { HabiticaTag, HabiticaTask, HabiticaUser } from "@/lib/types";
import { useState } from "react";
import { BatchCaptureModal } from "./BatchCaptureModal";
import { CommandPalette } from "./CommandPalette";
import { HeaderStatsRibbon } from "./HeaderStatsRibbon";
import { HybridOmnibar } from "./HybridOmnibar";
import { SetupNotice } from "./SetupNotice";
import { TaskInspectorPane } from "./TaskInspectorPane";
import { TaskStream } from "./TaskStream";

interface BrioCommandCenterProps {
  user: HabiticaUser;
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  isConfigured: boolean;
}

export function BrioCommandCenter({
  user,
  tasks,
  tags,
  isConfigured,
}: BrioCommandCenterProps) {
  const [selectedTask, setSelectedTask] = useState<HabiticaTask | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "dailies" | "todos" | "habits"
  >("all");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Keep selected task updated with latest data from stream
  const currentSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) || selectedTask
    : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
      {/* 1. Habitica RPG Stats & Header */}
      <HeaderStatsRibbon
        user={user}
        isConfigured={isConfigured}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* 2. Setup Guide Banner (Shown when credentials absent) */}
      <SetupNotice isConfigured={isConfigured} />

      {/* 3. Hybrid Omnibar (1-line capture with #tag autocomplete + ⌘B batch modal trigger) */}
      <HybridOmnibar
        tags={tags}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
      />

      {/* 4. Split-Pane Workspace (Task Stream Left + Linear Inspector Right) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left / Center Stream */}
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

      {/* 5. Global Raycast Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        tags={tags}
        isResting={user.flags?.rest}
        onOpenBatchCapture={() => setIsBatchModalOpen(true)}
        onSelectTask={(task) => setSelectedTask(task)}
        onFilterType={(type) => {
          setActiveTab(type);
          setActiveTagFilter(null);
        }}
        onFilterTag={(tagName) => {
          setActiveTagFilter(tagName);
          setActiveTab("all");
        }}
      />

      {/* 6. Frictionless Batch Capture Modal (⌘B or C) */}
      <BatchCaptureModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.06] pt-6 pb-2 text-center text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>
            Brio OS v0.2.0 • Raycast + Linear Command Center for Habitica
          </span>
          <span>•</span>
          <span className="font-mono">
            Palette: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘K</kbd> • Batch: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘B</kbd> • Vim: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">j/k</kbd>
          </span>
        </div>
      </footer>
    </div>
  );
}
