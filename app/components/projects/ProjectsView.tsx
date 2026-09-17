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
import {
  ChevronRight,
  Code2,
  FolderGit2,
  ListTodo,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

interface ProjectsViewProps {
  data: ProjectsPageData;
  onRefresh?: () => void;
}

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string; badge: string }> = {
  permanent: {
    label: "Permanente",
    color: "border-[#4EAB9E]/40 bg-[#142321] text-[#4EAB9E]",
    badge: "text-[#4EAB9E] bg-[#142321] border-[#4EAB9E]/30",
  },
  in_progress: {
    label: "En Desarrollo",
    color: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]",
    badge: "text-[#D99B43] bg-[#221D16] border-[#D99B43]/30",
  },
  completed: {
    label: "Completado",
    color: "border-[#7EA35A]/40 bg-[#17241A] text-[#7EA35A]",
    badge: "text-[#7EA35A] bg-[#17241A] border-[#7EA35A]/30",
  },
  launched: {
    label: "Lanzado",
    color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]",
    badge: "text-[#7EA35A] bg-[#1C2219] border-[#7EA35A]/30",
  },
  idea: {
    label: "Idea",
    color: "border-[#8E867B]/30 bg-[#1A1917] text-[#C2BAAD]",
    badge: "text-[#C2BAAD] bg-[#1A1917] border-[#8E867B]/30",
  },
  paused: {
    label: "Pausado",
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
  const [newCanonicalPrefix, setNewCanonicalPrefix] = useState("");
  const [newTaskPrefixes, setNewTaskPrefixes] = useState("");

  const counts = useMemo(() => {
    const list = data.projects || [];
    return {
      all: list.length,
      in_progress: list.filter((p) => p.status === "in_progress").length,
      completed: list.filter((p) => p.status === "completed").length,
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

      return titleMatch || descMatch;
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

    const prefixesArray = newTaskPrefixes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      await createProjectAction({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        status: newStatus,
        canonicalPrefix: newCanonicalPrefix.trim() || undefined,
        taskPrefixes: prefixesArray,
      });

      soundFx.taskComplete();
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewCanonicalPrefix("");
      setNewTaskPrefixes("");
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
                <span>Proyectos</span>
                <span className="font-mono text-xs text-[#8E867B] font-normal px-2 py-0.5 rounded-full bg-[#181715] border border-[#2A2723]">
                  {counts.all}
                </span>
              </h1>
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
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${activeFilter === "all"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${activeFilter === "in_progress"
              ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/50 font-bold"
              : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
              }`}
          >
            <span>En Desarrollo</span>
            <span className="text-[10px] opacity-70">({counts.in_progress})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${activeFilter === "completed"
              ? "bg-[#17241A] text-[#7EA35A] border border-[#7EA35A]/50 font-bold"
              : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
              }`}
          >
            <span>Completado</span>
            <span className="text-[10px] opacity-70">({counts.completed})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("launched")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${activeFilter === "launched"
              ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/50 font-bold"
              : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
              }`}
          >
            <span>Lanzado</span>
            <span className="text-[10px] opacity-70">({counts.launched})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("permanent")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${activeFilter === "permanent"
              ? "bg-[#142321] text-[#4EAB9E] border border-[#4EAB9E]/50 font-bold"
              : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
              }`}
          >
            <span>Permanente</span>
            <span className="text-[10px] opacity-70">({counts.permanent})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("idea")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${activeFilter === "idea"
              ? "bg-[#1A1917] text-[#C2BAAD] border border-[#8E867B]/50 font-bold"
              : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
              }`}
          >
            <span>Idea</span>
            <span className="text-[10px] opacity-70">({counts.idea})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("paused")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${activeFilter === "paused"
              ? "bg-[#181715] text-[#8E867B] border border-[#8E867B]/50 font-bold"
              : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
              }`}
          >
            <span>Pausado</span>
            <span className="text-[10px] opacity-70">({counts.paused})</span>
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <select
                        value={proj.status}
                        onChange={(e) =>
                          handleUpdateStatus(proj.id, e.target.value as ProjectStatus)
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusMeta.color} bg-[#121110] focus:outline-none cursor-pointer`}
                      >
                        <option value="in_progress">En Desarrollo</option>
                        <option value="completed">Completado</option>
                        <option value="launched">Lanzado</option>
                        <option value="permanent">Permanente</option>
                        <option value="idea">Idea</option>
                        <option value="paused">Pausado</option>
                      </select>
                      <span className="rounded bg-[#221D16] border border-[#3D3425] px-1.5 py-0.5 font-mono text-[9px] text-[#D99B43] font-semibold">
                        {metrics.canonicalPrefix}
                      </span>
                    </div>

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
                  </div>

                  {/* Habitica Task Live Metrics */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8E867B] flex items-center gap-1">
                        <ListTodo className="size-2.5 text-[#D99B43]" />
                        <span>
                          {metrics.completedCount}/{metrics.totalCount} completadas
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
                </div>

                {/* Footer: Open Dossier */}
                <div className="pt-2 border-t border-[#2A2723] flex items-center justify-end text-xs font-mono text-[#8E867B] group-hover:text-[#D99B43] transition-colors">
                  <span className="flex items-center gap-1">
                    <span>Dossier</span>
                    <ChevronRight className="size-3.5" />
                  </span>
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
                  <option value="in_progress">En Desarrollo</option>
                  <option value="completed">Completado</option>
                  <option value="idea">Idea</option>
                  <option value="launched">Lanzado</option>
                  <option value="permanent">Permanente</option>
                  <option value="paused">Pausado</option>
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

              {/* Dynamic Prefixes for Habitica matcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-[#2A2723] bg-[#100F0E]">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-[#8E867B]">
                    Prefijo Canónico:
                  </label>
                  <input
                    type="text"
                    value={newCanonicalPrefix}
                    onChange={(e) => setNewCanonicalPrefix(e.target.value)}
                    placeholder="ej. [Hybridge], [Brio]..."
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-[#8E867B]">
                    Prefijos Habitica (comas):
                  </label>
                  <input
                    type="text"
                    value={newTaskPrefixes}
                    onChange={(e) => setNewTaskPrefixes(e.target.value)}
                    placeholder="ej. hybridge, hackeo, módulo 4..."
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                  />
                </div>
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
