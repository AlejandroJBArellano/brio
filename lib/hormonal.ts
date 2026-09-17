import {
  HormonalDailyChecklist,
  HormonalPhaseConfig,
  HormonalPhaseId,
  HormonalScheduleConfig,
} from "./types";

export const DEFAULT_HORMONAL_CONFIG: HormonalScheduleConfig = {
  sleepStart: "21:30",
  sleepEnd: "07:30",
  sleepTargetHours: 10,
  morningFocusStart: "08:30",
  morningFocusEnd: "12:00",
  gymStart: "12:00",
  gymEnd: "14:00",
  lunchStart: "14:00",
  lunchEnd: "15:00",
  afternoonWorkStart: "15:00",
  workHardStop: "19:00",
};

export const DEFAULT_HORMONAL_CHECKLIST: HormonalDailyChecklist = {
  sleep10hLogged: false,
  morningSunlight: false,
  morningDeepWorkDone: false,
  gymSessionCompleted: false,
  postGymNutrition: false,
  hardStop7pmRespected: false,
  nightDimLightMagnesium: false,
};

export const HORMONAL_PHASES_CATALOG: Record<HormonalPhaseId, HormonalPhaseConfig> = {
  wake_sunlight: {
    id: "wake_sunlight",
    name: "Luz solar y agua",
    shortName: "Luz solar",
    startTime: "07:30",
    endTime: "08:30",
    icon: "Sun",
    color: "#f59e0b",
    hormoneFocus: "Inicio de día",
    actionHeadline: "Sol y agua",
    description: "Recibe luz solar directa y toma agua con electrolitos al despertar.",
    keyNutrientsOrTips: [
      "Agua con electrolitos",
      "10-15 min de luz solar directa",
    ],
  },
  morning_deep_work: {
    id: "morning_deep_work",
    name: "Deep Work",
    shortName: "Deep Work",
    startTime: "08:30",
    endTime: "12:00",
    icon: "Zap",
    color: "#3b82f6",
    hormoneFocus: "Foco",
    actionHeadline: "Deep Work",
    description: "Bloque de máxima concentración para las tareas más importantes.",
    keyNutrientsOrTips: [
      "Sin distracciones",
      "Completar tarea prioritaria",
    ],
  },
  gym_power: {
    id: "gym_power",
    name: "Gimnasio",
    shortName: "Gimnasio",
    startTime: "12:00",
    endTime: "14:00",
    icon: "Dumbbell",
    color: "#ef4444",
    hormoneFocus: "Fuerza",
    actionHeadline: "Entrenar",
    description: "Entrenamiento de fuerza y desconexión laboral.",
    keyNutrientsOrTips: [
      "Sobrecarga progresiva",
      "Hidratación constante",
    ],
  },
  anabolic_lunch: {
    id: "anabolic_lunch",
    name: "Almuerzo",
    shortName: "Almuerzo",
    startTime: "14:00",
    endTime: "15:00",
    icon: "Utensils",
    color: "#10b981",
    hormoneFocus: "Nutrición",
    actionHeadline: "Almorzar",
    description: "Comida completa alta en proteína y nutrientes sin pesadez.",
    keyNutrientsOrTips: [
      "Proteína y carbohidratos limpios",
      "Grasas saludables",
    ],
  },
  afternoon_flow: {
    id: "afternoon_flow",
    name: "Trabajo y proyectos",
    shortName: "Trabajo",
    startTime: "15:00",
    endTime: "19:00",
    icon: "Briefcase",
    color: "#8b5cf6",
    hormoneFocus: "Gestión",
    actionHeadline: "Avanzar proyectos",
    description: "Reuniones, resolución de pendientes y avance en proyectos.",
    keyNutrientsOrTips: [
      "Bloques de trabajo enfocado",
      "Preparar cierre laboral",
    ],
  },
  evening_hard_stop: {
    id: "evening_hard_stop",
    name: "Cierre laboral y relax",
    shortName: "Cierre 7 PM",
    startTime: "19:00",
    endTime: "21:30",
    icon: "Moon",
    color: "#ec4899",
    hormoneFocus: "Desconexión",
    actionHeadline: "Cierre de jornada",
    description: "Corte total de trabajo, luces cálidas y desconexión mental.",
    keyNutrientsOrTips: [
      "Cero trabajo después de las 7:00 PM",
      "Cena ligera y luces tenues",
    ],
  },
  deep_sleep_10h: {
    id: "deep_sleep_10h",
    name: "Sueño reparador",
    shortName: "Sueño 10h",
    startTime: "21:30",
    endTime: "07:30",
    icon: "Moon",
    color: "#6366f1",
    hormoneFocus: "Recuperación",
    actionHeadline: "Dormir",
    description: "Descanso profundo para recuperación física y mental.",
    keyNutrientsOrTips: [
      "Habitación oscura y fresca",
      "Sin pantallas en la cama",
    ],
  },
};

