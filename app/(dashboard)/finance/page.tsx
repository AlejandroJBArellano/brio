import { fetchFinanceDashboardDataAction } from "@/app/actions/finance";
import { FinanceView } from "@/app/components/finance/FinanceView";
import { FinanceSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function FinancePage() {
  return (
    <Suspense fallback={<FinanceSkeleton />}>
      <AsyncFinanceContent />
    </Suspense>
  );
}

async function AsyncFinanceContent() {
  const financeData = await fetchFinanceDashboardDataAction();
  return <FinanceView data={financeData} />;
}
