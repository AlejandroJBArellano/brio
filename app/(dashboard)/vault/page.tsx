import { fetchVaultDashboardDataAction } from "@/app/actions/vault";
import { VaultSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { VaultView } from "@/app/components/vault/VaultView";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function VaultPage() {
  return (
    <Suspense fallback={<VaultSkeleton />}>
      <AsyncVaultContent />
    </Suspense>
  );
}

async function AsyncVaultContent() {
  const vaultData = await fetchVaultDashboardDataAction();
  return <VaultView data={vaultData} />;
}
