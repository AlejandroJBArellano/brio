import { fetchFinanceDashboardDataAction } from "@/app/actions/finance";
import { fetchDailyHealthDataAction } from "@/app/actions/health";
import { fetchContextualNotesAction } from "@/app/actions/notes";
import { fetchProjectsDashboardDataAction } from "@/app/actions/projects";
import { fetchTodayRitualAction } from "@/app/actions/rituals";
import { fetchDashboardDataAction } from "@/app/actions/tasks";
import { TodaySkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { TodayViewClient } from "@/app/components/today/TodayViewClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeleton />}>
      <AsyncTodayContent />
    </Suspense>
  );
}

async function AsyncTodayContent() {
  const [
    habiticaData,
    healthData,
    financeData,
    todayRitual,
    projectsData,
    contextualNotes,
  ] = await Promise.all([
    fetchDashboardDataAction(),
    fetchDailyHealthDataAction(),
    fetchFinanceDashboardDataAction(),
    fetchTodayRitualAction(),
    fetchProjectsDashboardDataAction().catch(() => ({
      projects: [],
      learningItems: [],
      scratchpadContent: "",
    })),
    fetchContextualNotesAction().catch(() => []),
  ]);

  return (
    <TodayViewClient
      user={habiticaData.user}
      tasks={habiticaData.tasks}
      tags={habiticaData.tags || []}
      healthData={healthData}
      financeData={financeData}
      todayRitual={todayRitual}
      projects={projectsData.projects}
      contextualNotes={contextualNotes}
    />
  );
}
