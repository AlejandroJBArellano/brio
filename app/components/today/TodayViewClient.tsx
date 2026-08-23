"use client";

import { useCommandCenter } from "@/app/components/context/CommandCenterContext";
import { MobileQuickDashboard } from "@/app/components/mobile/MobileQuickDashboard";
import {
  CalendarDaySchedule,
  FinanceDashboardData,
  HabiticaTask,
  HabiticaUser,
  HealthDashboardData,
  RitualLog,
} from "@/lib/types";

interface TodayViewClientProps {
  user: HabiticaUser;
  tasks: HabiticaTask[];
  healthData: HealthDashboardData;
  financeData: FinanceDashboardData;
  calendarSchedule: CalendarDaySchedule;
  todayRitual: RitualLog | null;
}

export function TodayViewClient({
  user,
  tasks,
  healthData,
  financeData,
  calendarSchedule,
  todayRitual,
}: TodayViewClientProps) {
  const { openModal } = useCommandCenter();

  return (
    <MobileQuickDashboard
      user={user}
      tasks={tasks}
      healthData={healthData}
      financeData={financeData}
      calendarSchedule={calendarSchedule}
      todayRitual={todayRitual}
      onOpenBottomSheet={(tab) => openModal("bottomSheet", { tab })}
      onOpenNotificationSettings={() => openModal("notificationSettings")}
      onOpenMorningRitual={() => openModal("morningRitual")}
      onOpenEveningReview={() => openModal("eveningReview")}
      onOpenManageSupplements={() => openModal("manageSupplements")}
    />
  );
}
