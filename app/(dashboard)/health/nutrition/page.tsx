import { fetchNutritionDashboardDataAction } from "@/app/actions/nutrition";
import { NutritionView } from "@/app/components/health/nutrition/NutritionView";
import { NutritionHealthSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { getTodayDateStr } from "@/lib/dateUtils";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function NutritionPage() {
  return (
    <Suspense fallback={<NutritionHealthSkeleton />}>
      <AsyncNutritionContent />
    </Suspense>
  );
}

async function AsyncNutritionContent() {
  const todayStr = getTodayDateStr();
  const nutritionData = await fetchNutritionDashboardDataAction(todayStr);

  if (!nutritionData) {
    return (
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-8 text-center text-xs text-[#8E867B]">
        No se pudieron cargar los datos del plan de nutrición.
      </div>
    );
  }

  return <NutritionView data={nutritionData} />;
}
