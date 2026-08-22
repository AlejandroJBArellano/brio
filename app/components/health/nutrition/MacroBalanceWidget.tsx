"use client";

import { MacroEstimate } from "@/lib/types";
import { Flame, Info, Leaf, PieChart, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

interface MacroBalanceWidgetProps {
  macros: MacroEstimate;
}

export function MacroBalanceWidget({ macros }: MacroBalanceWidgetProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate calories from macros for percentage distribution
  const proteinCals = macros.proteinGrams * 4;
  const carbsCals = macros.carbsGrams * 4;
  const fatCals = macros.fatGrams * 9;
  const totalCalculatedCals = proteinCals + carbsCals + fatCals || 1;

  const proteinPct = Math.round((proteinCals / totalCalculatedCals) * 100);
  const carbsPct = Math.round((carbsCals / totalCalculatedCals) * 100);
  const fatPct = Math.round((fatCals / totalCalculatedCals) * 100);

  return (
    <div className="rounded-2xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Balance de Macronutrientes Estimado</span>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-neutral-400 hover:text-white transition-colors"
                title="Información sobre cálculo de macros"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </h3>
            <p className="text-xs text-neutral-400">
              Calculado automáticamente a partir de tus porciones del día
            </p>
          </div>
        </div>

        {/* Total Calories Badge */}
        <div className="flex items-baseline gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 shadow-inner">
          <span className="text-xs text-amber-300 font-semibold">Total:</span>
          <span className="font-mono text-xl font-extrabold text-amber-400">
            {macros.kcal}
          </span>
          <span className="text-[11px] font-mono text-amber-300/80">kcal</span>
        </div>
      </div>

      {showInfo && (
        <div className="mt-3 p-3 rounded-xl bg-neutral-950/80 border border-white/8 text-xs text-neutral-300 leading-relaxed animate-in fade-in duration-200">
          <p>
            💡 <strong className="text-white">Estimación Nutricional:</strong> Las calorías y gramos de proteína, carbohidratos, grasas y fibra se calculan según los factores equivalentes estándar de cada grupo del plan de la nutrióloga Mariana Mont. Te permite llevar un control aproximado sin necesidad de pesar cada gramo de comida.
          </p>
        </div>
      )}

      {/* Macro Breakdown Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Protein */}
        <div className="flex flex-col rounded-xl border border-violet-500/20 bg-neutral-950/60 p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-violet-300">Proteína</span>
            <span className="text-[10px] font-mono text-violet-400 font-bold">{proteinPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-extrabold text-white">
              {macros.proteinGrams}
            </span>
            <span className="text-xs text-neutral-400">g</span>
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5">Tofu, legumbres, semillas</span>
        </div>

        {/* Carbs */}
        <div className="flex flex-col rounded-xl border border-amber-500/20 bg-neutral-950/60 p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-amber-300">Carbohidratos</span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">{carbsPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-extrabold text-white">
              {macros.carbsGrams}
            </span>
            <span className="text-xs text-neutral-400">g</span>
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5">Granos integrales, fruta</span>
        </div>

        {/* Fats */}
        <div className="flex flex-col rounded-xl border border-lime-500/20 bg-neutral-950/60 p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-lime-300">Grasas Saludables</span>
            <span className="text-[10px] font-mono text-lime-400 font-bold">{fatPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-extrabold text-white">
              {macros.fatGrams}
            </span>
            <span className="text-xs text-neutral-400">g</span>
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5">Semillas, aguacate, aceite</span>
        </div>

        {/* Fiber */}
        <div className="flex flex-col rounded-xl border border-emerald-500/20 bg-neutral-950/60 p-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-emerald-300">Fibra Dietética</span>
            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-extrabold text-emerald-400">
              {macros.fiberGrams}
            </span>
            <span className="text-xs text-neutral-400">g</span>
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5">Verduras, hojas, avena</span>
        </div>
      </div>

      {/* Distribution Ratio Multi-Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
          <span>Distribución Calórica</span>
          <span className="font-mono text-neutral-500">
            P: {proteinPct}% | C: {carbsPct}% | G: {fatPct}%
          </span>
        </div>
        <div className="h-2.5 w-full flex overflow-hidden rounded-full bg-neutral-950 border border-white/6">
          <div
            style={{ width: `${proteinPct}%` }}
            className="bg-violet-500 transition-all duration-500"
            title={`Proteína: ${proteinPct}%`}
          />
          <div
            style={{ width: `${carbsPct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Carbohidratos: ${carbsPct}%`}
          />
          <div
            style={{ width: `${fatPct}%` }}
            className="bg-lime-500 transition-all duration-500"
            title={`Grasas: ${fatPct}%`}
          />
        </div>
      </div>
    </div>
  );
}
