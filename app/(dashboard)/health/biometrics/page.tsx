import { fetchBiometricsHealthDataAction } from "@/app/actions/health";
import { BiometricsHealthView } from "@/app/components/health/BiometricsHealthView";
import { BiometricsHealthSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function BiometricsPage() {
  return (
    <Suspense fallback={<BiometricsHealthSkeleton />}>
      <AsyncBiometricsContent />
    </Suspense>
  );
}

async function AsyncBiometricsContent() {
  const biometricsData = await fetchBiometricsHealthDataAction();
  return <BiometricsHealthView data={biometricsData} />;
}
