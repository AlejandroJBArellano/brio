"use client";

import { toggleTaskAction } from "@/app/actions/tasks";
import {
  AMBIENT_SOUND_OPTIONS,
  ambientAudio,
  AmbientSoundType,
} from "@/lib/audio";
import { soundFx } from "@/lib/soundFx";
import { getHormonalStatus } from "@/lib/hormonal";
import { HabiticaTask } from "@/lib/types";
import {
  Headphones,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Tv,
  Volume2,
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
  const [currentSound, setCurrentSound] = useState<AmbientSoundType>("alpha");
  const [synthVolume, setSynthVolume] = useState(0.35);
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);

  // YouTube state
  const [customYouTubeTracks, setCustomYouTubeTracks] = useState<
    YouTubeFocusTrack[]
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_CUSTOM_YT_KEY);
        if (saved) return JSON.parse(saved) as YouTubeFocusTrack[];
      } catch (err) {
        console.error("Failed to load custom YouTube focus tracks", err);
      }
    }
    return [];
  });
  const [selectedYouTubeId, setSelectedYouTubeId] = useState<string>(
    DEFAULT_YOUTUBE_TRACKS[0].id
  );
  const [isYouTubeFormOpen, setIsYouTubeFormOpen] = useState(false);
  const [newYtUrl, setNewYtUrl] = useState("");
  const [newYtTitle, setNewYtTitle] = useState("");
  const [newYtIcon, setNewYtIcon] = useState("🎵");
  const [isYtVideoExpanded, setIsYtVideoExpanded] = useState(true);

  const [isCompleted, setIsCompleted] = useState(false);
  const [_isPending, startTransition] = useTransition();

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
          setIsSynthPlaying(false);
          soundFx.focusComplete();

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

  const handleSelectSound = (soundId: AmbientSoundType) => {
    setCurrentSound(soundId);
    if (soundId === "none") {
      ambientAudio.stop();
      setIsSynthPlaying(false);
    } else {
      ambientAudio.play(soundId, synthVolume);
      setIsSynthPlaying(true);
    }
  };

  const handleToggleSynthPlay = () => {
    if (isSynthPlaying) {
      ambientAudio.stop();
      setIsSynthPlaying(false);
    } else {
      if (currentSound !== "none") {
        ambientAudio.play(currentSound, synthVolume);
        setIsSynthPlaying(true);
      }
    }
  };

  const handleStart = () => {
    soundFx.focusStart();
    setIsActive(true);
    setIsCompleted(false);
    if (audioSource === "synth" && currentSound !== "none") {
      ambientAudio.play(currentSound, synthVolume);
      setIsSynthPlaying(true);
    }
  };

  const handlePause = () => {
    setIsActive(false);
    ambientAudio.stop();
    setIsSynthPlaying(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(selectedMinutes * 60);
    setIsCompleted(false);
    ambientAudio.stop();
    setIsSynthPlaying(false);
  };

  const handleSelectDuration = (mins: number) => {
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
    setIsActive(false);
    setIsCompleted(false);
    ambientAudio.stop();
    setIsSynthPlaying(false);
  };

  const handleClose = () => {
    ambientAudio.stop();
    setIsSynthPlaying(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-7 shadow-2xl my-auto"
        role="dialog"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors z-20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-5">
          {/* Header Badge with Hormonal Context */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 rounded-lg border border-[#3D3425] bg-[#221D16] px-3.5 py-1 text-xs font-semibold text-[#D99B43]">
              <Zap className="h-3.5 w-3.5 text-[#D99B43]" />
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
            <label className="block text-[11px] font-semibold text-[#8E867B] uppercase tracking-wider mb-1.5 text-left font-mono">
              Tarea en foco:
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs font-medium text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
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
            <div className="font-mono text-6xl sm:text-7xl font-bold tracking-tight text-[#F5F2EB] select-none">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-64 overflow-hidden rounded-full bg-[#22201D] border border-[#2A2723]">
              <div
                className="h-full bg-[#D99B43] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {isCompleted && (
              <div className="mt-2.5 flex items-center gap-2 text-sm font-semibold text-[#7EA35A]">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedMinutes === dur.minutes
                    ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                    : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
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
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#2A2723] bg-[#121110] text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-all active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={isActive ? handlePause : handleStart}
              className={`flex h-13 w-36 items-center justify-center gap-2 rounded-lg font-bold text-sm shadow-lg transition-all active:scale-95 ${
                isActive
                  ? "bg-[#E8AF59] text-[#121110] hover:bg-[#D99B43]"
                  : "bg-[#D99B43] text-[#121110] hover:bg-[#E8AF59]"
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
          <div className="w-full pt-4 border-t border-[#2A2723]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAudioSource("synth");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    audioSource === "synth"
                      ? "bg-[#282622] text-[#F5F2EB] border-[#3D3831] shadow-xs"
                      : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <Headphones className="h-3.5 w-3.5 text-[#D99B43]" />
                  <span>🧠 Ondas Hz & Frecuencias</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAudioSource("youtube");
                    ambientAudio.stop();
                    setIsSynthPlaying(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    audioSource === "youtube"
                      ? "bg-[#282622] text-[#F5F2EB] border-[#3D3831] shadow-xs"
                      : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                  }`}
                >
                  <Tv className="h-3.5 w-3.5 text-[#E05D52]" />
                  <span>📺 YouTube Focus</span>
                </button>
              </div>

              {audioSource === "synth" && currentSound !== "none" && (
                <div className="flex items-center gap-2.5 text-xs text-[#DDD6C9]">
                  <button
                    type="button"
                    onClick={handleToggleSynthPlay}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      isSynthPlaying
                        ? "bg-[#7EA35A]/20 text-[#7EA35A] border-[#7EA35A]/40"
                        : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9]"
                    }`}
                  >
                    {isSynthPlaying ? (
                      <>
                        <Pause className="h-3 w-3 fill-current" />
                        <span>Pausar Ondas</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        <span>Sonar Ondas</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 text-[#8E867B]">
                    <Volume2 className="h-3.5 w-3.5 text-[#D99B43]" />
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
                      className="w-20 h-1.5 bg-[#22201D] rounded-lg appearance-none cursor-pointer accent-[#D99B43]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* View 1: Native Web Audio Synthesizer */}
            {audioSource === "synth" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left animate-in fade-in duration-150">
                {AMBIENT_SOUND_OPTIONS.map((snd) => {
                  const isSelected = currentSound === snd.id;
                  const isPlayingThis = isSelected && isSynthPlaying && snd.id !== "none";

                  return (
                    <button
                      key={snd.id}
                      type="button"
                      onClick={() => handleSelectSound(snd.id)}
                      className={`flex flex-col p-2.5 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? "bg-[#221D16] text-[#F5F2EB] border-[#D99B43]/50 shadow-xs font-bold"
                          : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9] hover:bg-[#1A1816]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="flex items-center gap-1.5 font-semibold text-xs truncate">
                          <span>{snd.icon}</span>
                          <span className="truncate">{snd.label}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {isPlayingThis && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-[#7EA35A] animate-ping shrink-0" />
                          )}
                          {snd.hzBadge && snd.id !== "none" && (
                            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-[#3D3425] text-[#E8AF59] border border-[#D99B43]/30 shrink-0">
                              {snd.hzBadge}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#8E867B] font-normal line-clamp-2 leading-tight">
                        {snd.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* View 2: YouTube Iframe Focus Player */}
            {audioSource === "youtube" && (
              <div className="space-y-3 text-left animate-in fade-in duration-150 font-mono">
                {/* Track Selector Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {allYouTubeTracks.map((track) => {
                    const isSelected = selectedYouTubeId === track.id;
                    const isCustom = track.category === "custom";
                    return (
                      <div
                        key={track.id}
                        className={`group inline-flex items-center rounded-lg border text-xs transition-all ${
                          isSelected
                            ? "bg-[#221716] text-[#F5F2EB] border-[#E05D52]/50 font-bold"
                            : "bg-[#121110] text-[#8E867B] border-[#2A2723] hover:text-[#DDD6C9] hover:bg-[#1A1816]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedYouTubeId(track.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
                        >
                          <span>{track.icon}</span>
                          <span className="max-w-40 truncate">{track.title}</span>
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomTrack(track.id, e)}
                            title="Eliminar este video"
                            className="pr-2 pl-0.5 text-[#8E867B] hover:text-[#E05D52] transition-colors cursor-pointer"
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
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-[#2A2723] bg-[#121110] text-xs text-[#8E867B] hover:text-[#DDD6C9] hover:border-[#38332D] transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar Video/Canal</span>
                  </button>
                </div>

                {/* Form to Add Custom YouTube Video */}
                {isYouTubeFormOpen && (
                  <div className="p-3.5 rounded-xl border border-[#E05D52]/30 bg-[#181715] space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-[#F5F2EB] font-serif">
                      <span>🎬 Agregar Video o Transmisión en Vivo de YouTube:</span>
                      <button
                        type="button"
                        onClick={() => setIsYouTubeFormOpen(false)}
                        className="text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-sans">
                      <input
                        type="text"
                        placeholder="URL de YouTube (ej. https://youtube.com/watch?v=...)"
                        value={newYtUrl}
                        onChange={(e) => setNewYtUrl(e.target.value)}
                        className="sm:col-span-2 rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#E05D52]"
                      />
                      <input
                        type="text"
                        placeholder="Nombre / Título (ej. Jazz Café)"
                        value={newYtTitle}
                        onChange={(e) => setNewYtTitle(e.target.value)}
                        className="rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#E05D52]"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8E867B]">Emoji:</span>
                        {["🎵", "🎧", "☕", "🌧️", "🌌", "🧠", "🔥", "🏮"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewYtIcon(emoji)}
                            className={`px-1.5 py-0.5 rounded text-xs transition-all cursor-pointer ${
                              newYtIcon === emoji ? "bg-[#221D16] border border-[#D99B43]/40 scale-110" : "opacity-60 hover:opacity-100"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddYouTubeTrack}
                        className="px-3.5 py-1.5 rounded-lg bg-[#E05D52] hover:bg-[#E8736A] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        Guardar Video
                      </button>
                    </div>
                  </div>
                )}

                {/* Embedded YouTube Iframe Player */}
                <div className="relative rounded-xl overflow-hidden border border-[#2A2723] bg-[#121110] shadow-xl">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#181715] border-b border-[#2A2723] text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[#F5F2EB]">
                      <span>{activeYtTrack.icon}</span>
                      <span>{activeYtTrack.title}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsYtVideoExpanded(!isYtVideoExpanded)}
                      title={isYtVideoExpanded ? "Minimizar video" : "Expandir video"}
                      className="flex items-center gap-1 text-[#8E867B] hover:text-[#DDD6C9] transition-colors cursor-pointer"
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
