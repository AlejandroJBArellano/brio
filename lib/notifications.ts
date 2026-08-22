/**
 * Brio Web Notifications & Smart Reminders Engine
 * Works across desktop and mobile PWA (iOS 16.4+ & Android Chrome).
 */

export interface NotificationSettings {
  enabled: boolean;
  supplementsMorning: boolean;
  supplementsMorningTime: string; // "08:30"
  supplementsAfternoon: boolean;
  supplementsAfternoonTime: string; // "14:30"
  hydrationPacing: boolean;
  hydrationIntervalHours: number; // 2
  antExpenseAlert: boolean;
  antExpenseThresholdPercent: number; // 80% ($120 of $150)
  morningRitualReminder: boolean;
  morningRitualTime: string; // "08:00"
  eveningReviewReminder: boolean;
  eveningReviewTime: string; // "20:30"
  soundEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  supplementsMorning: true,
  supplementsMorningTime: "08:30",
  supplementsAfternoon: true,
  supplementsAfternoonTime: "14:30",
  hydrationPacing: true,
  hydrationIntervalHours: 2,
  antExpenseAlert: true,
  antExpenseThresholdPercent: 80,
  morningRitualReminder: true,
  morningRitualTime: "08:00",
  eveningReviewReminder: true,
  eveningReviewTime: "20:30",
  soundEnabled: true,
};

const STORAGE_KEY = "brio_notification_settings_v1";
const LAST_SENT_KEY = "brio_notifications_sent_log_v1";

/**
 * Load persisted notification settings from localStorage.
 */
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Save notification settings to localStorage.
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save notification settings", err);
  }
}

/**
 * Request native browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const current = getNotificationSettings();
      saveNotificationSettings({ ...current, enabled: true });
    }
    return permission;
  } catch (err) {
    console.error("Error requesting notification permission", err);
    return "denied";
  }
}

/**
 * Play a subtle clean notification audio chime using Web Audio API (no external asset needed).
 */
export function playNotificationChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    // Pleasant high chime: 880Hz (A5) -> 1318.5Hz (E6)
    osc1.frequency.setValueAtTime(880, now);
    osc2.frequency.setValueAtTime(1318.5, now + 0.08);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.45);
  } catch {
    // Ignore audio context autoplay restriction
  }
}

/**
 * Send a notification if permitted.
 */
export function sendBrioNotification(
  title: string,
  options?: NotificationOptions & { playSound?: boolean }
): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  if (Notification.permission !== "granted") return false;

  try {
    const settings = getNotificationSettings();
    if (options?.playSound !== false && settings.soundEnabled) {
      playNotificationChime();
    }

    const n = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      silent: false,
      ...options,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };

    return true;
  } catch (err) {
    console.error("Failed to send notification", err);
    return false;
  }
}

interface SentNotificationLog {
  [key: string]: number; // key -> timestamp ms
}

function getSentLog(): SentNotificationLog {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LAST_SENT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordSentNotification(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const log = getSentLog();
    log[key] = Date.now();
    localStorage.setItem(LAST_SENT_KEY, JSON.stringify(log));
  } catch {}
}

/**
 * Checks whether a notification of a given key has already been sent today.
 */
function alreadySentToday(key: string): boolean {
  const log = getSentLog();
  const timestamp = log[key];
  if (!timestamp) return false;
  const sentDate = new Date(timestamp).toDateString();
  const today = new Date().toDateString();
  return sentDate === today;
}

/**
 * Main inspection function to trigger scheduled checks.
 */
