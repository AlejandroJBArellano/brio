import { getOwnerSession } from "@/app/actions/auth";
import { AuthGate } from "@/app/components/auth/AuthGate";
import {
  CommandCenterProvider,
} from "@/app/components/context/CommandCenterContext";
import { DashboardShellClient } from "@/app/components/layout/DashboardShellClient";
import { getCachedHabiticaDashboardData } from "@/lib/dal/habitica";
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

  // 2. Fetch master Habitica user & tags from cached DAL
  const habiticaData = await getCachedHabiticaDashboardData();

  return (
    <CommandCenterProvider>
      <DashboardShellClient
        user={habiticaData.user}
        tasks={habiticaData.tasks}
        tags={habiticaData.tags}
        isConfigured={habiticaData.isConfigured}
      >
        {children}
      </DashboardShellClient>
    </CommandCenterProvider>
  );
}
