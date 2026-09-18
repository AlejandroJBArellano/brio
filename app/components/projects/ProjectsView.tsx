"use client";

import {
  createProjectAction,
  deleteProjectAction,
  ProjectsPageData,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import { matchTasksToProject } from "@/lib/projectMatcher";
import { soundFx } from "@/lib/soundFx";
import { HabiticaTask, ProjectItem, ProjectStatus } from "@/lib/types";
import {
  CheckCircle2,
  ChevronDown,
  FolderGit2,
  Kanban,
  LayoutGrid,
  ListTodo,
  PauseCircle,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

interface ProjectsViewProps {
  data: ProjectsPageData;
  onRefresh?: () => void;
}

interface BoardColumn {
  id: string;
  statuses: ProjectStatus[];
  title: string;
  defaultStatus: ProjectStatus;
  badgeStyle: string;
  icon: React.ReactNode;
}

// Active sprint/workflow lifecycle columns for the Kanban board
const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: "idea",
    statuses: ["idea"],
    title: "To-Do",
    defaultStatus: "idea",
    badgeStyle: "border-[#8E867B]/30 bg-[#1A1917] text-[#C2BAAD]",
    icon: <ListTodo className="size-3.5 text-[#C2BAAD]" />,
  },
  {
    id: "in_progress",
    statuses: ["in_progress"],
    title: "En Desarrollo",
    defaultStatus: "in_progress",
    badgeStyle: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]",
    icon: <Zap className="size-3.5 text-[#D99B43]" />,
  },
  {
    id: "completed",
    statuses: ["completed", "launched"],
    title: "Completados",
    defaultStatus: "completed",
    badgeStyle: "border-[#7EA35A]/30 bg-[#17241A] text-[#7EA35A]",
    icon: <CheckCircle2 className="size-3.5 text-[#7EA35A]" />,
  },
];

const STATUS_SELECT_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "idea", label: "To-Do" },
  { value: "in_progress", label: "En Desarrollo" },
  { value: "permanent", label: "Permanente" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Completado" },
  { value: "launched", label: "Lanzado" },
];

