"use client";

import {
  createProjectAction,
  deleteProjectAction,
  ProjectsPageData,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import { matchTasksToProject } from "@/lib/projectMatcher";
import { soundFx } from "@/lib/soundFx";
import { ProjectItem, ProjectStatus } from "@/lib/types";
import {
  CheckCircle2,
  FolderGit2,
  Kanban,
  LayoutGrid,
  Lightbulb,
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

const BOARD_COLUMNS: BoardColumn[] = [
  {
    id: "idea",
    statuses: ["idea"],
    title: "Ideas",
    defaultStatus: "idea",
    badgeStyle: "border-[#8E867B]/30 bg-[#1A1917] text-[#C2BAAD]",
    icon: <Lightbulb className="size-3.5 text-[#C2BAAD]" />,
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
    id: "permanent",
    statuses: ["permanent"],
    title: "Permanentes",
    defaultStatus: "permanent",
    badgeStyle: "border-[#4EAB9E]/30 bg-[#142321] text-[#4EAB9E]",
    icon: <Shield className="size-3.5 text-[#4EAB9E]" />,
  },
  {
    id: "paused",
    statuses: ["paused"],
    title: "Pausados",
    defaultStatus: "paused",
    badgeStyle: "border-[#2A2723] bg-[#181715] text-[#8E867B]",
    icon: <PauseCircle className="size-3.5 text-[#8E867B]" />,
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
  { value: "idea", label: "Idea" },
  { value: "in_progress", label: "En Desarrollo" },
  { value: "permanent", label: "Permanente" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Completado" },
  { value: "launched", label: "Lanzado" },
];

export function ProjectsView({ data, onRefresh }: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "grid">("board");
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

  return (
    <div className="space-y-5 font-sans">
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

      {/* 2. Board / Kanban View */}
      {viewMode === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start">
          {BOARD_COLUMNS.map((column) => {
            const columnProjects = filteredProjects.filter((p) =>
              column.statuses.includes(p.status)
            );

            return (
              <div
                key={column.id}
                className="w-80 shrink-0 flex flex-col rounded-2xl border border-[#2A2723] bg-[#141311] p-3 space-y-3 shadow-sm"
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
                    title={`Agregar proyecto en ${column.title}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                {/* Column Cards List */}
                <div className="space-y-2.5 min-h-32">
                  {columnProjects.length > 0 ? (
                    columnProjects.map((proj) => {
                      const metrics = matchTasksToProject(proj, data.tasks || []);

                      return (
                        <Link
                          key={proj.id}
                          href={`/projects/${proj.id}`}
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
                                value={proj.status}
                                onChange={(e) =>
                                  handleUpdateStatus(proj.id, e.target.value as ProjectStatus)
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
                                onClick={() => handleDeleteProject(proj.id)}
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
                              {proj.title}
                            </h4>
                            {proj.description && (
                              <p className="text-xs text-[#8E867B] line-clamp-2 font-sans leading-relaxed">
                                {proj.description}
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
                              {proj.status !== "permanent" && (
                                <span className="font-bold text-[#DDD6C9]">
                                  {metrics.progressPercent}%
                                </span>
                              )}
                            </div>
                            {proj.status !== "permanent" && (
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
                    })
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
      ) : (
        /* 3. Grid View Alternative */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProjects.map((proj) => {
            const metrics = matchTasksToProject(proj, data.tasks || []);

            return (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="group rounded-xl border border-[#2A2723] bg-[#181715] hover:border-[#D99B43]/50 hover:bg-[#1D1B18] p-4 shadow-sm transition-all space-y-3 cursor-pointer block"
              >
                <div
                  className="flex items-center justify-between font-mono"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="rounded bg-[#221D16] border border-[#3D3425] px-1.5 py-0.5 font-mono text-[9px] text-[#D99B43] font-semibold">
                    {metrics.canonicalPrefix}
                  </span>

                  <div className="flex items-center gap-1">
                    <select
                      value={proj.status}
                      onChange={(e) =>
                        handleUpdateStatus(proj.id, e.target.value as ProjectStatus)
                      }
                      className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#2A2723] bg-[#121110] text-[#8E867B] focus:outline-none cursor-pointer"
                    >
                      {STATUS_SELECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
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
                </div>

                <div>
                  <h3 className="font-serif text-sm font-bold text-[#F5F2EB] group-hover:text-white transition-colors truncate">
                    {proj.title}
                  </h3>
                  {proj.description && (
                    <p className="text-xs text-[#8E867B] line-clamp-1 mt-0.5">
                      {proj.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#8E867B] flex items-center gap-1">
                      <ListTodo className="size-2.5 text-[#D99B43]" />
                      <span>
                        {metrics.completedCount}/{metrics.totalCount} hechas
                      </span>
                    </span>
                    {proj.status !== "permanent" && (
                      <span className="font-bold text-[#DDD6C9]">
                        {metrics.progressPercent}%
                      </span>
                    )}
                  </div>
                  {proj.status !== "permanent" && (
                    <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#4EAB9E] transition-all duration-500"
                        style={{ width: `${metrics.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
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
                  <option value="idea">Idea</option>
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
