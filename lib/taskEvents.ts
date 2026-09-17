import { getDb } from "@/lib/db";
import { HabiticaEventType } from "@/lib/types";

interface EventTemplate {
  type: "habit" | "daily" | "todo";
  text: string;
  notes: string;
  priority: number;
  tags: string[];
  up?: boolean;
  down?: boolean;
}

function stripEmojis(str = "") {
  if (!str) return "";
  return str
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{FE0F}\u{200D}\u{200C}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

const EVENT_TEMPLATES: Record<HabiticaEventType, EventTemplate> = {
  MORNING_KICKOFF: {
    type: "habit",
    text: "[Brio] Ritual Matutino",
    notes: "Despegue matutino, registro de energia y autocuidado completado.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "rituals"],
  },
  EVENING_REVIEW: {
    type: "habit",
    text: "[Brio] Cierre Nocturno",
    notes: "Reflexion nocturna, auditoria de gastos y desconexion.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "rituals"],
  },
  WORKOUT_COMPLETED: {
    type: "habit",
    text: "[Brio] Entrenamiento / Ejercicio",
    notes: "Sesion de fuerza o entrenamiento deportivo completado.",
    priority: 2,
    up: true,
    down: false,
    tags: ["brio", "health", "workout"],
  },
  HYDRATION_LOGGED: {
    type: "habit",
    text: "[Brio] Hidratacion (+500ml)",
    notes: "Mantenerse hidratado durante la jornada.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health"],
  },
  SUPPLEMENTS_COMPLETED: {
    type: "habit",
    text: "[Brio] Suplementacion Diaria",
    notes: "Tomar suplementacion y vitaminas segun el protocolo.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health"],
  },
  SLEEP_LOGGED: {
    type: "habit",
    text: "[Brio] Descanso Optimo (>=7h)",
    notes: "Registro de sueno reparador y recuperacion fisica.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "health", "sleep"],
  },
  BODY_COMPOSITION_LOGGED: {
    type: "habit",
    text: "[Brio] Registro Composicion Corporal",
    notes: "Monitoreo periodico de peso, % grasa y masa muscular.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health"],
  },
  LAB_REPORT_LOGGED: {
    type: "todo",
    text: "[Brio] Chequeo Clinico y Biomarcadores",
    notes: "Analisis de laboratorio y salud preventiva registrados en Brio.",
    priority: 2,
    tags: ["brio", "health"],
  },
  NUTRITION_HABIT: {
    type: "habit",
    text: "[Brio] Nutricion",
    notes: "Alimentacion limpia, ensalada diaria o cumplimiento del plan.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "health", "nutrition"],
  },
  SCHEDULED_MEAL_COMPLETED: {
    type: "habit",
    text: "[Brio] Comida Programada",
    notes: "Comer segun la planificacion clinica.",
    priority: 1.5,
    up: true,
    down: false,
    tags: ["brio", "health", "nutrition"],
  },
  DAILY_EXPENSES_LOGGED: {
    type: "daily",
    text: "[Brio] Registrar Gastos Diarios",
    notes: "Mantener el registro de finanzas al dia sin omitir gastos.",
    priority: 1.5,
    tags: ["brio", "finance"],
  },
  SAVINGS_CONTRIBUTION: {
    type: "habit",
    text: "[Brio] Aporte a Meta de Ahorro",
    notes: "Aportar capital a fondos de ahorro o inversion.",
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
    text: "[Brio] Sesion de Lectura / Estudio",
    notes: "Avanzar en libros, cursos o documentacion de la Boveda.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "learning"],
  },
  VAULT_COMPLETED: {
    type: "todo",
    text: "[Brio] Finalizar Libro / Curso",
    notes: "Completar un libro, curso o certificacion en la Boveda.",
    priority: 2,
    tags: ["brio", "learning"],
  },
  PROJECT_COMPLETED: {
    type: "todo",
    text: "[Brio] Proyecto Finalizado",
    notes: "Entrega o finalizacion de un proyecto en Brio.",
    priority: 2,
    tags: ["brio", "projects"],
  },
  CIRCADIAN_HABIT_COMPLETED: {
    type: "habit",
    text: "[Brio] Optimizacion Circadiana",
    notes: "Luz solar matutina, corte de cafeina o bloqueo de luz azul.",
    priority: 1,
    up: true,
    down: false,
    tags: ["brio", "health", "circadian"],
  },
};

export interface AwardTaskEventOptions {
  customTitle?: string;
  customNotes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dispatches an event to update or create tasks in the native PostgreSQL database.
 */
export async function awardTaskEvent(
  eventType: HabiticaEventType,
  options?: AwardTaskEventOptions
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  try {
    const template = EVENT_TEMPLATES[eventType];
    if (!template) {
      return { success: false, error: `Unknown event type ${eventType}` };
    }

    const sql = getDb();
    const taskTitle = stripEmojis(options?.customTitle || template.text);
    const taskNotes = stripEmojis(options?.customNotes || template.notes);

    // 1. Search for existing task by exact text match
    const existing = await sql`
      SELECT id, type, completed, streak FROM tasks
      WHERE LOWER(TRIM(text)) = LOWER(TRIM(${taskTitle}))
         OR LOWER(TRIM(text)) = LOWER(TRIM(${template.text}))
      LIMIT 1;
    `;

    if (existing.length > 0) {
      const task = existing[0];
      if (task.type === "habit") {
        await sql`
          UPDATE tasks
          SET counter_up = counter_up + 1,
              updated_at = NOW()
          WHERE id = ${task.id};
        `;
      } else if (task.type === "daily") {
        const streak = task.completed ? Number(task.streak) : Number(task.streak) + 1;
        await sql`
          UPDATE tasks
          SET completed = TRUE,
              completed_at = NOW(),
              streak = ${streak},
              updated_at = NOW()
          WHERE id = ${task.id};
        `;
      } else if (task.type === "todo") {
        await sql`
          UPDATE tasks
          SET completed = TRUE,
              completed_at = NOW(),
              updated_at = NOW()
          WHERE id = ${task.id};
        `;
      }
      return { success: true, taskId: task.id };
    }

    // 2. If not found, provision in database
    const newId = crypto.randomUUID();
    const isCompleted = template.type !== "habit";
    const counterUp = template.type === "habit" ? 1 : 0;
    const streak = template.type === "daily" ? 1 : 0;

    await sql`
      INSERT INTO tasks (
        id, text, notes, type, priority, completed, completed_at,
        streak, up, down, counter_up, counter_down, created_at, updated_at
      ) VALUES (
        ${newId}, ${taskTitle}, ${taskNotes}, ${template.type}, ${template.priority},
        ${isCompleted}, ${isCompleted ? new Date().toISOString() : null},
        ${streak}, TRUE, FALSE, ${counterUp}, 0, NOW(), NOW()
      );
    `;

    return { success: true, taskId: newId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Task Event Error]: Failed to record event ${eventType}:`, message);
    return { success: false, error: message };
  }
}
