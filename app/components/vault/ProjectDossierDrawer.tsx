"use client";

import {
  addProjectResourceAction,
  deleteProjectAction,
  removeProjectResourceAction,
  updateProjectDetailsAction,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import {
  deleteContextualNoteAction,
  fetchContextualNotesAction,
  saveContextualNoteAction,
} from "@/app/actions/notes";
import { createSingleTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { DrawerResizeHandle, useResizableDrawer } from "@/app/hooks/useResizableDrawer";
import { matchTasksToProject } from "@/lib/projectMatcher";
import { soundFx } from "@/lib/soundFx";
import {
  ContextualNote,
  HabiticaTag,
  HabiticaTask,
  NoteCategory,
  ProjectItem,
  ProjectStatus,
} from "@/lib/types";
import { classifyUrl, extractAndClassifyLinks } from "@/lib/urlClassifier";
import { getTaskPriorityInfo, parseTaskPrefix } from "@/lib/utils";
import {
  Check,
  Edit2,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  Layers,
  Link as LinkIcon,
  ListTodo,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

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
    label: "Permanente",
    color: "text-[#4EAB9E]",
    badge: "border-[#4EAB9E]/40 bg-[#142321] text-[#4EAB9E]",
  },
  in_progress: {
    label: "En Desarrollo",
    color: "text-[#D99B43]",
    badge: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]",
  },
  completed: {
    label: "Completado",
    color: "text-[#7EA35A]",
    badge: "border-[#7EA35A]/40 bg-[#17241A] text-[#7EA35A]",
  },
  launched: {
    label: "Lanzado",
    color: "text-[#7EA35A]",
    badge: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]",
  },
  idea: {
    label: "Idea",
    color: "text-[#C2BAAD]",
    badge: "border-[#8E867B]/30 bg-[#1A1917] text-[#C2BAAD]",
  },
  paused: {
    label: "Pausado",
    color: "text-[#8E867B]",
    badge: "border-[#2A2723] bg-[#181715] text-[#8E867B]",
  },
};

const NOTE_CATEGORY_META: Record<
  NoteCategory,
  { label: string; color: string }
> = {
  idea: {
    label: "Idea",
    color: "border-[#8E867B]/40 bg-[#1A1917] text-[#C2BAAD]",
  },
  decision: {
    label: "Decisión",
    color: "border-[#D99B43]/40 bg-[#221D16] text-[#D99B43]",
  },
  technical: {
    label: "Técnica",
    color: "border-[#4EAB9E]/40 bg-[#142321] text-[#4EAB9E]",
  },
  meeting: {
    label: "Reunión",
    color: "border-[#7EA35A]/40 bg-[#17241A] text-[#7EA35A]",
  },
  log: {
    label: "Log",
    color: "border-[#93C5FD]/40 bg-[#161C27] text-[#93C5FD]",
  },
};

