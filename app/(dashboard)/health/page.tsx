import { fetchHealthDashboardDataAction } from "@/app/actions/health";
import { HealthView } from "@/app/components/health/HealthView";
import { HealthSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function HealthPage() {
  return (
    <Suspense fallback={<HealthSkeleton />}>
      <AsyncHealthContent />
    </Suspense>
  );
}

async function AsyncHealthContent() {
  const healthData = await fetchHealthDashboardDataAction();
  return <HealthView data={healthData} />;
}
