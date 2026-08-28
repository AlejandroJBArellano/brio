"use client";

import { TrainingHealthData } from "@/lib/types";
import { Activity, Dumbbell, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HevyWidget } from "./HevyWidget";
import { MuscleRecoveryWidget } from "./MuscleRecoveryWidget";

interface TrainingHealthViewProps {
  data: TrainingHealthData;
  onRefresh?: () => void;
}

export function TrainingHealthView({ data, onRefresh }: TrainingHealthViewProps) {
  const router = useRouter();
  const [trainingSubTab, setTrainingSubTab] = useState<"hevy" | "recovery">("hevy");

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sub-Navigation: Hevy Tracker vs Recuperación Muscular */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2A2723] pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#181715] rounded-lg border border-[#2A2723]">
          <button
            type="button"
            onClick={() => setTrainingSubTab("hevy")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              trainingSubTab === "hevy"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Hevy Sync & Métricas</span>
          </button>

          <button
            type="button"
            onClick={() => setTrainingSubTab("recovery")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              trainingSubTab === "recovery"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Mapa de Recuperación Muscular</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#8E867B]">
          <Flame className="h-3.5 w-3.5 text-[#D99B43]" />
          <span>
            Racha: <strong className="text-[#F5F2EB]">{data.workoutStreak} días</strong>
          </span>
        </div>
      </div>

      {/* SUB-VIEW 1: HEVY TRACKER */}
      {trainingSubTab === "hevy" && (
        <HevyWidget
          recentWorkouts={data.recentHevyWorkouts}
          stats={data.hevyStats}
          onRefresh={handleRefresh}
        />
      )}

      {/* SUB-VIEW 2: RECUPERACIÓN MUSCULAR */}
      {trainingSubTab === "recovery" && (
        <MuscleRecoveryWidget recentWorkouts={data.recentHevyWorkouts} />
      )}
    </div>
  );
}
