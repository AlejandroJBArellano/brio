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
    name: "Despertar & Recarga Solar",
    shortName: "Luz Solar & Hidratación",
    startTime: "07:30",
    endTime: "08:30",
    icon: "🌅",
    color: "#f59e0b", // Amber
    hormoneFocus: "Pico de Testosterona (+35%) & Cortisol Natural",
    actionHeadline: "Carga de Luz Natural & Electrolitos",
    description:
      "Despiertas tras 10 horas de sueño reparador. Tu testosterona y cortisol natural están en su punto más alto del día. Hidrátate con 500ml de agua fresca + pizca de sal de mar y sal a recibir 10-15 min de luz solar directa.",
    keyNutrientsOrTips: [
      "500ml - 750ml de agua + electrolitos",
      "10-15 minutos de luz solar directa a los ojos (sin gafas de sol)",
      "Cero cafeína necesaria: tu cortisol natural eleva la alerta limpiamente",
    ],
  },
  morning_deep_work: {
    id: "morning_deep_work",
    name: "Ventana Dorada de Deep Work",
    shortName: "Deep Work Matutino",
    startTime: "08:30",
    endTime: "12:00",
    icon: "⚡",
    color: "#3b82f6", // Blue
    hormoneFocus: "Máxima Agudeza Analítica & Dopamina",
    actionHeadline: "Atacar Tareas de Mayor Fricción (Must-Win 3)",
    description:
      "3.5 horas de foco ininterrumpido. El cerebro masculino cuenta con máxima capacidad de toma de decisiones difíciles, pensamiento crítico y tolerancia al esfuerzo mental.",
    keyNutrientsOrTips: [
      "Modo Zen en Brio (⌘P) sin notificaciones ni pestañas abiertas",
      "Completar la tarea Must-Win #1 del día antes del mediodía",
      "Mantener hidratación constante (botella de 1L cerca)",
    ],
  },
  gym_power: {
    id: "gym_power",
    name: "Gimnasio & Entrenamiento de Fuerza",
    shortName: "Gym & Fuerza (Hevy)",
    startTime: "12:00",
    endTime: "14:00",
    icon: "🏋️",
    color: "#ef4444", // Red / Rose
    hormoneFocus: "Pico Neuromuscular & Estímulo Anabólico",
    actionHeadline: "Entrenamiento Intenso & Desconexión Mental",
    description:
      "Tu temperatura corporal y activación neuromuscular están en ascenso. Este bloque es un corte total con el trabajo mental para canalizar energía al entrenamiento de sobrecarga progresiva.",
    keyNutrientsOrTips: [
      "Registrar sets y cargas en Hevy (⌘5)",
      "Creatina 5g + agua durante/post sesión",
      "Ducha fría/tibia de reinicio tras el entrenamiento",
    ],
  },
  anabolic_lunch: {
    id: "anabolic_lunch",
    name: "Almuerzo Post-Gym Anabólico",
    shortName: "Almuerzo <15 min",
    startTime: "14:00",
    endTime: "15:00",
    icon: "🥗",
    color: "#10b981", // Emerald
    hormoneFocus: "Sensibilidad a Insulina & Reposición de Glucógeno",
    actionHeadline: "Comida Densa en Nutrientes sin Pesadez",
    description:
      "Ventana anabólica óptima para asimilar nutrientes. Preparar una comida en <15 min con el Asistente de Despensa: alta en proteína, grasas saludables (aguacate, aceite de oliva) y carbohidratos complejos.",
    keyNutrientsOrTips: [
      "Proteína de alta biodisponibilidad + carbohidratos limpios (arroz, quinoa, papa)",
      "Grasas monoinsaturadas (aguacate, semillas) precursoras de andrógenos",
      "Evitar azúcares simples o harinas ultraprocesadas para no generar somnolencia",
    ],
  },
  afternoon_flow: {
    id: "afternoon_flow",
    name: "Bloque Laboral 2: Gestión & Proyectos",
    shortName: "Trabajo & Proyectos",
    startTime: "15:00",
    endTime: "19:00",
    icon: "💼",
    color: "#8b5cf6", // Purple
    hormoneFocus: "Foco Sostenido & Tareas Operativas",
    actionHeadline: "Avanzar Proyectos y Preparar Cierre",
    description:
      "4 horas para reuniones, resolución de tickets, revisión de código y avances en proyectos secundarios. La energía se mantiene estable gracias al almuerzo sin crash glucémico.",
    keyNutrientsOrTips: [
      "Trabajo por bloques de 50m / 10m de pausa",
      "Infusión de hierbas o agua fresca",
      "Dejar todo listo para el corte definitivo a las 7:00 PM",
    ],
  },
  evening_hard_stop: {
    id: "evening_hard_stop",
    name: "Hard Stop 7:00 PM & Dim Light",
    shortName: "Hard Stop 7PM & Relax",
    startTime: "19:00",
    endTime: "21:30",
    icon: "⛔",
    color: "#ec4899", // Pink / Sunset
    hormoneFocus: "Caída de Cortisol & Producción de Melatonina",
    actionHeadline: "Cierre Total de Trabajo (⌘E) & Desconexión",
    description:
      "LÍMITE ESTRICTO: Cero trabajo ni pantallas estresantes después de las 7:00 PM. Ejecuta el Cierre Nocturno en Brio (⌘E). Cena ligera, luces cálidas y preparación mental para descansar.",
    keyNutrientsOrTips: [
      "Disparar animación de 'Work Shutdown Complete' (⌘E)",
      "Cena ligera y digestiva 2 horas antes de acostarse",
      "Magnesio Bisglicinato + Zinc para optimizar el sueño delta",
      "Luces bajas y ambiente fresco en la habitación (~19°C)",
    ],
  },
  deep_sleep_10h: {
    id: "deep_sleep_10h",
    name: "10 Horas de Sueño Profundo & Síntesis Androgénica",
    shortName: "10h Sueño Profundo",
    startTime: "21:30",
    endTime: "07:30",
    icon: "💤",
    color: "#6366f1", // Indigo
    hormoneFocus: "80%+ Síntesis Nocturna de Testosterona & Hormona de Crecimiento (GH)",
    actionHeadline: "Regeneración Celular, Neuromuscular y Hormonal",
    description:
      "Tu cuerpo entra en el estado de mayor reconstrucción biológica. Durante las fases No-REM 3/4 y REM, el eje hipotálamo-hipófisis libera los pulsos de GH y LH que recargan tu testosterona para mañana.",
    keyNutrientsOrTips: [
      "Oscuridad total (cortinas blackout o antifaz)",
      "Cero teléfono ni notificaciones en la cama",
      "Meta innegociable: 10 horas completas de descanso reparador",
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
