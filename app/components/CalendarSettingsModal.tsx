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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Configurar Google Calendar (iCal)
              </h2>
              <p className="text-xs text-[#8E867B]">
                Sincronización privada de reuniones y eventos en tiempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-mono">
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Dirección secreta en formato iCal de Google Calendar
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
              <input
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-9 pr-4 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:border-[#D99B43] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 text-xs text-[#8E867B] space-y-1.5 font-sans">
            <div className="flex items-center gap-1.5 font-bold text-[#DDD6C9]">
              <HelpCircle className="h-3.5 w-3.5 text-[#D99B43]" />
              <span>¿Cómo obtener tu enlace privado iCal?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#8E867B] pl-1">
              <li>Abre <strong>Google Calendar</strong> en tu navegador.</li>
              <li>Ve a <strong>Configuración</strong> &gt; selecciona tu calendario a la izquierda.</li>
              <li>Baja a la sección <strong>&quot;Integrar el calendario&quot;</strong>.</li>
              <li>Copia la <strong>&quot;Dirección secreta en formato iCal&quot;</strong> y pégala aquí.</li>
            </ol>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2723] font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs cursor-pointer"
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
