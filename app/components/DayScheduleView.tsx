"use client";

import { CalendarDaySchedule, CalendarEvent } from "@/lib/types";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  Settings,
  Sparkles,
  Video,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Agenda de Google Calendar
              </h2>
              {isConfigured ? (
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  En Vivo
                </span>
              ) : (
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Modo Preview / Demo
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              {schedule.events.length} evento(s) hoy • {hours > 0 ? `${hours}h ` : ""}{mins}m de reuniones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/8 bg-neutral-950/60 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sincronizar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs text-blue-300 hover:bg-blue-500/20 transition-colors font-medium"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Configurar iCal</span>
          </button>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
        <div className="space-y-3">
          {schedule.events.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-500">
              No tienes eventos programados para hoy. ¡Día libre para deep work! 🚀
            </div>
          ) : (
            schedule.events.map((event, idx) => {
              const isNow = event.status === "now";
              const isPast = event.status === "past";

              return (
                <div
                  key={event.id || idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                    isNow
                      ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                      : isPast
                      ? "border-white/4 bg-neutral-950/30 opacity-60"
                      : "border-white/6 bg-neutral-950/60 hover:border-white/12"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        isNow
                          ? "bg-blue-500 text-white animate-pulse"
                          : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-semibold tracking-tight ${
                            isPast ? "line-through text-neutral-400" : "text-white"
                          }`}
                        >
                          {event.title}
                        </h4>
                        {isNow && (
                          <span className="rounded bg-blue-500 text-neutral-950 text-[10px] px-1.5 py-0.2 font-bold uppercase">
                            En curso
                          </span>
                        )}
                        {event.timeUntil && !isNow && !isPast && (
                          <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.2 font-medium">
                            {event.timeUntil}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1 font-mono">
                        <span>
                          {event.startTimeFormatted}
                          {event.endTimeFormatted ? ` - ${event.endTimeFormatted}` : ""}
                        </span>
                        <span>•</span>
                        <span>{event.durationMinutes} min</span>
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-neutral-300">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <div className="mt-2 sm:mt-0 text-xs text-neutral-400 max-w-xs truncate sm:text-right">
                      {event.description}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <CalendarSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(url) => {
          if (onSaveCalendarUrl) onSaveCalendarUrl(url);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
