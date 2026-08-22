import { fetchAnalyticsDataAction } from "@/app/actions/analytics";
import { getOwnerSession } from "@/app/actions/auth";
import { fetchCalendarScheduleAction } from "@/app/actions/calendar";
import { fetchFinanceDashboardDataAction } from "@/app/actions/finance";
import { fetchHealthDashboardDataAction } from "@/app/actions/health";
import { fetchProjectsDashboardDataAction } from "@/app/actions/projects";
import { fetchTodayRitualAction } from "@/app/actions/rituals";
import { fetchDashboardDataAction } from "@/app/actions/tasks";
import { fetchVaultDashboardDataAction } from "@/app/actions/vault";
import { AuthGate } from "@/app/components/auth/AuthGate";
import { BrioCommandCenter } from "@/app/components/BrioCommandCenter";
import { DashboardSkeleton } from "@/app/components/skeletons/DashboardSkeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function BrioDashboardPage() {
  // 1. Server-side private owner session check (instant cookie check)
  const session = await getOwnerSession();

  // 2. If not authenticated, present the private owner Auth Gate
  if (!session.isAuthenticated) {
    return <AuthGate />;
  }

  // 3. Stream the dashboard with high-fidelity skeleton fallback
  return (
    <main className="min-h-screen flex flex-col">
      <Suspense fallback={<DashboardSkeleton />}>
        <AsyncDashboardContent />
      </Suspense>
    </main>
  );
}

/**
 * Asynchronous Server Component that loads all dashboard domain data in parallel.
 * Streams into the Suspense boundary as soon as data resolution completes.
 */
async function AsyncDashboardContent() {
  const [
    habiticaData,
    financeData,
    analyticsData,
    calendarData,
    todayRitual,
    healthData,
    projectsData,
    vaultData,
  ] = await Promise.all([
    fetchDashboardDataAction(),
    fetchFinanceDashboardDataAction(),
    fetchAnalyticsDataAction(),
    fetchCalendarScheduleAction(),
    fetchTodayRitualAction(),
    fetchHealthDashboardDataAction(),
    fetchProjectsDashboardDataAction(),
    fetchVaultDashboardDataAction(),
  ]);

  return (
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
      vaultData={vaultData}
    />
  );
}
