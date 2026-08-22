"use client";

import { Calendar, HelpCircle, Link as LinkIcon, Save, X } from "lucide-react";
import { useState } from "react";

interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl?: string;
  onSave: (url: string) => void;
}

export function CalendarSettingsModal({
  isOpen,
  onClose,
  currentUrl = "",
  onSave,
}: CalendarSettingsModalProps) {
  const [url, setUrl] = useState(currentUrl);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Configurar Google Calendar (iCal)
              </h2>
              <p className="text-xs text-neutral-400">
                Sincronización privada de reuniones y eventos en tiempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Dirección secreta en formato iCal de Google Calendar
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.1] bg-neutral-950/80 pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-neutral-950/60 p-3.5 text-xs text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-neutral-200">
              <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
              <span>¿Cómo obtener tu enlace privado iCal?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-400 pl-1">
              <li>Abre <strong>Google Calendar</strong> en tu navegador.</li>
              <li>Ve a <strong>Configuración</strong> &gt; selecciona tu calendario a la izquierda.</li>
              <li>Baja a la sección <strong>&quot;Integrar el calendario&quot;</strong>.</li>
              <li>Copia la <strong>&quot;Dirección secreta en formato iCal&quot;</strong> y pégala aquí.</li>
            </ol>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 font-semibold text-xs text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Calendario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
