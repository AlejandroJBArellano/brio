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

  const handleTestNotification = async () => {
    if (permission !== "granted") {
      await handleRequestPermission();
      return;
    }
    const success = await sendBrioNotification("⚡ Brio OS — Notificación de Prueba", {
      body: "¡Tus recordatorios inteligentes están configurados correctamente y listos!",
      tag: "test-notification",
    });
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2723] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#F5F2EB]">
                Recordatorios & Notificaciones
              </h2>
              <p className="text-xs text-[#8E867B]">
                Alertas automáticas en tu navegador y celular (PWA)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Permission Banner */}
        <div className="mt-4 font-mono">
          {permission !== "granted" ? (
            <div className="rounded-lg border border-[#D99B43]/30 bg-[#221D16] p-3.5 flex items-center justify-between gap-3 font-sans">
              <div className="text-xs text-[#DDD6C9]">
                <span className="font-semibold block text-[#D99B43]">
                  Permiso de notificaciones requerido
                </span>
                Habilita las notificaciones para que Brio te avise en tus
                horarios clave.
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Activar
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-[#7EA35A]/30 bg-[#1C2219] p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#7EA35A] font-medium font-sans">
                <Check className="size-4 text-[#7EA35A]" />
                Permisos del sistema activos
              </div>
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3 py-1 rounded-lg bg-[#121110] hover:bg-[#22201D] text-[#DDD6C9] text-xs font-medium border border-[#2A2723] transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <Sparkles className="size-3 text-[#D99B43]" />
                {testSent ? "¡Enviada!" : "Probar Notificación"}
              </button>
            </div>
          )}
        </div>

        {/* Settings List */}
        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Suplementos Mañana */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                <Sun className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">
                  Suplementos de la Mañana
                </p>
                <p className="text-xs text-[#8E867B]">
                  Alerta si tienes suplementos matutinos pendientes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <input
                type="time"
                value={settings.supplementsMorningTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplementsMorningTime: e.target.value,
                  })
                }
                className="rounded-md bg-[#181715] border border-[#2A2723] px-2 py-1 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
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
                className="size-4 rounded accent-[#D99B43] cursor-pointer"
              />
            </div>
          </div>

          {/* Suplementos Tarde */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30">
                <Pill className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">
                  Suplementos de la Tarde
                </p>
                <p className="text-xs text-[#8E867B]">
                  Alerta si faltan suplementos del turno vespertino
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <input
                type="time"
                value={settings.supplementsAfternoonTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    supplementsAfternoonTime: e.target.value,
                  })
                }
                className="rounded-md bg-[#181715] border border-[#2A2723] px-2 py-1 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
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
                className="size-4 rounded accent-[#D99B43] cursor-pointer"
              />
            </div>
          </div>

          {/* Hidratación */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#162322] text-[#4EAB9E] border border-[#4EAB9E]/30">
                <Droplet className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">
                  Recordatorio de Hidratación
                </p>
                <p className="text-xs text-[#8E867B]">
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
              className="size-4 rounded accent-[#D99B43] cursor-pointer"
            />
          </div>

          {/* Alerta Gastos Hormiga */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#2A1715] text-[#E05D52] border border-[#E05D52]/30">
                <ShieldAlert className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">
                  Alerta de Gastos Hormiga
                </p>
                <p className="text-xs text-[#8E867B]">
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
              className="size-4 rounded accent-[#D99B43] cursor-pointer"
            />
          </div>

          {/* Ritual Matutino */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">
                  Ritual Matutino (AM)
                </p>
                <p className="text-xs text-[#8E867B]">
                  Recordatorio para elegir tus 3 Must-Win tasks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <input
                type="time"
                value={settings.morningRitualTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    morningRitualTime: e.target.value,
                  })
                }
                className="rounded-md bg-[#181715] border border-[#2A2723] px-2 py-1 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
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
                className="size-4 rounded accent-[#D99B43] cursor-pointer"
              />
            </div>
          </div>

          {/* Cierre Nocturno */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                <Moon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">
                  Cierre Nocturno (PM)
                </p>
                <p className="text-xs text-[#8E867B]">
                  Work Shutdown & protección de HP en Habitica
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <input
                type="time"
                value={settings.eveningReviewTime}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    eveningReviewTime: e.target.value,
                  })
                }
                className="rounded-md bg-[#181715] border border-[#2A2723] px-2 py-1 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
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
                className="size-4 rounded accent-[#D99B43] cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Chime */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#181715] border border-[#2A2723] text-[#DDD6C9]">
                {settings.soundEnabled ? (
                  <Volume2 className="size-4 text-[#D99B43]" />
                ) : (
                  <VolumeX className="size-4 text-[#8E867B]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#F5F2EB]">Sonido Chime</p>
                <p className="text-xs text-[#8E867B]">
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
              className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                settings.soundEnabled
                  ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30"
                  : "bg-[#181715] text-[#8E867B] border border-[#2A2723]"
              }`}
            >
              {settings.soundEnabled ? "Activado" : "Silencio"}
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#2A2723] pt-4 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#8E867B] hover:text-[#DDD6C9] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] text-xs font-bold shadow-xs transition-all cursor-pointer font-sans"
          >
            {savedSuccess ? (
              <>
                <Check className="size-4 text-[#121110]" />
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
