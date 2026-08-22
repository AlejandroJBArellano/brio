import { fetchCalendarScheduleAction } from "@/app/actions/calendar";
import { fetchFinanceDashboardDataAction } from "@/app/actions/finance";
import { fetchHealthDashboardDataAction } from "@/app/actions/health";
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
    calendarData,
    todayRitual,
  ] = await Promise.all([
    fetchDashboardDataAction(),
    fetchHealthDashboardDataAction(),
    fetchFinanceDashboardDataAction(),
    fetchCalendarScheduleAction(),
    fetchTodayRitualAction(),
  ]);

  return (
    <TodayViewClient
      user={habiticaData.user}
      tasks={habiticaData.tasks}
      healthData={healthData}
      financeData={financeData}
      calendarSchedule={calendarData.schedule}
      todayRitual={todayRitual}
    />
  );
}
