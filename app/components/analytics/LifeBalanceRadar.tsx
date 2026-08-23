"use client";

import { LifeTagDistribution } from "@/lib/types";
import { Compass } from "lucide-react";

interface LifeBalanceRadarProps {
  tagDistributions: LifeTagDistribution[];
}

export function LifeBalanceRadar({ tagDistributions }: LifeBalanceRadarProps) {
  return (
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#2A2723]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
            Balance de Vida por Pilares & Tags
          </h3>
          <p className="text-xs text-[#8E867B]">
            Distribución de tu energía entre salud, trabajo, estudio y finanzas
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4 font-mono">
        {tagDistributions.map((pillar) => (
          <div key={pillar.tag} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: pillar.color }}
                />
                <span className="font-semibold text-[#F5F2EB]">
                  #{pillar.tag}
                </span>
                <span className="text-[#8E867B] font-mono text-[11px]">
                  ({pillar.count} tareas/hábitos)
                </span>
              </div>
              <span className="font-mono font-bold text-[#DDD6C9]">
                {pillar.percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pillar.percentage}%`,
                  backgroundColor: pillar.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-[#2A2723] bg-[#121110] p-3.5 text-xs text-[#DDD6C9] font-sans">
        💡 <strong className="text-[#F5F2EB]">Consejo de Equilibrio:</strong> Mantén tus pilares de <code className="font-mono text-[#D99B43]">#Selfcare</code> y <code className="font-mono text-[#4EAB9E]">#Productivity</code> en equilibrio frente a <code className="font-mono text-[#7EA35A]">#Proficient</code> y <code className="font-mono text-[#E05D52]">#Estudio</code> para maximizar tu momentum y evitar la fatiga mental.
      </div>
    </div>
  );
}
