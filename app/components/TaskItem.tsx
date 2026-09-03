"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import { soundFx } from "@/lib/soundFx";
import { HabiticaTag, HabiticaTask } from "@/lib/types";
import {
  getTaskPriorityInfo,
  getTaskValueColor,
  parseTaskPrefix,
} from "@/lib/utils";
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronRight,
  Flame,
  ListTodo,
  Loader2,
  Minus,
  Plus,
  Tag,
  Zap,
} from "lucide-react";
import { useOptimistic, useTransition } from "react";

interface TaskItemProps {
  task: HabiticaTask;
  isSelected?: boolean;
  onSelect?: () => void;
  tags?: HabiticaTag[];
  tagsMap?: Record<string, string>;
  showTypeBadge?: boolean;
}

export function TaskItem({
  task,
  isSelected = false,
  onSelect,
  tags,
  tagsMap,
  showTypeBadge = false,
}: TaskItemProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic(
    {
      completed: task.completed || false,
      counterUp: task.counterUp || 0,
      counterDown: task.counterDown || 0,
    },
    (current, action: "up" | "down") => {
      if (task.type === "todo" || task.type === "daily") {
        return { ...current, completed: !current.completed };
      }
      if (task.type === "habit") {
        return {
          ...current,
          counterUp: action === "up" ? current.counterUp + 1 : current.counterUp,
          counterDown: action === "down" ? current.counterDown + 1 : current.counterDown,
        };
      }
      return current;
    }
  );

  const valueStyle = getTaskValueColor(task.value || 0);
  const prioStyle = getTaskPriorityInfo(task.priority || 1);
  const { prefix, cleanTitle } = parseTaskPrefix(task.text);

  const handleScore = (
    e: React.MouseEvent,
    direction: "up" | "down" = "up"
  ) => {
    e.stopPropagation();
    if (isPending) return;

    if (direction === "up" && !optimisticState.completed) {
      soundFx.taskComplete();
    } else {
      soundFx.click();
    }

    startTransition(async () => {
      setOptimisticState(direction);
      await toggleTaskAction(task.id, direction);
    });
  };

  const completedChecklistCount =
    task.checklist?.filter((c) => c.completed).length || 0;
  const totalChecklistCount = task.checklist?.length || 0;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 transition-all cursor-pointer select-none border-b border-[#22201D] last:border-b-0 ${isSelected
          ? "bg-[#22201D] border-l-2 border-l-[#D99B43] pl-3.25 sm:pl-3.75"
          : "bg-[#181715] hover:bg-[#1D1B18] border-l-2 border-l-transparent"
        } ${isPending ? "opacity-60 pointer-events-none" : optimisticState.completed ? "opacity-45" : "opacity-100"}`}
    >
      {/* Columna Principal: Check / Acciones + Título + Badges */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox (Todos & Dailies) */}
        {(task.type === "todo" || task.type === "daily") && (
          <button
            type="button"
            disabled={isPending}
            onClick={(e) => handleScore(e, "up")}
            aria-label={
              optimisticState.completed
                ? "Marcar como pendiente"
                : "Marcar como completada"
            }
            className={`flex size-5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer ${isPending
                ? "border-[#D99B43]/70 bg-[#1D1B18] cursor-wait"
                : optimisticState.completed
                  ? "border-[#7EA35A] bg-[#7EA35A] text-[#121110] shadow-xs"
                  : "border-[#3D3831] bg-[#121110] hover:border-[#D99B43]/70 hover:bg-[#D99B43]/10"
              }`}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin text-[#D99B43]" />
            ) : optimisticState.completed ? (
              <Check className="size-3.5 stroke-[2.5]" />
            ) : null}
          </button>
        )}

        {/* Botones de Hábito (+ / -) */}
        {task.type === "habit" && (
          <div className="flex items-center gap-1 shrink-0">
            {task.up !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "up")}
                aria-label="Sumar hábito"
                title="Anotar hábito positivo (+)"
                className="flex size-5.5 items-center justify-center rounded border border-[#38332D] bg-[#141311] text-[#7EA35A] hover:border-[#7EA35A]/60 hover:bg-[#7EA35A]/15 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="size-3 stroke-[2.5]" />
              </button>
            )}
            {task.down !== false && (
              <button
                type="button"
                onClick={(e) => handleScore(e, "down")}
                aria-label="Restar hábito"
                title="Anotar hábito negativo (-)"
                className="flex size-5.5 items-center justify-center rounded border border-[#38332D] bg-[#141311] text-[#E05D52] hover:border-[#E05D52]/60 hover:bg-[#E05D52]/15 active:scale-95 transition-all cursor-pointer"
              >
                <Minus className="size-3 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}

        {/* Badge de Tipo si está habilitado */}
        {showTypeBadge && (
          <span
            className={`hidden sm:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0 border ${task.type === "daily"
                ? "border-[#3D3425] bg-[#221D16] text-[#E8AF59]"
                : task.type === "habit"
                  ? "border-[#1D2619] bg-[#182014] text-[#7EA35A]"
                  : "border-[#1E2825] bg-[#141F1D] text-[#4EAB9E]"
              }`}
          >
            {task.type === "daily" && <Calendar className="size-2.5" />}
            {task.type === "habit" && <Zap className="size-2.5" />}
            {task.type === "todo" && <ListTodo className="size-2.5" />}
            <span>{task.type}</span>
          </span>
        )}

        {/* Contenedor de Título, Prefijo y Metadatos */}
        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
          {/* Título & Prefijo */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {prefix && (
              <span className="shrink-0 rounded border border-[#38332D] bg-[#1C1A17] px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#C2BAAD]">
                {prefix}
              </span>
            )}

            <span
              className={`text-xs sm:text-sm font-medium leading-snug tracking-tight text-[#F5F2EB] truncate ${optimisticState.completed
                  ? "line-through text-[#8E867B]"
                  : "group-hover:text-white"
                }`}
            >
              {cleanTitle}
            </span>
          </div>

          {/* Subtítulos / Subtareas / Tags */}
          <div className="flex items-center gap-2 text-xs text-[#8E867B] shrink-0">
            {totalChecklistCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-[#1C1A17] px-1.5 py-0.5 font-mono text-[10px] text-[#8E867B] border border-[#2A2723]">
                <CheckSquare className="size-2.5 text-[#8E867B]" />
                <span>
                  {completedChecklistCount}/{totalChecklistCount}
                </span>
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                {task.tags.slice(0, 2).map((tagId, i) => {
                  const tagName =
                    tagsMap?.[tagId] ||
                    tags?.find((t) => t.id === tagId)?.name ||
                    tagId;

                  return (
                    <span
                      key={i}
                      title={tagName}
                      className="inline-flex items-center gap-1 rounded border border-[#2E2A25] bg-[#191815] px-1.5 py-0.5 text-[10px] font-medium text-[#A69E91] truncate max-w-24 sm:max-w-28"
                    >
                      <Tag className="size-2.5 text-[#8E867B] shrink-0" />
                      <span className="truncate">{tagName}</span>
                    </span>
                  );
                })}
                {task.tags.length > 2 && (
                  <span className="text-[10px] font-mono text-[#8E867B]">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Prioridad, Salud RPG, Métricas y Flecha */}
      <div className="ml-3 flex items-center gap-2 sm:gap-3.5 shrink-0">
        {/* Priority Badge */}
        <span
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.2 font-mono text-[9px] font-semibold ${prioStyle.badge}`}
          title={`Prioridad: ${prioStyle.label}`}
        >
          <span className={`size-1.5 rounded-full ${prioStyle.dot}`} />
          <span className="hidden sm:inline">{prioStyle.shortLabel}</span>
        </span>

        {/* RPG Health Status Badge */}
        <div
          className={`hidden md:inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-mono tracking-tight ${valueStyle.pillBg}`}
          title={`Salud Habitica: ${(task.value || 0).toFixed(1)} (${valueStyle.label})`}
        >
          <span className={`size-1.5 rounded-full ${valueStyle.dot}`} />
          <span>{valueStyle.label}</span>
          <span className="opacity-70 tabular-nums text-[9px]">
            {task.value !== undefined && task.value >= 0 ? "+" : ""}
            {(task.value || 0).toFixed(1)}
          </span>
        </div>

        {/* Indicador de Racha (Dailies) */}
        {task.type === "daily" && (task.streak || 0) > 0 && (
          <span
            className="flex items-center gap-1 rounded border border-[#3D3425] bg-[#221D16] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#D99B43]"
            title={`Racha actual: ${task.streak} días consecutivos`}
          >
            <Flame className="size-3 fill-[#D99B43] text-[#D99B43]" />
            <span className="tabular-nums">{task.streak}</span>
          </span>
        )}

        {/* Indicador de Descanso si no toca hoy */}
        {task.type === "daily" && task.isDue === false && (
          <span
            className="hidden sm:inline-flex items-center gap-1 rounded border border-[#2E2A25] bg-[#191815] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#8E867B]"
            title="Día de descanso: Esta tarea no está programada para hoy"
          >
            <span>Descanso</span>
          </span>
        )}

        {/* Contador de Hábitos */}
        {task.type === "habit" && (
          <div
            className="font-mono text-xs tabular-nums text-[#DDD6C9] bg-[#141311] px-2 py-0.5 rounded border border-[#2A2723]"
            title="Conteo positivo / negativo"
          >
            <span className="text-[#7EA35A]">+{optimisticState.counterUp}</span>
            <span className="text-[#5C564E] mx-1">/</span>
            <span className="text-[#E05D52]">-{optimisticState.counterDown}</span>
          </div>
        )}

        {/* Flecha de Selección / Inspector */}
        <ChevronRight
          className={`size-3.5 transition-transform duration-200 ${isSelected
              ? "text-[#D99B43] translate-x-0.5"
              : "text-[#5C564E] group-hover:text-[#DDD6C9]"
            }`}
        />
      </div>
    </div>
  );
}