export function ProjectsView({ data, onRefresh }: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "grid">("board");
  const [gridFilterStatus, setGridFilterStatus] = useState<string>("all");
  const [isPausedCollapsed, setIsPausedCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New Project Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<ProjectStatus>("in_progress");
  const [newCanonicalPrefix, setNewCanonicalPrefix] = useState("");
  const [newTaskPrefixes, setNewTaskPrefixes] = useState("");

  const handleOpenAddWithStatus = (status: ProjectStatus) => {
    setNewStatus(status);
    setIsAddModalOpen(true);
  };

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

  const filteredProjects = useMemo(() => {
    const list = data.projects || [];
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const descMatch = (p.description || "").toLowerCase().includes(q);
      const prefixMatch = (p.canonicalPrefix || "").toLowerCase().includes(q);
      return titleMatch || descMatch || prefixMatch;
    });
  }, [data.projects, searchQuery]);

  const permanentProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.status === "permanent");
  }, [filteredProjects]);

  const pausedProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.status === "paused");
  }, [filteredProjects]);

  const gridProjects = useMemo(() => {
    if (gridFilterStatus === "all") return filteredProjects;
    if (gridFilterStatus === "in_progress") {
      return filteredProjects.filter((p) => p.status === "in_progress");
    }
    if (gridFilterStatus === "idea") {
      return filteredProjects.filter((p) => p.status === "idea");
    }
    if (gridFilterStatus === "permanent") {
      return filteredProjects.filter((p) => p.status === "permanent");
    }
    if (gridFilterStatus === "paused") {
      return filteredProjects.filter((p) => p.status === "paused");
    }
    if (gridFilterStatus === "completed") {
      return filteredProjects.filter(
        (p) => p.status === "completed" || p.status === "launched"
      );
    }
    return filteredProjects;
  }, [filteredProjects, gridFilterStatus]);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#2A2723]">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[#221D16] border border-[#3D3425] text-[#D99B43]">
            <FolderGit2 className="size-5" />
          </span>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
              <span>Proyectos</span>
              <span className="font-mono text-xs text-[#8E867B] font-normal px-2 py-0.5 rounded-full bg-[#181715] border border-[#2A2723]">
                {data.projects?.length || 0}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#181715] border border-[#2A2723] font-mono text-xs">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-[#221D16] text-[#D99B43]"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
              title="Vista Tablero"
            >
              <Kanban className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#221D16] text-[#D99B43]"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-48 sm:min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8E867B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar proyecto..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#181715] pl-8 pr-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43] font-mono"
            />
          </div>

          {/* Create Button */}
          <button
            type="button"
            onClick={() => handleOpenAddWithStatus("in_progress")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] px-3.5 py-1.5 text-xs font-mono font-bold text-[#121110] transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="size-4 stroke-3" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* 2. Board / Kanban View (Active Lifecycle: Ideas, En Desarrollo, Completados) */}
      {viewMode === "board" ? (
        <div className="space-y-8">
          {/* Kanban Columns */}
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {BOARD_COLUMNS.map((column) => {
              const columnProjects = filteredProjects.filter((p) =>
                column.statuses.includes(p.status)
              );

              return (
                <div
                  key={column.id}
                  className="flex-1 min-w-72 max-w-sm shrink-0 flex flex-col rounded-2xl border border-[#2A2723] bg-[#141311] p-3 space-y-3 shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#181715] border border-[#2A2723]">
                        {column.icon}
                      </span>
                      <h3 className="font-serif text-xs font-bold text-[#F5F2EB] tracking-wide">
                        {column.title}
                      </h3>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#181715] text-[#8E867B] border border-[#2A2723]">
                        {columnProjects.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAddWithStatus(column.defaultStatus)}
                      className="p-1 rounded text-[#8E867B] hover:text-[#D99B43] hover:bg-[#221D16] transition-colors cursor-pointer"
                      title={`Agregar en ${column.title}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  {/* Column Cards List */}
                  <div className="space-y-2.5 min-h-32">
                    {columnProjects.length > 0 ? (
                      columnProjects.map((proj) => (
                        <ProjectCard
                          key={proj.id}
                          project={proj}
                          tasks={data.tasks || []}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDeleteProject}
                        />
                      ))
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-[#2A2723]/60 text-center text-xs font-mono text-[#8E867B]">
                        Sin proyectos
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dedicated Section: Proyectos Permanentes */}
          {permanentProjects.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#2A2723]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#142321] border border-[#4EAB9E]/30 text-[#4EAB9E]">
                    <Shield className="size-3.5" />
                  </span>
                  <h2 className="font-serif text-sm font-bold text-[#F5F2EB]">
                    Permanentes
                  </h2>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#142321] text-[#4EAB9E] border border-[#4EAB9E]/30">
                    {permanentProjects.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddWithStatus("permanent")}
                  className="text-xs font-mono text-[#8E867B] hover:text-[#4EAB9E] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="size-3.5" />
                  <span>Agregar Permanente</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {permanentProjects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                    tasks={data.tasks || []}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dedicated Section: Proyectos Pausados (Collapsible) */}
          {pausedProjects.length > 0 && (
            <div className="rounded-xl border border-[#2A2723] bg-[#141311] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsPausedCollapsed(!isPausedCollapsed)}
                className="w-full flex items-center justify-between p-3.5 bg-[#161513] hover:bg-[#1A1917] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <PauseCircle className="size-4 text-[#8E867B]" />
                  <span className="font-serif text-xs font-bold text-[#F5F2EB]">
                    Pausados
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#181715] text-[#8E867B] border border-[#2A2723]">
                    {pausedProjects.length}
                  </span>
                </div>
                <ChevronDown
                  className={`size-4 text-[#8E867B] transition-transform duration-200 ${
                    isPausedCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </button>

              {!isPausedCollapsed && (
                <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 border-t border-[#22201D]">
                  {pausedProjects.map((proj) => (
                    <ProjectCard
                      key={proj.id}
                      project={proj}
                      tasks={data.tasks || []}
                      onUpdateStatus={handleUpdateStatus}
                      onDelete={handleDeleteProject}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* 3. Grid View with Filter Tabs */
        <div className="space-y-4">
          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-[11px]">
            {[
              { id: "all", label: "Todos", count: filteredProjects.length },
              {
                id: "in_progress",
                label: "En Desarrollo",
                count: filteredProjects.filter((p) => p.status === "in_progress").length,
              },
              {
                id: "permanent",
                label: "Permanentes",
                count: permanentProjects.length,
              },
              {
                id: "idea",
                label: "To-Do",
                count: filteredProjects.filter((p) => p.status === "idea").length,
              },
              {
                id: "paused",
                label: "Pausados",
                count: pausedProjects.length,
              },
              {
                id: "completed",
                label: "Completados",
                count: filteredProjects.filter(
                  (p) => p.status === "completed" || p.status === "launched"
                ).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGridFilterStatus(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  gridFilterStatus === tab.id
                    ? "bg-[#221D16] border-[#D99B43]/50 text-[#D99B43] font-semibold"
                    : "bg-[#181715] border-[#2A2723] text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {gridProjects.length > 0 ? (
              gridProjects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  tasks={data.tasks || []}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeleteProject}
                />
              ))
            ) : (
              <div className="col-span-full p-10 rounded-xl border border-dashed border-[#2A2723] text-center text-xs font-mono text-[#8E867B]">
                No hay proyectos en esta categoría.
              </div>
            )}
          </div>
        </div>
      )}

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
                  placeholder="ej. Brio, Hybridge, Plataforma Web..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Resumen del alcance o tecnología..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43] resize-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">Estado</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                >
                  <option value="idea">To-Do</option>
                  <option value="in_progress">En Desarrollo</option>
                  <option value="permanent">Permanente</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Completado</option>
                  <option value="launched">Lanzado</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    </div>
  );
}

/**
 * Reusable Project Card Component
 */
function ProjectCard({
  project,
  tasks,
  onUpdateStatus,
  onDelete,
}: {
  project: ProjectItem;
  tasks: HabiticaTask[];
  onUpdateStatus: (id: string, status: ProjectStatus) => void;
  onDelete: (id: string) => void;
}) {
  const metrics = matchTasksToProject(project, tasks);
  const isPermanent = project.status === "permanent";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-xl border border-[#2A2723] bg-[#181715] hover:border-[#D99B43]/50 hover:bg-[#1D1B18] p-3.5 shadow-sm transition-all space-y-3 cursor-pointer"
    >
      {/* Card Top: Prefix, Status Dropdown, Delete */}
      <div
        className="flex items-center justify-between gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="rounded bg-[#221D16] border border-[#3D3425] px-1.5 py-0.5 font-mono text-[9px] text-[#D99B43] font-semibold truncate max-w-36">
          {metrics.canonicalPrefix}
        </span>

        <div className="flex items-center gap-1">
          <select
            value={project.status}
            onChange={(e) =>
              onUpdateStatus(project.id, e.target.value as ProjectStatus)
            }
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] focus:outline-none cursor-pointer"
          >
            {STATUS_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-[#8E867B] hover:text-[#E05D52] transition-opacity cursor-pointer"
            title="Eliminar proyecto"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Card Title & Description */}
      <div className="space-y-1">
        <h4 className="font-serif text-sm font-bold text-[#F5F2EB] group-hover:text-[#FFFFFF] transition-colors leading-snug line-clamp-2">
          {project.title}
        </h4>
        {project.description && (
          <p className="text-xs text-[#8E867B] line-clamp-2 font-sans leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      {/* Habitica Tasks Progress */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#8E867B] flex items-center gap-1">
            <ListTodo className="size-3 text-[#D99B43]" />
            <span>
              {metrics.completedCount}/{metrics.totalCount} hechas
            </span>
          </span>
          {!isPermanent && (
            <span className="font-bold text-[#DDD6C9]">
              {metrics.progressPercent}%
            </span>
          )}
        </div>
        {!isPermanent && (
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#4EAB9E] transition-all duration-300"
              style={{ width: `${metrics.progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
