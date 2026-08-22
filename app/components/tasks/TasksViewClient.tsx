"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { DailyFocusRibbon } from "@/app/components/DailyFocusRibbon";
import { TaskInspectorPane } from "@/app/components/TaskInspectorPane";
import { TaskStream } from "@/app/components/TaskStream";
import { HabiticaTag, HabiticaTask, RitualLog } from "@/lib/types";
import { useTransition } from "react";

interface TasksViewClientProps {
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  todayRitual: RitualLog | null;
}

export function TasksViewClient({
  tasks,
  tags,
  todayRitual,
}: TasksViewClientProps) {
  const {
    activeTaskTab,
    setActiveTaskTab,
    activeTagFilter,
    setActiveTagFilter,
    selectedTask,
    setSelectedTask,
    mustWinTaskIds,
    setMustWinTaskIds,
    openModal,
  } = useCommandCenter();

  const [, startTransition] = useTransition();

  const currentSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) || selectedTask
    : null;

  const currentMustWins =
    mustWinTaskIds.length > 0 ? mustWinTaskIds : todayRitual?.mustWinTasks || [];

  const handleToggleMustWin = (taskId: string) => {
    startTransition(async () => {
      await toggleTaskAction(taskId, "up");
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Daily Must-Win Focus Ribbon */}
      <DailyFocusRibbon
        mustWinTaskIds={currentMustWins}
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
  );
}
