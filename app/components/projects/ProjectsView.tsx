"use client";

import {
  createProjectAction,
  deleteProjectAction,
  ProjectsPageData,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import { ProjectDossierDrawer } from "@/app/components/vault/ProjectDossierDrawer";
import { matchTasksToProject } from "@/lib/projectMatcher";
import { soundFx } from "@/lib/soundFx";
import { ProjectItem, ProjectStatus } from "@/lib/types";
import { extractAndClassifyLinks } from "@/lib/urlClassifier";
import {
  ChevronRight,
  Code2,
  ExternalLink,
  FolderGit2,
  Globe,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

interface ProjectsViewProps {
  data: ProjectsPageData;
  onRefresh?: () => void;
}

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string; badge: string }> = {
  permanent: {
    label: "♾️ Permanente",
    color: "border-[#4EAB9E]/40 bg-[#142321] text-[#4EAB9E]",
    badge: "text-[#4EAB9E] bg-[#142321] border-[#4EAB9E]/30",
  },
  in_progress: {
    label: "⚡ En Desarrollo",
    color: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]",
    badge: "text-[#D99B43] bg-[#221D16] border-[#D99B43]/30",
  },
  launched: {
    label: "🚀 Lanzado",
    color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]",
    badge: "text-[#7EA35A] bg-[#1C2219] border-[#7EA35A]/30",
  },
  idea: {
    label: "💡 Idea",
    color: "border-[#8E867B]/30 bg-[#1A1917] text-[#C2BAAD]",
    badge: "text-[#C2BAAD] bg-[#1A1917] border-[#8E867B]/30",
  },
  paused: {
    label: "⏸️ Pausado",
    color: "border-[#2A2723] bg-[#181715] text-[#8E867B]",
    badge: "text-[#8E867B] bg-[#181715] border-[#2A2723]",
  },
};

