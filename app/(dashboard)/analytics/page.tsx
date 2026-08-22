import { fetchAnalyticsDataAction } from "@/app/actions/analytics";
import { AnalyticsView } from "@/app/components/analytics/AnalyticsView";
import { AnalyticsSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AsyncAnalyticsContent />
    </Suspense>
  );
}

async function AsyncAnalyticsContent() {
  const analyticsData = await fetchAnalyticsDataAction();
  return <AnalyticsView data={analyticsData} />;
}
