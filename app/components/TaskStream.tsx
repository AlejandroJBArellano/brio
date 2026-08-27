"use client";

import { deleteTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
import {
  Calendar,
  CheckCircle2,
  Hash,
  Layers,
  ListTodo,
  Search,
  Sparkles,
  Table,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { TaskItem } from "./TaskItem";

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
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
  const [_isPending, startTransition] = useTransition();

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "dailies" && task.type !== "daily") return false;
      if (activeTab === "todos" && task.type !== "todo") return false;
      if (activeTab === "habits" && task.type !== "habit") return false;

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
  }, [tasks, tagsMap, activeTab, activeTagFilter, hideCompleted, searchQuery]);

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

  // Derived selected index from selectedTaskId
  const selectedIndex = selectedTaskId
    ? Math.max(0, filteredTasks.findIndex((t) => t.id === selectedTaskId))
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
        setViewMode((prev) => (prev === "grouped" ? "table" : "grouped"));
        return;
      }

      if (filteredTasks.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = selectedIndex < filteredTasks.length - 1 ? selectedIndex + 1 : 0;
        onSelectTask(filteredTasks[next] || null);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = selectedIndex > 0 ? selectedIndex - 1 : filteredTasks.length - 1;
        onSelectTask(filteredTasks[next] || null);
      } else if (e.key === " " || e.key === "x") {
        e.preventDefault();
        const curTask = filteredTasks[selectedIndex];
        if (curTask) {
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "up");
          });
        }
      } else if (e.key === "+" || e.key === "=") {
        const curTask = filteredTasks[selectedIndex];
        if (curTask && curTask.type === "habit") {
          e.preventDefault();
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "up");
          });
        }
      } else if (e.key === "-") {
        const curTask = filteredTasks[selectedIndex];
        if (curTask && curTask.type === "habit") {
          e.preventDefault();
          startTransition(async () => {
            await toggleTaskAction(curTask.id, "down");
          });
        }
      } else if (e.key === "Enter" || e.key === "e") {
        e.preventDefault();
        const curTask = filteredTasks[selectedIndex];
        if (curTask) {
          onSelectTask(curTask);
        }
      } else if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
        const curTask = filteredTasks[selectedIndex];
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
  }, [filteredTasks, selectedIndex, onSelectTask]);

  return (
    <section className="space-y-4">
      {/* Stream Controls: Tabs, Tag pill, Search, View Mode & Active Toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#2A2723] bg-[#181715] p-1 shrink-0">
          <button
            onClick={() => onTabChange("all")}
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
            onClick={() => onTabChange("dailies")}
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
            onClick={() => onTabChange("habits")}
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

        {/* Search, Mode Toggle & Filters */}
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
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8E867B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar o filtrar..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] py-1.5 pl-8 pr-3 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none transition-all"
            />
          </div>

          {/* View Mode Toggle (Grouped vs Table) - Only in All tab */}
          {activeTab === "all" && (
            <div className="flex items-center rounded-lg border border-[#2A2723] bg-[#121110] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                title="Vista Agrupada por Tipo (v)"
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
          )}

          {/* Active / Completed Toggle */}
          <button
            onClick={() => setHideCompleted((prev) => !prev)}
            title={hideCompleted ? "Mostrar todas (incluyendo completadas)" : "Ocultar completadas"}
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

      {/* RENDER VIEW: GROUPED vs UNIFIED TABLE */}
      {filteredTasks.length > 0 ? (
        activeTab === "all" && viewMode === "grouped" ? (
          /* =================== VISTA AGRUPADA (EDITORIAL COMMAND) =================== */
          <div className="space-y-5">
            {/* 1. SECCIÓN DAILIES */}
            {filteredDailies.length > 0 && (
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
                  <TableHeader />
                  <div className="divide-y divide-[#22201D]">
                    {filteredDailies.map((task) => (
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

            {/* 2. SECCIÓN TO-DOS */}
            {filteredTodos.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded bg-[#1E2825] text-[#4EAB9E]">
                      <ListTodo className="size-3" />
                    </span>
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#4EAB9E]">
                      To-Dos Pendientes
                    </h3>
                    <span className="rounded bg-[#141F1D] border border-[#1E2825] px-1.5 py-0.2 font-mono text-[10px] text-[#4EAB9E]">
                      {filteredTodos.length}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#2A2723] bg-[#141311] overflow-hidden shadow-lg">
                  <TableHeader />
                  <div className="divide-y divide-[#22201D]">
                    {filteredTodos.map((task) => (
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

            {/* 3. SECCIÓN HÁBITOS */}
            {filteredHabits.length > 0 && (
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
                  <TableHeader />
                  <div className="divide-y divide-[#22201D]">
                    {filteredHabits.map((task) => (
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
          /* =================== VISTA LEDGER CONTINUO / PESTAÑAS INDIVIDUALES =================== */
          <div className="rounded-xl border border-[#2A2723] bg-[#141311] overflow-hidden shadow-lg">
            <TableHeader showTypeColumn={activeTab === "all"} />
            <div className="divide-y divide-[#22201D]">
              {filteredTasks.map((task) => (
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
            {searchQuery || activeTagFilter
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
            cambiar vista
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
 * Tabular Column Header for Archival Ledger
 */
function TableHeader({ showTypeColumn = false }: { showTypeColumn?: boolean }) {
  return (
    <div className="hidden sm:flex items-center justify-between border-b border-[#2A2723] bg-[#161513] px-4 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#736B60] select-none">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-5 text-center">Acc</span>
        {showTypeColumn && <span className="w-14">Tipo</span>}
        <span className="flex-1">Tarea & Etiquetas</span>
      </div>
      <div className="flex items-center gap-6 shrink-0 pr-6">
        <span className="hidden md:inline-block w-24 text-center">Salud RPG</span>
        <span className="w-16 text-right">Métrica</span>
      </div>
    </div>
  );
}
