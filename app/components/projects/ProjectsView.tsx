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
  ProjectsDashboardData,
  ProjectStatus,
} from "@/lib/types";
import {
  BookOpen,
  ExternalLink,
  Plus,
  Rocket,
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
  idea: { label: "💡 Idea", color: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]" },
  in_progress: { label: "⚡ En Desarrollo", color: "border-[#4EAB9E]/30 bg-[#162121] text-[#4EAB9E]" },
  paused: { label: "⏸️ Pausado", color: "border-[#2A2723] bg-[#181715] text-[#8E867B]" },
  launched: { label: "🚀 Lanzado", color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]" },
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Backlog de Proyectos & Side Hustles
              </h2>
              <p className="text-xs text-[#8E867B]">
                Ideas, prototipos en desarrollo y proyectos lanzados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-sans">
            {onOpenScratchpad && (
              <button
                type="button"
                onClick={onOpenScratchpad}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2723] bg-[#181715] text-xs font-semibold text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-all cursor-pointer"
              >
                <span>📝 Scratchpad</span>
                <kbd className="text-[10px] font-mono text-[#8E867B]">⌘J</kbd>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] shadow-xs transition-all cursor-pointer"
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
                className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm flex flex-col justify-between group hover:border-[#38332D] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Eliminar proyecto"
                      className="opacity-0 group-hover:opacity-100 text-[#8E867B] hover:text-[#E05D52] transition-opacity cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                    {project.title}
                  </h3>

                  {project.description && (
                    <p className="mt-1 text-xs text-[#8E867B] line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Tech stack tags */}
                  {project.techStack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-[#121110] border border-[#2A2723] text-[10px] font-mono text-[#DDD6C9]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* External links */}
                  {(project.liveUrl || project.repoUrl) && (
                    <div className="mt-3.5 flex items-center gap-2 font-mono">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121110] hover:bg-[#22201D] border border-[#2A2723] text-[11px] font-medium text-[#4EAB9E] hover:underline transition-all"
                        >
                          <span>🌐 Sitio Web</span>
                          <ExternalLink className="h-3 w-3 text-[#4EAB9E]" />
                        </a>
                      )}
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121110] hover:bg-[#22201D] border border-[#2A2723] text-[11px] font-medium text-[#DDD6C9] hover:text-[#F5F2EB] transition-all"
                        >
                          <span>🔗 Repo</span>
                          <ExternalLink className="h-3 w-3 text-[#8E867B]" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#2A2723] flex items-center justify-between font-mono">
                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#121110]">
                      <div
                        className="h-full bg-[#D99B43]"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-[#8E867B]">
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
                    className="rounded-md border border-[#2A2723] bg-[#121110] px-2 py-1 text-[11px] text-[#DDD6C9] focus:outline-none cursor-pointer"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Tracker de Cursos, Certificaciones & Universidad
              </h2>
              <p className="text-xs text-[#8E867B]">
                Rutas de aprendizaje activas, certificaciones cloud y materias universitarias
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewBookModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] shadow-xs transition-all cursor-pointer font-sans"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Curso / Libro</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.learningItems.map((item) => {
            const percent = Math.min(
              100,
              Math.round((item.currentProgress / item.totalProgress) * 100)
            );
            const unitLabel = item.totalProgress <= 20 ? "módulos / días" : (item.type === "book" ? "págs" : "%");

            return (
              <div
                key={item.id}
                className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="px-2 py-0.5 rounded-md border border-[#D99B43]/30 bg-[#221D16] text-[#D99B43] text-[11px] font-bold">
                      {item.type.toUpperCase()}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteBook(item.id)}
                      title="Eliminar registro"
                      className="opacity-0 group-hover:opacity-100 text-[#8E867B] hover:text-[#E05D52] transition-opacity cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                    {item.title}
                  </h3>
                  {item.author && (
                    <p className="text-xs text-[#8E867B]">Por {item.author}</p>
                  )}

                  {item.keyTakeaways && (
                    <div className="mt-3 rounded-lg bg-[#121110] p-3 border border-[#2A2723] text-xs text-[#DDD6C9] italic font-sans">
                      &ldquo;{item.keyTakeaways}&rdquo;
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-3 pt-3 border-t border-[#2A2723] font-mono">
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                      <span className="text-[#8E867B]">
                        {item.currentProgress} / {item.totalProgress} {unitLabel}
                      </span>
                      <span className="text-[#D99B43] font-bold">{percent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#121110]">
                      <div
                        className="h-full bg-[#D99B43] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleIncrementBookProgress(item, item.totalProgress <= 20 ? 1 : 10)}
                      disabled={isPending}
                      className="flex-1 py-1.5 rounded-md bg-[#121110] border border-[#2A2723] text-xs font-mono text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] cursor-pointer"
                    >
                      +{item.totalProgress <= 20 ? "1 u." : "10"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIncrementBookProgress(item, item.totalProgress <= 20 ? 2 : 25)}
                      disabled={isPending}
                      className="flex-1 py-1.5 rounded-md bg-[#121110] border border-[#2A2723] text-xs font-mono text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] cursor-pointer"
                    >
                      +{item.totalProgress <= 20 ? "2 u." : "25"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <h3 className="font-serif text-base font-bold text-[#F5F2EB]">Nuevo Proyecto</h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3 font-mono">
              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  placeholder="Brio OS ⚡"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Sistema operativo personal..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Tech Stack (separado por comas)
                </label>
                <input
                  type="text"
                  placeholder="Next.js, Tailwind, Neon DB"
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3 py-2 text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <h3 className="font-serif text-base font-bold text-[#F5F2EB]">Nuevo Libro o Curso</h3>
              <button
                type="button"
                onClick={() => setIsNewBookModalOpen(false)}
                className="text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="mt-4 space-y-3 font-mono">
              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Atomic Habits"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Autor / Instructor
                </label>
                <input
                  type="text"
                  placeholder="James Clear"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Total de Páginas / Módulos
                </label>
                <input
                  type="number"
                  value={bookTotal}
                  onChange={(e) => setBookTotal(parseInt(e.target.value) || 100)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsNewBookModalOpen(false)}
                  className="px-3 py-2 text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] cursor-pointer"
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
