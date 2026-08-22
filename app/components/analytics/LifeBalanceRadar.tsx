"use client";

import { LifeTagDistribution } from "@/lib/types";
import { Compass, Sparkles } from "lucide-react";

interface LifeBalanceRadarProps {
  tagDistributions: LifeTagDistribution[];
}

export function LifeBalanceRadar({ tagDistributions }: LifeBalanceRadarProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-2.5 pb-4 border-b border-white/6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Balance de Vida por Pilares & Tags
          </h3>
          <p className="text-xs text-neutral-400">
            Distribución de tu energía entre salud, trabajo, estudio y finanzas
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {tagDistributions.map((pillar) => (
          <div key={pillar.tag} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: pillar.color }}
                />
                <span className="font-semibold text-white capitalize">
                  #{pillar.tag}
                </span>
                <span className="text-neutral-500 font-mono text-[11px]">
                  ({pillar.count} tareas/hábitos)
                </span>
              </div>
              <span className="font-mono font-bold text-neutral-300">
                {pillar.percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-950">
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

      <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs text-indigo-300">
        💡 <strong>Consejo de Equilibrio:</strong> Mantén tus pilares de <code className="font-mono text-emerald-300">#salud</code> y <code className="font-mono text-indigo-300">#deepwork</code> por encima del 20% para evitar el burnout y mantener alta tu salud de Habitica.
      </div>
    </div>
  );
}
