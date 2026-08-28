"use client";

import { BiometricsHealthData } from "@/lib/types";
import { FlaskConical, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BiomarkersView } from "./biomarkers/BiomarkersView";
import { BodyCompositionWidget } from "./BodyCompositionWidget";
import { SmartFitModal } from "./SmartFitModal";

interface BiometricsHealthViewProps {
  data: BiometricsHealthData;
  onRefresh?: () => void;
}

export function BiometricsHealthView({ data, onRefresh }: BiometricsHealthViewProps) {
  const router = useRouter();
  const [biometricsSubTab, setBiometricsSubTab] = useState<"biomarkers" | "composition">("biomarkers");
  const [isSmartFitModalOpen, setIsSmartFitModalOpen] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sub-Navigation: Biomarcadores Clínicos vs Composición Corporal */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2A2723] pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#181715] rounded-lg border border-[#2A2723]">
          <button
            type="button"
            onClick={() => setBiometricsSubTab("biomarkers")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              biometricsSubTab === "biomarkers"
                ? "bg-[#4EAB9E] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Estudios & Biomarcadores Clínicos</span>
            {data.biomarkersData && (
              <span
                className={`ml-1 rounded px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                  biometricsSubTab === "biomarkers"
                    ? "bg-[#121110] text-[#4EAB9E]"
                    : "bg-[#162121] text-[#4EAB9E] border border-[#4EAB9E]/30"
                }`}
              >
                {data.biomarkersData.totalBiomarkersTracked}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setBiometricsSubTab("composition")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              biometricsSubTab === "composition"
                ? "bg-[#4EAB9E] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Composición Corporal (InBody / SmartFit)</span>
          </button>
        </div>

        {data.latestBodyComposition && (
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[#8E867B]">
            <span>
              Peso: <strong className="text-[#F5F2EB]">{data.latestBodyComposition.weightKg} kg</strong>
            </span>
            {data.latestBodyComposition.bodyFatPercentage !== undefined && (
              <span>
                Grasa:{" "}
                <strong className="text-[#4EAB9E]">
                  {data.latestBodyComposition.bodyFatPercentage}%
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* SUB-VIEW 1: BIOMARCADORES DE SANGRE */}
      {biometricsSubTab === "biomarkers" && (
        <BiomarkersView
          data={data.biomarkersData}
          onRefresh={handleRefresh}
        />
      )}

      {/* SUB-VIEW 2: COMPOSICIÓN CORPORAL */}
      {biometricsSubTab === "composition" && (
        <BodyCompositionWidget
          logs={data.bodyCompositionLogs || []}
          latest={data.latestBodyComposition}
          previous={data.previousBodyComposition}
          onOpenModal={() => setIsSmartFitModalOpen(true)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Smart Fit Body Composition Modal */}
      <SmartFitModal
        isOpen={isSmartFitModalOpen}
        onClose={() => setIsSmartFitModalOpen(false)}
        latestLog={data.latestBodyComposition}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
