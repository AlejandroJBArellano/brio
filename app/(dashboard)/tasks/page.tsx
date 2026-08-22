import { fetchTodayRitualAction } from "@/app/actions/rituals";
import { fetchDashboardDataAction } from "@/app/actions/tasks";
import { TasksSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { TasksViewClient } from "@/app/components/tasks/TasksViewClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksSkeleton />}>
      <AsyncTasksContent />
    </Suspense>
  );
}

async function AsyncTasksContent() {
  const [dashboardData, todayRitual] = await Promise.all([
    fetchDashboardDataAction(),
    fetchTodayRitualAction(),
  ]);

  return (
    <TasksViewClient
      tasks={dashboardData.tasks}
      tags={dashboardData.tags}
      todayRitual={todayRitual}
    />
  );
}
