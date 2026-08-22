import { fetchDashboardDataAction } from "@/app/actions/tasks";
import { BrioCommandCenter } from "@/app/components/BrioCommandCenter";

export const dynamic = "force-dynamic";

export default async function BrioDashboardPage() {
  const { user, tasks, tags, isConfigured } = await fetchDashboardDataAction();

  return (
    <main className="min-h-screen flex flex-col">
      <BrioCommandCenter
        user={user}
        tasks={tasks}
        tags={tags}
        isConfigured={isConfigured}
      />
    </main>
  );
}
