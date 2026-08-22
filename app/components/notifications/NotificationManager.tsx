"use client";

import { checkAndTriggerSmartReminders } from "@/lib/notifications";
import { FinanceDashboardData, HealthDashboardData, RitualLog } from "@/lib/types";
import { useEffect } from "react";

interface NotificationManagerProps {
  healthData?: HealthDashboardData;
  financeData?: FinanceDashboardData;
  todayRitual?: RitualLog | null;
}

export function NotificationManager({
  healthData,
  financeData,
  todayRitual,
}: NotificationManagerProps) {
  useEffect(() => {
    // 1. Run immediate check on mount / data change
    const runCheck = () => {
      const todaySupplements = healthData?.todayHealth?.supplements || [];
      const waterMl = healthData?.todayHealth?.waterMl || 0;
      const todayAntExpenses = financeData?.totalAntExpensesToday || 0;
      const antExpenseDailyLimit = financeData?.currentBudget?.dailyAntLimit || 150;
      const hasCompletedMorningRitual = Boolean(todayRitual?.mustWinTasks && todayRitual.mustWinTasks.length > 0);
      const hasCompletedEveningReview = Boolean(todayRitual?.expensesLogged);

      checkAndTriggerSmartReminders({
        todaySupplements,
        waterMl,
        todayAntExpenses,
        antExpenseDailyLimit,
        hasCompletedMorningRitual,
        hasCompletedEveningReview,
      });
    };

    runCheck();

    // 2. Periodic check every 60 seconds
    const interval = setInterval(runCheck, 60 * 1000);
    return () => clearInterval(interval);
  }, [healthData, financeData, todayRitual]);

  return null;
}
