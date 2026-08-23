"use client";

import { MacroEstimate } from "@/lib/types";
import { Flame, Info, Leaf } from "lucide-react";
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
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
              <span>Balance de Macronutrientes Estimado</span>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-[#8E867B] hover:text-[#F5F2EB] transition-colors cursor-pointer"
                title="Información sobre cálculo de macros"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </h3>
            <p className="text-xs text-[#8E867B] font-mono">
              Calculado automáticamente a partir de tus porciones del día
            </p>
          </div>
        </div>

        {/* Total Calories Badge */}
        <div className="flex items-baseline gap-1.5 rounded-lg border border-[#D99B43]/30 bg-[#221D16] px-3 py-1.5 font-mono">
          <span className="text-xs text-[#D99B43] font-semibold">Total:</span>
          <span className="font-mono text-xl font-bold text-[#F5F2EB]">
            {macros.kcal}
          </span>
          <span className="text-[11px] font-mono text-[#D99B43]">kcal</span>
        </div>
      </div>

      {showInfo && (
        <div className="mt-3 p-3 rounded-lg bg-[#121110] border border-[#2A2723] text-xs text-[#DDD6C9] leading-relaxed animate-in fade-in duration-150 font-sans">
          <p>
            💡 <strong className="text-[#F5F2EB]">Estimación Nutricional:</strong> Las calorías y gramos de proteína, carbohidratos, grasas y fibra se calculan según los factores equivalentes estándar de cada grupo del plan de la nutrióloga Mariana Mont. Te permite llevar un control aproximado sin necesidad de pesar cada gramo de comida.
          </p>
        </div>
      )}

      {/* Macro Breakdown Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        {/* Protein */}
        <div className="flex flex-col rounded-lg border border-[#2A2723] bg-[#121110] p-3">
          <div className="flex items-center justify-between text-xs text-[#8E867B]">
            <span className="font-semibold text-[#4EAB9E] font-sans">Proteína</span>
            <span className="text-[10px] font-mono text-[#4EAB9E] font-bold">{proteinPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-[#F5F2EB]">
              {macros.proteinGrams}
            </span>
            <span className="text-xs text-[#8E867B]">g</span>
          </div>
          <span className="text-[10px] text-[#8E867B] mt-0.5 font-sans">Tofu, legumbres, semillas</span>
        </div>

        {/* Carbs */}
        <div className="flex flex-col rounded-lg border border-[#2A2723] bg-[#121110] p-3">
          <div className="flex items-center justify-between text-xs text-[#8E867B]">
            <span className="font-semibold text-[#D99B43] font-sans">Carbohidratos</span>
            <span className="text-[10px] font-mono text-[#D99B43] font-bold">{carbsPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-[#F5F2EB]">
              {macros.carbsGrams}
            </span>
            <span className="text-xs text-[#8E867B]">g</span>
          </div>
          <span className="text-[10px] text-[#8E867B] mt-0.5 font-sans">Granos integrales, fruta</span>
        </div>

        {/* Fats */}
        <div className="flex flex-col rounded-lg border border-[#2A2723] bg-[#121110] p-3">
          <div className="flex items-center justify-between text-xs text-[#8E867B]">
            <span className="font-semibold text-[#7EA35A] font-sans">Grasas</span>
            <span className="text-[10px] font-mono text-[#7EA35A] font-bold">{fatPct}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-[#F5F2EB]">
              {macros.fatGrams}
            </span>
            <span className="text-xs text-[#8E867B]">g</span>
          </div>
          <span className="text-[10px] text-[#8E867B] mt-0.5 font-sans">Semillas, aguacate, aceite</span>
        </div>

        {/* Fiber */}
        <div className="flex flex-col rounded-lg border border-[#2A2723] bg-[#121110] p-3">
          <div className="flex items-center justify-between text-xs text-[#8E867B]">
            <span className="font-semibold text-[#7EA35A] font-sans">Fibra</span>
            <Leaf className="h-3.5 w-3.5 text-[#7EA35A]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-[#7EA35A]">
              {macros.fiberGrams}
            </span>
            <span className="text-xs text-[#8E867B]">g</span>
          </div>
          <span className="text-[10px] text-[#8E867B] mt-0.5 font-sans">Verduras, hojas, avena</span>
        </div>
      </div>

      {/* Distribution Ratio Multi-Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[11px] text-[#8E867B] font-mono">
          <span>Distribución Calórica</span>
          <span>
            P: {proteinPct}% | C: {carbsPct}% | G: {fatPct}%
          </span>
        </div>
        <div className="h-2 w-full flex overflow-hidden rounded bg-[#121110] border border-[#2A2723]">
          <div
            style={{ width: `${proteinPct}%` }}
            className="bg-[#4EAB9E] transition-all duration-300"
            title={`Proteína: ${proteinPct}%`}
          />
          <div
            style={{ width: `${carbsPct}%` }}
            className="bg-[#D99B43] transition-all duration-300"
            title={`Carbohidratos: ${carbsPct}%`}
          />
          <div
            style={{ width: `${fatPct}%` }}
            className="bg-[#7EA35A] transition-all duration-300"
            title={`Grasas: ${fatPct}%`}
          />
        </div>
      </div>
    </div>
  );
}
