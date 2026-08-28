"use client";

import {
  deleteContextualNoteAction,
  saveContextualNoteAction,
} from "@/app/actions/notes";
import { updateProjectDetailsAction } from "@/app/actions/projects";
import { createSingleTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import {
  ContextualNote,
  HabiticaTag,
  HabiticaTask,
  NoteCategory,
  ProjectItem,
} from "@/lib/types";
import {
  classifyUrl,
  extractAndClassifyLinks,
  partitionLinksForDb,
} from "@/lib/urlClassifier";
import {
  Check,
  Code2,
  Edit2,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  Layers,
  ListTodo,
  Plus,
  Tag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

interface ProjectFocusCardProps {
  projects: ProjectItem[];
  tasks: HabiticaTask[];
  tags?: HabiticaTag[];
  contextualNotes: ContextualNote[];
  onRefreshData?: () => void;
}

const CATEGORY_META: Record<
  NoteCategory,
  { label: string; icon: string; color: string }
> = {
  idea: { label: "Idea", icon: "💡", color: "text-[#D99B43] bg-[#221D16] border-[#D99B43]/30" },
  decision: { label: "Decisión", icon: "⚖️", color: "text-[#7EA35A] bg-[#141813] border-[#7EA35A]/30" },
  technical: { label: "Técnico", icon: "⚙️", color: "text-[#4EAB9E] bg-[#141C1A] border-[#4EAB9E]/30" },
  meeting: { label: "Reunión", icon: "👥", color: "text-[#B388FF] bg-[#1E1627] border-[#B388FF]/30" },
  log: { label: "Log de Sesión", icon: "📋", color: "text-[#8E867B] bg-[#181715] border-[#2A2723]" },
};

export function ProjectFocusCard({
  projects,
  tasks,
  tags = [],
  contextualNotes,
  onRefreshData,
}: ProjectFocusCardProps) {
  const [isPending, startTransition] = useTransition();

  // Active Project Selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return projects.length > 0 ? projects[0].id : "default_project";
  });

  const activeProject = useMemo(() => {
    return (
      projects.find((p) => p.id === selectedProjectId) ||
      projects[0] || {
        id: "default_project",
        title: "Brio MVP & Core Architecture",
        description: "Zero-latency Personal Command Center with RPG gamification and bio-control.",
        status: "in_progress",
        techStack: ["Next.js 15", "PostgreSQL", "Tailwind", "Habitica"],
        repoUrl: "https://github.com/alejandro/brio",
        progress: 65,
      }
    );
  }, [projects, selectedProjectId]);

  // Find Best Matching Habitica Tag or allow manual tag selection
  const autoDetectedTag = useMemo(() => {
    if (!tags || tags.length === 0) return null;
    const projectWords = activeProject.title
      .toLowerCase()
      .split(/[\s—\-_()]+/)
      .filter((w) => w.length >= 3);

    if (projectWords.length === 0) return null;

    // 1. Try first word exact match (e.g. "unpo")
    const primaryWord = projectWords[0];
    const exactPrimaryMatch = tags.find(
      (t) => t.name.toLowerCase() === primaryWord
    );
    if (exactPrimaryMatch) return exactPrimaryMatch;

    // 2. Try whole title match
    const cleanTitle = activeProject.title.toLowerCase();
    const exactTitleMatch = tags.find(
      (t) => cleanTitle.includes(t.name.toLowerCase()) && t.name.toLowerCase() === primaryWord
    );
    if (exactTitleMatch) return exactTitleMatch;

    // Do NOT auto-match generic parent tags like "Proficient" if it doesn't match primary project name
    return null;
  }, [tags, activeProject]);

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Active Tag ID: Manual selection or Auto-detected
  const activeTag = useMemo(() => {
    if (selectedTagId === "none") {
      return null;
    }
    if (selectedTagId !== null) {
      return tags.find((t) => t.id === selectedTagId) || null;
    }
    return autoDetectedTag;
  }, [selectedTagId, tags, autoDetectedTag]);

  // Tab State: 'tasks' | 'notes' | 'resources'
  const [activeTab, setActiveTab] = useState<"tasks" | "notes" | "resources">(
    "tasks"
  );

  // Selected Task for Drawer
  const [activeTaskForDrawer, setActiveTaskForDrawer] =
    useState<HabiticaTask | null>(null);

  // Quick Task Creation
  const [newTaskText, setNewTaskText] = useState("");

  // Contextual Note Creation Form State
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] =
    useState<NoteCategory>("technical");
  const [newNoteTaskId, setNewNoteTaskId] = useState<string>("");
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>("all");

  // ACCURATE Task Filtering for Active Project (ONLY TO-DOS, NEVER DAILIES)
  const projectTasks = useMemo(() => {
    // 1. Strict filter: ONLY to-dos (no dailies, no habits)
    const todoTasks = tasks.filter((t) => t.type === "todo");

    // 2. Strategy A: Filter by active Habitica Tag ID if selected
    if (activeTag) {
      return todoTasks.filter(
        (t) => t.tags && Array.isArray(t.tags) && t.tags.includes(activeTag.id)
      );
    }

    // 3. Strategy B: Filter by primary project keyword in task text or notes (e.g. "unpo")
    const projectWords = activeProject.title
      .toLowerCase()
      .split(/[\s—\-_()]+/)
      .filter((w) => w.length >= 3);

    const primaryKeyword = projectWords[0] || "";
    if (!primaryKeyword) return [];

    return todoTasks.filter((t) => {
      const text = (t.text || "").toLowerCase();
      const notes = (t.notes || "").toLowerCase();
      return text.includes(primaryKeyword) || notes.includes(primaryKeyword);
    });
  }, [tasks, activeTag, activeProject]);

  // Filter Contextual Notes for this Project
  const projectNotes = useMemo(() => {
    return contextualNotes.filter(
      (n) =>
        n.projectId === activeProject.id ||
        n.projectId === "default_project" ||
        activeProject.id === "default_project"
    );
  }, [contextualNotes, activeProject]);

  const filteredProjectNotes = useMemo(() => {
    if (noteCategoryFilter === "all") return projectNotes;
    return projectNotes.filter((n) => n.category === noteCategoryFilter);
  }, [projectNotes, noteCategoryFilter]);

  // Handlers
  const handleToggleTask = (task: HabiticaTask) => {
    soundFx.taskComplete();
    startTransition(async () => {
      await toggleTaskAction(task.id, "up");
      if (onRefreshData) onRefreshData();
    });
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    soundFx.taskComplete();

    const tagSuffix = activeTag ? ` #${activeTag.name}` : "";
    const formattedText = `${newTaskText.trim()}${tagSuffix}`;
    setNewTaskText("");

    startTransition(async () => {
      await createSingleTaskAction(formattedText);
      if (onRefreshData) onRefreshData();
    });
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    soundFx.taskComplete();

    startTransition(async () => {
      await saveContextualNoteAction({
        projectId: activeProject.id,
        taskId: newNoteTaskId || undefined,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        category: newNoteCategory,
      });

      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteTaskId("");
      setIsCreatingNote(false);
      if (onRefreshData) onRefreshData();
    });
  };

  const handleDeleteNote = (noteId: string) => {
    soundFx.click();
    startTransition(async () => {
      await deleteContextualNoteAction(noteId);
      if (onRefreshData) onRefreshData();
    });
  };

  // Edit Project Dialog State
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectEditTitle, setProjectEditTitle] = useState("");
  const [projectEditDescription, setProjectEditDescription] = useState("");
  const [projectEditTechStack, setProjectEditTechStack] = useState("");
  const [projectEditUrls, setProjectEditUrls] = useState<string[]>([""]);

  const handleOpenEditProject = () => {
    setProjectEditTitle(activeProject.title);
    setProjectEditDescription(activeProject.description || "");
    setProjectEditTechStack(activeProject.techStack?.join(", ") || "");
    const classified = extractAndClassifyLinks(activeProject.repoUrl, activeProject.liveUrl);
    setProjectEditUrls(classified.length > 0 ? classified.map((l) => l.url) : [""]);
    setIsEditingProject(true);
  };

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectEditTitle.trim()) return;
    soundFx.taskComplete();

    const techArray = projectEditTechStack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const validUrls = projectEditUrls.map((u) => u.trim()).filter(Boolean);
    const { repoUrl, liveUrl } = partitionLinksForDb(validUrls);

    startTransition(async () => {
      await updateProjectDetailsAction({
        id: activeProject.id,
        title: projectEditTitle.trim(),
        description: projectEditDescription.trim() || undefined,
        status: activeProject.status,
        techStack: techArray,
        repoUrl,
        liveUrl,
        progress: activeProject.progress,
      });

      setIsEditingProject(false);
      if (onRefreshData) onRefreshData();
    });
  };

  const pendingTasksCount = projectTasks.filter((t) => !t.completed).length;

  return (
    <div className="rounded-2xl border border-[#2A2723] bg-[#181715] p-5 sm:p-7 shadow-sm space-y-6 font-sans relative">
      {/* ========================================================================= */}
      {/* 1. SPACIOUS 3-TIER PROJECT HEADER                                         */}
      {/* ========================================================================= */}
      <div className="space-y-4 pb-4 border-b border-[#2A2723]">
        {/* Row 1: Badges & Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#D99B43] bg-[#221D16] px-2.5 py-1 rounded-md border border-[#D99B43]/30 flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              <span>Proyecto en Foco</span>
            </span>

            {/* Habitica Tag Dropdown Selector */}
            {tags.length > 0 ? (
              <div className="flex items-center gap-1 font-mono text-[10px] text-[#4EAB9E] bg-[#141C1A] px-2.5 py-1 rounded-md border border-[#4EAB9E]/30">
                <Tag className="h-3 w-3" />
                <select
                  value={selectedTagId !== null ? selectedTagId : activeTag ? activeTag.id : "none"}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="bg-transparent border-none text-[#4EAB9E] font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="none" className="bg-[#181715] text-[#8E867B]">
                    🔍 Filtrar por nombre del proyecto (sin tag)
                  </option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#181715] text-[#4EAB9E]">
                      🏷️ #{t.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              activeTag && (
                <span className="font-mono text-[10px] text-[#4EAB9E] bg-[#141C1A] px-2.5 py-1 rounded-md border border-[#4EAB9E]/30">
                  #{activeTag.name}
                </span>
              )
            )}
          </div>

          {/* Project Switcher Select & Edit Button */}
          <div className="flex items-center gap-2">
            {projects.length > 1 && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#8E867B] bg-[#121110] px-3 py-1.5 rounded-lg border border-[#2A2723]">
                <span className="text-[10px] uppercase">Cambiar:</span>
                <select
                  value={activeProject.id}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedTagId(null); // reset tag override to auto
                  }}
                  className="bg-transparent border-none text-[#F5F2EB] font-bold focus:outline-none cursor-pointer max-w-44 truncate"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#181715] text-[#F5F2EB]">
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Edit Project Button */}
            <button
              type="button"
              onClick={handleOpenEditProject}
              className="px-2.5 py-1.5 rounded-lg border border-[#2A2723] bg-[#121110] hover:bg-[#221D16] text-[#8E867B] hover:text-[#D99B43] text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
              title="Editar título, descripción o enlaces del proyecto"
            >
              <Edit2 className="h-3 w-3" />
              <span>Editar</span>
            </button>
          </div>
        </div>

        {/* Edit Project Inline Modal Dialog */}
        {isEditingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-[#D99B43]/40 bg-[#181715] p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-[#D99B43]" />
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5F2EB]">
                    Editar Proyecto
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProject(false)}
                  className="p-1 rounded text-[#8E867B] hover:text-[#DDD6C9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProjectEdit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#8E867B]">
                    Título del Proyecto:
                  </label>
                  <input
                    type="text"
                    required
                    value={projectEditTitle}
                    onChange={(e) => setProjectEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#8E867B]">
                    Descripción / Resumen:
                  </label>
                  <textarea
                    rows={2}
                    value={projectEditDescription}
                    onChange={(e) => setProjectEditDescription(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] resize-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#8E867B]">
                    Tech Stack (separado por comas):
                  </label>
                  <input
                    type="text"
                    value={projectEditTechStack}
                    onChange={(e) => setProjectEditTechStack(e.target.value)}
                    placeholder="Next.js 15, PostgreSQL, Tailwind..."
                    className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                  />
                </div>

                {/* Dynamic Smart Links Manager */}
                <div className="space-y-2 pt-2 border-t border-[#2A2723]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono text-[#8E867B] font-semibold">
                      🔗 Enlaces & Recursos (Autoclasificación):
                    </label>
                    <button
                      type="button"
                      onClick={() => setProjectEditUrls((prev) => [...prev, ""])}
                      className="text-[11px] font-mono text-[#D99B43] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>+ Agregar link</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {projectEditUrls.map((url, idx) => {
                      const classification = url.trim() ? classifyUrl(url) : null;
                      return (
                        <div key={idx} className="space-y-1 bg-[#121110] p-2 rounded-lg border border-[#2A2723]">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={url}
                              onChange={(e) => {
                                const updated = [...projectEditUrls];
                                updated[idx] = e.target.value;
                                setProjectEditUrls(updated);
                              }}
                              placeholder="https://github.com/..., https://strata.us, https://figma.com/..."
                              className="flex-1 rounded-md border border-[#2A2723] bg-[#181715] px-2.5 py-1.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43] font-mono"
                            />
                            {projectEditUrls.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setProjectEditUrls(projectEditUrls.filter((_, i) => i !== idx))}
                                className="p-1 text-[#8E867B] hover:text-[#E05D52] transition-colors cursor-pointer"
                                title="Eliminar enlace"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Live Auto-Classification Pill */}
                          {classification && classification.url && (
                            <div className="flex items-center gap-2 pt-0.5">
                              <span className="text-[10px] text-[#8E867B] font-mono">Origen detectado:</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${classification.badgeStyle}`}>
                                {classification.label}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2723]">
                  <button
                    type="button"
                    onClick={() => setIsEditingProject(false)}
                    className="px-3.5 py-2 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!projectEditTitle.trim() || isPending}
                    className="px-5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs font-mono cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Row 2: Big Project Title & Description */}
        <div className="space-y-1">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F5F2EB] tracking-tight leading-snug">
            {activeProject.title}
          </h2>
          {activeProject.description && (
            <p className="text-xs sm:text-sm text-[#8E867B] font-mono leading-relaxed max-w-3xl">
              {activeProject.description}
            </p>
          )}
        </div>

        {/* Row 3: Dedicated Full-Width Segmented Tab Navigation Bar */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#121110] border border-[#2A2723] font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`py-2.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "tasks"
                ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#181715]"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Tareas</span>
            <span
              className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "tasks"
                  ? "bg-[#D99B43] text-[#121110]"
                  : "bg-[#181715] text-[#8E867B]"
              }`}
            >
              {pendingTasksCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`py-2.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "notes"
                ? "bg-[#141C1A] text-[#4EAB9E] border border-[#4EAB9E]/30 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#181715]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Notas</span>
            <span
              className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "notes"
                  ? "bg-[#4EAB9E] text-[#121110]"
                  : "bg-[#181715] text-[#8E867B]"
              }`}
            >
              {projectNotes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`py-2.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "resources"
                ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#181715]"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Recursos & Stack</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB CONTENT                                                            */}
      {/* ========================================================================= */}

      {/* TAB 1: TAREAS DEL PROYECTO */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Quick Add Task Input */}
          <form onSubmit={handleQuickAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={`+ Añadir tarea a ${activeProject.title} ${activeTag ? `(#${activeTag.name})` : ""}...`}
              className="flex-1 rounded-xl border border-[#2A2723] bg-[#121110] px-4 py-2.5 text-xs sm:text-sm text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none font-sans"
            />
            <button
              type="submit"
              disabled={!newTaskText.trim() || isPending}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] disabled:opacity-50 text-[#121110] font-bold text-xs sm:text-sm font-mono transition-all cursor-pointer shrink-0 shadow-xs"
            >
              + Agregar
            </button>
          </form>

          {/* Filtered Tasks List */}
          <div className="space-y-2 max-h-105 overflow-y-auto pr-1">
            {projectTasks.length > 0 ? (
              projectTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer group select-none ${
                    task.completed
                      ? "bg-[#141813] border-[#7EA35A]/30 text-[#8E867B]"
                      : "bg-[#121110] border-[#2A2723] hover:border-[#D99B43]/50 text-[#F5F2EB]"
                  }`}
                >
                  <div
                    onClick={() => handleToggleTask(task)}
                    className="flex items-center gap-3.5 flex-1 min-w-0 pr-3"
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        task.completed
                          ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110] font-bold"
                          : "border-[#38332D] bg-[#181715] group-hover:border-[#D99B43]"
                      }`}
                    >
                      {task.completed && <Check className="h-3.5 w-3.5 stroke-3" />}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <span
                        className={`text-xs sm:text-sm truncate block font-medium ${
                          task.completed
                            ? "line-through text-[#8E867B]"
                            : "text-[#F5F2EB]"
                        }`}
                      >
                        {task.text}
                      </span>
                      {task.notes && (
                        <span className="text-[11px] text-[#8E867B] truncate block line-clamp-1">
                          {task.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Open Detail Drawer Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTaskForDrawer(task)}
                    className="px-2.5 py-1 rounded-lg text-[#8E867B] hover:text-[#D99B43] bg-[#181715] border border-[#2A2723] hover:border-[#D99B43]/40 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5 shrink-0"
                    title="Ver notas y subtareas de esta tarea"
                  >
                    {task.checklist && task.checklist.length > 0 && (
                      <span className="text-[10px] text-[#D99B43] bg-[#221D16] px-1.5 py-0.2 rounded border border-[#D99B43]/30">
                        {task.checklist.filter((c) => c.completed).length}/
                        {task.checklist.length}
                      </span>
                    )}
                    <span>Detalles ➔</span>
                  </button>
                </div>
              ))
            ) : (
              /* Beautiful Precise Empty State */
              <div className="rounded-xl border border-dashed border-[#2A2723] bg-[#121110] p-8 text-center space-y-2">
                <ListTodo className="h-8 w-8 text-[#8E867B] mx-auto opacity-70" />
                <h4 className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                  Sin tareas asignadas a {activeProject.title}
                </h4>
                <p className="text-xs text-[#8E867B] font-mono max-w-md mx-auto">
                  {activeTag
                    ? `No hay tareas con la etiqueta #${activeTag.name}. Escribe una tarea arriba para crearla automáticamente.`
                    : "No hay tareas con el nombre de este proyecto. Vincula una etiqueta arriba o escribe una nueva tarea."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NOTAS CONTEXTUALES */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Header Bar & New Note Button */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#2A2723]">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setNoteCategoryFilter("all")}
                className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  noteCategoryFilter === "all"
                    ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/40 font-bold"
                    : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                }`}
              >
                Todas ({projectNotes.length})
              </button>
              {(Object.keys(CATEGORY_META) as NoteCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNoteCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                    noteCategoryFilter === cat
                      ? `${CATEGORY_META[cat].color} font-bold shadow-xs`
                      : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <span>{CATEGORY_META[cat].icon}</span>
                  <span>{CATEGORY_META[cat].label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingNote(!isCreatingNote)}
              className="px-3.5 py-1.5 rounded-lg bg-[#4EAB9E] hover:bg-[#5BBDAF] text-[#121110] font-bold text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isCreatingNote ? "Cerrar" : "Nueva Nota"}</span>
            </button>
          </div>

          {/* New Note Form */}
          {isCreatingNote && (
            <form
              onSubmit={handleSaveNote}
              className="rounded-xl border border-[#4EAB9E]/35 bg-[#121110] p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95 duration-150"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Título de la nota..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="rounded-lg border border-[#2A2723] bg-[#181715] px-3.5 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none"
                  autoFocus
                />

                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value as NoteCategory)}
                  className="rounded-lg border border-[#2A2723] bg-[#181715] px-3.5 py-2 text-xs text-[#F5F2EB] focus:border-[#4EAB9E] focus:outline-none font-mono"
                >
                  <option value="idea">💡 Idea</option>
                  <option value="decision">⚖️ Decisión de Arquitectura</option>
                  <option value="technical">⚙️ Nota Técnica</option>
                  <option value="meeting">👥 Reunión / Feedback</option>
                  <option value="log">📋 Log de Sesión</option>
                </select>
              </div>

              {/* Task Linker Dropdown */}
              {projectTasks.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#8E867B]">
                  <span>Vincular a Tarea:</span>
                  <select
                    value={newNoteTaskId}
                    onChange={(e) => setNewNoteTaskId(e.target.value)}
                    className="flex-1 rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-1.5 text-xs text-[#F5F2EB] focus:border-[#4EAB9E] focus:outline-none font-mono truncate"
                  >
                    <option value="">-- General del Proyecto (Sin tarea específica) --</option>
                    {projectTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.text}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <textarea
                rows={4}
                placeholder="Escribe el contenido en markdown o texto plano..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#181715] p-3 text-xs sm:text-sm text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#4EAB9E] focus:outline-none resize-none font-sans leading-relaxed"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNote(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#2A2723] text-xs font-mono text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newNoteTitle.trim() || !newNoteContent.trim() || isPending}
                  className="px-5 py-2 rounded-lg bg-[#4EAB9E] hover:bg-[#5BBDAF] text-[#121110] font-bold text-xs font-mono cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  Guardar Nota
                </button>
              </div>
            </form>
          )}

          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-105 overflow-y-auto pr-1">
            {filteredProjectNotes.length > 0 ? (
              filteredProjectNotes.map((note) => {
                const meta = CATEGORY_META[note.category] || CATEGORY_META.idea;
                const linkedTask = tasks.find((t) => t.id === note.taskId);

                return (
                  <div
                    key={note.id}
                    className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-2 flex flex-col justify-between hover:border-[#4EAB9E]/40 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${meta.color}`}
                        >
                          {meta.icon} {meta.label}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-[#8E867B] hover:text-[#E05D52] p-1 rounded transition-colors cursor-pointer"
                          title="Eliminar nota"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB]">
                        {note.title}
                      </h4>

                      {linkedTask && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D99B43] bg-[#221D16] px-2 py-0.5 rounded border border-[#D99B43]/30 truncate max-w-full">
                          ⚡ {linkedTask.text}
                        </span>
                      )}

                      <p className="text-xs text-[#8E867B] whitespace-pre-wrap line-clamp-4 leading-relaxed font-sans">
                        {note.content}
                      </p>
                    </div>

                    <span className="font-mono text-[9px] text-[#8E867B] opacity-60">
                      {new Date(note.updatedAt).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-[#2A2723] p-8 text-center text-xs text-[#8E867B] font-mono">
                No hay notas en este proyecto. ¡Crea una con el botón &quot;+ Nueva Nota&quot;!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RECURSOS Y ENLACES */}
      {activeTab === "resources" && (
        <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-5 space-y-4">
          <div>
            <h4 className="font-serif text-sm font-bold text-[#F5F2EB] mb-2.5">
              Enlaces Directos & Repositorios
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(() => {
                const classifiedLinks = extractAndClassifyLinks(
                  activeProject.repoUrl,
                  activeProject.liveUrl
                );

                if (classifiedLinks.length === 0) {
                  return (
                    <div className="col-span-full p-4 rounded-xl border border-dashed border-[#2A2723] bg-[#181715] text-center text-xs font-mono text-[#8E867B]">
                      Sin enlaces ni repositorios vinculados. ¡Agrégalos con el botón &quot;Editar&quot;!
                    </div>
                  );
                }

                return classifiedLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all hover:scale-101 ${link.badgeStyle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {link.category === "git" ? (
                        <FolderGit2 className="h-4 w-4 shrink-0 text-[#DDD6C9]" />
                      ) : (
                        <Globe className="h-4 w-4 shrink-0 text-[#4EAB9E]" />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold font-mono">{link.label}</div>
                        <div className="text-[10px] text-[#8E867B] font-mono truncate opacity-80">
                          {link.url}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 ml-2" />
                  </a>
                ));
              })()}
            </div>
          </div>

          {activeProject.techStack && activeProject.techStack.length > 0 && (
            <div className="pt-3 border-t border-[#2A2723]">
              <span className="text-[11px] font-mono text-[#8E867B] block mb-2">
                Stack Tecnológico:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {activeProject.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-xs text-[#DDD6C9] bg-[#181715] px-2.5 py-1 rounded-md border border-[#2A2723]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={activeTaskForDrawer}
        projectId={activeProject.id}
        projectNotes={projectNotes}
        isOpen={Boolean(activeTaskForDrawer)}
        onClose={() => setActiveTaskForDrawer(null)}
        onRefreshData={onRefreshData}
      />
    </div>
  );
}
