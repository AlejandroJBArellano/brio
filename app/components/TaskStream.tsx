"use client";

import { deleteTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
import {
  getTaskPriorityInfo,
  getTaskValueColor,
  parseTaskPrefix,
} from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Flame,
  Folder,
  FolderOpen,
  Hash,
  Kanban,
  Layers,
  ListTodo,
  Minus,
  Plus,
  Search,
  Sparkles,
  Table,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { TaskItem } from "./TaskItem";

export type SortField = "text" | "priority" | "value" | "date" | "type";
export type SortDirection = "asc" | "desc";

function sortTasks(
  taskList: HabiticaTask[],
  sortField: SortField | null,
  sortDirection: SortDirection | null
): HabiticaTask[] {
  if (!sortField || !sortDirection) {
    return taskList;
  }

  return [...taskList].sort((a, b) => {
    // Keep completed tasks always at the bottom
    const aCompleted = Boolean(a.completed);
    const bCompleted = Boolean(b.completed);
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }

    let comparison = 0;

    switch (sortField) {
      case "text": {
        const titleA = parseTaskPrefix(a.text).cleanTitle.toLowerCase().trim();
        const titleB = parseTaskPrefix(b.text).cleanTitle.toLowerCase().trim();
        comparison = titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: "base" });
        break;
      }
      case "priority": {
        const prioA = a.priority ?? 1;
        const prioB = b.priority ?? 1;
        comparison = prioA - prioB;
        break;
      }
      case "value": {
        const valA = a.value ?? 0;
        const valB = b.value ?? 0;
        comparison = valA - valB;
        break;
      }
      case "date": {
        const timeA = a.date ? new Date(a.date).getTime() : (a.type === "daily" ? (a.streak || 0) : null);
        const timeB = b.date ? new Date(b.date).getTime() : (b.type === "daily" ? (b.streak || 0) : null);

        if (timeA === null && timeB === null) {
          comparison = 0;
        } else if (timeA === null) {
          return 1;
        } else if (timeB === null) {
          return -1;
        } else {
          comparison = timeA - timeB;
        }
        break;
      }
      case "type": {
        const typeOrder: Record<string, number> = { daily: 1, todo: 2, habit: 3 };
        const orderA = typeOrder[a.type] ?? 99;
        const orderB = typeOrder[b.type] ?? 99;
        comparison = orderA - orderB;
        break;
      }
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

interface TaskStreamProps {
  tasks: HabiticaTask[];
  tags?: HabiticaTag[];
  selectedTaskId: string | null;
  onSelectTask: (task: HabiticaTask | null) => void;
  activeTab: "all" | "dailies" | "todos" | "habits";
  onTabChange: (tab: "all" | "dailies" | "todos" | "habits") => void;
  activeTagFilter: string | null;
  onClearTagFilter: () => void;
}

export function TaskStream({
  tasks,
  tags = [],
  selectedTaskId,
  onSelectTask,
  activeTab,
  onTabChange,
  activeTagFilter,
  onClearTagFilter,
}: TaskStreamProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<"grouped" | "board" | "table">("grouped");
  const [selectedProjectChip, setSelectedProjectChip] = useState<string | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);
  const [_isPending, startTransition] = useTransition();

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      // 1st click: intelligent initial direction
      const initialDir: SortDirection = field === "priority" ? "desc" : "asc";
      setSortField(field);
      setSortDirection(initialDir);
    } else if (sortDirection === (field === "priority" ? "desc" : "asc")) {
      // 2nd click: invert direction
      setSortDirection(field === "priority" ? "asc" : "desc");
    } else {
      // 3rd click: reset to original order
      setSortField(null);
      setSortDirection(null);
    }
  };

  const tagsMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (tags) {
      for (const t of tags) {
        map[t.id] = t.name;
      }
    }
    return map;
  }, [tags]);

  const dailies = useMemo(
    () => tasks.filter((t) => t.type === "daily"),
    [tasks]
  );
  const todos = useMemo(
    () => tasks.filter((t) => t.type === "todo"),
    [tasks]
  );
  const habits = useMemo(
    () => tasks.filter((t) => t.type === "habit"),
    [tasks]
  );

  const completedDailiesCount = useMemo(
    () => dailies.filter((d) => d.completed || !d.isDue).length,
    [dailies]
  );

  // Available unique project prefixes from todos
  const projectList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of todos) {
      const { prefix } = parseTaskPrefix(t.text);
      const key = prefix || "General";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [todos]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "dailies" && task.type !== "daily") return false;
      if (activeTab === "todos" && task.type !== "todo") return false;
      if (activeTab === "habits" && task.type !== "habit") return false;

      // Project chip filter (for todos / general)
      if (selectedProjectChip && task.type === "todo") {
        const { prefix } = parseTaskPrefix(task.text);
        const itemProj = prefix || "General";
        if (itemProj !== selectedProjectChip) return false;
      }

      // Tag filter
      if (activeTagFilter) {
        const filterLower = activeTagFilter.toLowerCase();
        const matchesActiveTag = task.tags?.some((tagId) => {
          const tagName = tagsMap[tagId] || tagId;
          return (
            tagId.toLowerCase() === filterLower ||
            tagName.toLowerCase() === filterLower
          );
        });
        if (!matchesActiveTag) return false;
      }

      // Hide completed dailies/todos
      if (hideCompleted && task.type === "daily" && (task.completed || !task.isDue)) {
        return false;
      }
      if (hideCompleted && task.type === "todo" && task.completed) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = task.text.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        const matchesTags = task.tags?.some((tagId) => {
          const tagName = tagsMap[tagId] || tagId;
          return (
            tagId.toLowerCase().includes(query) ||
            tagName.toLowerCase().includes(query)
          );
        });
        return matchesText || matchesNotes || matchesTags;
      }

      return true;
    });
  }, [
    tasks,
    tagsMap,
    activeTab,
    selectedProjectChip,
    activeTagFilter,
    hideCompleted,
    searchQuery,
  ]);

  // Split filtered tasks for grouped view
  const filteredDailies = useMemo(
    () => filteredTasks.filter((t) => t.type === "daily"),
    [filteredTasks]
  );
  const filteredTodos = useMemo(
    () => filteredTasks.filter((t) => t.type === "todo"),
    [filteredTasks]
  );
  const filteredHabits = useMemo(
    () => filteredTasks.filter((t) => t.type === "habit"),
    [filteredTasks]
  );

  const sortedFilteredTasks = useMemo(
    () => sortTasks(filteredTasks, sortField, sortDirection),
    [filteredTasks, sortField, sortDirection]
  );

  const sortedDailies = useMemo(
    () => sortTasks(filteredDailies, sortField, sortDirection),
    [filteredDailies, sortField, sortDirection]
  );

  const sortedHabits = useMemo(
    () => sortTasks(filteredHabits, sortField, sortDirection),
    [filteredHabits, sortField, sortDirection]
  );

  // Group To-Dos by Project for project accordion folders
  const todosByProject = useMemo(() => {
    const groups: Record<string, HabiticaTask[]> = {};
    for (const t of filteredTodos) {
      const { prefix } = parseTaskPrefix(t.text);
      const key = prefix || "General / Sin Proyecto";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    if (sortField && sortDirection) {
      for (const key of Object.keys(groups)) {
        groups[key] = sortTasks(groups[key], sortField, sortDirection);
      }
    }
    return groups;
  }, [filteredTodos, sortField, sortDirection]);

  const toggleProjectCollapse = (projectName: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };

  // Active task list for keyboard navigation matching visual order
  const activeTaskList = useMemo(() => {
    if (viewMode === "table") {
      return sortedFilteredTasks;
    }
    if (viewMode === "grouped") {
      const list: HabiticaTask[] = [];
      if (activeTab !== "habits" && activeTab !== "todos") {
        list.push(...sortedDailies);
      }
      if (activeTab !== "dailies" && activeTab !== "habits") {
        for (const projTasks of Object.values(todosByProject)) {
          list.push(...projTasks);
        }
      }
      if (activeTab !== "dailies" && activeTab !== "todos") {
        list.push(...sortedHabits);
      }
      return list;
    }
    return filteredTasks;
  }, [
    viewMode,
    sortedFilteredTasks,
    sortedDailies,
    todosByProject,
    sortedHabits,
    filteredTasks,
    activeTab,
  ]);

  // Derived selected index from selectedTaskId
  const selectedIndex = selectedTaskId
    ? Math.max(0, activeTaskList.findIndex((t) => t.id === selectedTaskId))
    : -1;

  // Vim-style keyboard navigation: j/k, Space/x, +/-, Enter, d, v (toggle mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement;

      if (isInputActive) return;

      if (e.key === "v" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setViewMode((prev) => {
          if (prev === "grouped") return "board";
          if (prev === "board") return "table";
          return "grouped";
        });
        return;
      }

      if (activeTaskList.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const next =
          selectedIndex < activeTaskList.length - 1 ? selectedIndex + 1 : 0;
        onSelectTask(activeTaskList[next] || null);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const next =
          selectedIndex > 0 ? selectedIndex - 1 : activeTaskList.length - 1;
        onSelectTask(activeTaskList[next] || null);
      } else if (e.key === " " || e.key === "x") {
        e.preventDefault();
        const curTask = activeTaskList[selectedIndex];
        if (curTask) {
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "up");
          });
        }
      } else if (e.key === "+" || e.key === "=") {
        const curTask = activeTaskList[selectedIndex];
        if (curTask && curTask.type === "habit") {
          e.preventDefault();
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "up");
          });
        }
      } else if (e.key === "-") {
        const curTask = activeTaskList[selectedIndex];
        if (curTask && curTask.type === "habit") {
          e.preventDefault();
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "down");
          });
        }
      } else if (e.key === "Enter" || e.key === "e") {
        e.preventDefault();
        const curTask = activeTaskList[selectedIndex];
        if (curTask) {
          onSelectTask(curTask);
        }
      } else if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
        const curTask = activeTaskList[selectedIndex];
        if (curTask && window.confirm(`¿Eliminar "${curTask.text}"?`)) {
          e.preventDefault();
          startTransition(async () => {
            await deleteTaskAction(curTask.id);
            onSelectTask(null);
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTaskList, selectedIndex, onSelectTask]);

  return (
    <section className="space-y-4">
      {/* Controls Bar: Category Tabs, Search, View Mode (Grupos / Board / Ledger) & Active Toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#2A2723] bg-[#181715] p-1 shrink-0">
          <button
            onClick={() => {
              onTabChange("all");
              setSelectedProjectChip(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#282622] text-[#F5F2EB] border border-[#3D3831] shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <span>All</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px] text-[#8E867B]">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => {
              onTabChange("dailies");
              setSelectedProjectChip(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "dailies"
                ? "bg-[#3D3425] text-[#E8AF59] border border-[#D99B43]/40 shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Dailies</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px]">
              {dailies.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("todos")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "todos"
                ? "bg-[#1E2825] text-[#4EAB9E] border border-[#4EAB9E]/40 shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <ListTodo className="h-3 w-3" />
            <span>To-Dos</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px]">
              {todos.length}
            </span>
          </button>

          <button
            onClick={() => {
              onTabChange("habits");
              setSelectedProjectChip(null);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "habits"
                ? "bg-[#1D2619] text-[#7EA35A] border border-[#7EA35A]/40 shadow-xs"
                : "text-[#8E867B] hover:bg-[#1F1D1A] hover:text-[#DDD6C9]"
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Habits</span>
            <span className="rounded bg-[#121110] px-1.5 py-0.2 font-mono text-[10px]">
              {habits.length}
            </span>
          </button>
        </div>

        {/* Search, View Mode Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Tag Filter Indicator */}
          {activeTagFilter && (
            <div className="flex items-center gap-1 rounded-lg border border-[#3D3425] bg-[#221D16] px-2.5 py-1 text-xs text-[#D99B43]">
              <Hash className="h-3 w-3" />
              <span>{activeTagFilter}</span>
              <button
                onClick={onClearTagFilter}
                className="ml-1 hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative flex-1 sm:w-44">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8E867B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar o filtrar..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] py-1.5 pl-8 pr-3 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
            />
          </div>

          {/* View Mode Switcher (Grupos | Board | Ledger) */}
          <div className="flex items-center rounded-lg border border-[#2A2723] bg-[#121110] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              title="Vista Agrupada por Secciones (v)"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all cursor-pointer ${
                viewMode === "grouped"
                  ? "bg-[#22201D] text-[#F5F2EB] font-semibold border border-[#38332D] shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <Layers className="size-3" />
              <span className="hidden sm:inline">Grupos</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              title="Vista Board Kanban (v)"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all cursor-pointer ${
                viewMode === "board"
                  ? "bg-[#221D16] text-[#E8AF59] font-semibold border border-[#D99B43]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <Kanban className="size-3" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Vista Tabla Continua (v)"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#22201D] text-[#F5F2EB] font-semibold border border-[#38332D] shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <Table className="size-3" />
              <span className="hidden sm:inline">Ledger</span>
            </button>
          </div>

          {/* Active / Completed Toggle */}
          <button
            onClick={() => setHideCompleted((prev) => !prev)}
            title={
              hideCompleted
                ? "Mostrar todas (incluyendo completadas)"
                : "Ocultar completadas"
            }
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors cursor-pointer ${
              hideCompleted
                ? "border-[#D99B43]/50 bg-[#D99B43]/15 text-[#E8AF59]"
                : "border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] hover:border-[#38332D]"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Activas</span>
          </button>
        </div>
      </div>

      {/* Project Filter Chips Bar (Visible in To-Dos or All tab when projects exist) */}
      {(activeTab === "todos" || (activeTab === "all" && viewMode !== "board")) &&
        projectList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-[11px] font-mono text-[#736B60] shrink-0 mr-1">
              Proyectos:
            </span>
            <button
              type="button"
              onClick={() => setSelectedProjectChip(null)}
              className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] transition-all cursor-pointer shrink-0 border ${
                selectedProjectChip === null
                  ? "bg-[#22201D] text-[#F5F2EB] border-[#38332D] font-semibold"
                  : "bg-[#141311] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
              }`}
            >
              Todos ({todos.length})
            </button>
            {projectList.map(([proj, count]) => {
              const isSelected = selectedProjectChip === proj;
              return (
                <button
                  key={proj}
                  type="button"
                  onClick={() =>
                    setSelectedProjectChip(isSelected ? null : proj)
                  }
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#221D16] text-[#E8AF59] border-[#D99B43]/50 font-semibold"
                      : "bg-[#141311] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <span className="truncate max-w-32">{proj}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

      {/* RENDER VIEW: 1. BOARD (KANBAN) | 2. GROUPED (FOLDERS) | 3. LEDGER */}
      {filteredTasks.length > 0 ? (
        viewMode === "board" ? (
          /* =================== 1. VISTA BOARD KANBAN (3 COLUMNAS) =================== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Columna 1: Dailies */}
            <div className="space-y-3 rounded-xl border border-[#2A2723] bg-[#141311] p-3 shadow-lg">
              <div className="flex items-center justify-between px-1 pb-2 border-b border-[#22201D]">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded bg-[#3D3425] text-[#E8AF59]">
                    <Calendar className="size-3" />
                  </span>
                  <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#E8AF59]">
                    Dailies de Hoy
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#8E867B]">
                  {completedDailiesCount}/{dailies.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {filteredDailies.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    tagsMap={tagsMap}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => onSelectTask(task)}
                  />
                ))}
                {filteredDailies.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#8E867B] border border-dashed border-[#22201D] rounded-lg">
                    No hay dailies pendientes
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: To-Dos */}
            <div className="space-y-3 rounded-xl border border-[#2A2723] bg-[#141311] p-3 shadow-lg">
              <div className="flex items-center justify-between px-1 pb-2 border-b border-[#22201D]">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded bg-[#1E2825] text-[#4EAB9E]">
                    <ListTodo className="size-3" />
                  </span>
                  <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#4EAB9E]">
                    To-Dos & Proyectos
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#8E867B]">
                  {filteredTodos.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {filteredTodos.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    tagsMap={tagsMap}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => onSelectTask(task)}
                  />
                ))}
                {filteredTodos.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#8E867B] border border-dashed border-[#22201D] rounded-lg">
                    No hay to-dos pendientes
                  </div>
                )}
              </div>
            </div>

            {/* Columna 3: Hábitos */}
            <div className="space-y-3 rounded-xl border border-[#2A2723] bg-[#141311] p-3 shadow-lg">
              <div className="flex items-center justify-between px-1 pb-2 border-b border-[#22201D]">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded bg-[#1D2619] text-[#7EA35A]">
                    <Zap className="size-3" />
                  </span>
                  <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#7EA35A]">
                    Hábitos & Prácticas
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#8E867B]">
                  {filteredHabits.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {filteredHabits.map((task) => (
                  <TaskBoardCard
                    key={task.id}
                    task={task}
                    tagsMap={tagsMap}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => onSelectTask(task)}
                  />
                ))}
                {filteredHabits.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#8E867B] border border-dashed border-[#22201D] rounded-lg">
                    No hay hábitos activos
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : viewMode === "grouped" ? (
          /* =================== 2. VISTA AGRUPADA CON CARPETAS DE PROYECTO =================== */
          <div className="space-y-5">
            {/* 1. SECCIÓN DAILIES */}
            {filteredDailies.length > 0 && activeTab !== "todos" && activeTab !== "habits" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-[#3D3425] text-[#E8AF59]">
                      <Calendar className="size-3" />
                    </span>
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#E8AF59]">
                      Dailies de Hoy
                    </h3>
                    <span className="rounded bg-[#221D16] border border-[#3D3425] px-1.5 py-0.2 font-mono text-[10px] text-[#E8AF59]">
                      {filteredDailies.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#8E867B]">
                      {completedDailiesCount}/{dailies.length} listos
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A2723] bg-[#141311] overflow-hidden shadow-lg">
                  <TableHeader
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <div className="divide-y divide-[#22201D]">
                    {sortedDailies.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        tagsMap={tagsMap}
                        isSelected={selectedTaskId === task.id}
                        onSelect={() => onSelectTask(task)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. SECCIÓN TO-DOS AGRUPADOS POR CARPETA DE PROYECTO */}
            {filteredTodos.length > 0 && activeTab !== "dailies" && activeTab !== "habits" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-[#1E2825] text-[#4EAB9E]">
                      <ListTodo className="size-3" />
                    </span>
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#4EAB9E]">
                      To-Dos por Proyecto
                    </h3>
                    <span className="rounded bg-[#141F1D] border border-[#1E2825] px-1.5 py-0.2 font-mono text-[10px] text-[#4EAB9E]">
                      {filteredTodos.length} tareas en {Object.keys(todosByProject).length} proyectos
                    </span>
                  </div>
                </div>

                {/* Project Accordions */}
                <div className="space-y-2">
                  {Object.entries(todosByProject).map(([projectName, projTasks]) => {
                    const isCollapsed = Boolean(collapsedProjects[projectName]);
                    const doneCount = projTasks.filter((t) => t.completed).length;

                    return (
                      <div
                        key={projectName}
                        className="rounded-xl border border-[#2A2723] bg-[#141311] overflow-hidden shadow-md transition-all"
                      >
                        {/* Project Header Accordion Button */}
                        <button
                          type="button"
                          onClick={() => toggleProjectCollapse(projectName)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#171614] hover:bg-[#1C1A17] border-b border-[#22201D] transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isCollapsed ? (
                              <Folder className="size-4 text-[#D99B43] shrink-0" />
                            ) : (
                              <FolderOpen className="size-4 text-[#E8AF59] shrink-0" />
                            )}
                            <span className="font-serif text-xs font-bold text-[#F5F2EB] truncate">
                              {projectName}
                            </span>
                            <span className="rounded bg-[#221D16] border border-[#3D3425] px-1.5 py-0.2 font-mono text-[10px] text-[#D99B43]">
                              {projTasks.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {doneCount > 0 && (
                              <span className="font-mono text-[10px] text-[#7EA35A]">
                                {doneCount}/{projTasks.length} listos
                              </span>
                            )}
                            <ChevronDown
                              className={`size-4 text-[#8E867B] transition-transform duration-200 ${
                                isCollapsed ? "-rotate-90" : "rotate-0"
                              }`}
                            />
                          </div>
                        </button>

                        {/* Tasks inside this project */}
                        {!isCollapsed && (
                          <div>
                            <TableHeader
                              sortField={sortField}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <div className="divide-y divide-[#22201D]">
                              {projTasks.map((task) => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  tagsMap={tagsMap}
                                  isSelected={selectedTaskId === task.id}
                                  onSelect={() => onSelectTask(task)}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SECCIÓN HÁBITOS */}
            {filteredHabits.length > 0 && activeTab !== "dailies" && activeTab !== "todos" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-[#1D2619] text-[#7EA35A]">
                      <Zap className="size-3" />
                    </span>
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#7EA35A]">
                      Hábitos & Prácticas
                    </h3>
                    <span className="rounded bg-[#182014] border border-[#1D2619] px-1.5 py-0.2 font-mono text-[10px] text-[#7EA35A]">
                      {filteredHabits.length}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A2723] bg-[#141311] overflow-hidden shadow-lg">
                  <TableHeader
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <div className="divide-y divide-[#22201D]">
                    {sortedHabits.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        tagsMap={tagsMap}
                        isSelected={selectedTaskId === task.id}
                        onSelect={() => onSelectTask(task)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =================== 3. VISTA LEDGER TABULAR CONTINUA =================== */
          <div className="rounded-xl border border-[#2A2723] bg-[#141311] overflow-hidden shadow-lg">
            <TableHeader
              showTypeColumn={activeTab === "all"}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <div className="divide-y divide-[#22201D]">
              {sortedFilteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  tagsMap={tagsMap}
                  isSelected={selectedTaskId === task.id}
                  onSelect={() => onSelectTask(task)}
                  showTypeBadge={activeTab === "all"}
                />
              ))}
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2A2723] bg-[#141311] py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C1A17] text-[#8E867B]">
            <Sparkles className="h-5 w-5 text-[#D99B43]" />
          </div>
          <h3 className="mt-3 font-serif text-sm font-semibold text-[#F5F2EB]">
            No se encontraron tareas
          </h3>
          <p className="mt-1 max-w-sm text-xs text-[#8E867B]">
            {searchQuery || activeTagFilter || selectedProjectChip
              ? "Ninguna tarea coincide con los filtros aplicados."
              : "Usa la barra de captura rápida o presiona 'C' para ingresar tareas."}
          </p>
        </div>
      )}

      {/* Keyboard Shortcuts Helper Ribbon */}
      <div className="hidden lg:flex items-center justify-between border-t border-[#2A2723] pt-2 text-[11px] font-mono text-[#8E867B]">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              j
            </kbd>
            /
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              k
            </kbd>{" "}
            navegar
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              Espacio
            </kbd>{" "}
            completar
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              + / -
            </kbd>{" "}
            hábito
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              Enter
            </kbd>{" "}
            inspeccionar
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              v
            </kbd>{" "}
              cambiar vista (Grupos/Board/Ledger)
          </span>
          <span>
            <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
              d
            </kbd>{" "}
            eliminar
          </span>
        </div>
        <span>
          <kbd className="rounded bg-[#181715] px-1 py-0.5 text-[#DDD6C9] border border-[#2A2723]">
            ⌘K
          </kbd>{" "}
          command palette
        </span>
      </div>
    </section>
  );
}

/**
 * Tabular Column Header with interactive sorting
 */
function TableHeader({
  showTypeColumn = false,
  sortField,
  sortDirection,
  onSort,
}: {
  showTypeColumn?: boolean;
  sortField?: SortField | null;
  sortDirection?: SortDirection | null;
  onSort?: (field: SortField) => void;
}) {
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field || !sortDirection) {
      return (
        <ArrowUpDown className="size-2.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
      );
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="size-2.5 text-[#D99B43] shrink-0" />
    ) : (
      <ArrowDown className="size-2.5 text-[#D99B43] shrink-0" />
    );
  };

  const getHeaderClass = (field: SortField) => {
    const isActive = sortField === field && Boolean(sortDirection);
    return `group inline-flex items-center gap-1 transition-colors cursor-pointer select-none ${
      isActive
        ? "text-[#D99B43] font-bold"
        : "text-[#736B60] hover:text-[#DDD6C9]"
    }`;
  };

  return (
    <div className="hidden sm:flex items-center justify-between border-b border-[#2A2723] bg-[#161513] px-4 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#736B60] select-none">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-5 text-center">Acc</span>
        {showTypeColumn && (
          <button
            type="button"
            onClick={() => onSort?.("type")}
            className={`w-14 text-left ${getHeaderClass("type")}`}
            title="Ordenar por Tipo"
          >
            <span>Tipo</span>
            {renderSortIndicator("type")}
          </button>
        )}
        <button
          type="button"
          onClick={() => onSort?.("text")}
          className={`flex-1 text-left ${getHeaderClass("text")}`}
          title="Ordenar por Tarea (A-Z)"
        >
          <span>Tarea & Etiquetas</span>
          {renderSortIndicator("text")}
        </button>
      </div>
      <div className="flex items-center gap-4 shrink-0 pr-6">
        <button
          type="button"
          onClick={() => onSort?.("priority")}
          className={`w-14 justify-center ${getHeaderClass("priority")}`}
          title="Ordenar por Prioridad"
        >
          <span>Prioridad</span>
          {renderSortIndicator("priority")}
        </button>
        <button
          type="button"
          onClick={() => onSort?.("value")}
          className={`hidden md:inline-flex w-24 justify-center ${getHeaderClass("value")}`}
          title="Ordenar por Salud RPG"
        >
          <span>Salud RPG</span>
          {renderSortIndicator("value")}
        </button>
        <button
          type="button"
          onClick={() => onSort?.("date")}
          className={`w-16 justify-end ${getHeaderClass("date")}`}
          title="Ordenar por Métrica / Fecha"
        >
          <span>Métrica</span>
          {renderSortIndicator("date")}
        </button>
      </div>
    </div>
  );
}

/**
 * Tactical Compact Card for Board (Kanban) Mode
 */
function TaskBoardCard({
  task,
  tagsMap,
  isSelected,
  onSelect,
}: {
  task: HabiticaTask;
  tagsMap: Record<string, string>;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { prefix, cleanTitle } = parseTaskPrefix(task.text);
  const prio = getTaskPriorityInfo(task.priority || 1);
  const valueStyle = getTaskValueColor(task.value || 0);

  const handleScore = (
    e: React.MouseEvent,
    direction: "up" | "down" = "up"
  ) => {
    e.stopPropagation();
    if (isPending) return;

    if (direction === "up" && !task.completed) {
      soundFx.taskComplete();
    } else {
      soundFx.click();
    }

    startTransition(async () => {
      await toggleTaskAction(task.id, direction);
    });
  };

  const completedChecklistCount =
    task.checklist?.filter((c) => c.completed).length || 0;
  const totalChecklistCount = task.checklist?.length || 0;

  return (
    <div
      onClick={onSelect}
      className={`group p-3 rounded-lg border transition-all cursor-pointer select-none space-y-2 ${
        isSelected
          ? "border-[#D99B43] bg-[#22201D] shadow-md ring-1 ring-[#D99B43]/50"
          : "border-[#2A2723] bg-[#181715] hover:border-[#38332D] hover:bg-[#1D1B18]"
      } ${task.completed ? "opacity-50" : "opacity-100"}`}
    >
      {/* Top Card Row: Prefix, Priority & Type */}
      <div className="flex items-center justify-between gap-1.5 text-[10px]">
        <div className="flex items-center gap-1.5 truncate">
          {prefix ? (
            <span className="shrink-0 rounded border border-[#38332D] bg-[#1C1A17] px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#C2BAAD] truncate max-w-28">
              {prefix}
            </span>
          ) : (
            <span className="font-mono text-[9px] text-[#736B60] uppercase">
              {task.type}
            </span>
          )}
          {task.type === "daily" && task.isDue === false && (
            <span className="rounded bg-[#191815] border border-[#2E2A25] px-1.5 py-0.2 font-mono text-[9px] text-[#8E867B]">
              Descanso
            </span>
          )}
        </div>

        {/* Priority Badge */}
        <span
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[9px] font-semibold shrink-0 ${prio.badge}`}
        >
          <span className={`size-1.5 rounded-full ${prio.dot}`} />
          <span>{prio.shortLabel}</span>
        </span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <h4
          onClick={() => {
            navigator.clipboard.writeText(task.text);
            soundFx.click();
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          title="Clic para copiar título"
          className={`text-xs font-medium text-[#F5F2EB] leading-snug line-clamp-2 cursor-pointer hover:underline underline-offset-2 decoration-[#D99B43]/50 ${
            task.completed ? "line-through text-[#8E867B]" : "group-hover:text-white"
          }`}
        >
          {cleanTitle}
        </h4>
        {copied && (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#7EA35A] bg-[#7EA35A]/10 border border-[#7EA35A]/30 px-1.5 py-0.2 rounded animate-in fade-in duration-150 shrink-0">
            <Check className="size-2.5" />
            <span>Copiado</span>
          </span>
        )}
      </div>

      {/* Meta tags & checklist */}
      {(totalChecklistCount > 0 || (task.tags && task.tags.length > 0)) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#8E867B]">
          {totalChecklistCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-[#141311] px-1.5 py-0.2 font-mono border border-[#2A2723]">
              <CheckSquare className="size-2.5" />
              <span>
                {completedChecklistCount}/{totalChecklistCount}
              </span>
            </span>
          )}
          {task.tags?.slice(0, 1).map((tagId, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 rounded border border-[#2E2A25] bg-[#141311] px-1.5 py-0.2 text-[#A69E91] truncate max-w-24"
            >
              <Tag className="size-2 text-[#736B60]" />
              <span className="truncate">{tagsMap[tagId] || tagId}</span>
            </span>
          ))}
        </div>
      )}

      {/* Card Footer: Action Trigger & RPG Health Pill */}
      <div className="flex items-center justify-between pt-1.5 border-t border-[#22201D]">
        {/* Left Action Button (Check or Habit +/-) */}
        {(task.type === "todo" || task.type === "daily") && (
          <button
            type="button"
            onClick={(e) => handleScore(e, "up")}
            className={`flex size-5 items-center justify-center rounded border transition-all cursor-pointer ${
              task.completed
                ? "border-[#7EA35A] bg-[#7EA35A] text-[#121110]"
                : "border-[#3D3831] bg-[#121110] hover:border-[#D99B43]"
            }`}
          >
            {task.completed && <Check className="size-3 stroke-3" />}
          </button>
        )}

        {task.type === "habit" && (
          <div className="flex items-center gap-1">
            {task.up !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "up")}
                className="flex size-5 items-center justify-center rounded border border-[#38332D] bg-[#121110] text-[#7EA35A] hover:bg-[#7EA35A]/15 cursor-pointer"
              >
                <Plus className="size-2.5 stroke-[2.5]" />
              </button>
            )}
            {task.down !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "down")}
                className="flex size-5 items-center justify-center rounded border border-[#38332D] bg-[#121110] text-[#E05D52] hover:bg-[#E05D52]/15 cursor-pointer"
              >
                <Minus className="size-2.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}

        {/* Right Health Pill */}
        <div className="flex items-center gap-1.5">
          {task.type === "daily" && (task.streak || 0) > 0 && (
            <span className="flex items-center gap-0.5 rounded border border-[#3D3425] bg-[#221D16] px-1 py-0.2 font-mono text-[9px] font-semibold text-[#D99B43]">
              <Flame className="size-2.5 fill-[#D99B43]" />
              <span>{task.streak}</span>
            </span>
          )}

          <div
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.2 text-[9px] font-mono ${valueStyle.pillBg}`}
            title={`Salud Habitica: ${(task.value || 0).toFixed(1)}`}
          >
            <span className={`size-1.5 rounded-full ${valueStyle.dot}`} />
            <span>{valueStyle.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
