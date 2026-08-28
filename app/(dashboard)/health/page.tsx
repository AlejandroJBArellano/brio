import { fetchDailyHealthDataAction } from "@/app/actions/health";
import { DailyHealthView } from "@/app/components/health/DailyHealthView";
import { DailyHealthSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function HealthPage() {
  return (
    <Suspense fallback={<DailyHealthSkeleton />}>
      <AsyncDailyHealthContent />
    </Suspense>
  );
}

async function AsyncDailyHealthContent() {
  const dailyData = await fetchDailyHealthDataAction();
  return <DailyHealthView data={dailyData} />;
}

