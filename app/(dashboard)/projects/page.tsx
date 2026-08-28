import { fetchProjectsPageDataAction } from "@/app/actions/projects";
import { ProjectsView } from "@/app/components/projects/ProjectsView";
import { ProjectsSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Proyectos | Brio Command Center",
  description: "Tablero central de proyectos, startups y arquitectura de software.",
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <AsyncProjectsContent />
    </Suspense>
  );
}

async function AsyncProjectsContent() {
  const projectsData = await fetchProjectsPageDataAction();
  return <ProjectsView data={projectsData} />;
}
