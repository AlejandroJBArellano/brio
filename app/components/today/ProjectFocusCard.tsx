"use client";

import {
  deleteContextualNoteAction,
  saveContextualNoteAction,
} from "@/app/actions/notes";
import { syncProjectFromNotionAction } from "@/app/actions/projectIntegrations";
import { toggleTaskAction } from "@/app/actions/tasks";
import { NoteContentRenderer } from "@/app/components/notes/NoteContentRenderer";
import { getProjectKeywords } from "@/lib/projectMatcher";
import { soundFx } from "@/lib/soundFx";
import { parseTaskMetadata } from "@/lib/taskMetadata";
import {
  ContextualNote,
  HabiticaTag,
  HabiticaTask,
  NoteCategory,
  ProjectItem,
} from "@/lib/types";
import { extractAndClassifyLinks } from "@/lib/urlClassifier";
import { parseTaskPrefix } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cpu,
  ExternalLink,
  FileText,
  FolderGit2,
  Globe,
  Layers,
  Lightbulb,
  ListTodo,
  Loader2,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Tag,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { TaskDetailDrawer } from "./TaskDetailDrawer";

interface ProjectFocusCardProps {
  projects: ProjectItem[];
  tasks: HabiticaTask[];
  tags?: HabiticaTag[];
  contextualNotes: ContextualNote[];
  onRefreshData?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CATEGORY_META: Record<
  NoteCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  idea: { label: "Idea", icon: <Lightbulb className="h-3 w-3" />, color: "text-[#D99B43] bg-[#221D16] border-[#D99B43]/30" },
  decision: { label: "Decisión", icon: <Scale className="h-3 w-3" />, color: "text-[#7EA35A] bg-[#141813] border-[#7EA35A]/30" },
  technical: { label: "Técnico", icon: <Cpu className="h-3 w-3" />, color: "text-[#4EAB9E] bg-[#141C1A] border-[#4EAB9E]/30" },
  meeting: { label: "Reunión", icon: <Users className="h-3 w-3" />, color: "text-[#B388FF] bg-[#1E1627] border-[#B388FF]/30" },
  log: { label: "Log de Sesión", icon: <FileText className="h-3 w-3" />, color: "text-[#8E867B] bg-[#181715] border-[#2A2723]" },
};

