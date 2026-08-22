import { fetchDashboardDataAction } from "@/app/actions/tasks";
import { BatchCaptureInput } from "@/app/components/BatchCaptureInput";
import { HeaderStatsRibbon } from "@/app/components/HeaderStatsRibbon";
import { SetupNotice } from "@/app/components/SetupNotice";
import { TaskStream } from "@/app/components/TaskStream";

export const dynamic = "force-dynamic";

export default async function BrioDashboardPage() {
  const { user, tasks, isConfigured } = await fetchDashboardDataAction();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* 1. Habitica RPG Stats & Header */}
      <HeaderStatsRibbon user={user} isConfigured={isConfigured} />

      {/* 2. Setup Guide Banner (Shown when .env.local keys are absent) */}
      <SetupNotice isConfigured={isConfigured} />

      {/* 3. Frictionless Multiline Batch Capture Center */}
      <BatchCaptureInput />

      {/* 4. Categorized Task Stream (Dailies, To-Dos, Habits) */}
      <div className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Active Task Stream
          </h2>
          <span className="font-mono text-[11px] text-neutral-500">
            {tasks.length} total synced
          </span>
        </div>
        <TaskStream tasks={tasks} />
      </div>

      {/* Footer / System Status */}
      <footer className="mt-auto border-t border-white/6 pt-6 pb-2 text-center text-xs text-neutral-500">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>
            Brio OS v0.1.0 • Built with Next.js 16 App Router & Habitica REST API
          </span>
          <span>•</span>
          <span className="font-mono">
            Batch Dispatch: <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-300">⌘+Enter</kbd>
          </span>
        </div>
      </footer>
    </main>
  );
}
