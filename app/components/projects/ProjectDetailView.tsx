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
  saveContextualNoteAction,
} from "@/app/actions/notes";
import { createSingleTaskAction, toggleTaskAction } from "@/app/actions/tasks";
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
import { classifyUrl, LinkCategory } from "@/lib/urlClassifier";
import { getTaskPriorityInfo, parseTaskPrefix } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Edit2,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  Layers,
  ListTodo,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

interface ProjectDetailViewProps {
  project: ProjectItem;
  tasks?: HabiticaTask[];
  tags?: HabiticaTag[];
  initialNotes?: ContextualNote[];
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

export function ProjectDetailView({
  project,
  tasks = [],
  tags: _tags = [],
  initialNotes = [],
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tasks State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [filterMode, setFilterMode] = useState<"pending" | "completed" | "all">("pending");

  // Resources State
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newResourceLabel, setNewResourceLabel] = useState("");

  // Notes State
  const [notes, setNotes] = useState<ContextualNote[]>(initialNotes);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("idea");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editDescription, setEditDescription] = useState(project.description || "");
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);
  const [editCanonicalPrefix, setEditCanonicalPrefix] = useState(project.canonicalPrefix || "");
  const [editTaskPrefixes, setEditTaskPrefixes] = useState(
    Array.isArray(project.taskPrefixes) ? project.taskPrefixes.join(", ") : ""
  );

