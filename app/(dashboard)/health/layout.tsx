import { HealthNavigationRibbon } from "@/app/components/health/HealthNavigationRibbon";
import { ReactNode } from "react";

export default function HealthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Persistent 4-Pillar Health Navigation Ribbon */}
      <HealthNavigationRibbon />

      {/* Domain Sub-Page Content */}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
