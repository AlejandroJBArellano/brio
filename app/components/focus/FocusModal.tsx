"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import {
  AMBIENT_SOUND_OPTIONS,
  ambientAudio,
  AmbientSoundType,
} from "@/lib/audio";
import { getHormonalStatus } from "@/lib/hormonal";
import { HabiticaTask } from "@/lib/types";
import {
  ExternalLink,
  Headphones,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Sparkles,
  Trash2,
  Tv,
  Volume2,
  VolumeX,
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

export interface YouTubeFocusTrack {
  id: string; // YouTube Video ID
  title: string;
  category: "lofi" | "synthwave" | "binaural" | "ambient" | "custom";
  icon: string;
}

const DEFAULT_YOUTUBE_TRACKS: YouTubeFocusTrack[] = [
  {
    id: "jfKfPfyJRdk",
    title: "Lofi Girl — Beats to Relax/Study",
    category: "lofi",
    icon: "☕",
  },
  {
    id: "4xDzrJKXOOY",
    title: "Lofi Synthwave Chill Radio",
    category: "synthwave",
    icon: "🌆",
  },
  {
    id: "8hM_7Cq-eQI",
    title: "40 Hz Gamma Waves Deep Focus",
    category: "binaural",
    icon: "🧠",
  },
  {
    id: "-5KAN9_CzSA",
    title: "Coffee Shop Rain & Jazz Ambience",
    category: "ambient",
    icon: "🌧️",
  },
  {
    id: "lTRiuFIWV54",
    title: "Tokyo Night Rain 4K Ambience",
    category: "ambient",
    icon: "🏮",
  },
  {
    id: "1Zz_k7zD7u8",
    title: "Interstellar Deep Space Drone",
    category: "ambient",
    icon: "🚀",
  },
];

const STORAGE_CUSTOM_YT_KEY = "brio_custom_youtube_focus_tracks_v1";

function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard youtu.be, youtube.com/watch?v=, youtube.com/live/, youtube.com/embed/
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/
  );

  return match ? match[1] : null;
}

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

  // Audio source: "synth" (Native Web Audio) vs "youtube" (YouTube Player) vs "none"
  const [audioSource, setAudioSource] = useState<"synth" | "youtube">("synth");

  // Native Synthesizer state
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>("gamma");
  const [synthVolume, setSynthVolume] = useState(0.35);

  // YouTube state
  const [customYouTubeTracks, setCustomYouTubeTracks] = useState<
    YouTubeFocusTrack[]
  >([]);
  const [selectedYouTubeId, setSelectedYouTubeId] = useState<string>(
    DEFAULT_YOUTUBE_TRACKS[0].id
  );
  const [isYouTubeFormOpen, setIsYouTubeFormOpen] = useState(false);
  const [newYtUrl, setNewYtUrl] = useState("");
  const [newYtTitle, setNewYtTitle] = useState("");
  const [newYtIcon, setNewYtIcon] = useState("🎵");
  const [isYtVideoExpanded, setIsYtVideoExpanded] = useState(true);

  const [isCompleted, setIsCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load custom YouTube tracks from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_CUSTOM_YT_KEY);
        if (saved) {
          setCustomYouTubeTracks(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Failed to load custom YouTube focus tracks", err);
      }
    }
  }, []);

  const saveCustomTracks = (tracks: YouTubeFocusTrack[]) => {
    setCustomYouTubeTracks(tracks);
    try {
      localStorage.setItem(STORAGE_CUSTOM_YT_KEY, JSON.stringify(tracks));
    } catch (err) {
      console.error("Failed to save custom YouTube tracks", err);
    }
  };

  const handleAddYouTubeTrack = () => {
    const extractedId = extractYouTubeId(newYtUrl);
    if (!extractedId) {
      alert("Por favor introduce una URL o ID de video de YouTube válida.");
      return;
    }

    const newTrack: YouTubeFocusTrack = {
      id: extractedId,
      title: newYtTitle.trim() || `YouTube Focus (${extractedId})`,
      category: "custom",
      icon: newYtIcon || "🎵",
    };

    const updated = [newTrack, ...customYouTubeTracks.filter((t) => t.id !== extractedId)];
    saveCustomTracks(updated);
    setSelectedYouTubeId(extractedId);
    setNewYtUrl("");
    setNewYtTitle("");
    setIsYouTubeFormOpen(false);
  };

  const handleDeleteCustomTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customYouTubeTracks.filter((t) => t.id !== id);
    saveCustomTracks(updated);
    if (selectedYouTubeId === id) {
      setSelectedYouTubeId(DEFAULT_YOUTUBE_TRACKS[0].id);
    }
  };

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

  // Web Audio native synthesizer playback control
  useEffect(() => {
    if (
      isOpen &&
      isActive &&
      audioSource === "synth" &&
      currentSound !== "none"
    ) {
      ambientAudio.play(currentSound, synthVolume);
    } else {
      ambientAudio.stop();
    }
  }, [isOpen, isActive, audioSource, currentSound, synthVolume]);

  const handleStart = () => {
    setIsActive(true);
    setIsCompleted(false);
    if (audioSource === "synth" && currentSound !== "none") {
      ambientAudio.play(currentSound, synthVolume);
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

  const handleClose = () => {
    ambientAudio.stop();
    setIsActive(false);
    onClose();
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.round(
    ((selectedMinutes * 60 - timeLeft) / (selectedMinutes * 60)) * 100
  );

  const hormonalStatus = getHormonalStatus();
  const allYouTubeTracks = [...customYouTubeTracks, ...DEFAULT_YOUTUBE_TRACKS];
  const activeYtTrack = allYouTubeTracks.find((t) => t.id === selectedYouTubeId) || DEFAULT_YOUTUBE_TRACKS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-neutral-950/95 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl my-auto"
        role="dialog"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors z-20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-5">
          {/* Header Badge with Hormonal Context */}
          <div className="flex flex-col items-center gap-1.5">
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
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 text-left">
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
              className={`absolute h-56 w-56 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
                isActive
                  ? "bg-indigo-600/25 opacity-100"
                  : "bg-indigo-900/10 opacity-30"
              }`}
            />

            <div className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-white select-none">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-64 overflow-hidden rounded-full bg-neutral-900 border border-white/6">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isCompleted && (
              <div className="mt-2.5 flex items-center gap-2 text-sm font-bold text-emerald-400 animate-bounce">
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
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={isActive ? handlePause : handleStart}
              className={`flex h-14 w-36 items-center justify-center gap-2 rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
                isActive
                  ? "bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-amber-500/20"
                  : "bg-linear-to-r from-indigo-500 to-indigo-600 text-white hover:brightness-110 shadow-indigo-500/30"
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                  <span>Iniciar Flujo</span>
                </>
              )}
            </button>
          </div>

          {/* Audio Source Tabs Switcher */}
          <div className="w-full pt-4 border-t border-white/8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAudioSource("synth");
                    if (!isActive) ambientAudio.stop();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    audioSource === "synth"
                      ? "bg-indigo-600/90 text-white border-indigo-500 shadow-sm"
                      : "bg-neutral-900/60 text-neutral-400 border-white/6 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Headphones className="h-3.5 w-3.5" />
                  <span>🧠 Ondas & Sintetizador Nativo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAudioSource("youtube");
                    ambientAudio.stop();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    audioSource === "youtube"
                      ? "bg-red-600/90 text-white border-red-500 shadow-sm"
                      : "bg-neutral-900/60 text-neutral-400 border-white/6 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Tv className="h-3.5 w-3.5" />
                  <span>📺 YouTube Player & Canales</span>
                </button>
              </div>

              {audioSource === "synth" && currentSound !== "none" && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
                  <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={synthVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSynthVolume(v);
                      ambientAudio.setVolume(v);
                    }}
                    className="w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* View 1: Native Web Audio Synthesizer */}
            {audioSource === "synth" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left animate-in fade-in duration-150">
                {AMBIENT_SOUND_OPTIONS.map((snd) => {
                  const isSelected = currentSound === snd.id;
                  return (
                    <button
                      key={snd.id}
                      type="button"
                      onClick={() => {
                        setCurrentSound(snd.id);
                        if (isActive) {
                          if (snd.id === "none") ambientAudio.stop();
                          else ambientAudio.play(snd.id, synthVolume);
                        }
                      }}
                      className={`flex flex-col p-2.5 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-500/20 text-white border-indigo-500/50 shadow-md shadow-indigo-500/10 font-bold"
                          : "bg-neutral-900/50 text-neutral-400 border-white/6 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-sm mb-0.5">
                        <span>{snd.icon}</span>
                        <span className="font-semibold text-xs truncate">
                          {snd.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-normal truncate">
                        {snd.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* View 2: YouTube Iframe Focus Player */}
            {audioSource === "youtube" && (
              <div className="space-y-3 text-left animate-in fade-in duration-150">
                {/* Track Selector Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {allYouTubeTracks.map((track) => {
                    const isSelected = selectedYouTubeId === track.id;
                    const isCustom = track.category === "custom";
                    return (
                      <div
                        key={track.id}
                        className={`group inline-flex items-center rounded-xl border text-xs transition-all ${
                          isSelected
                            ? "bg-red-500/20 text-white border-red-500/50 font-bold"
                            : "bg-neutral-900/60 text-neutral-400 border-white/6 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedYouTubeId(track.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5"
                        >
                          <span>{track.icon}</span>
                          <span className="max-w-40 truncate">{track.title}</span>
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomTrack(track.id, e)}
                            title="Eliminar este video"
                            className="pr-2 pl-0.5 text-neutral-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Custom Track Button */}
                  <button
                    type="button"
                    onClick={() => setIsYouTubeFormOpen(!isYouTubeFormOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-white/20 bg-white/5 text-xs text-neutral-300 hover:text-white hover:border-white/40 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar Video/Canal</span>
                  </button>
                </div>

                {/* Form to Add Custom YouTube Video */}
                {isYouTubeFormOpen && (
                  <div className="p-3.5 rounded-2xl border border-red-500/30 bg-neutral-900/90 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>🎬 Agregar Video o Transmisión en Vivo de YouTube:</span>
                      <button
                        type="button"
                        onClick={() => setIsYouTubeFormOpen(false)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="URL de YouTube (ej. https://youtube.com/watch?v=...)"
                        value={newYtUrl}
                        onChange={(e) => setNewYtUrl(e.target.value)}
                        className="sm:col-span-2 rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
                      />
                      <input
                        type="text"
                        placeholder="Nombre / Título (ej. Jazz Café)"
                        value={newYtTitle}
                        onChange={(e) => setNewYtTitle(e.target.value)}
                        className="rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-neutral-400">Emoji:</span>
                        {["🎵", "🎧", "☕", "🌧️", "🌌", "🧠", "🔥", "🏮"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewYtIcon(emoji)}
                            className={`px-1.5 py-0.5 rounded text-xs transition-all ${
                              newYtIcon === emoji ? "bg-white/20 scale-110" : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddYouTubeTrack}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 shadow-md shadow-red-500/20 transition-all"
                      >
                        Guardar Video
                      </button>
                    </div>
                  </div>
                )}

                {/* Embedded YouTube Iframe Player */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-xl">
                  <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/80 border-b border-white/6 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-white">
                      <span>{activeYtTrack.icon}</span>
                      <span>{activeYtTrack.title}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsYtVideoExpanded(!isYtVideoExpanded)}
                      title={isYtVideoExpanded ? "Minimizar video" : "Expandir video"}
                      className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                    >
                      {isYtVideoExpanded ? (
                        <>
                          <Minimize2 className="h-3.5 w-3.5" />
                          <span className="text-[10px]">Minimizar</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3.5 w-3.5" />
                          <span className="text-[10px]">Ver Video</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`transition-all duration-300 ${isYtVideoExpanded ? "h-44 sm:h-56" : "h-0 overflow-hidden"}`}>
                    <iframe
                      key={selectedYouTubeId}
                      src={`https://www.youtube-nocookie.com/embed/${selectedYouTubeId}?autoplay=${isActive ? 1 : 0}&enablejsapi=1&loop=1&playlist=${selectedYouTubeId}`}
                      title={activeYtTrack.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