export function ProjectDossierDrawer({
  project,
  tasks = [],
  tags: _tags = [],
  onClose,
  onRefresh,
}: ProjectDossierDrawerProps) {
  const { width, isResizing, handleMouseDown, resetWidth } = useResizableDrawer({
    storageKey: "brio:drawer-width:project",
    defaultWidth: 620,
    minWidth: 420,
    maxWidthRatio: 0.92,
  });

  const [activeTab, setActiveTab] = useState<"tasks" | "resources" | "notes">("tasks");
  const [newTaskTitle, setNewNewTaskTitle] = useState("");
  const [filterMode, setFilterMode] = useState<"pending" | "completed" | "all">("pending");
  const [isPending, startTransition] = useTransition();

  // Resources State
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceLabel, setNewResourceLabel] = useState("");

  // Notes State
  const [notes, setNotes] = useState<ContextualNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("idea");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(() => project?.title || "");
  const [editDescription, setEditDescription] = useState(() => project?.description || "");
  const [editStatus, setEditStatus] = useState<ProjectStatus>(() => project?.status || "in_progress");
  const [editCanonicalPrefix, setEditCanonicalPrefix] = useState(() => project?.canonicalPrefix || "");
  const [editTaskPrefixes, setEditTaskPrefixes] = useState(() =>
    Array.isArray(project?.taskPrefixes) ? project.taskPrefixes.join(", ") : ""
  );
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Load contextual notes for project
  useEffect(() => {
    if (!project?.id) return;
    fetchContextualNotesAction(project.id).then((data) => {
      setNotes(data || []);
    });
  }, [project?.id]);

  const handleOpenEdit = () => {
    if (project) {
      setEditTitle(project.title || "");
      setEditDescription(project.description || "");
      setEditStatus(project.status || "in_progress");
      setEditCanonicalPrefix(project.canonicalPrefix || "");
      setEditTaskPrefixes(Array.isArray(project.taskPrefixes) ? project.taskPrefixes.join(", ") : "");
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

interface ClassifiedProjectResource {
  url: string;
  label: string;
  category: string;
  domain: string;
  badgeStyle: string;
  isCustom: boolean;
}

  // Compute Resources
  const integrations = project?.integrations;
  const projectDescription = project?.description;

  const resourcesFromIntegrations = useMemo(() => {
    const raw = integrations?.resources;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item: { url?: string; label?: string } | string) => {
        if (typeof item === "string") {
          const c = classifyUrl(item);
          return {
            url: c.url,
            label: c.label,
            category: c.category,
            domain: c.domain,
            badgeStyle: c.badgeStyle,
            isCustom: true,
          };
        }
        const c = classifyUrl(item.url || "");
        return {
          url: c.url,
          label: item.label || c.label,
          category: c.category,
          domain: c.domain,
          badgeStyle: c.badgeStyle,
          isCustom: true,
        };
      })
      .filter((r) => Boolean(r.url));
  }, [integrations]);

  const resourcesFromDesc = useMemo(() => {
    if (!projectDescription) return [];
    const extracted = extractAndClassifyLinks(projectDescription);
    return extracted.map((e) => ({
      url: e.url,
      label: e.label,
      category: e.category,
      domain: e.domain,
      badgeStyle: e.badgeStyle,
      isCustom: false,
    }));
  }, [projectDescription]);

  const allResources = useMemo(() => {
    const map = new Map<string, ClassifiedProjectResource>();
    for (const r of resourcesFromIntegrations) {
      if (r.url) map.set(r.url, r);
    }
    for (const r of resourcesFromDesc) {
      if (r.url && !map.has(r.url)) map.set(r.url, r);
    }
    return Array.from(map.values());
  }, [resourcesFromIntegrations, resourcesFromDesc]);

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

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceUrl.trim() || isPending) return;

    startTransition(async () => {
      await addProjectResourceAction(
        project.id,
        newResourceUrl.trim(),
        newResourceLabel.trim() || undefined
      );
      soundFx.click();
      setNewResourceUrl("");
      setNewResourceLabel("");
      if (onRefresh) onRefresh();
    });
  };

  const handleRemoveResource = (url: string) => {
    startTransition(async () => {
      await removeProjectResourceAction(project.id, url);
      soundFx.click();
      if (onRefresh) onRefresh();
    });
  };

  const handleSaveNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim() || isPending) return;

    startTransition(async () => {
      const res = await saveContextualNoteAction({
        projectId: project.id,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        category: newNoteCategory,
      });

      if (res.success && res.note) {
        setNotes((prev) => [res.note!, ...prev]);
        setNewNoteTitle("");
        setNewNoteContent("");
        setIsAddingNote(false);
        soundFx.taskComplete();
      }
    });
  };

  const handleDeleteNote = (noteId: string) => {
    startTransition(async () => {
      await deleteContextualNoteAction(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      soundFx.click();
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

    const prefixesArray = editTaskPrefixes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      await updateProjectDetailsAction({
        id: project.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
        progress: metrics.progressPercent,
        canonicalPrefix: editCanonicalPrefix.trim() || undefined,
        taskPrefixes: prefixesArray,
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
      <div
        className={`relative w-full resizable-drawer h-full bg-[#181715] border-l border-[#2A2723] shadow-2xl flex flex-col z-10 ${
          isResizing ? "select-none transition-none" : "animate-in slide-in-from-right duration-300"
        } overflow-hidden`}
        style={{ "--drawer-width": `${width}px` } as React.CSSProperties}
      >
        <DrawerResizeHandle
          onMouseDown={handleMouseDown}
          onDoubleClick={resetWidth}
          isResizing={isResizing}
        />

        {/* Header */}
        <div className="p-5 border-b border-[#2A2723] bg-[#141311] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded bg-[#221D16] border border-[#3D3425] px-2 py-0.5 font-mono text-[10px] text-[#D99B43] font-semibold">
                {metrics.canonicalPrefix}
              </span>
              {project.taskPrefixes && project.taskPrefixes.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {project.taskPrefixes.slice(0, 3).map((p, i) => (
                    <span
                      key={i}
                      className="rounded bg-[#181715] border border-[#2A2723] px-1.5 py-0.5 font-mono text-[9px] text-[#8E867B]"
                    >
                      {p}
                    </span>
                  ))}
                  {project.taskPrefixes.length > 3 && (
                    <span className="font-mono text-[9px] text-[#635C53]">
                      +{project.taskPrefixes.length - 3}
                    </span>
                  )}
                </div>
              )}
              <select
                value={project.status}
                onChange={(e) => handleUpdateStatus(e.target.value as ProjectStatus)}
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg border ${statusMeta.badge} bg-[#121110] focus:outline-none cursor-pointer`}
              >
                <option value="in_progress">En Desarrollo</option>
                <option value="completed">Completado</option>
                <option value="launched">Lanzado / Prod</option>
                <option value="permanent">Permanente</option>
                <option value="idea">Idea</option>
                <option value="paused">Pausado</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Dedicated Page Link */}
              <Link
                href={`/projects/${project.id}`}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border bg-[#181715] text-[#8E867B] hover:text-[#4EAB9E] hover:border-[#4EAB9E]/40 border-[#2A2723] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Abrir página completa"
              >
                <ExternalLink className="size-3.5 text-[#4EAB9E]" />
                <span className="hidden sm:inline">Página</span>
              </Link>

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
                <span>{isEditing ? "Ver Dossier" : "Editar"}</span>
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

          {/* Segmented Navigation Tabs */}
          {!isEditing && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-[#2A2723]/60 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "tasks"
                    ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/40 font-bold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <ListTodo className="size-3.5" />
                <span>Tareas ({metrics.totalCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("resources")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "resources"
                    ? "bg-[#141C1A] text-[#4EAB9E] border border-[#4EAB9E]/40 font-bold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <FolderGit2 className="size-3.5" />
                <span>Recursos ({allResources.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "notes"
                    ? "bg-[#181715] text-[#F5F2EB] border border-[#38332D] font-bold"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <FileText className="size-3.5" />
                <span>Notas ({notes.length})</span>
              </button>
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
                    Descripción / Resumen:
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] resize-none font-sans"
                  />
                </div>

                {/* Status & Dynamic Progress */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-[#8E867B]">
                      Estado:
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                      className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                    >
                      <option value="in_progress">En Desarrollo</option>
                      <option value="completed">Completado</option>
                      <option value="launched">Lanzado</option>
                      <option value="permanent">Permanente</option>
                      <option value="idea">Idea</option>
                      <option value="paused">Pausado</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-[#8E867B]">
                      Progreso Dinámico ({metrics.completedCount}/{metrics.totalCount}):
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#4EAB9E] transition-all duration-300"
                          style={{ width: `${metrics.progressPercent}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#F5F2EB]">
                        {metrics.progressPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Habitica Prefix & Matcher Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-[#2A2723] bg-[#100F0E]">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-[#8E867B]">
                      Prefijo Canónico:
                    </label>
                    <input
                      type="text"
                      value={editCanonicalPrefix}
                      onChange={(e) => setEditCanonicalPrefix(e.target.value)}
                      placeholder="[Hybridge], [Brio]..."
                      className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-[#8E867B]">
                      Prefijos Habitica (comas):
                    </label>
                    <input
                      type="text"
                      value={editTaskPrefixes}
                      onChange={(e) => setEditTaskPrefixes(e.target.value)}
                      placeholder="hybridge, hackeo ético, sa módulo 4..."
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
            /* TAB 1: TAREAS                                                             */
            /* ========================================================================= */
            activeTab === "tasks" ? (
              <>
                {/* Progress Metrics Dashboard */}
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
                      <span className="text-[9px] uppercase text-[#7EA35A] block">Completadas</span>
                      <span className="text-sm font-bold text-[#7EA35A]">{metrics.completedCount}</span>
                    </div>
                    <div className="rounded-lg bg-[#181715] p-2 border border-[#22201D]">
                      <span className="text-[9px] uppercase text-[#D99B43] block">Pendientes</span>
                      <span className="text-sm font-bold text-[#D99B43]">{metrics.pendingCount}</span>
                    </div>
                  </div>
                </div>

                {/* Rapid Task Creation */}
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

                {/* Project Tasks List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListTodo className="size-4 text-[#4EAB9E]" />
                      <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                        Tareas ({metrics.totalCount})
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
                        Completadas ({metrics.completedCount})
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
                          ? "No hay tareas pendientes en este proyecto."
                          : "No hay tareas registradas con este filtro."}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : /* ========================================================================= */
            /* TAB 2: RECURSOS & ENLACES                                                 */
            /* ========================================================================= */
            activeTab === "resources" ? (
              <div className="space-y-4">
                {/* Add Resource Form */}
                <div className="rounded-xl border border-[#2A2723] bg-[#141311] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4 text-[#4EAB9E]" />
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                      Agregar Recurso o Enlace
                    </h3>
                  </div>

                  <form onSubmit={handleAddResource} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        required
                        value={newResourceUrl}
                        onChange={(e) => setNewResourceUrl(e.target.value)}
                        placeholder="https://github.com/..., figma.com/..."
                        className="rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none font-mono"
                      />
                      <input
                        type="text"
                        value={newResourceLabel}
                        onChange={(e) => setNewResourceLabel(e.target.value)}
                        placeholder="Nombre o etiqueta (opcional)"
                        className="rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newResourceUrl.trim() || isPending}
                        className="px-3.5 py-1.5 rounded-lg bg-[#4EAB9E] hover:bg-[#5BBDAF] text-[#121110] font-mono text-xs font-bold disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="size-3.5" />
                        <span>Agregar Recurso</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Resources List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E867B]">
                      Recursos Registrados ({allResources.length})
                    </span>
                  </div>

                  {allResources.length > 0 ? (
                    allResources.map((res, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#2A2723] bg-[#141311] hover:border-[#38332D] transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border shrink-0 ${res.badgeStyle}`}
                          >
                            {res.category.toUpperCase()}
                          </span>

                          <div className="min-w-0 flex-1">
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-[#F5F2EB] hover:text-[#4EAB9E] flex items-center gap-1.5 truncate transition-colors"
                            >
                              <span className="truncate">{res.label || res.domain || res.url}</span>
                              <ExternalLink className="size-3 shrink-0 text-[#8E867B] group-hover:text-[#4EAB9E]" />
                            </a>
                            <span className="text-[10px] font-mono text-[#8E867B] block truncate">
                              {res.url}
                            </span>
                          </div>
                        </div>

                        {res.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleRemoveResource(res.url)}
                            className="p-1 text-[#8E867B] hover:text-[#E05D52] transition-colors cursor-pointer ml-2"
                            title="Eliminar recurso"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 rounded-lg border border-dashed border-[#2A2723] text-center text-xs font-mono text-[#8E867B]">
                      <Globe className="size-6 text-[#8E867B] mx-auto mb-2 opacity-50" />
                      No hay recursos ni enlaces registrados en este proyecto.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ========================================================================= */
              /* TAB 3: NOTAS CONTEXTUALES                                                 */
              /* ========================================================================= */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-[#DDD6C9]" />
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                      Notas del Proyecto ({notes.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="px-3 py-1 rounded-lg bg-[#221D16] border border-[#D99B43]/40 text-[#D99B43] text-xs font-mono font-semibold hover:bg-[#2A241B] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span>{isAddingNote ? "Cerrar" : "Nueva Nota"}</span>
                  </button>
                </div>

                {isAddingNote && (
                  <form
                    onSubmit={handleSaveNewNote}
                    className="rounded-xl border border-[#D99B43]/30 bg-[#141311] p-4 space-y-3 animate-in zoom-in-95 duration-150"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Título de la nota..."
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
                      />

                      <select
                        value={newNoteCategory}
                        onChange={(e) => setNewNoteCategory(e.target.value as NoteCategory)}
                        className="rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none font-mono"
                      >
                        <option value="idea">Idea</option>
                        <option value="decision">Decisión Técnica</option>
                        <option value="technical">Nota Técnica</option>
                        <option value="meeting">Reunión / Feedback</option>
                        <option value="log">Log de Sesión</option>
                      </select>
                    </div>

                    <textarea
                      rows={4}
                      required
                      placeholder="Escribe el contenido de la nota..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none resize-none font-sans"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingNote(false)}
                        className="px-3 py-1.5 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newNoteTitle.trim() || !newNoteContent.trim() || isPending}
                        className="px-4 py-1.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-mono text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
                      >
                        Guardar Nota
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2.5">
                  {notes.length > 0 ? (
                    notes.map((note) => {
                      const catMeta = NOTE_CATEGORY_META[note.category] || NOTE_CATEGORY_META.idea;

                      return (
                        <div
                          key={note.id}
                          className="p-3.5 rounded-xl border border-[#2A2723] bg-[#141311] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${catMeta.color}`}
                            >
                              {catMeta.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-[#8E867B] hover:text-[#E05D52] p-1 rounded transition-colors cursor-pointer"
                              title="Eliminar nota"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          <h4 className="font-serif text-xs font-bold text-[#F5F2EB]">
                            {note.title}
                          </h4>
                          <p className="text-xs text-[#8E867B] font-sans whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 rounded-lg border border-dashed border-[#2A2723] text-center text-xs font-mono text-[#8E867B]">
                      No hay notas registradas para este proyecto.
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
