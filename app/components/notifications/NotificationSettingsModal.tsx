"use client";

import {
  getNotificationSettings,
  NotificationSettings,
  playNotificationChime,
  requestNotificationPermission,
  saveNotificationSettings,
  sendBrioNotification,
} from "@/lib/notifications";
import {
  Bell,
  Check,
  Clock,
  Droplet,
  Moon,
  Pill,
  ShieldAlert,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useState } from "react";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  if (!isOpen) return null;
  return <NotificationSettingsModalContent onClose={onClose} />;
}

function NotificationSettingsModalContent({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm === "granted") {
      setSettings((prev) => ({ ...prev, enabled: true }));
      saveNotificationSettings({ ...settings, enabled: true });
    }
  };

  const handleSave = () => {
    saveNotificationSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestNotification = () => {
    if (permission !== "granted") {
      handleRequestPermission();
      return;
    }
    const success = sendBrioNotification("⚡ Brio OS — Notificación de Prueba", {
      body: "¡Tus recordatorios inteligentes están configurados correctamente y listos!",
      tag: "test-notification",
    });
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recordatorios & Notificaciones
              </h2>
              <p className="text-xs text-neutral-400">
                Alertas automáticas en tu navegador y celular (PWA)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Permission Banner */}
        <div className="mt-4">
          {permission !== "granted" ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-200">
                <span className="font-semibold block text-amber-300">
                  Permiso de notificaciones requerido
                </span>
                Habilita las notificaciones para que Brio te avise en tus
                horarios clave.
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold shadow transition-colors"
              >
                Activar
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                <Check className="size-4 text-emerald-400" />
                Permisos del sistema activos
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="size-3 text-indigo-400" />
                {testSent ? "¡Enviada!" : "Probar Notificación"}
              </button>
            </div>
          )}
        </div>

        {/* Settings List */}
        <div className="mt-4 space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Suplementos Mañana */}
          <div className="rounded-2xl border border-white/8 bg-neutral-800/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sun className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Suplementos de la Mañana
                </p>
                <p className="text-xs text-neutral-400">
                  Alerta si tienes suplementos matutinos pendientes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.supplementsMorningTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplementsMorningTime: e.target.value,
                  })
                }
                className="rounded-lg bg-neutral-900 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="checkbox"
                checked={settings.supplementsMorning}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplementsMorning: e.target.checked,
                  })
                }
                className="size-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Suplementos Tarde */}
          <div className="rounded-2xl border border-white/8 bg-neutral-800/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Pill className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Suplementos de la Tarde
                </p>
                <p className="text-xs text-neutral-400">
                  Alerta si faltan suplementos del turno vespertino
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.supplementsAfternoonTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplementsAfternoonTime: e.target.value,
                  })
                }
                className="rounded-lg bg-neutral-900 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="checkbox"
                checked={settings.supplementsAfternoon}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplementsAfternoon: e.target.checked,
                  })
                }
                className="size-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Hidratación */}
          <div className="rounded-2xl border border-white/8 bg-neutral-800/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Droplet className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Recordatorio de Hidratación
                </p>
                <p className="text-xs text-neutral-400">
                  Aviso periódico si vas atrás de la meta de 3L
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.hydrationPacing}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hydrationPacing: e.target.checked,
                })
              }
              className="size-4 rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Alerta Gastos Hormiga */}
          <div className="rounded-2xl border border-white/8 bg-neutral-800/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Alerta de Gastos Hormiga
                </p>
                <p className="text-xs text-neutral-400">
                  Aviso preventivo al superar el 80% ($120 de $150 MXN)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.antExpenseAlert}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  antExpenseAlert: e.target.checked,
                })
              }
              className="size-4 rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Ritual Matutino */}
          <div className="rounded-2xl border border-white/8 bg-neutral-800/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Ritual Matutino (AM)
                </p>
                <p className="text-xs text-neutral-400">
                  Recordatorio para elegir tus 3 Must-Win tasks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.morningRitualTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    morningRitualTime: e.target.value,
                  })
                }
                className="rounded-lg bg-neutral-900 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="checkbox"
                checked={settings.morningRitualReminder}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    morningRitualReminder: e.target.checked,
                  })
                }
                className="size-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Cierre Nocturno */}
          <div className="rounded-2xl border border-white/8 bg-neutral-800/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <Moon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Cierre Nocturno (PM)
                </p>
                <p className="text-xs text-neutral-400">
                  Work Shutdown & protección de HP en Habitica
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={settings.eveningReviewTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    eveningReviewTime: e.target.value,
                  })
                }
                className="rounded-lg bg-neutral-900 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="checkbox"
                checked={settings.eveningReviewReminder}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    eveningReviewReminder: e.target.checked,
                  })
                }
                className="size-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Chime */}
          <div className="rounded-2xl border border-white/8 bg-neutral-800/40 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-700 text-neutral-300">
                {settings.soundEnabled ? (
                  <Volume2 className="size-4 text-indigo-400" />
                ) : (
                  <VolumeX className="size-4 text-neutral-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Sonido Chime</p>
                <p className="text-xs text-neutral-400">
                  Tono sutil y elegante de notificación Web Audio
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.soundEnabled;
                setSettings({ ...settings, soundEnabled: next });
                if (next) playNotificationChime();
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                settings.soundEnabled
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "bg-white/5 text-neutral-400 border border-white/10"
              }`}
            >
              {settings.soundEnabled ? "Activado" : "Silencio"}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/8 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            {savedSuccess ? (
              <>
                <Check className="size-4 text-white" />
                ¡Guardado!
              </>
            ) : (
              "Guardar Configuración"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
