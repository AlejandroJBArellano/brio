import { habiticaClient } from "@/lib/habitica";
import { HabiticaEventType, HabiticaTask, HabiticaTaskPayload } from "@/lib/types";

interface EventTemplate {
  type: "habit" | "daily" | "todo";
  text: string;
  notes: string;
  priority: number;
  tags: string[];
  up?: boolean;
  down?: boolean;
}

const EVENT_TEMPLATES: Record<HabiticaEventType, EventTemplate> = {
  MORNING_KICKOFF: {
    type: "habit",
    text: "[Brio] Ritual Matutino",
    notes: "Despegue matutino, registro de energía y autocuidado completado.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "rituals"],
  },
  EVENING_REVIEW: {
    type: "habit",
    text: "[Brio] Cierre Nocturno",
    notes: "Reflexión nocturna, auditoría de gastos y desconexión.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "rituals"],
  },
  WORKOUT_COMPLETED: {
    type: "habit",
    text: "[Brio] Entrenamiento / Ejercicio",
    notes: "Sesión de fuerza (Hevy) o entrenamiento deportivo completado.",
    priority: 2,
    up: true,
    down: false,
    tags: ["brio", "health", "workout"],
  },
  HYDRATION_LOGGED: {
    type: "habit",
    text: "[Brio] Hidratación (+500ml)",
    notes: "Mantenerse hidratado durante la jornada.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health"],
  },
  SUPPLEMENTS_COMPLETED: {
    type: "habit",
    text: "[Brio] Suplementación Diaria",
    notes: "Tomar suplementación y vitaminas según el protocolo.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health"],
  },
  SLEEP_LOGGED: {
    type: "habit",
    text: "[Brio] Descanso Óptimo (≥7h)",
    notes: "Registro de sueño reparador y recuperación física.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "health", "sleep"],
  },
  BODY_COMPOSITION_LOGGED: {
    type: "habit",
    text: "[Brio] Registro Composición Corporal",
    notes: "Monitoreo periódico de peso, % grasa y masa muscular.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health"],
  },
  LAB_REPORT_LOGGED: {
    type: "todo",
    text: "[Brio] Chequeo Clínico y Biomarcadores",
    notes: "Análisis de laboratorio y salud preventiva registrados en Brio.",
    priority: 2,
    tags: ["brio", "health"],
  },
  NUTRITION_HABIT: {
    type: "habit",
    text: "[Brio] Nutrición & Mariana Mont",
    notes: "Alimentación limpia, ensalada diaria, suplementación o cumplimiento de porciones del plan Mariana Mont.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "health", "nutrition", "mariana-mont"],
  },
  SCHEDULED_MEAL_COMPLETED: {
    type: "habit",
    text: "[Brio] Receta / Comida Mariana Mont",
    notes: "Comer según la planificación o recetas clínicas de la nutrióloga Mariana Mont.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "health", "nutrition", "mariana-mont"],
  },
  DAILY_EXPENSES_LOGGED: {
    type: "daily",
    text: "[Brio] Registrar Gastos Diarios",
    notes: "Mantener el registro de finanzas al día sin omitir gastos.",
    priority: 1.5,
    tags: ["brio", "finance"],
  },
  SAVINGS_CONTRIBUTION: {
    type: "habit",
    text: "[Brio] Aporte a Meta de Ahorro",
    notes: "Aportar capital a fondos de ahorro o inversión.",
    priority: 2,
    up: true,
    down: false,
    tags: ["brio", "finance"],
  },
  WISHLIST_DISMISSED_COOLING: {
    type: "habit",
    text: "[Brio] Autocontrol: Deseo Descartado",
    notes: "Victoria contra compras impulsivas tras periodo de enfriamiento.",
    priority: 2,
    up: true,
    down: false,
    tags: ["brio", "finance", "mindset"],
  },
  VAULT_PROGRESS: {
    type: "habit",
    text: "[Brio] Sesión de Lectura / Estudio",
    notes: "Avanzar en libros, cursos o documentación de la Bóveda.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "learning"],
  },
  VAULT_COMPLETED: {
    type: "todo",
    text: "[Brio] Finalizar Libro / Curso",
    notes: "Completar un libro, curso o certificación en la Bóveda.",
    priority: 2,
    tags: ["brio", "learning"],
  },
  PROJECT_COMPLETED: {
    type: "todo",
    text: "[Brio] Proyecto Finalizado",
    notes: "Entrega o finalización de un proyecto en Brio.",
    priority: 2,
    tags: ["brio", "projects"],
  },
  CIRCADIAN_HABIT_COMPLETED: {
    type: "habit",
    text: "[Brio] Optimización Circadiana",
    notes: "Luz solar matutina, corte de cafeína o bloqueo de luz azul.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health", "circadian"],
  },
};

