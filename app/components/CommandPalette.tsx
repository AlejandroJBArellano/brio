"use client";

import { toggleSleepAction } from "@/app/actions/tasks";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
import { capitalize } from "@/lib/utils";
import {
  Activity,
  Bed,
  Calendar,
  Check,
  CheckCircle2,
  CornerDownLeft,
  Flame,
  Hash,
  Layers,
  ListTodo,
  Moon,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Sun,
  Tag,
  Wallet,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DashboardMainTab } from "./HeaderStatsRibbon";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: HabiticaTask[];
  tags: HabiticaTag[];
  isResting?: boolean;
  onOpenBatchCapture: () => void;
  onOpenMorningRitual: () => void;
  onOpenEveningReview: () => void;
  onOpenFinanceModal: () => void;
  onSelectMainTab: (tab: DashboardMainTab) => void;
  onSelectTask: (task: HabiticaTask) => void;
  onFilterType: (type: "all" | "dailies" | "todos" | "habits") => void;
  onFilterTag: (tag: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  tasks,
  tags,
  isResting = false,
  onOpenBatchCapture,
  onOpenMorningRitual,
  onOpenEveningReview,
  onOpenFinanceModal,
  onSelectMainTab,
  onSelectTask,
  onFilterType,
  onFilterTag,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose();
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Command items
  const staticActions = useMemo(() => {
    return [
      {
        id: "action-morning-ritual",
        title: "🌅 Iniciar Ritual Matutino",
        subtitle: "Alinear energía, agenda del día y 3 Must-Wins",
        icon: Sun,
        badge: "⌘M",
        run: () => {
          onClose();
          onOpenMorningRitual();
        },
      },
      {
        id: "action-evening-review",
        title: "🌙 Iniciar Cierre Nocturno",
        subtitle: "Auditoría de daño HP, gastos del día y brain dump",
        icon: Moon,
        badge: "⌘E",
        run: () => {
          onClose();
          onOpenEveningReview();
        },
      },
      {
        id: "action-finance-new",
        title: "💰 Registrar Movimiento en Brio Finanzas",
        subtitle: "Gasto o ingreso con categoría y tarjeta en Neon DB",
        icon: Wallet,
        badge: "⌘F",
        run: () => {
          onClose();
          onOpenFinanceModal();
        },
      },
      {
        id: "action-tab-tasks",
        title: "Ir a Tareas & Hábitos",
        subtitle: "Vista principal de Habitica + Linear Inspector",
        icon: Zap,
        badge: "⌘1",
        run: () => {
          onSelectMainTab("tasks");
          onClose();
        },
      },
      {
        id: "action-tab-finance",
        title: "Ir a Brio Finanzas",
        subtitle: "Termómetro mensual, gastos hormiga y metas de ahorro",
        icon: Wallet,
        badge: "⌘2",
        run: () => {
          onSelectMainTab("finance");
          onClose();
        },
      },
      {
        id: "action-tab-analytics",
        title: "Ir a Consistencia & Balance",
        subtitle: "Heatmap de hábitos y balance de vida por tags",
        icon: Activity,
        badge: "⌘3",
        run: () => {
          onSelectMainTab("analytics");
          onClose();
        },
      },
      {
        id: "action-tab-calendar",
        title: "Ir a Agenda Google Calendar",
        subtitle: "Timeline de eventos y reuniones sincronizadas",
        icon: Calendar,
        badge: "⌘4",
        run: () => {
          onSelectMainTab("calendar");
          onClose();
        },
      },
      {
        id: "action-tab-health",
        title: "Ir a Salud & Rendimiento",
        subtitle: "Check-in de entrenamiento, hidratación 3L y sueño",
        icon: Activity,
        badge: "⌘5",
        run: () => {
          onSelectMainTab("health");
          onClose();
        },
      },
      {
        id: "action-tab-projects",
        title: "Ir a Proyectos & Aprendizaje",
        subtitle: "Backlog de side projects y tracker de libros/cursos",
        icon: Layers,
        badge: "⌘6",
        run: () => {
          onSelectMainTab("projects");
          onClose();
        },
      },
      {
        id: "action-batch",
        title: "Captura por Lotes (Batch Tasks)",
        subtitle: "Crear múltiples tareas de Habitica en milisegundos",
        icon: Plus,
        badge: "⌘B",
        run: () => {
          onClose();
          onOpenBatchCapture();
        },
      },
      {
        id: "action-rest",
        title: isResting ? "Despertar de la Posada" : "Descansar en la Posada (Inn)",
        subtitle: isResting
          ? "Reanudar daño de dailies"
          : "Pausar daño de dailies no completadas",
        icon: Bed,
        badge: isResting ? "En Posada" : "Activo",
        run: () => {
          startTransition(async () => {
            await toggleSleepAction();
            onClose();
          });
        },
      },
      {
        id: "action-sync",
        title: "Sincronizar Estado de Brio",
        subtitle: "Refrescar HP, MP, EXP, y tareas",
        icon: RotateCw,
        badge: "Sync",
        run: () => {
          startTransition(() => {
            router.refresh();
            onClose();
          });
        },
      },
    ];
  }, [
    isResting,
    onClose,
    onOpenMorningRitual,
    onOpenEveningReview,
    onOpenFinanceModal,
    onSelectMainTab,
    onOpenBatchCapture,
    router,
  ]);

  // Filter tasks based on query
  const filteredTasks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return tasks
      .filter((t) => {
        const matchTitle = t.text.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        return matchTitle || matchNotes || matchTags;
      })
      .slice(0, 8);
  }, [tasks, query]);

  // Filter tags based on query
  const filteredTags = useMemo(() => {
    if (!query.trim() || !query.startsWith("#")) return [];
    const cleanQ = query.replace(/^#/, "").toLowerCase();
    return tags
      .filter((t) => t.name.toLowerCase().includes(cleanQ))
      .slice(0, 5);
  }, [tags, query]);

  // Filtered action list
  const filteredActions = useMemo(() => {
    if (!query.trim() || query.startsWith("#")) return staticActions;
    const q = query.toLowerCase().trim();
    return staticActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );
  }, [staticActions, query]);

  // Total selectable items
  const allItems = useMemo(() => {
    return [
      ...filteredActions.map((a) => ({ type: "action" as const, data: a })),
      ...filteredTags.map((t) => ({ type: "tag" as const, data: t })),
      ...filteredTasks.map((t) => ({ type: "task" as const, data: t })),
    ];
  }, [filteredActions, filteredTags, filteredTasks]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + allItems.length) % allItems.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (!current) return;

      if (current.type === "action") {
        current.data.run();
      } else if (current.type === "tag") {
        onFilterTag(current.data.name);
        onClose();
      } else if (current.type === "task") {
        onSelectTask(current.data);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 backdrop-blur-md bg-black/70 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="relative flex items-center border-b border-white/[0.08] px-4 py-3.5">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando, tarea, #tag o acción..."
            className="w-full bg-transparent pl-3 pr-8 font-sans text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
          <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* List of items */}
        <div className="max-h-[380px] overflow-y-auto p-2">
          {/* Actions Group */}
          {filteredActions.length > 0 && (
            <div className="mb-2">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Comandos & Vistas
              </div>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            isSelected ? "text-white" : "text-neutral-400"
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-xs">{action.title}</div>
                          <div
                            className={`text-[11px] ${
                              isSelected ? "text-indigo-100" : "text-neutral-500"
                            }`}
                          >
                            {action.subtitle}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                          isSelected
                            ? "bg-indigo-700 text-white"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {action.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags Group */}
          {filteredTags.length > 0 && (
            <div className="mb-2">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Filtrar por Tag
              </div>
              <div className="space-y-1">
                {filteredTags.map((tag, idx) => {
                  const itemIdx = filteredActions.length + idx;
                  const isSelected = selectedIndex === itemIdx;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        onFilterTag(tag.name);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIdx)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2 text-left text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Hash
                          className={`h-3.5 w-3.5 ${
                            isSelected ? "text-white" : "text-indigo-400"
                          }`}
                        />
                        <span className="font-mono font-medium">#{tag.name}</span>
                      </div>
                      <span className="text-[10px] opacity-75">Filtrar</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks Match Group */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Tareas Encontradas
              </div>
              <div className="space-y-1">
                {filteredTasks.map((task, idx) => {
                  const itemIdx =
                    filteredActions.length + filteredTags.length + idx;
                  const isSelected = selectedIndex === itemIdx;
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        onSelectTask(task);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIdx)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2 text-left text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {task.type === "daily" ? (
                          <Calendar
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-amber-400"
                            }`}
                          />
                        ) : task.type === "habit" ? (
                          <Zap
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-emerald-400"
                            }`}
                          />
                        ) : (
                          <ListTodo
                            className={`h-3.5 w-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-sky-400"
                            }`}
                          />
                        )}
                        <span className="truncate font-medium">{task.text}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                        <span
                          className={`rounded px-1.5 py-0.5 ${
                            isSelected
                              ? "bg-indigo-700 text-white"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {capitalize(task.type)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allItems.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No se encontraron comandos o tareas que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-neutral-950/60 px-4 py-2.5 text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>{" "}
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              Ejecutar
            </span>
          </div>
          <span className="font-mono text-[10px] text-neutral-500">
            Brio OS Command Launcher
          </span>
        </div>
      </div>
    </div>
  );
}
