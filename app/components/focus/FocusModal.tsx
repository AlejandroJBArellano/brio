"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import { ambientAudio, AmbientSoundType } from "@/lib/audio";
import { getHormonalStatus } from "@/lib/hormonal";
import { HabiticaTask } from "@/lib/types";
import {
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: HabiticaTask[];
  onCompleteSession?: () => void;
}

const DURATIONS = [
  { label: "25 min (Pomodoro)", minutes: 25 },
  { label: "50 min (Deep Work)", minutes: 50 },
  { label: "90 min (Ultra Sprint)", minutes: 90 },
  { label: "15 min (Sprint)", minutes: 15 },
];

const SOUNDS: { id: AmbientSoundType; label: string; icon: string }[] = [
  { id: "brown", label: "Brown Noise (Foco)", icon: "🌊" },
  { id: "rain", label: "Lluvia Calma", icon: "🌧️" },
  { id: "white", label: "Ruido Blanco", icon: "📻" },
  { id: "binaural", label: "Ondas Alfa", icon: "🎧" },
  { id: "none", label: "Silencio", icon: "🔇" },
];

export function FocusModal({
  isOpen,
  onClose,
  tasks,
  onCompleteSession,
}: FocusModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    tasks[0]?.id || ""
  );
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>("brown");
  const [volume, setVolume] = useState(0.35);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeTask = tasks.find((t) => t.id === selectedTaskId);

  // Timer interval
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsActive(false);
          setIsCompleted(true);
          ambientAudio.stop();

          // Award Habitica XP/GP upon completing deep work
          startTransition(async () => {
            if (selectedTaskId) {
              await toggleTaskAction(selectedTaskId, "up");
            }
            if (onCompleteSession) onCompleteSession();
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, selectedTaskId, onCompleteSession]);

  // Audio control
  useEffect(() => {
    if (isOpen && isActive && currentSound !== "none") {
      ambientAudio.play(currentSound, volume);
    } else {
      ambientAudio.stop();
    }
  }, [isOpen, isActive, currentSound, volume]);

  const handleStart = () => {
    setIsActive(true);
    setIsCompleted(false);
    if (currentSound !== "none") {
      ambientAudio.play(currentSound, volume);
    }
  };

  const handlePause = () => {
    setIsActive(false);
    ambientAudio.stop();
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(selectedMinutes * 60);
    setIsCompleted(false);
    ambientAudio.stop();
  };

  const handleSelectDuration = (mins: number) => {
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
    setIsActive(false);
    setIsCompleted(false);
    ambientAudio.stop();
  };

  const handleSoundChange = (snd: AmbientSoundType) => {
    setCurrentSound(snd);
    if (isActive) {
      if (snd === "none") ambientAudio.stop();
      else ambientAudio.play(snd, volume);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.round(
    ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100
  );

  const hormonalStatus = getHormonalStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-neutral-950/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
        role="dialog"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            ambientAudio.stop();
            onClose();
          }}
          className="absolute right-5 top-5 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Header Badge with Hormonal Context */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-bold text-indigo-300">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span>Modo Focus Zen & Deep Work (⌘P)</span>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-medium"
              style={{
                backgroundColor: `${hormonalStatus.currentPhase.color}15`,
                borderColor: `${hormonalStatus.currentPhase.color}35`,
                color: hormonalStatus.currentPhase.color,
              }}
            >
              <span>{hormonalStatus.currentPhase.icon}</span>
              <span>{hormonalStatus.currentPhase.hormoneFocus}</span>
            </div>
          </div>

          {/* Active Task Selector */}
          <div className="w-full max-w-md">
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Tarea en foco:
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  [{task.type.toUpperCase()}] {task.text}
                </option>
              ))}
            </select>
          </div>

          {/* Giant Timer Display */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Circular glowing aura */}
            <div
              className={`absolute h-64 w-64 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
                isActive
                  ? "bg-indigo-600/20 opacity-100"
                  : "bg-indigo-900/10 opacity-40"
              }`}
            />

            <div className="font-mono text-7xl sm:text-8xl font-black tracking-tight text-white select-none">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-neutral-900 border border-white/6">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isCompleted && (
              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-400 animate-bounce">
                <Sparkles className="h-4 w-4" />
                <span>¡Sesión completada! +EXP & Oro otorgados 🎉</span>
              </div>
            )}
          </div>

          {/* Duration Preset Selector */}
          <div className="flex flex-wrap justify-center gap-2">
            {DURATIONS.map((dur) => (
              <button
                key={dur.minutes}
                type="button"
                onClick={() => handleSelectDuration(dur.minutes)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedMinutes === dur.minutes
                    ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20"
                    : "bg-neutral-900/80 text-neutral-400 hover:text-white border border-white/6"
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>

          {/* Controls: Play / Pause / Reset */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              title="Reiniciar temporizador"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={isActive ? handlePause : handleStart}
              className={`flex h-16 w-36 items-center justify-center gap-2 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
                isActive
                  ? "bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-amber-500/20"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:brightness-110 shadow-indigo-500/30"
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="h-5 w-5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                  <span>Iniciar Flujo</span>
                </>
              )}
            </button>
          </div>

          {/* Ambient Sound Selector */}
          <div className="w-full pt-4 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Headphones className="h-4 w-4 text-indigo-400" />
              <span>Audio Ambiental (Web Audio):</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {SOUNDS.map((snd) => (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => handleSoundChange(snd.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
                    currentSound === snd.id
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>{snd.icon}</span>
                  <span>{snd.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
