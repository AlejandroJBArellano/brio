import { getOwnerSession } from "@/app/actions/auth";
import { AuthGate } from "@/app/components/auth/AuthGate";
import {
  CommandCenterProvider,
} from "@/app/components/context/CommandCenterContext";
import { DashboardShellClient } from "@/app/components/layout/DashboardShellClient";
import { getCachedDashboardData } from "@/lib/dal/tasks";
import { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 1. Server-side owner session check
  const session = await getOwnerSession();
  if (!session.isAuthenticated) {
    return <AuthGate />;
  }

  // 2. Fetch master user & tags from native tasks DAL
  const dashboardData = await getCachedDashboardData();

  return (
    <CommandCenterProvider>
      <DashboardShellClient
        user={dashboardData.user}
        tasks={dashboardData.tasks}
        tags={dashboardData.tags}
        isConfigured={dashboardData.isConfigured}
      >
        {children}
      </DashboardShellClient>
    </CommandCenterProvider>
  );
}
