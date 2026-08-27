"use client";

import {
  deleteProjectAction,
  updateProjectDetailsAction,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import { createSingleTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import { HabiticaTag, HabiticaTask, ProjectItem, ProjectStatus } from "@/lib/types";
import { matchTasksToProject } from "@/lib/projectMatcher";
import { getTaskPriorityInfo, parseTaskPrefix } from "@/lib/utils";
import {
  Check,
  Code2,
  Edit2,
  ExternalLink,
  Globe,
  Layers,
  ListTodo,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface ProjectDossierDrawerProps {
  project: ProjectItem | null;
  tasks?: HabiticaTask[];
  tags?: HabiticaTag[];
  onClose: () => void;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; badge: string }
> = {
  permanent: {
    label: "♾️ Permanente",
    color: "text-[#4EAB9E]",
    badge: "border-[#4EAB9E]/40 bg-[#142321] text-[#4EAB9E]",
  },
  in_progress: {
    label: "⚡ En Desarrollo",
    color: "text-[#D99B43]",
    badge: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]",
  },
  launched: {
    label: "🚀 Lanzado",
    color: "text-[#7EA35A]",
    badge: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]",
  },
  idea: {
    label: "💡 Idea",
    color: "text-[#C2BAAD]",
    badge: "border-[#8E867B]/30 bg-[#1A1917] text-[#C2BAAD]",
  },
  paused: {
    label: "⏸️ Pausado",
    color: "text-[#8E867B]",
    badge: "border-[#2A2723] bg-[#181715] text-[#8E867B]",
  },
};

export function ProjectDossierDrawer({
  project,
  tasks = [],
  tags: _tags = [],
  onClose,
  onRefresh,
}: ProjectDossierDrawerProps) {
  const [newTaskTitle, setNewNewTaskTitle] = useState("");
  const [filterMode, setFilterMode] = useState<"pending" | "completed" | "all">("pending");
  const [isPending, startTransition] = useTransition();

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(() => project?.title || "");
  const [editDescription, setEditDescription] = useState(() => project?.description || "");
  const [editStatus, setEditStatus] = useState<ProjectStatus>(() => project?.status || "in_progress");
  const [editTechStack, setEditTechStack] = useState(() =>
    Array.isArray(project?.techStack) ? project.techStack.join(", ") : ""
  );
  const [editRepoUrl, setEditRepoUrl] = useState(() => project?.repoUrl || "");
  const [editLiveUrl, setEditLiveUrl] = useState(() => project?.liveUrl || "");
  const [editProgress, setEditProgress] = useState(() => project?.progress || 0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleOpenEdit = () => {
    if (project) {
      setEditTitle(project.title || "");
      setEditDescription(project.description || "");
      setEditStatus(project.status || "in_progress");
      setEditTechStack(Array.isArray(project.techStack) ? project.techStack.join(", ") : "");
      setEditRepoUrl(project.repoUrl || "");
      setEditLiveUrl(project.liveUrl || "");
      setEditProgress(project.progress || 0);
      setIsConfirmingDelete(false);
    }
    setIsEditing(true);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  const metrics = matchTasksToProject(project, tasks);
  const statusMeta = STATUS_CONFIG[project.status] || STATUS_CONFIG.idea;

  const filteredTasks = metrics.matchedTasks.filter((t) => {
    if (filterMode === "pending") return !t.completed;
    if (filterMode === "completed") return t.completed;
    return true;
  });

  const handleToggleTask = (taskId: string, isCompleted: boolean) => {
    if (!isCompleted) {
      soundFx.taskComplete();
    } else {
      soundFx.click();
    }

    startTransition(async () => {
      await toggleTaskAction(taskId, "up");
      if (onRefresh) onRefresh();
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isPending) return;

    const fullTitle = `${metrics.canonicalPrefix} ${newTaskTitle.trim()}`;
    setNewNewTaskTitle("");

    startTransition(async () => {
      await createSingleTaskAction(fullTitle);
      soundFx.click();
      if (onRefresh) onRefresh();
    });
  };

  const handleUpdateStatus = (newStatus: ProjectStatus) => {
    startTransition(async () => {
      await updateProjectStatusAction(project.id, newStatus);
      if (onRefresh) onRefresh();
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || isPending) return;

    const techArray = editTechStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      await updateProjectDetailsAction({
        id: project.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
        techStack: techArray,
        repoUrl: editRepoUrl.trim() || undefined,
        liveUrl: editLiveUrl.trim() || undefined,
        progress: editProgress,
      });

      soundFx.taskComplete();
      setIsEditing(false);
      if (onRefresh) onRefresh();
    });
  };

  const handleDeleteProject = () => {
    startTransition(async () => {
      await deleteProjectAction(project.id);
      soundFx.click();
      if (onRefresh) onRefresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xl h-full bg-[#181715] border-l border-[#2A2723] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#2A2723] bg-[#141311] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#221D16] border border-[#3D3425] px-2 py-0.5 font-mono text-[10px] text-[#D99B43] font-semibold">
                {metrics.canonicalPrefix}
              </span>
              <select
                value={project.status}
                onChange={(e) => handleUpdateStatus(e.target.value as ProjectStatus)}
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg border ${statusMeta.badge} bg-[#121110] focus:outline-none cursor-pointer`}
              >
                <option value="permanent">♾️ Permanente</option>
                <option value="in_progress">⚡ En Desarrollo</option>
                <option value="launched">🚀 Lanzado / Prod</option>
                <option value="idea">💡 Idea</option>
                <option value="paused">⏸️ Pausado</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Edit Mode Toggle Button */}
              <button
                type="button"
                onClick={() => (isEditing ? setIsEditing(false) : handleOpenEdit())}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isEditing
                    ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/50"
                    : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border-[#2A2723]"
                }`}
              >
                <Edit2 className="size-3.5" />
                <span>{isEditing ? "Ver Dossier" : "Editar Proyecto"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {!isEditing && (
            <div>
              <h2 className="font-serif text-lg font-bold text-[#F5F2EB] leading-snug">
                {project.title}
              </h2>
              {project.description && (
                <p className="text-xs text-[#8E867B] mt-1 leading-relaxed font-sans">
                  {project.description}
                </p>
              )}
            </div>
          )}

          {/* Links Ribbon */}
          {!isEditing && (project.repoUrl || project.liveUrl) && (
            <div className="flex items-center gap-3 pt-1 text-xs font-mono">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162121] border border-[#4EAB9E]/40 text-[#4EAB9E] hover:underline font-semibold"
                >
                  <Globe className="size-3.5" />
                  <span>Sitio Web / Live</span>
                  <ExternalLink className="size-3 opacity-70" />
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121110] border border-[#2A2723] text-[#DDD6C9] hover:text-[#F5F2EB]"
                >
                  <Code2 className="size-3.5" />
                  <span>Repositorio</span>
                  <ExternalLink className="size-3 opacity-70" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ========================================================================= */}
          {/* EDIT FORM MODE                                                            */}
          {/* ========================================================================= */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-[#D99B43]/30 bg-[#141311] p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
                  <span className="font-serif text-sm font-bold text-[#F5F2EB] flex items-center gap-2">
                    <Edit2 className="size-4 text-[#D99B43]" />
                    <span>Editar Detalles del Proyecto</span>
                  </span>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#8E867B]">
                    Título del Proyecto:
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#8E867B]">
                    Descripción / Propósito:
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Descripción técnica, objetivos o contexto..."
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] resize-none font-sans"
                  />
                </div>

                {/* Status & Progress Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-[#8E867B]">
                      Estado:
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                      className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                    >
                      <option value="permanent">♾️ Permanente</option>
                      <option value="in_progress">⚡ En Desarrollo</option>
                      <option value="launched">🚀 Lanzado</option>
                      <option value="idea">💡 Idea</option>
                      <option value="paused">⏸️ Pausado</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-[#8E867B]">
                      Progreso: {editProgress}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={editProgress}
                      onChange={(e) => setEditProgress(Number(e.target.value))}
                      className="w-full accent-[#D99B43] h-2 bg-[#2A2723] rounded-lg cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#8E867B]">
                    Stack Tecnológico (separado por comas):
                  </label>
                  <input
                    type="text"
                    value={editTechStack}
                    onChange={(e) => setEditTechStack(e.target.value)}
                    placeholder="Next.js 15, PostgreSQL, Tailwind, AWS..."
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                  />
                </div>

                {/* Repo URL & Live URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-[#8E867B]">
                      URL de Repositorio (Git):
                    </label>
                    <input
                      type="url"
                      value={editRepoUrl}
                      onChange={(e) => setEditRepoUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-[#8E867B]">
                      URL Sitio Web / Staging:
                    </label>
                    <input
                      type="url"
                      value={editLiveUrl}
                      onChange={(e) => setEditLiveUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2A2723]">
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteProject}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-lg bg-[#E05D52] hover:bg-[#F06E63] text-[#121110] font-bold text-xs font-mono cursor-pointer"
                      >
                        Confirmar Eliminación
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="px-2 py-1.5 text-xs text-[#8E867B] hover:text-[#DDD6C9]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-3 py-1.5 rounded-lg border border-[#E05D52]/30 text-[#E05D52] hover:bg-[#221716] text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Eliminar Proyecto</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!editTitle.trim() || isPending}
                      className="px-5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs font-mono cursor-pointer transition-all disabled:opacity-50 shadow-xs"
                    >
                      {isPending ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* ========================================================================= */
            /* STANDARD DOSSIER VIEW                                                     */
            /* ========================================================================= */
            <>
              {/* Section 1: Progress Metrics Dashboard */}
              <div className="rounded-xl border border-[#2A2723] bg-[#141311] p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-[#D99B43]" />
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                      Progreso & Entregables
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#D99B43]">
                    {metrics.progressPercent}% completado
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-[#1A1917] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#7EA35A] transition-all duration-300"
                    style={{ width: `${metrics.progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                  <div className="rounded-lg bg-[#181715] p-2 border border-[#22201D]">
                    <span className="text-[9px] uppercase text-[#8E867B] block">Total</span>
                    <span className="text-sm font-bold text-[#F5F2EB]">{metrics.totalCount}</span>
                  </div>
                  <div className="rounded-lg bg-[#181715] p-2 border border-[#22201D]">
                    <span className="text-[9px] uppercase text-[#7EA35A] block">Listas</span>
                    <span className="text-sm font-bold text-[#7EA35A]">{metrics.completedCount}</span>
                  </div>
                  <div className="rounded-lg bg-[#181715] p-2 border border-[#22201D]">
                    <span className="text-[9px] uppercase text-[#D99B43] block">Pendientes</span>
                    <span className="text-sm font-bold text-[#D99B43]">{metrics.pendingCount}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Rapid Task Creation */}
              <div className="rounded-xl border border-[#2A2723] bg-[#141311] p-4 space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E867B] block">
                  + Agregar Tarea al Proyecto
                </span>
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewNewTaskTitle(e.target.value)}
                    placeholder={`Nueva tarea para ${metrics.canonicalPrefix}...`}
                    className="flex-1 rounded-lg border border-[#2A2723] bg-[#121110] pl-3 pr-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || isPending}
                    className="px-3.5 py-2 rounded-lg bg-[#D99B43] text-[#121110] font-mono text-xs font-bold hover:bg-[#E8AF59] disabled:opacity-50 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>Agregar</span>
                  </button>
                </form>
              </div>

              {/* Section 3: Project Tasks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="size-4 text-[#4EAB9E]" />
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                      To-Dos del Proyecto en Habitica ({metrics.totalCount})
                    </h3>
                  </div>

                  <div className="flex rounded-lg bg-[#121110] p-0.5 border border-[#2A2723] font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFilterMode("pending")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        filterMode === "pending"
                          ? "bg-[#221D16] text-[#D99B43] font-bold"
                          : "text-[#8E867B] hover:text-[#DDD6C9]"
                      }`}
                    >
                      Pendientes ({metrics.pendingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("completed")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        filterMode === "completed"
                          ? "bg-[#1C2219] text-[#7EA35A] font-bold"
                          : "text-[#8E867B] hover:text-[#DDD6C9]"
                      }`}
                    >
                      Listas ({metrics.completedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("all")}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        filterMode === "all"
                          ? "bg-[#1A1917] text-[#F5F2EB] font-bold"
                          : "text-[#8E867B] hover:text-[#DDD6C9]"
                      }`}
                    >
                      Todas ({metrics.totalCount})
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                      const priority = getTaskPriorityInfo(task.priority);
                      const { cleanTitle } = parseTaskPrefix(task.text);

                      return (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task.id, Boolean(task.completed))}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none group ${
                            task.completed
                              ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                              : "bg-[#141311] border-[#2A2723] hover:border-[#3D3425] text-[#F5F2EB]"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                                task.completed
                                  ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                                  : "border-[#38332D] bg-[#181715] group-hover:border-[#D99B43]"
                              }`}
                            >
                              {task.completed && <Check className="size-3 stroke-3" />}
                            </div>

                            <span
                              className={`text-xs truncate ${
                                task.completed ? "line-through text-[#8E867B]" : "text-[#F5F2EB]"
                              }`}
                            >
                              {cleanTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {priority && (
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${priority.badge}`}
                              >
                                {priority.label}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 rounded-lg border border-dashed border-[#2A2723] text-center text-xs font-mono text-[#8E867B]">
                      {filterMode === "pending"
                        ? "🎉 No hay tareas pendientes en este proyecto."
                        : "No hay tareas registradas con este filtro."}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
