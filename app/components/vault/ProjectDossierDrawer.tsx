"use client";

import { updateProjectStatusAction } from "@/app/actions/projects";
import { createSingleTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import { HabiticaTag, HabiticaTask, ProjectItem, ProjectStatus } from "@/lib/types";
import { matchTasksToProject } from "@/lib/projectMatcher";
import { getTaskPriorityInfo, parseTaskPrefix } from "@/lib/utils";
import {
  Check,
  CheckSquare,
  Code2,
  ExternalLink,
  Globe,
  Layers,
  ListTodo,
  Plus,
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
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("pending");
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xl h-full bg-[#181715] border-l border-[#2A2723] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
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

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div>
            <h2 className="font-serif text-lg font-bold text-[#F5F2EB] leading-snug">
              {project.title}
            </h2>
            {project.description && (
              <p className="text-xs text-[#8E867B] mt-1 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Links Ribbon */}
          {(project.repoUrl || project.liveUrl) && (
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

            {/* Visual Progress Bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#1C1A17] border border-[#2A2723]">
              <div
                className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#4EAB9E] transition-all duration-500"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>

            {/* Sub Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
              <div className="p-2 rounded-lg bg-[#181715] border border-[#22201D]">
                <div className="text-[10px] text-[#8E867B] uppercase">Total</div>
                <div className="text-sm font-bold text-[#F5F2EB] mt-0.5">
                  {metrics.totalCount}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#181715] border border-[#22201D]">
                <div className="text-[10px] text-[#7EA35A] uppercase">Listas</div>
                <div className="text-sm font-bold text-[#7EA35A] mt-0.5">
                  {metrics.completedCount}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#181715] border border-[#22201D]">
                <div className="text-[10px] text-[#D99B43] uppercase">Pendientes</div>
                <div className="text-sm font-bold text-[#D99B43] mt-0.5">
                  {metrics.pendingCount}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quick Task Creator */}
          <div className="rounded-xl border border-[#2A2723] bg-[#141311] p-3.5 space-y-2.5">
            <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8E867B]">
              + Agregar Tarea al Proyecto
            </label>
            <form onSubmit={handleAddTask} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewNewTaskTitle(e.target.value)}
                  placeholder={`Nueva tarea para ${metrics.canonicalPrefix}...`}
                  className="w-full pl-3 pr-3 py-2 rounded-lg border border-[#2A2723] bg-[#121110] text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-bold text-[#121110] transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>Agregar</span>
              </button>
            </form>
          </div>

          {/* Section 3: Live Habitica Tasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="size-4 text-[#4EAB9E]" />
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#4EAB9E]">
                  To-Dos del Proyecto en Habitica ({metrics.matchedTasks.length})
                </h3>
              </div>

              {/* Filter Tabs (Pendientes / Listas / Todas) */}
              <div className="flex items-center rounded-lg border border-[#2A2723] bg-[#121110] p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setFilterMode("pending")}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
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
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                    filterMode === "completed"
                      ? "bg-[#182014] text-[#7EA35A] font-bold"
                      : "text-[#8E867B] hover:text-[#DDD6C9]"
                  }`}
                >
                  Listas ({metrics.completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                    filterMode === "all"
                      ? "bg-[#22201D] text-[#F5F2EB] font-bold"
                      : "text-[#8E867B] hover:text-[#DDD6C9]"
                  }`}
                >
                  Todas ({metrics.totalCount})
                </button>
              </div>
            </div>

            {/* Tasks container */}
            <div className="rounded-xl border border-[#2A2723] bg-[#141311] divide-y divide-[#22201D] overflow-hidden shadow-md">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const { cleanTitle } = parseTaskPrefix(task.text);
                  const prio = getTaskPriorityInfo(task.priority || 1);
                  const checklistCount = task.checklist?.length || 0;
                  const checklistDone = task.checklist?.filter((c) => c.completed).length || 0;

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 transition-all hover:bg-[#181715] ${
                        task.completed ? "opacity-45" : "opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id, Boolean(task.completed))}
                          className={`flex size-4.5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer ${
                            task.completed
                              ? "border-[#7EA35A] bg-[#7EA35A] text-[#121110]"
                              : "border-[#3D3831] bg-[#121110] hover:border-[#D99B43]"
                          }`}
                        >
                          {task.completed && <Check className="size-3 stroke-3" />}
                        </button>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <span
                            className={`text-xs font-medium leading-snug block truncate ${
                              task.completed
                                ? "line-through text-[#8E867B]"
                                : "text-[#F5F2EB]"
                            }`}
                          >
                            {cleanTitle}
                          </span>

                          {checklistCount > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-[#8E867B]">
                              <CheckSquare className="size-2.5" />
                              <span>
                                {checklistDone}/{checklistCount} subtareas
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Priority badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[9px] font-semibold shrink-0 ml-2 ${prio.badge}`}
                      >
                        <span className={`size-1.5 rounded-full ${prio.dot}`} />
                        <span>{prio.shortLabel}</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#8E867B] space-y-1">
                  <p>No hay tareas en esta vista.</p>
                  <p className="text-[11px] text-[#736B60]">
                    Usa el campo superior para crear tu primera tarea con{" "}
                    <code className="text-[#D99B43]">{metrics.canonicalPrefix}</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Tech Stack Badges */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8E867B]">
                Tech Stack
              </label>
              <div className="flex flex-wrap gap-1.5">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-md bg-[#141311] border border-[#2A2723] text-[10px] font-mono text-[#DDD6C9]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