export function ProjectsView({ data, onRefresh }: ProjectsViewProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | ProjectStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<ProjectStatus>("in_progress");
  const [newTechStack, setNewTechStack] = useState("");
  const [newUrls, setNewUrls] = useState<string[]>([""]);

  const counts = useMemo(() => {
    const list = data.projects || [];
    return {
      all: list.length,
      in_progress: list.filter((p) => p.status === "in_progress").length,
      launched: list.filter((p) => p.status === "launched").length,
      permanent: list.filter((p) => p.status === "permanent").length,
      idea: list.filter((p) => p.status === "idea").length,
      paused: list.filter((p) => p.status === "paused").length,
    };
  }, [data.projects]);

  const filteredProjects = useMemo(() => {
    return (data.projects || []).filter((p) => {
      const matchesFilter = activeFilter === "all" || p.status === activeFilter;
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title.toLowerCase().includes(q);
      const descMatch = (p.description || "").toLowerCase().includes(q);
      const techMatch = (p.techStack || []).some((t) => t.toLowerCase().includes(q));

      return titleMatch || descMatch || techMatch;
    });
  }, [data.projects, activeFilter, searchQuery]);

  const handleUpdateStatus = (id: string, status: ProjectStatus) => {
    startTransition(async () => {
      await updateProjectStatusAction(id, status);
      if (onRefresh) onRefresh();
    });
  };

  const handleDeleteProject = (id: string) => {
    if (!confirm("¿Eliminar este proyecto?")) return;
    startTransition(async () => {
      await deleteProjectAction(id);
      soundFx.click();
      if (onRefresh) onRefresh();
    });
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isPending) return;

    const techArray = newTechStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const validUrls = newUrls.map((u) => u.trim()).filter(Boolean);
    const gitLinks = validUrls.filter((u) => u.includes("git") || u.includes("github"));
    const liveLinks = validUrls.filter((u) => !u.includes("git") && !u.includes("github"));

    startTransition(async () => {
      await createProjectAction({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        status: newStatus,
        techStack: techArray,
        repoUrl: gitLinks.length > 0 ? gitLinks.join(", ") : undefined,
        liveUrl: liveLinks.length > 0 ? liveLinks.join(", ") : undefined,
      });

      soundFx.taskComplete();
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewTechStack("");
      setNewUrls([""]);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2A2723]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#221D16] border border-[#3D3425] text-[#D99B43]">
              <FolderGit2 className="size-5" />
            </span>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
                <span>Proyectos & Código</span>
                <span className="font-mono text-xs text-[#8E867B] font-normal px-2 py-0.5 rounded-full bg-[#181715] border border-[#2A2723]">
                  {counts.all}
                </span>
              </h1>
              <p className="text-xs text-[#8E867B] font-mono">
                Tablero central de desarrollo, startups y arquitectura de software
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] px-4 py-2 text-xs font-mono font-bold text-[#121110] transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="size-4 stroke-3" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "all"
                ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/50 font-bold"
                : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] opacity-70">({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("in_progress")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "in_progress"
                ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/50 font-bold"
                : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
            }`}
          >
            <span>⚡ En Desarrollo</span>
            <span className="text-[10px] opacity-70">({counts.in_progress})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("launched")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "launched"
                ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/50 font-bold"
                : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
            }`}
          >
            <span>🚀 Lanzado</span>
            <span className="text-[10px] opacity-70">({counts.launched})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("permanent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "permanent"
                ? "bg-[#142321] text-[#4EAB9E] border border-[#4EAB9E]/50 font-bold"
                : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
            }`}
          >
            <span>♾️ Permanente</span>
            <span className="text-[10px] opacity-70">({counts.permanent})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("idea")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "idea"
                ? "bg-[#1A1917] text-[#C2BAAD] border border-[#8E867B]/50 font-bold"
                : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
            }`}
          >
            <span>💡 Idea</span>
            <span className="text-[10px] opacity-70">({counts.idea})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8E867B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar proyecto o stack..."
            className="w-full rounded-lg border border-[#2A2723] bg-[#181715] pl-8 pr-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43] font-mono"
          />
        </div>
      </div>

      {/* 3. Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-xl border border-dashed border-[#2A2723] bg-[#121110]">
            <Code2 className="size-8 text-[#8E867B] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-[#DDD6C9]">
              No hay proyectos en esta vista
            </p>
            <p className="text-xs text-[#8E867B] mt-1 font-mono">
              Prueba cambiando los filtros o crea un nuevo proyecto con el botón superior.
            </p>
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const statusMeta = STATUS_LABELS[proj.status] || STATUS_LABELS.idea;
            const metrics = matchTasksToProject(proj, data.tasks || []);
            const classifiedLinks = extractAndClassifyLinks(proj.repoUrl, proj.liveUrl);

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className="group rounded-xl border border-[#2A2723] bg-[#181715] hover:border-[#38332D] hover:bg-[#1D1B18] p-3.5 sm:p-4 shadow-sm transition-all flex flex-col justify-between cursor-pointer space-y-2.5"
              >
                <div className="space-y-2">
                  {/* Status & Delete button */}
                  <div
                    className="flex items-center justify-between font-mono"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={proj.status}
                      onChange={(e) =>
                        handleUpdateStatus(proj.id, e.target.value as ProjectStatus)
                      }
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusMeta.color} bg-[#121110] focus:outline-none cursor-pointer`}
                    >
                      <option value="permanent">♾️ Permanente</option>
                      <option value="in_progress">⚡ En Desarrollo</option>
                      <option value="launched">🚀 Lanzado</option>
                      <option value="idea">💡 Idea</option>
                      <option value="paused">⏸️ Pausado</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#8E867B] hover:text-[#E05D52] transition-all cursor-pointer"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight group-hover:text-white transition-colors truncate"
                      title={proj.title}
                    >
                      {proj.title}
                    </h3>
                    {proj.description && (
                      <p className="text-[11px] text-[#8E867B] mt-0.5 line-clamp-1 font-sans">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  {/* Habitica Task Live Metrics */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8E867B] flex items-center gap-1">
                        <ListTodo className="size-2.5 text-[#D99B43]" />
                        <span>
                          {metrics.completedCount}/{metrics.totalCount} listas
                        </span>
                      </span>
                      <span className="font-bold text-[#DDD6C9]">
                        {metrics.progressPercent}%
                      </span>
                    </div>
                    <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#4EAB9E] transition-all duration-500"
                        style={{ width: `${metrics.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Tech Stack Badges */}
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {proj.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-1.5 py-0.2 rounded bg-[#121110] border border-[#2A2723] text-[9px] font-mono text-[#DDD6C9] truncate max-w-28"
                        >
                          {tech}
                        </span>
                      ))}
                      {proj.techStack.length > 3 && (
                        <span className="px-1 py-0.2 rounded bg-[#121110] border border-[#2A2723] text-[9px] font-mono text-[#8E867B]">
                          +{proj.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Links & Open Dossier */}
                <div
                  className="pt-2 border-t border-[#2A2723] flex items-center justify-between text-xs font-mono"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    {classifiedLinks.slice(0, 2).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8E867B] hover:text-[#F5F2EB] flex items-center gap-1 truncate max-w-28 text-[10px] transition-colors"
                        title={link.url}
                      >
                        {link.category === "git" ? (
                          <Code2 className="size-3 shrink-0" />
                        ) : (
                          <Globe className="size-3 shrink-0 text-[#4EAB9E]" />
                        )}
                        <span className="truncate">{link.label}</span>
                      </a>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProject(proj)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D99B43] hover:text-[#E8AF59] transition-colors cursor-pointer shrink-0 ml-auto"
                  >
                    <span>Dossier</span>
                    <ChevronRight className="size-3 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#D99B43]/40 bg-[#181715] p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <FolderGit2 className="size-4 text-[#D99B43]" />
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB]">
                  Nuevo Proyecto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">
                  Título del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ej. Strata Analytics, Unpo, Brio OS..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">
                  Estado Inicial:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono cursor-pointer"
                >
                  <option value="in_progress">⚡ En Desarrollo</option>
                  <option value="idea">💡 Idea</option>
                  <option value="launched">🚀 Lanzado</option>
                  <option value="permanent">♾️ Permanente</option>
                  <option value="paused">⏸️ Pausado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">
                  Descripción / Resumen:
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Propósito del proyecto, arquitectura o metas..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] resize-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">
                  Stack Tecnológico (separado por comas):
                </label>
                <input
                  type="text"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  placeholder="Next.js 15, PostgreSQL, Tailwind, AWS..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                />
              </div>

              {/* Dynamic URLs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-[#8E867B]">
                    Enlaces & Recursos:
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewUrls((prev) => [...prev, ""])}
                    className="text-[11px] font-mono text-[#D99B43] hover:underline cursor-pointer"
                  >
                    + Agregar otro
                  </button>
                </div>
                {newUrls.map((url, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={url}
                    onChange={(e) => {
                      const updated = [...newUrls];
                      updated[idx] = e.target.value;
                      setNewUrls(updated);
                    }}
                    placeholder="https://github.com/..., https://mi-sitio.com..."
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2A2723]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || isPending}
                  className="px-5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs font-mono cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Project Dossier Drawer */}
      {selectedProject && (
        <ProjectDossierDrawer
          project={selectedProject}
          tasks={data.tasks || []}
          tags={data.tags || []}
          onClose={() => setSelectedProject(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
