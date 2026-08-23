"use client";

import { CalendarDaySchedule } from "@/lib/types";
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { CalendarSettingsModal } from "./CalendarSettingsModal";

interface DayScheduleViewProps {
  schedule: CalendarDaySchedule;
  isConfigured: boolean;
  onRefresh?: () => void;
  onSaveCalendarUrl?: (url: string) => void;
}

export function DayScheduleView({
  schedule,
  isConfigured,
  onRefresh,
  onSaveCalendarUrl,
}: DayScheduleViewProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const hours = schedule.totalMeetingMinutes > 0 ? Math.floor(schedule.totalMeetingMinutes / 60) : 0;
  const mins = schedule.totalMeetingMinutes % 60;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Agenda de Google Calendar
              </h2>
              {isConfigured ? (
                <span className="rounded-md border border-[#7EA35A]/30 bg-[#1C2219] px-2 py-0.5 text-[10px] font-bold text-[#7EA35A]">
                  En Vivo
                </span>
              ) : (
                <span className="rounded-md border border-[#D99B43]/30 bg-[#221D16] px-2 py-0.5 text-[10px] font-bold text-[#D99B43]">
                  Modo Preview / Demo
                </span>
              )}
            </div>
            <p className="text-xs text-[#8E867B]">
              {schedule.events.length} evento(s) hoy • {hours > 0 ? `${hours}h ` : ""}{mins}m de reuniones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2A2723] bg-[#121110] text-xs text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sincronizar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D99B43]/30 bg-[#221D16] text-xs text-[#D99B43] hover:bg-[#2A231A] transition-colors font-medium cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Configurar iCal</span>
          </button>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
        <div className="space-y-3">
          {schedule.events.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8E867B] font-mono">
              No tienes eventos programados para hoy. ¡Día libre para deep work! 🚀
            </div>
          ) : (
            schedule.events.map((event, idx) => {
              const isNow = event.status === "now";
              const isPast = event.status === "past";

              return (
                <div
                  key={event.id || idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all ${
                    isNow
                      ? "border-[#D99B43]/40 bg-[#221D16] shadow-xs"
                      : isPast
                      ? "border-[#2A2723]/60 bg-[#121110]/50 opacity-60"
                      : "border-[#2A2723] bg-[#121110] hover:border-[#38332D]"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                        isNow
                          ? "bg-[#D99B43] text-[#121110]"
                          : "bg-[#181715] text-[#8E867B] border border-[#2A2723]"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-semibold tracking-tight ${
                            isPast ? "line-through text-[#8E867B]" : "text-[#F5F2EB]"
                          }`}
                        >
                          {event.title}
                        </h4>
                        {isNow && (
                          <span className="rounded bg-[#D99B43] text-[#121110] text-[10px] px-1.5 py-0.2 font-bold uppercase font-mono">
                            En curso
                          </span>
                        )}
                        {event.timeUntil && !isNow && !isPast && (
                          <span className="rounded bg-[#121110] border border-[#2A2723] text-[#DDD6C9] text-[10px] px-1.5 py-0.2 font-mono">
                            {event.timeUntil}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#8E867B] mt-1 font-mono">
                        <span>
                          {event.startTimeFormatted}
                          {event.endTimeFormatted ? ` - ${event.endTimeFormatted}` : ""}
                        </span>
                        <span>•</span>
                        <span>{event.durationMinutes} min</span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[#DDD6C9]">
                              <MapPin className="h-3 w-3 text-[#D99B43]" />
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <div className="mt-2 sm:mt-0 text-xs text-[#8E867B] max-w-xs truncate sm:text-right font-sans">
                      {event.description}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Calendar Settings Modal */}
      <CalendarSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(url) => {
          if (onSaveCalendarUrl) {
            onSaveCalendarUrl(url);
          }
        }}
      />
    </div>
  );
}
