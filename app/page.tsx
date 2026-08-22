import { fetchAnalyticsDataAction } from "@/app/actions/analytics";
import { fetchCalendarScheduleAction } from "@/app/actions/calendar";
import { fetchFinanceDashboardDataAction } from "@/app/actions/finance";
import { fetchHealthDashboardDataAction } from "@/app/actions/health";
import { fetchProjectsDashboardDataAction } from "@/app/actions/projects";
import { fetchTodayRitualAction } from "@/app/actions/rituals";
import { fetchDashboardDataAction } from "@/app/actions/tasks";
import { AuthGate } from "@/app/components/auth/AuthGate";
import { BrioCommandCenter } from "@/app/components/BrioCommandCenter";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function BrioDashboardPage() {
  // 1. Server-side session verification via Better Auth / Neon Auth
  let session = null;
  try {
    const headerList = await headers();
    session = await auth.api.getSession({
      headers: headerList,
    });
  } catch (error) {
    console.error("[Session verification error]:", error);
  }

  // 2. If user is not authenticated, render the secure Auth Gate
  if (!session?.user) {
    return <AuthGate />;
  }

  // 3. Load user dashboard data concurrently
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
