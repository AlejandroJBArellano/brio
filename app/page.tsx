import { fetchAnalyticsDataAction } from "@/app/actions/analytics";
import { fetchCalendarScheduleAction } from "@/app/actions/calendar";
import { fetchFinanceDashboardDataAction } from "@/app/actions/finance";
import { fetchHealthDashboardDataAction } from "@/app/actions/health";
import { fetchProjectsDashboardDataAction } from "@/app/actions/projects";
import { fetchTodayRitualAction } from "@/app/actions/rituals";
import { fetchDashboardDataAction } from "@/app/actions/tasks";
import { BrioCommandCenter } from "@/app/components/BrioCommandCenter";

export const dynamic = "force-dynamic";

export default async function BrioDashboardPage() {
  const [
    habiticaData,
    financeData,
    analyticsData,
    calendarData,
    todayRitual,
    healthData,
    projectsData,
  ] = await Promise.all([
    fetchDashboardDataAction(),
    fetchFinanceDashboardDataAction(),
    fetchAnalyticsDataAction(),
    fetchCalendarScheduleAction(),
    fetchTodayRitualAction(),
    fetchHealthDashboardDataAction(),
    fetchProjectsDashboardDataAction(),
  ]);

  return (
    <main className="min-h-screen flex flex-col">
      <BrioCommandCenter
        user={habiticaData.user}
        tasks={habiticaData.tasks}
        tags={habiticaData.tags}
        isConfigured={habiticaData.isConfigured}
        financeData={financeData}
        analyticsData={analyticsData}
        calendarSchedule={calendarData.schedule}
        isCalendarConfigured={calendarData.isConfigured}
        todayRitual={todayRitual}
        healthData={healthData}
        projectsData={projectsData}
      />
    </main>
  );
}
