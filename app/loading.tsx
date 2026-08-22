import { DashboardSkeleton } from "@/app/components/skeletons/DashboardSkeleton";

/**
 * Next.js App Router Root Loading Boundary.
 * Immediately streams the high-fidelity skeleton shell while Server Components fetch data.
 */
export default function Loading() {
  return (
    <main className="min-h-screen flex flex-col">
      <DashboardSkeleton />
    </main>
  );
}
