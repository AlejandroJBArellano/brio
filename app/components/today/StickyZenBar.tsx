"use client";

import {
  AMBIENT_SOUND_OPTIONS,
  ambientAudio,
  AmbientSoundType,
} from "@/lib/audio";
import { soundFx } from "@/lib/soundFx";
import {
  ChevronDown,
  ChevronUp,
  Headphones,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DURATIONS = [
  { label: "25 min (Pomodoro)", minutes: 25 },
  { label: "50 min (Deep Work)", minutes: 50 },
  { label: "15 min (Sprint)", minutes: 15 },
  { label: "Libre", minutes: 0 },
];

export interface StickyZenBarProps {
  projectTitle?: string;
}

export function StickyZenBar({ projectTitle }: StickyZenBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isCountUp, setIsCountUp] = useState(false);

  // Audio State
  const [activeSound, setActiveSound] = useState<AmbientSoundType>("none");
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer Tick Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (isCountUp) {
            return prev + 1;
          }
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            soundFx.taskComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isCountUp]);

  // Audio Engine Lifecycle
  useEffect(() => {
    if (activeSound !== "none" && !isMuted) {
      ambientAudio.play(activeSound, volume);
    } else {
      ambientAudio.stop();
    }

    return () => {
      ambientAudio.stop();
    };
  }, [activeSound, isMuted, volume]);

  const handleSelectDuration = (minutes: number) => {
    setSelectedDuration(minutes);
    if (minutes === 0) {
      setIsCountUp(true);
      setTimeLeft(0);
    } else {
      setIsCountUp(false);
      setTimeLeft(minutes * 60);
    }
    setIsRunning(false);
  };

  const toggleTimer = () => {
    if (!isRunning) {
      soundFx.focusStart();
    } else {
      soundFx.click();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (selectedDuration === 0) {
      setTimeLeft(0);
    } else {
      setTimeLeft(selectedDuration * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const activeSoundOption = AMBIENT_SOUND_OPTIONS.find(
    (s) => s.id === activeSound
  );

  return (
    <div className="fixed bottom-4 right-4 sm:right-6 z-40 max-w-md w-[calc(100vw-2rem)] sm:w-auto font-sans">
      {/* Compact / Minimized Bar */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full border shadow-xl backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] select-none ${
            isRunning
              ? "bg-[#1C2219]/90 border-[#7EA35A]/50 text-[#F5F2EB]"
              : "bg-[#181715]/90 border-[#2A2723] text-[#DDD6C9]"
          }`}
        >
          {/* Quick Play/Pause */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTimer();
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
              isRunning
                ? "bg-[#7EA35A] text-[#121110]"
                : "bg-[#221D16] text-[#D99B43] hover:bg-[#D99B43] hover:text-[#121110]"
            }`}
          >
            {isRunning ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Time & Project Label */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span
              className={`font-bold tracking-wider ${
                isRunning ? "text-[#7EA35A]" : "text-[#D99B43]"
              }`}
            >
              {formatTime(timeLeft)}
            </span>
            {projectTitle && (
              <span className="text-[11px] text-[#8E867B] truncate max-w-32 hidden xs:inline">
                • {projectTitle}
              </span>
            )}
          </div>

          {/* Active Sound Indicator */}
          {activeSound !== "none" && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#4EAB9E] bg-[#141C1A] px-2 py-0.5 rounded-full border border-[#4EAB9E]/30">
              <Headphones className="h-3 w-3 animate-pulse" />
              <span>{activeSoundOption?.icon || "🎵"}</span>
            </div>
          )}

          <ChevronUp className="h-4 w-4 text-[#8E867B] ml-1" />
        </div>
      ) : (
        /* Expanded Floating Zen Console */
        <div className="rounded-2xl border border-[#2A2723] bg-[#181715]/95 p-4 sm:p-5 shadow-2xl backdrop-blur-lg space-y-4 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#2A2723]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7EA35A]/20 text-[#7EA35A]">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <span className="font-serif text-xs sm:text-sm font-bold text-[#F5F2EB]">
                Consola Zen & Deep Work
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-colors cursor-pointer"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Main Timer Display */}
          <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 text-center space-y-3">
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-widest text-[#F5F2EB]">
              {formatTime(timeLeft)}
            </div>

            {/* Duration Selector */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap font-mono text-[11px]">
              {DURATIONS.map((d) => (
                <button
                  key={d.minutes}
                  type="button"
                  onClick={() => handleSelectDuration(d.minutes)}
                  className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    selectedDuration === d.minutes
                      ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/40 font-bold"
                      : "bg-[#181715] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  {d.minutes === 0 ? "Libre" : `${d.minutes}m`}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleTimer}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs font-mono ${
                  isRunning
                    ? "bg-[#221716] hover:bg-[#2F1F1E] text-[#E05D52] border border-[#E05D52]/40"
                    : "bg-[#7EA35A] hover:bg-[#8FB866] text-[#121110]"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Comenzar Foco</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-[#181715] hover:bg-[#22201D] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723] transition-colors cursor-pointer"
                title="Reiniciar temporizador"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Ambient Sound Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8E867B]">
              <div className="flex items-center gap-1.5">
                <Headphones className="h-3.5 w-3.5 text-[#4EAB9E]" />
                <span>Audio Binaural & Ondas Cerebrales:</span>
              </div>
              {activeSound !== "none" && (
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5 text-[#E05D52]" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-[#7EA35A]" />
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSound("none")}
                className={`p-2 rounded-lg border text-center font-mono text-[10px] transition-all cursor-pointer ${
                  activeSound === "none"
                    ? "bg-[#221D16] text-[#D99B43] border-[#D99B43]/40 font-bold"
                    : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                }`}
              >
                🔇 Silencio
              </button>

              {AMBIENT_SOUND_OPTIONS.slice(0, 5).map((snd) => (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => setActiveSound(snd.id)}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    activeSound === snd.id
                      ? "bg-[#141C1A] text-[#4EAB9E] border-[#4EAB9E]/50 font-bold shadow-xs"
                      : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                  title={`${snd.label} (${snd.hzBadge}) - ${snd.sublabel}`}
                >
                  <span className="text-sm">{snd.icon}</span>
                  <span className="text-[9px] font-mono truncate max-w-full">
                    {snd.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Volume Slider if playing */}
            {activeSound !== "none" && !isMuted && (
              <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-[#8E867B]">
                <span>Vol:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-[#4EAB9E] h-1.5 bg-[#2A2723] rounded-lg cursor-pointer"
                />
                <span>{Math.round(volume * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