/**
 * Parses "HH:MM" into minutes from midnight (0 to 1439).
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formats minutes from midnight into "HH:MM AM/PM" or 24h.
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = (minutes + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const padH = h.toString().padStart(2, "0");
  const padM = m.toString().padStart(2, "0");
  return `${padH}:${padM}`;
}

/**
 * Determines which hormonal phase corresponds to the given time in minutes.
 */
export function getPhaseByMinutes(
  minutes: number,
  config: HormonalScheduleConfig = DEFAULT_HORMONAL_CONFIG
): HormonalPhaseId {
  const wakeMin = timeStringToMinutes(config.sleepEnd); // 07:30 -> 450
  const morningWorkMin = timeStringToMinutes(config.morningFocusStart); // 08:30 -> 510
  const gymMin = timeStringToMinutes(config.gymStart); // 12:00 -> 720
  const lunchMin = timeStringToMinutes(config.lunchStart); // 14:00 -> 840
  const afterWorkMin = timeStringToMinutes(config.afternoonWorkStart); // 15:00 -> 900
  const hardStopMin = timeStringToMinutes(config.workHardStop); // 19:00 -> 1140
  const sleepStartMin = timeStringToMinutes(config.sleepStart); // 21:30 -> 1290

  // 1. Wake & Sunlight: 07:30 to 08:30
  if (minutes >= wakeMin && minutes < morningWorkMin) {
    return "wake_sunlight";
  }

  // 2. Morning Deep Work: 08:30 to 12:00
  if (minutes >= morningWorkMin && minutes < gymMin) {
    return "morning_deep_work";
  }

  // 3. Gym & Power: 12:00 to 14:00
  if (minutes >= gymMin && minutes < lunchMin) {
    return "gym_power";
  }

  // 4. Anabolic Lunch: 14:00 to 15:00
  if (minutes >= lunchMin && minutes < afterWorkMin) {
    return "anabolic_lunch";
  }

  // 5. Afternoon Work: 15:00 to 19:00
  if (minutes >= afterWorkMin && minutes < hardStopMin) {
    return "afternoon_flow";
  }

  // 6. Evening Hard Stop: 19:00 to 21:30
  if (minutes >= hardStopMin && minutes < sleepStartMin) {
    return "evening_hard_stop";
  }

  // 7. Deep Sleep 10h: 21:30 to 07:30 (crosses midnight)
  return "deep_sleep_10h";
}

/**
 * Calculates current active phase, progress percentage within the phase,
 * and remaining minutes.
 */
export function getHormonalStatus(
  date: Date = new Date(),
  config: HormonalScheduleConfig = DEFAULT_HORMONAL_CONFIG
) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const phaseId = getPhaseByMinutes(currentMinutes, config);
  const phaseConfig = HORMONAL_PHASES_CATALOG[phaseId];

  // Calculate start and end in minutes
  const startMin = timeStringToMinutes(phaseConfig.startTime);
  const endMin = timeStringToMinutes(phaseConfig.endTime);

  // Handle overnight phase (e.g. 21:30 to 07:30)
  let totalDuration = endMin - startMin;
  let elapsed = currentMinutes - startMin;

  if (startMin > endMin) {
    // Crosses midnight
    totalDuration = 1440 - startMin + endMin;
    if (currentMinutes >= startMin) {
      elapsed = currentMinutes - startMin;
    } else {
      elapsed = 1440 - startMin + currentMinutes;
    }
  }

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((elapsed / Math.max(1, totalDuration)) * 100))
  );
  const remainingMinutes = Math.max(0, totalDuration - elapsed);

  const remainingFormatted =
    remainingMinutes >= 60
      ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`
      : `${remainingMinutes}m`;

  // Determine next phase
  const phaseOrder: HormonalPhaseId[] = [
    "wake_sunlight",
    "morning_deep_work",
    "gym_power",
    "anabolic_lunch",
    "afternoon_flow",
    "evening_hard_stop",
    "deep_sleep_10h",
  ];
  const currentIndex = phaseOrder.indexOf(phaseId);
  const nextPhaseId = phaseOrder[(currentIndex + 1) % phaseOrder.length];
  const nextPhase = HORMONAL_PHASES_CATALOG[nextPhaseId];

  const isHardStopActive = currentMinutes >= timeStringToMinutes(config.workHardStop);

  return {
    currentPhase: phaseConfig,
    progressPercent,
    remainingMinutes,
    remainingFormatted,
    nextPhase,
    isHardStopActive,
    currentMinutes,
    timeFormatted: date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}
