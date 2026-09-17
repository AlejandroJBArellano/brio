"use client";

import { soundFx } from "@/lib/soundFx";
import { Bell, BellRing, Pause, Play, Plus, SkipForward, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface RestTimerBarProps {
  initialSeconds?: number;
  onFinish?: () => void;
  onClose?: () => void;
  autoStartKey?: string | number; // Change key to reset/restart timer
}

export function RestTimerBar({
  initialSeconds = 90,
  onFinish,
  onClose,
  autoStartKey,
}: RestTimerBarProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const prevKeyRef = useRef(autoStartKey);

  // Restart timer when autoStartKey changes (new set checked)
  useEffect(() => {
    if (autoStartKey !== undefined && autoStartKey !== prevKeyRef.current) {
      prevKeyRef.current = autoStartKey;
      setTotalSeconds(initialSeconds);
      setRemainingSeconds(initialSeconds);
      setIsRunning(true);
      setIsFinished(false);
    }
  }, [autoStartKey, initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            soundFx.workoutRestFinished();
            if (onFinish) onFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds, onFinish]);

  const addSeconds = (secs: number) => {
    soundFx.click();
    setRemainingSeconds((prev) => Math.max(0, prev + secs));
    setTotalSeconds((prev) => Math.max(prev, remainingSeconds + secs));
    if (isFinished && secs > 0) {
      setIsFinished(false);
      setIsRunning(true);
    }
  };

  const toggleRunning = () => {
    soundFx.click();
    setIsRunning(!isRunning);
  };

  const handleSkip = () => {
    soundFx.click();
    setIsRunning(false);
    setRemainingSeconds(0);
    setIsFinished(true);
    if (onClose) onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 100;

  return (
    <div
      className={`sticky top-3 z-40 rounded-xl border p-3 sm:p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 ${
        isFinished
          ? "bg-[#1C2219]/95 border-[#7EA35A] text-[#7EA35A]"
          : "bg-[#181715]/95 border-[#D99B43]/50 text-[#F5F2EB]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Timer Indicator & Countdown */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isFinished
                ? "bg-[#232E1F] border-[#7EA35A]/40 text-[#7EA35A] animate-pulse"
                : "bg-[#221D16] border-[#D99B43]/40 text-[#D99B43]"
            }`}
          >
            {isFinished ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </div>
          <div>
            <div className="text-[11px] font-mono text-[#8E867B] uppercase tracking-wider">
              {isFinished ? "Descanso terminado" : "Descanso"}
            </div>
            <div className="font-mono text-xl font-bold tracking-tight text-[#F5F2EB]">
              {formatTime(remainingSeconds)}
            </div>
          </div>
        </div>

        {/* Center/Right: Quick Controls */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => addSeconds(30)}
            className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-[#22201D] border border-[#2A2723] hover:border-[#D99B43]/40 text-[#DDD6C9] hover:text-[#F5F2EB] transition-all cursor-pointer"
            title="Añadir 30 segundos"
          >
            <Plus className="h-3 w-3" />
            <span>30s</span>
          </button>

          <button
            type="button"
            onClick={toggleRunning}
            className="p-1.5 rounded-lg bg-[#22201D] border border-[#2A2723] hover:border-[#D99B43]/40 text-[#DDD6C9] hover:text-[#F5F2EB] transition-all cursor-pointer"
            title={isRunning ? "Pausar" : "Reanudar"}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#22201D] border border-[#2A2723] hover:border-[#D99B43]/40 text-[#8E867B] hover:text-[#F5F2EB] transition-all cursor-pointer"
            title="Omitir descanso"
          >
            <SkipForward className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Omitir</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#2A2723]">
        <div
          className={`h-full transition-all duration-1000 ${
            isFinished ? "bg-[#7EA35A]" : "bg-[#D99B43]"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
