import { fetchProjectByIdAction } from "@/app/actions/projects";
import { ProjectDetailView } from "@/app/components/projects/ProjectDetailView";
import { ProjectsSkeleton } from "@/app/components/skeletons/RouteSkeletons";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchProjectByIdAction(id);
  if (!data.project) {
    return { title: "Proyecto no encontrado | Brio" };
  }
  return {
    title: `${data.project.title} | Brio`,
    description: data.project.description || "Gestión de proyecto, tareas y recursos",
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <AsyncProjectContent id={id} />
    </Suspense>
  );
}

async function AsyncProjectContent({ id }: { id: string }) {
  const data = await fetchProjectByIdAction(id);
  if (!data.project) {
    notFound();
  }

  return (
    <ProjectDetailView
      project={data.project}
      tasks={data.tasks}
      tags={data.tags}
      initialNotes={data.notes}
    />
  );
}