function getFirstParagraphPreview(markdown: string): string {
  if (!markdown) return "";
  const lines = markdown.split(/\r?\n/);
  const textLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (textLines.length > 0) break;
      continue;
    }
    // Skip headings, horizontal rules, markdown tables, code fences
    if (
      line.startsWith("#") ||
      line.startsWith("---") ||
      line.startsWith("===") ||
      line.startsWith("|") ||
      line.startsWith("```")
    ) {
      continue;
    }

    // Clean bullets, numbering and markdown formatting
    const cleanLine = line
      .replace(/^[\*\-\+\>]+\s*/, "")
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();

    if (cleanLine) {
      textLines.push(cleanLine);
    }
  }

  if (textLines.length === 0) {
    const fallback = lines.find((l) => l.trim().length > 0) || "";
    return fallback
      .replace(/^[#\*\-\+\>\|\s]+/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .trim();
  }

  return textLines.join(" ");
}

export function ProjectFocusCard({
  projects,
  tasks,
  tags = [],
  contextualNotes,
  onRefreshData,
  isFocusMode = false,
  onToggleFocusMode,
  isCollapsed = false,
  onToggleCollapse,
}: ProjectFocusCardProps) {
  const [isPending, startTransition] = useTransition();

  // Proyectos activos para la vista de Hoy (in_progress y permanent)
  const activeProjects = useMemo(() => {
    const activeOnly = projects.filter(
      (p) => p.status === "in_progress" || p.status === "permanent"
    );
    const list = activeOnly.length > 0 ? activeOnly : projects;

    const todoTasks = tasks.filter((t) => t.type === "todo");

    return list
      .map((p) => {
        const { prefixes } = getProjectKeywords(p);
        const pendingCount = todoTasks.filter((t) => {
          const { prefix } = parseTaskPrefix(t.text || "");
          const prefixLower = prefix?.toLowerCase() || "";
          const textLower = (t.text || "").toLowerCase();
          const notesLower = (t.notes || "").toLowerCase();
          for (const pre of prefixes) {
            if (prefixLower.includes(pre)) return true;
            if (textLower.includes(`[${pre}]`) || textLower.includes(pre)) return true;
            if (notesLower.includes(`[${pre}]`)) return true;
          }
          return false;
        }).filter((t) => !t.completed).length;

        return {
          ...p,
          pendingTasksCount: pendingCount,
        };
      })
      .sort((a, b) => {
        // Proyectos con tareas pendientes primero
        if (b.pendingTasksCount !== a.pendingTasksCount) {
          return b.pendingTasksCount - a.pendingTasksCount;
        }
        if (a.status === "in_progress" && b.status !== "in_progress") return -1;
        if (b.status === "in_progress" && a.status !== "in_progress") return 1;
        return 0;
      });
  }, [projects, tasks]);

  // Active Project Selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjects.length > 0) return activeProjects[0].id;
    return projects.length > 0 ? projects[0].id : "default_project";
  });

  const activeProject = useMemo(() => {
    return (
      activeProjects.find((p) => p.id === selectedProjectId) ||
      projects.find((p) => p.id === selectedProjectId) ||
      activeProjects[0] ||
      projects[0] || {
        id: "default_project",
        title: "Brio OS",
        description: "",
        status: "in_progress",
        techStack: ["Next.js 15", "PostgreSQL", "Tailwind", "Habitica"],
        repoUrl: "https://github.com/alejandro/brio",
        progress: 0,
      }
    );
  }, [activeProjects, projects, selectedProjectId]);

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


  // Contextual Note Creation Form State
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] =
    useState<NoteCategory>("technical");
  const [newNoteTaskId, setNewNoteTaskId] = useState<string>("");
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>("all");
  const [expandedNote, setExpandedNote] = useState<ContextualNote | null>(null);

  useEffect(() => {
    if (!expandedNote) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedNote(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedNote]);

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

    // 3. Strategy B: Filter by project canonical prefixes and keywords
    const { prefixes } = getProjectKeywords(activeProject);
    return todoTasks.filter((t) => {
      const { prefix } = parseTaskPrefix(t.text || "");
      const prefixLower = prefix?.toLowerCase() || "";
      const textLower = (t.text || "").toLowerCase();
      const notesLower = (t.notes || "").toLowerCase();

      for (const p of prefixes) {
        if (prefixLower.includes(p)) return true;
        if (textLower.includes(`[${p}]`) || textLower.includes(p)) return true;
        if (notesLower.includes(`[${p}]`)) return true;
      }
      return false;
    });
  }, [tasks, activeTag, activeProject]);

  // Priority & Search Filters for Tasks
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  const priorityCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    projectTasks.forEach((t) => {
      const prio = t.priority ?? 1.5;
      if (prio >= 2) high++;
      else if (prio <= 1) low++;
      else medium++;
    });
    return { all: projectTasks.length, high, medium, low };
  }, [projectTasks]);

  const filteredProjectTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      const prio = t.priority ?? 1.5;
      if (priorityFilter === "high" && prio < 2) return false;
      if (priorityFilter === "medium" && (prio < 1.1 || prio >= 2)) return false;
      if (priorityFilter === "low" && prio > 1) return false;

      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        const matchTitle = t.text.toLowerCase().includes(q);
        const matchNotes = (t.notes || "").toLowerCase().includes(q);
        if (!matchTitle && !matchNotes) return false;
      }
      return true;
    });
  }, [projectTasks, priorityFilter, taskSearchQuery]);

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

  // Loading state for completing a task
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  // Notion On-Demand Sync State
  const [isSyncingNotion, setIsSyncingNotion] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncNotion = async () => {
    if (isSyncingNotion) return;
    soundFx.click();
    setIsSyncingNotion(true);
    setSyncFeedback(null);
    try {
      const res = await syncProjectFromNotionAction(activeProject.id);
      if (res.success) {
        soundFx.taskComplete();
        const count = res.createdCount ?? 0;
        const msg =
          count > 0
            ? `${count} tareas nuevas`
            : `Al día (${res.skippedCount ?? 0} existentes)`;
        setSyncFeedback(msg);
        if (onRefreshData) onRefreshData();
      } else {
        soundFx.click();
        setSyncFeedback(res.error || "Error");
      }
    } catch {
      soundFx.click();
      setSyncFeedback("Error de red");
    } finally {
      setIsSyncingNotion(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Handlers
  const handleToggleTask = (task: HabiticaTask) => {
    if (loadingTaskId === task.id) return;
    soundFx.taskComplete();
    setLoadingTaskId(task.id);
    startTransition(async () => {
      try {
        await toggleTaskAction(task.id, "up");
        if (onRefreshData) onRefreshData();
      } finally {
        setLoadingTaskId(null);
      }
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

  const pendingTasksCount = projectTasks.filter((t) => !t.completed).length;

  // Render Mini / Collapsed Card if requested
  if (isCollapsed) {
    return (
      <div className="rounded-2xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3 font-sans transition-all">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
            <FolderGit2 className="h-4 w-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB] truncate">
                {activeProject.title}
              </h3>
              {activeTag && (
                <span className="font-mono text-[10px] text-[#4EAB9E] bg-[#141C1A] px-2 py-0.5 rounded border border-[#4EAB9E]/30 hidden sm:inline">
                  #{activeTag.name}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8E867B] font-mono">
              {pendingTasksCount} tareas pendientes • {projectNotes.length} notas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${isFocusMode
                ? "bg-[#D99B43] text-[#121110] border-[#D99B43]"
                : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:text-[#D99B43]"
                }`}
              title="Modo Focus"
            >
              <Zap className="h-4 w-4" />
            </button>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="px-3 py-1.5 rounded-lg bg-[#121110] hover:bg-[#1C1A17] border border-[#2A2723] text-[#DDD6C9] hover:text-[#F5F2EB] font-mono text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <span>Expandir</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 bg-[#181715] p-5 sm:p-7 shadow-sm space-y-6 font-sans relative ${isFocusMode
        ? "border-[#D99B43]/50 ring-1 ring-[#D99B43]/20 shadow-lg"
        : "border-[#2A2723]"
        }`}
    >
      {/* ========================================================================= */}
      {/* 1. COMPACT UNIFIED HEADER                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-1">
        {/* Left: Project Selector / Title & Habitica Tag Badge */}
        <div className="flex items-center gap-2 min-w-0">
          {activeProjects.length > 1 ? (
            <div className="relative flex items-center min-w-0 group">
              <select
                value={activeProject.id}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedTagId(null); // reset tag override to auto
                }}
                className="font-serif text-lg sm:text-xl font-bold text-[#F5F2EB] tracking-tight bg-transparent border-none focus:outline-none cursor-pointer hover:text-[#D99B43] transition-colors appearance-none pr-5 truncate max-w-44 sm:max-w-64"
                title="Cambiar proyecto"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#181715] text-[#F5F2EB] font-sans text-xs">
                    {p.title} {p.pendingTasksCount > 0 ? `(${p.pendingTasksCount})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-[#8E867B] group-hover:text-[#D99B43] pointer-events-none absolute right-0 transition-colors" />
            </div>
          ) : (
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F5F2EB] tracking-tight truncate max-w-44 sm:max-w-64">
              {activeProject.title}
            </h2>
          )}

          {/* Habitica Tag Dropdown / Badge */}
          {tags.length > 0 ? (
            <div className="flex items-center gap-1 font-mono text-[10px] text-[#4EAB9E] bg-[#141C1A] px-2 py-0.5 rounded-md border border-[#4EAB9E]/30 shrink-0">
              <Tag className="h-2.5 w-2.5 shrink-0" />
              <select
                value={selectedTagId !== null ? selectedTagId : activeTag ? activeTag.id : "none"}
                onChange={(e) => setSelectedTagId(e.target.value)}
                className="bg-transparent border-none text-[#4EAB9E] font-bold focus:outline-none cursor-pointer pr-0.5 text-[10px]"
              >
                <option value="none" className="bg-[#181715] text-[#8E867B]">
                  Proyecto
                </option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#181715] text-[#4EAB9E]">
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            activeTag && (
              <span className="font-mono text-[10px] text-[#4EAB9E] bg-[#141C1A] px-2 py-0.5 rounded-md border border-[#4EAB9E]/30 shrink-0">
                #{activeTag.name}
              </span>
            )
          )}
        </div>

        {/* Center: Segmented Tabs (Tareas, Notas, Recursos) */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#121110] border border-[#2A2723] font-mono text-xs shrink-0 order-3 sm:order-2 w-full sm:w-auto justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`py-1 px-2.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "tasks"
              ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-2xs"
              : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tareas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "tasks"
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
            className={`py-1 px-2.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "notes"
              ? "bg-[#141C1A] text-[#4EAB9E] border border-[#4EAB9E]/30 shadow-2xs"
              : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "notes"
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
            className={`py-1 px-2.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "resources"
              ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30 shadow-2xs"
              : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Recursos</span>
          </button>
        </div>

        {/* Right: Actions (Notion Sync, Focus Toggle, Minimize) */}
        <div className="flex items-center gap-1.5 shrink-0 order-2 sm:order-3">
          {syncFeedback && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 truncate max-w-25 sm:max-w-none">
              {syncFeedback}
            </span>
          )}

          {/* Notion Discreet Sync Button */}
          {(activeProject.id === "prj-unpo" || activeProject.integrations?.notion?.enabled) && (
            <button
              type="button"
              onClick={handleSyncNotion}
              disabled={isSyncingNotion}
              className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 border shadow-2xs bg-[#121110] text-[#DDD6C9] hover:text-[#FFFFFF] border-[#2A2723] hover:border-[#B388FF]/50 disabled:opacity-50"
              title="Sincronizar Notion"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncingNotion ? "animate-spin text-[#D99B43]" : "text-[#B388FF]"
                  }`}
              />
              <span className="hidden xl:inline text-[11px]">
                {isSyncingNotion ? "Sincronizando..." : "Notion"}
              </span>
            </button>
          )}

          {/* Zen Focus Toggle Button */}
          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 border shadow-2xs ${isFocusMode
                ? "bg-[#D99B43] text-[#121110] border-[#D99B43] hover:bg-[#E8AF59]"
                : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border-[#2A2723] hover:border-[#D99B43]/50"
                }`}
              title={isFocusMode ? "Restaurar" : "Focus"}
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline text-[11px]">Restaurar</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-[#D99B43]" />
                  <span className="hidden xl:inline text-[11px]">Focus</span>
                </>
              )}
            </button>
          )}

          {/* Collapse / Minimize Card Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#DDD6C9] bg-[#121110] hover:bg-[#1C1A17] border border-[#2A2723] transition-colors cursor-pointer"
              title="Minimizar"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB CONTENT                                                            */}
      {/* ================================================      {/* TAB 1: TAREAS DEL PROYECTO */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Priority & Search Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2A2723]/60">
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
              <button
                type="button"
                onClick={() => setPriorityFilter("all")}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${priorityFilter === "all"
                  ? "bg-[#DDD6C9] text-[#121110] border-[#DDD6C9] font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
              >
                Todas ({priorityCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setPriorityFilter("high")}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${priorityFilter === "high"
                  ? "bg-[#251417] text-[#FF6369] border-[#E5484D] font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#FF6369]"
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6369]" />
                Alta ({priorityCounts.high})
              </button>

              <button
                type="button"
                onClick={() => setPriorityFilter("medium")}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${priorityFilter === "medium"
                  ? "bg-[#221D16] text-[#D99B43] border-[#D99B43] font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#D99B43]"
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D99B43]" />
                Media ({priorityCounts.medium})
              </button>

              <button
                type="button"
                onClick={() => setPriorityFilter("low")}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${priorityFilter === "low"
                  ? "bg-[#141813] text-[#7EA35A] border-[#7EA35A] font-bold"
                  : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#7EA35A]"
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#7EA35A]" />
                Baja ({priorityCounts.low})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="h-3 w-3 text-[#8E867B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="w-36 sm:w-48 pl-7 pr-2.5 py-1 rounded-lg text-xs bg-[#121110] border border-[#2A2723] text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Filtered Tasks List */}
          <div className="space-y-2.5 max-h-125 overflow-y-auto pr-1">
            {filteredProjectTasks.length > 0 ? (
              filteredProjectTasks.map((task) => {
                const meta = parseTaskMetadata(task);

                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskForDrawer(task)}
                    className={`group rounded-xl border p-3.5 sm:p-4 transition-all duration-150 flex flex-col gap-2.5 cursor-pointer select-none ${loadingTaskId === task.id ? "opacity-60 pointer-events-none" : ""
                      } ${task.completed
                        ? "bg-[#141813]/60 border-[#7EA35A]/25 text-[#8E867B]"
                        : "bg-[#121110] border-[#2A2723] hover:border-[#38332D] hover:bg-[#151412] text-[#F5F2EB]"
                      }`}
                  >
                    {/* Top Row: Checkbox, Title & Quick Edit Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTask(task);
                          }}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${loadingTaskId === task.id
                            ? "border-[#D99B43]/70 bg-[#1D1B18]"
                            : task.completed
                              ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                              : "border-[#38332D] bg-[#181715] hover:border-[#D99B43]"
                            }`}
                        >
                          {loadingTaskId === task.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-[#D99B43]" />
                          ) : task.completed ? (
                            <Check className="h-3.5 w-3.5 stroke-3" />
                          ) : null}
                        </button>

                        {/* Title */}
                        <div className="min-w-0 space-y-1">
                          <h4
                            className={`text-xs sm:text-sm font-medium leading-snug wrap-break-word ${task.completed
                              ? "line-through text-[#8E867B]"
                              : "text-[#F5F2EB] group-hover:text-[#FFFFFF]"
                              }`}
                          >
                            {task.text}
                          </h4>
                        </div>
                      </div>

                      {/* Right: Quick Edit / Details Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTaskForDrawer(task);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[#8E867B] group-hover:text-[#DDD6C9] bg-[#181715] border border-[#2A2723] group-hover:border-[#38332D] transition-colors text-xs font-mono flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Editar tarea, descripción y propiedades"
                      >
                        <Pencil className="h-3 w-3 text-[#D99B43]" />
                        <span className="hidden sm:inline">Editar</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Bottom Row: Rich Metadata Badges (No emojis) */}
                    <div className="flex flex-wrap items-center gap-1.5 pl-8 text-[10px] font-mono">
                      {/* Priority Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-1 ${meta.priorityColor.badge}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {meta.priorityLabel}
                      </span>

                      {/* Notion Status Badge */}
                      {meta.notionStatus && (
                        <span className="px-2 py-0.5 rounded-md border border-[#2A2723] bg-[#181715] text-[#C2BAAD] font-semibold">
                          {meta.notionStatus}
                        </span>
                      )}

                      {/* Notion Category Badge */}
                      {meta.notionCategory && (
                        <span className="px-2 py-0.5 rounded-md border border-[#4EAB9E]/30 bg-[#141C1A] text-[#4EAB9E]">
                          {meta.notionCategory}
                        </span>
                      )}

                      {/* Notion Hours */}
                      {meta.notionHours && (
                        <span className="px-2 py-0.5 rounded-md border border-[#2A2723] bg-[#181715] text-[#8E867B]">
                          {meta.notionHours}
                        </span>
                      )}

                      {/* Notion Ticket ID */}
                      {meta.notionTicketId && (
                        <span className="px-2 py-0.5 rounded-md border border-[#2A2723] bg-[#181715] text-[#8E867B]">
                          #{meta.notionTicketId}
                        </span>
                      )}

                      {/* Checklist Progress Pill */}
                      {task.checklist && task.checklist.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md border border-[#D99B43]/30 bg-[#221D16] text-[#D99B43] flex items-center gap-1">
                          <ListTodo className="h-3 w-3" />
                          <span>
                            {task.checklist.filter((c) => c.completed).length}/
                            {task.checklist.length}
                          </span>
                        </span>
                      )}

                      {/* Direct Notion Link */}
                      {meta.notionUrl && (
                        <a
                          href={meta.notionUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-0.5 rounded-md border border-[#2A2723] hover:border-[#B388FF]/50 bg-[#181715] text-[#DDD6C9] hover:text-[#FFFFFF] flex items-center gap-1 transition-colors"
                          title="Abrir en Notion"
                        >
                          <ExternalLink className="h-3 w-3 text-[#B388FF]" />
                          <span>Notion</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-[#2A2723] bg-[#121110] p-8 text-center space-y-2">
                <ListTodo className="h-8 w-8 text-[#8E867B] mx-auto opacity-70" />
                <h4 className="font-serif text-sm sm:text-base font-bold text-[#F5F2EB]">
                  Sin tareas en este filtro
                </h4>
                <p className="text-xs text-[#8E867B] font-mono max-w-md mx-auto">
                  {taskSearchQuery.trim()
                    ? `No hay tareas que coincidan con "${taskSearchQuery}".`
                    : `No hay tareas con prioridad "${priorityFilter}".`}
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
                className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${noteCategoryFilter === "all"
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
                  className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${noteCategoryFilter === cat
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
                  <option value="idea">Idea</option>
                  <option value="decision">Decisión de Arquitectura</option>
                  <option value="technical">Nota Técnica</option>
                  <option value="meeting">Reunión / Feedback</option>
                  <option value="log">Log de Sesión</option>
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
                    onClick={() => {
                      soundFx.click();
                      setExpandedNote(note);
                    }}
                    className="rounded-xl border border-[#2A2723] bg-[#121110] p-3.5 space-y-2 flex flex-col justify-between hover:border-[#4EAB9E]/60 hover:bg-[#161513] transition-all cursor-pointer group shadow-xs select-none"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${meta.color}`}
                        >
                          {meta.icon}
                          <span>{meta.label}</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="text-[#8E867B] hover:text-[#E05D52] p-1 rounded transition-colors cursor-pointer"
                          title="Eliminar nota"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB] group-hover:text-[#4EAB9E] transition-colors line-clamp-1">
                        {note.title}
                      </h4>

                      {linkedTask && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D99B43] bg-[#221D16] px-2 py-0.5 rounded border border-[#D99B43]/30 truncate max-w-full">
                          <ListTodo className="h-3 w-3 shrink-0 text-[#D99B43]" />
                          <span className="truncate">{linkedTask.text}</span>
                        </span>
                      )}

                      <p className="text-xs text-[#8E867B] font-sans leading-relaxed line-clamp-2 group-hover:text-[#DDD6C9] transition-colors">
                        {getFirstParagraphPreview(note.content)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-[#2A2723]/50 text-[9px] font-mono text-[#8E867B]">
                      <span>
                        {new Date(note.updatedAt).toLocaleDateString("es-MX", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[#4EAB9E] opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 font-mono">
                        <span>Ver completa</span>
                        <Maximize2 className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-[#2A2723] p-8 text-center text-xs text-[#8E867B] font-mono">
                No hay notas en este proyecto.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RECURSOS Y ENLACES */}
      {activeTab === "resources" && (
        <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(() => {
              const classifiedLinks = extractAndClassifyLinks(
                activeProject.repoUrl,
                activeProject.liveUrl
              );

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
      )}

      {/* Expanded Note Modal */}
      {expandedNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setExpandedNote(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#141311] border border-[#2A2723] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-[#2A2723] bg-[#181715]/90">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const meta =
                      CATEGORY_META[expandedNote.category] || CATEGORY_META.idea;
                    return (
                      <span
                        className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded border inline-flex items-center gap-1.5 ${meta.color}`}
                      >
                        {meta.icon}
                        <span>{meta.label}</span>
                      </span>
                    );
                  })()}

                  {(() => {
                    const linkedTask = tasks.find(
                      (t) => t.id === expandedNote.taskId
                    );
                    if (!linkedTask) return null;
                    return (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#D99B43] bg-[#221D16] px-2.5 py-0.5 rounded border border-[#D99B43]/30 truncate max-w-xs">
                        <ListTodo className="h-3 w-3 shrink-0" />
                        <span className="truncate">{linkedTask.text}</span>
                      </span>
                    );
                  })()}

                  <span className="font-mono text-[10px] text-[#8E867B]">
                    {new Date(expandedNote.updatedAt).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F5F2EB] leading-snug">
                  {expandedNote.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setExpandedNote(null)}
                className="p-1.5 rounded-lg border border-[#2A2723] text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer shrink-0"
                title="Cerrar (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable full markdown */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 font-sans text-[#DDD6C9]">
              <NoteContentRenderer content={expandedNote.content} />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 p-4 sm:px-6 border-t border-[#2A2723] bg-[#181715]/60 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  const noteIdToDelete = expandedNote.id;
                  setExpandedNote(null);
                  handleDeleteNote(noteIdToDelete);
                }}
                className="text-[#8E867B] hover:text-[#E05D52] transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded hover:bg-[#E05D52]/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </button>

              <button
                type="button"
                onClick={() => setExpandedNote(null)}
                className="px-4 py-1.5 rounded-lg bg-[#2A2723] hover:bg-[#38332D] text-[#F5F2EB] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
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