// In-memory cache for resolved Habitica task IDs to minimize API calls
const taskIdCache = new Map<string, string>();

/**
 * Finds an existing task by text/tag or creates it automatically.
 */
async function findOrCreateHabiticaTask(
  template: EventTemplate,
  customTitle?: string,
  customNotes?: string
): Promise<HabiticaTask | null> {
  const taskText = customTitle || template.text;
  const cacheKey = `${template.type}:${taskText}`;

  const cachedId = taskIdCache.get(cacheKey);
  if (cachedId) {
    return { id: cachedId, text: taskText, type: template.type };
  }

  try {
    // 1. Fetch user tasks of the matching type to check if already created
    const existingTasks = await habiticaClient.getUserTasks(
      template.type === "habit"
        ? "habits"
        : template.type === "daily"
        ? "dailys"
        : "todos"
    );

    const match = existingTasks.find(
      (t) =>
        t.text.trim().toLowerCase() === taskText.trim().toLowerCase() ||
        t.text.trim().toLowerCase() === template.text.trim().toLowerCase()
    );

    if (match) {
      taskIdCache.set(cacheKey, match.id);
      return match;
    }

    // 2. Not found -> Provision new task in Habitica
    const payload: HabiticaTaskPayload = {
      text: taskText,
      notes: customNotes || template.notes,
      type: template.type,
      priority: template.priority,
      up: template.up,
      down: template.down,
    };

    const created = await habiticaClient.createTask(payload);
    if (created?.id) {
      taskIdCache.set(cacheKey, created.id);
      return created;
    }

    return null;
  } catch (error) {
    console.warn(`[Habitica Gamification]: Could not find or create task "${taskText}":`, error);
    return null;
  }
}

export interface AwardHabiticaEventOptions {
  customTitle?: string;
  customNotes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dispatches a gamification event to Habitica.
 * Safe, asynchronous, and non-blocking: errors are caught and logged so callers are never interrupted.
 */
export async function awardHabiticaEvent(
  eventType: HabiticaEventType,
  options?: AwardHabiticaEventOptions
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const template = EVENT_TEMPLATES[eventType];
    if (!template) {
      console.warn(`[Habitica Gamification]: Unknown event type "${eventType}"`);
      return { success: false, error: `Unknown event type ${eventType}` };
    }

    // For one-off 'todo' events with custom title (e.g. completing a specific book or project)
    if (template.type === "todo" && options?.customTitle) {
      const todoPayload: HabiticaTaskPayload = {
        text: `[Brio] Completado: ${options.customTitle}`,
        notes: options.customNotes || template.notes,
        type: "todo",
        priority: template.priority,
        tags: template.tags,
      };

      const task = await habiticaClient.createTask(todoPayload);
      if (task?.id) {
        // Score to complete it immediately and award XP/Gold
        await habiticaClient.scoreTask(task.id, "up");
        console.log(`[Habitica Gamification]: Awarded XP for completed todo "${todoPayload.text}"`);
        return { success: true, taskId: task.id };
      }
    }

    // For persistent habits or dailies
    const task = await findOrCreateHabiticaTask(
      template,
      options?.customTitle,
      options?.customNotes
    );

    if (!task || !task.id) {
      return { success: false, error: "Task could not be resolved" };
    }

    const res = await habiticaClient.scoreTask(task.id, "up");
    console.log(`[Habitica Gamification]: Scored "${task.text}" for event ${eventType}`);

    return { success: res.success, taskId: task.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Habitica Gamification Error]: Failed to award event ${eventType}:`, message);
    return { success: false, error: message };
  }
}
