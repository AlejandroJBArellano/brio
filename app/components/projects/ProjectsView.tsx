"use client";

import {
  createLearningItemAction,
  createProjectAction,
  deleteLearningItemAction,
  deleteProjectAction,
  updateLearningProgressAction,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import {
  LearningItem,
  LearningItemType,
  LearningStatus,
  ProjectItem,
  ProjectsDashboardData,
  ProjectStatus,
} from "@/lib/types";
import {
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Layers,
  Lightbulb,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface ProjectsViewProps {
  data: ProjectsDashboardData;
  onRefresh?: () => void;
  onOpenScratchpad?: () => void;
}

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string }> = {
  idea: { label: "💡 Idea", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  in_progress: { label: "⚡ En Desarrollo", color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300" },
  paused: { label: "⏸️ Pausado", color: "border-neutral-700 bg-neutral-800 text-neutral-400" },
  launched: { label: "🚀 Lanzado", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
};

export function ProjectsView({
  data,
  onRefresh,
  onOpenScratchpad,
}: ProjectsViewProps) {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);

  // Project form state
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("idea");
  const [projectTech, setProjectTech] = useState("");
  const [projectRepo, setProjectRepo] = useState("");

  // Book form state
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookType, setBookType] = useState<LearningItemType>("book");
  const [bookTotal, setBookTotal] = useState(300);

  const [isPending, startTransition] = useTransition();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    startTransition(async () => {
      await createProjectAction({
        title: projectTitle.trim(),
        description: projectDesc.trim() || undefined,
        status: projectStatus,
        techStack: projectTech
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        repoUrl: projectRepo.trim() || undefined,
        progress: projectStatus === "launched" ? 100 : 20,
      });

      setIsNewProjectModalOpen(false);
      setProjectTitle("");
      setProjectDesc("");
      setProjectTech("");
      setProjectRepo("");
      if (onRefresh) onRefresh();
    });
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    startTransition(async () => {
      await createLearningItemAction({
        title: bookTitle.trim(),
        type: bookType,
        author: bookAuthor.trim() || undefined,
        totalProgress: bookTotal,
      });

      setIsNewBookModalOpen(false);
      setBookTitle("");
      setBookAuthor("");
      if (onRefresh) onRefresh();
    });
  };

  const handleUpdateProjectStatus = (id: string, status: ProjectStatus) => {
    startTransition(async () => {
      await updateProjectStatusAction(id, status);
      if (onRefresh) onRefresh();
    });
  };

  const handleDeleteProject = (id: string) => {
    startTransition(async () => {
      await deleteProjectAction(id);
      if (onRefresh) onRefresh();
    });
  };

  const handleIncrementBookProgress = (item: LearningItem, pagesToAdd: number) => {
    const newProg = Math.min(item.totalProgress, item.currentProgress + pagesToAdd);
    const newStatus: LearningStatus = newProg >= item.totalProgress ? "completed" : "reading";

    startTransition(async () => {
      await updateLearningProgressAction(item.id, newProg, undefined, newStatus);
      if (onRefresh) onRefresh();
    });
  };

  const handleDeleteBook = (id: string) => {
    startTransition(async () => {
      await deleteLearningItemAction(id);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* 1. Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Backlog de Proyectos & Side Hustles
              </h2>
              <p className="text-xs text-neutral-400">
                Ideas, prototipos en desarrollo y proyectos lanzados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenScratchpad && (
              <button
                type="button"
                onClick={onOpenScratchpad}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white transition-all"
              >
                <span>📝 Scratchpad (⌘J)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project) => {
            const statusConfig = STATUS_LABELS[project.status] || STATUS_LABELS.idea;

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Eliminar proyecto"
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white tracking-tight">
                    {project.title}
                  </h3>

                  {project.description && (
                    <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Tech stack tags */}
                  {project.techStack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-neutral-950/80 border border-white/[0.06] text-[10px] font-mono text-neutral-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-950">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-neutral-400">
                      {project.progress}%
                    </span>
                  </div>

                  {/* Status switcher */}
                  <select
                    value={project.status}
                    onChange={(e) =>
                      handleUpdateProjectStatus(
                        project.id,
                        e.target.value as ProjectStatus
                      )
                    }
                    className="rounded-lg border border-white/[0.08] bg-neutral-950 px-2 py-1 text-[11px] text-neutral-300 focus:outline-none"
                  >
                    <option value="idea">Idea</option>
                    <option value="in_progress">En Desarrollo</option>
                    <option value="paused">Pausado</option>
                    <option value="launched">Lanzado</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Reading & Learning Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Tracker de Libros & Cursos
              </h2>
              <p className="text-xs text-neutral-400">
                Aprendizaje continuo, lecturas activas y notas clave
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewBookModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 font-bold text-xs text-neutral-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Libro / Curso</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.learningItems.map((item) => {
            const percent = Math.min(
              100,
              Math.round((item.currentProgress / item.totalProgress) * 100)
            );

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-bold">
                      {item.type.toUpperCase()}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteBook(item.id)}
                      title="Eliminar registro"
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                  {item.author && (
                    <p className="text-xs text-neutral-400">Por {item.author}</p>
                  )}

                  {item.keyTakeaways && (
                    <div className="mt-3 rounded-xl bg-neutral-950/80 p-3 border border-white/[0.04] text-xs text-neutral-300 italic">
                      &ldquo;{item.keyTakeaways}&rdquo;
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-3 pt-3 border-t border-white/[0.06]">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-neutral-400">
                        {item.currentProgress} / {item.totalProgress} págs
                      </span>
                      <span className="text-amber-400 font-bold">{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-950">
                      <div
                        className="h-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleIncrementBookProgress(item, 10)}
                      disabled={isPending}
                      className="flex-1 py-1.5 rounded-lg bg-neutral-950 border border-white/[0.06] text-xs font-mono text-neutral-300 hover:text-white"
                    >
                      +10 págs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncrementBookProgress(item, 25)}
                      disabled={isPending}
                      className="flex-1 py-1.5 rounded-lg bg-neutral-950 border border-white/[0.06] text-xs font-mono text-neutral-300 hover:text-white"
                    >
                      +25 págs
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Nuevo Proyecto</h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  placeholder="Brio OS ⚡"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Sistema operativo personal..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tech Stack (separado por comas)
                </label>
                <input
                  type="text"
                  placeholder="Next.js, Tailwind, Neon DB"
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500"
                >
                  {isPending ? "Guardando..." : "Crear Proyecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Book Modal */}
      {isNewBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Nuevo Libro o Curso</h3>
              <button
                type="button"
                onClick={() => setIsNewBookModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Atomic Habits"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Autor / Instructor
                </label>
                <input
                  type="text"
                  placeholder="James Clear"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Total de Páginas / Módulos
                </label>
                <input
                  type="number"
                  value={bookTotal}
                  onChange={(e) => setBookTotal(parseInt(e.target.value) || 100)}
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBookModalOpen(false)}
                  className="px-3 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-amber-500 font-bold text-xs text-neutral-950 hover:bg-amber-400"
                >
                  {isPending ? "Guardando..." : "Guardar Libro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