interface ClassifiedProjectResource {
  url: string;
  label: string;
  category: LinkCategory;
  domain: string;
  badgeStyle: string;
  isCustom: boolean;
}

  const metrics = matchTasksToProject(project, tasks);
  const statusMeta = STATUS_CONFIG[project.status] || STATUS_CONFIG.idea;

  // Extract Resources (explicitly registered resources)
  const integrations = project.integrations;

  const allResources = useMemo<ClassifiedProjectResource[]>(() => {
    const raw = integrations?.resources;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item: { url?: string; label?: string } | string) => {
        const rawUrl = typeof item === "string" ? item : item.url || "";
        const customLabel = typeof item === "string" ? undefined : item.label;
        const c = classifyUrl(rawUrl);
        if (!c.url) return null;
        return {
          url: c.url,
          label: customLabel || c.label,
          category: c.category,
          domain: c.domain,
          badgeStyle: c.badgeStyle,
          isCustom: true,
        };
      })
      .filter((r): r is ClassifiedProjectResource => Boolean(r));
  }, [integrations]);

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
      router.refresh();
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isPending) return;

    const fullTitle = `${metrics.canonicalPrefix} ${newTaskTitle.trim()}`;
    setNewTaskTitle("");

    startTransition(async () => {
      await createSingleTaskAction(fullTitle);
      soundFx.click();
      router.refresh();
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
      router.refresh();
    });
  };

  const handleRemoveResource = (url: string) => {
    startTransition(async () => {
      await removeProjectResourceAction(project.id, url);
      soundFx.click();
      router.refresh();
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
      router.refresh();
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
      router.refresh();
    });
  };

  const handleDeleteProject = () => {
    if (!confirm("¿Eliminar este proyecto?")) return;
    startTransition(async () => {
      await deleteProjectAction(project.id);
      soundFx.click();
      router.push("/projects");
    });
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* 1. Header & Navigation */}
      <div className="space-y-4 pb-4 border-b border-[#2A2723]">
        <div className="flex items-center justify-between">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver a Proyectos</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isEditing
                  ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/50"
                  : "bg-[#181715] text-[#8E867B] hover:text-[#DDD6C9] border-[#2A2723]"
              }`}
            >
              <Edit2 className="size-3.5" />
              <span>{isEditing ? "Ver Proyecto" : "Editar"}</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteProject}
              className="p-1.5 rounded-lg border border-[#E05D52]/30 text-[#8E867B] hover:text-[#E05D52] hover:bg-[#221716] transition-colors cursor-pointer"
              title="Eliminar proyecto"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Project Header Info */}
        {!isEditing ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded bg-[#221D16] border border-[#3D3425] px-2.5 py-0.5 font-mono text-xs text-[#D99B43] font-semibold">
                  {metrics.canonicalPrefix}
                </span>

                <select
                  value={project.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as ProjectStatus)}
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border ${statusMeta.badge} bg-[#121110] focus:outline-none cursor-pointer`}
                >
                  <option value="in_progress">En Desarrollo</option>
                  <option value="completed">Completado</option>
                  <option value="launched">Lanzado / Prod</option>
                  <option value="permanent">Permanente</option>
                  <option value="idea">Idea</option>
                  <option value="paused">Pausado</option>
                </select>

                {project.taskPrefixes && project.taskPrefixes.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {project.taskPrefixes.map((p, i) => (
                      <span
                        key={i}
                        className="rounded bg-[#181715] border border-[#2A2723] px-1.5 py-0.5 font-mono text-[10px] text-[#8E867B]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F2EB] tracking-tight">
                {project.title}
              </h1>

              {project.description && (
                <p className="text-xs sm:text-sm text-[#8E867B] max-w-3xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Quick Metrics Badge */}
            <div className="flex items-center gap-3 bg-[#181715] border border-[#2A2723] rounded-xl p-3 shrink-0">
              {project.status !== "permanent" && (
                <>
                  <div className="text-center font-mono px-2">
                    <span className="text-[10px] uppercase text-[#8E867B] block">Progreso</span>
                    <span className="text-base font-bold text-[#D99B43]">
                      {metrics.progressPercent}%
                    </span>
                  </div>
                  <div className="h-7 w-px bg-[#2A2723]" />
                </>
              )}
              <div className="text-center font-mono px-2">
                <span className="text-[10px] uppercase text-[#8E867B] block">Tareas</span>
                <span className="text-base font-bold text-[#F5F2EB]">
                  {metrics.completedCount}/{metrics.totalCount}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Inline Edit Form */
          <form onSubmit={handleSaveEdit} className="space-y-4 p-5 rounded-xl border border-[#D99B43]/30 bg-[#141311]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">Título:</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-[#8E867B]">Estado:</label>
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
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-[#8E867B]">Descripción:</label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#8E867B]">Prefijo Canónico:</label>
                <input
                  type="text"
                  value={editCanonicalPrefix}
                  onChange={(e) => setEditCanonicalPrefix(e.target.value)}
                  placeholder="[Hybridge], [Brio]..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-[#8E867B]">Prefijos Habitica (comas):</label>
                <input
                  type="text"
                  value={editTaskPrefixes}
                  onChange={(e) => setEditTaskPrefixes(e.target.value)}
                  placeholder="hybridge, hackeo, módulo..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2723]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!editTitle.trim() || isPending}
                className="px-4 py-1.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-mono text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Tasks & Contextual Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Habitica Tasks */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <ListTodo className="size-4 text-[#D99B43]" />
                <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-[#F5F2EB]">
                  Tareas ({metrics.totalCount})
                </h2>
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

            {/* Rapid Task Add Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={`Nueva tarea para ${metrics.canonicalPrefix}...`}
                className="flex-1 rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || isPending}
                className="px-4 py-2 rounded-lg bg-[#D99B43] text-[#121110] font-mono text-xs font-bold hover:bg-[#E8AF59] disabled:opacity-50 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Agregar</span>
              </button>
            </form>

            {/* Tasks List */}
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
                <div className="p-8 rounded-lg border border-dashed border-[#2A2723] text-center text-xs font-mono text-[#8E867B]">
                  {filterMode === "pending"
                    ? "No hay tareas pendientes en este proyecto."
                    : "No hay tareas registradas con este filtro."}
                </div>
              )}
            </div>
          </div>

          {/* Section: Contextual Notes */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#4EAB9E]" />
                <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-[#F5F2EB]">
                  Notas del Proyecto ({notes.length})
                </h2>
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

            {/* New Note Form */}
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

            {/* Notes List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.length > 0 ? (
                notes.map((note) => {
                  const catMeta = NOTE_CATEGORY_META[note.category] || NOTE_CATEGORY_META.idea;

                  return (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl border border-[#2A2723] bg-[#141311] space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
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

                        <h4 className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB]">
                          {note.title}
                        </h4>
                        <p className="text-xs text-[#8E867B] font-sans whitespace-pre-wrap leading-relaxed line-clamp-4">
                          {note.content}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#2A2723]/50 text-[9px] font-mono text-[#8E867B]">
                        {new Date(note.updatedAt).toLocaleDateString("es-MX", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-8 rounded-lg border border-dashed border-[#2A2723] text-center text-xs font-mono text-[#8E867B]">
                  No hay notas registradas para este proyecto.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Resources & External Links */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2A2723]">
              <FolderGit2 className="size-4 text-[#4EAB9E]" />
              <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-[#F5F2EB]">
                Recursos & Enlaces ({allResources.length})
              </h2>
            </div>

            {/* Add Resource Form */}
            <form onSubmit={handleAddResource} className="space-y-2.5">
              <input
                type="url"
                required
                value={newResourceUrl}
                onChange={(e) => setNewResourceUrl(e.target.value)}
                placeholder="https://github.com/..., figma.com/..."
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none font-mono"
              />
              <input
                type="text"
                value={newResourceLabel}
                onChange={(e) => setNewResourceLabel(e.target.value)}
                placeholder="Nombre o etiqueta (opcional)"
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newResourceUrl.trim() || isPending}
                  className="w-full py-2 rounded-lg bg-[#4EAB9E] hover:bg-[#5BBDAF] text-[#121110] font-mono text-xs font-bold disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Agregar Recurso</span>
                </button>
              </div>
            </form>

            {/* Resources List */}
            <div className="space-y-2 pt-2">
              {allResources.length > 0 ? (
                allResources.map((res, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#2A2723] bg-[#141311] hover:border-[#38332D] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border shrink-0 ${res.badgeStyle}`}
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
                <div className="p-6 rounded-lg border border-dashed border-[#2A2723] text-center text-xs font-mono text-[#8E867B]">
                  <Globe className="size-5 text-[#8E867B] mx-auto mb-1 opacity-50" />
                  No hay enlaces registrados.
                </div>
              )}
            </div>
          </div>

          {/* Project Progress Summary Card */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-[#D99B43]" />
              <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                Resumen de Métricas
              </h3>
            </div>

            {project.status !== "permanent" && (
              <div className="h-2 w-full rounded-full bg-[#121110] overflow-hidden border border-[#2A2723]">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#D99B43] to-[#4EAB9E] transition-all duration-300"
                  style={{ width: `${metrics.progressPercent}%` }}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="rounded-lg bg-[#141311] p-2 border border-[#22201D]">
                <span className="text-[9px] uppercase text-[#8E867B] block">Total</span>
                <span className="text-xs font-bold text-[#F5F2EB]">{metrics.totalCount}</span>
              </div>
              <div className="rounded-lg bg-[#141311] p-2 border border-[#22201D]">
                <span className="text-[9px] uppercase text-[#7EA35A] block">Hechas</span>
                <span className="text-xs font-bold text-[#7EA35A]">{metrics.completedCount}</span>
              </div>
              <div className="rounded-lg bg-[#141311] p-2 border border-[#22201D]">
                <span className="text-[9px] uppercase text-[#D99B43] block">Pendientes</span>
                <span className="text-xs font-bold text-[#D99B43]">{metrics.pendingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
