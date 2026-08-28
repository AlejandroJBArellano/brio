"use client";

import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { TaskInspectorPane } from "@/app/components/TaskInspectorPane";
import { TaskStream } from "@/app/components/TaskStream";
import { HabiticaTag, HabiticaTask, RitualLog } from "@/lib/types";

interface TasksViewClientProps {
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  todayRitual?: RitualLog | null;
}

export function TasksViewClient({
  tasks,
  tags,
}: TasksViewClientProps) {
  const {
    activeTaskTab,
    setActiveTaskTab,
    activeTagFilter,
    setActiveTagFilter,
    selectedTask,
    setSelectedTask,
  } = useCommandCenter();

  const currentSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) || selectedTask
    : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Split-Pane Workspace (Task Stream Left + Linear Inspector Right) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div
          className={`w-full transition-all duration-300 ${
            currentSelectedTask ? "lg:w-[60%]" : "lg:w-full"
          }`}
        >
          <TaskStream
            tasks={tasks}
            tags={tags}
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
