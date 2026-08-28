import { fetchTrainingHealthDataAction } from "@/app/actions/health";
import { TrainingHealthView } from "@/app/components/health/TrainingHealthView";
import { TrainingHealthSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function TrainingPage() {
  return (
    <Suspense fallback={<TrainingHealthSkeleton />}>
      <AsyncTrainingContent />
    </Suspense>
  );
}

async function AsyncTrainingContent() {
  const trainingData = await fetchTrainingHealthDataAction();
  return <TrainingHealthView data={trainingData} />;
}