export function checkAndTriggerSmartReminders(data: {
  todaySupplements?: Array<{ id: string; name: string; timing?: string; taken: boolean }>;
  waterMl?: number;
  todayAntExpenses?: number;
  antExpenseDailyLimit?: number;
  hasCompletedMorningRitual?: boolean;
  hasCompletedEveningReview?: boolean;
}): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;

  const parseTimeMinutes = (timeStr: string) => {
    const [h, m] = (timeStr || "00:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // 1. Morning Supplements Reminder
  if (settings.supplementsMorning) {
    const morningTime = parseTimeMinutes(settings.supplementsMorningTime);
    // Trigger if time has arrived and not sent today
    if (currentTimeMinutes >= morningTime && !alreadySentToday("supplements_morning")) {
      const pendingMorning = (data.todaySupplements || []).filter(
        (s) =>
          !s.taken &&
          ((s.timing || "").toLowerCase().includes("mañana") ||
            (s.timing || "").toLowerCase().includes("morning") ||
            (s.timing || "").toLowerCase().includes("desayuno"))
      );

      if (pendingMorning.length > 0) {
        sendBrioNotification("💊 Suplementos de la Mañana", {
          body: `Tienes ${pendingMorning.length} suplementos pendientes (${pendingMorning
            .slice(0, 3)
            .map((s) => s.name.split("(")[0].trim())
            .join(", ")}). ¡Tómalos para energizar tu día!`,
          tag: "supplements-morning",
        });
        recordSentNotification("supplements_morning");
      }
    }
  }

  // 2. Afternoon Supplements Reminder
  if (settings.supplementsAfternoon) {
    const afternoonTime = parseTimeMinutes(settings.supplementsAfternoonTime);
    if (currentTimeMinutes >= afternoonTime && !alreadySentToday("supplements_afternoon")) {
      const pendingAfternoon = (data.todaySupplements || []).filter(
        (s) =>
          !s.taken &&
          ((s.timing || "").toLowerCase().includes("tarde") ||
            (s.timing || "").toLowerCase().includes("afternoon") ||
            (s.timing || "").toLowerCase().includes("comida"))
      );

      if (pendingAfternoon.length > 0) {
        sendBrioNotification("💊 Suplementos de la Tarde", {
          body: `Recuerda tomar tus suplementos de la tarde (${pendingAfternoon
            .slice(0, 3)
            .map((s) => s.name.split("(")[0].trim())
            .join(", ")}).`,
          tag: "supplements-afternoon",
        });
        recordSentNotification("supplements_afternoon");
      }
    }
  }

  // 3. Hydration Pacing Reminder (between 10:00 and 20:00)
  if (settings.hydrationPacing && currentHours >= 10 && currentHours <= 20) {
    const waterMl = data.waterMl || 0;
    // Expected pacing: by 14:00 should have >= 1500ml, by 18:00 >= 2200ml
    const expectedMl = Math.round(((currentHours - 8) / 12) * 3000);
    const lastSentHydration = getSentLog()["hydration_pacing_last"];
    const twoHoursMs = (settings.hydrationIntervalHours || 2) * 60 * 60 * 1000;

    if (
      waterMl < expectedMl - 500 &&
      (!lastSentHydration || Date.now() - lastSentHydration >= twoHoursMs)
    ) {
      sendBrioNotification("💧 Recordatorio de Hidratación", {
        body: `Llevas ${waterMl}ml de 3,000ml. Toma un vaso de agua (+250ml o +500ml) para mantener tu enfoque.`,
        tag: "hydration-reminder",
      });
      recordSentNotification("hydration_pacing_last");
    }
  }

  // 4. Ant-Expense Warning Alert
  if (settings.antExpenseAlert) {
    const antSpent = data.todayAntExpenses || 0;
    const limit = data.antExpenseDailyLimit || 150;
    const threshold = (limit * (settings.antExpenseThresholdPercent || 80)) / 100;

    if (antSpent >= threshold && !alreadySentToday("ant_expense_threshold")) {
      sendBrioNotification("🚨 Alerta de Gastos Hormiga", {
        body: `Has consumido $${antSpent.toFixed(0)} MXN de tu presupuesto diario de $${limit} MXN (${Math.round(
          (antSpent / limit) * 100
        )}%). ¡Cuidado con los gustitos no planeados!`,
        tag: "ant-expense-alert",
      });
      recordSentNotification("ant_expense_threshold");
    }
  }

  // 5. Morning Ritual Reminder
  if (settings.morningRitualReminder && !data.hasCompletedMorningRitual) {
    const morningTime = parseTimeMinutes(settings.morningRitualTime);
    if (currentTimeMinutes >= morningTime && !alreadySentToday("morning_ritual")) {
      sendBrioNotification("🌅 Ritual Matutino Brio", {
        body: "Momento de planear tus 3 tareas Must-Win del día y revisar tu agenda ⚡",
        tag: "morning-ritual-reminder",
      });
      recordSentNotification("morning_ritual");
    }
  }

  // 6. Evening Review / Work Shutdown Reminder
  if (settings.eveningReviewReminder && !data.hasCompletedEveningReview) {
    const eveningTime = parseTimeMinutes(settings.eveningReviewTime);
    if (currentTimeMinutes >= eveningTime && !alreadySentToday("evening_review")) {
      sendBrioNotification("🌙 Cierre Nocturno & Work Shutdown", {
        body: "Hora de apagar la mente laboral, registrar tus victorias y descansar sin daño en Habitica.",
        tag: "evening-review-reminder",
      });
      recordSentNotification("evening_review");
    }
  }
}
