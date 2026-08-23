"use client";

import { updateNutritionSettingsAction } from "@/app/actions/nutrition";
import { FOOD_GROUPS_CATALOG } from "@/lib/nutritionPresets";
import { FoodGroupKey, NutritionSettings } from "@/lib/types";
import { Settings2, X } from "lucide-react";
import { useState, useTransition } from "react";

interface NutritionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NutritionSettings;
  onSuccess?: () => void;
}

export function NutritionSettingsModal({
  isOpen,
  onClose,
  settings,
  onSuccess,
}: NutritionSettingsModalProps) {
  const [dailyGoals, setDailyGoals] = useState<Record<FoodGroupKey, number>>({
    ...settings.dailyPortionGoals,
  });
  const [waterGoal, setWaterGoal] = useState<number>(settings.waterTargetMl || 2000);
  const [activeWeek, setActiveWeek] = useState<number>(settings.activeWeek || 1);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleGoalChange = (key: FoodGroupKey, value: number) => {
    setDailyGoals((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateNutritionSettingsAction({
        dailyPortionGoals: dailyGoals,
        waterTargetMl: waterGoal,
        activeWeek: activeWeek,
      });
      if (onSuccess) onSuccess();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Configuración de Metas de Nutrición
              </h3>
              <p className="text-xs text-[#8E867B] font-mono">
                Personaliza tus porciones recomendadas y metas diarias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* General Targets (Water & Week) */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#121110] border border-[#2A2723]">
            <div>
              <label className="block text-[11px] font-bold text-[#DDD6C9] mb-1 font-serif">
                Meta de Hidratación:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="250"
                  min="1000"
                  max="5000"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#181715] p-2 font-mono text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                />
                <span className="text-xs text-[#8E867B] font-mono">ml</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#DDD6C9] mb-1 font-serif">
                Semana Activa del Plan:
              </label>
              <select
                value={activeWeek}
                onChange={(e) => setActiveWeek(Number(e.target.value))}
                className="w-full rounded-lg border border-[#2A2723] bg-[#181715] p-2 text-xs text-[#F5F2EB] font-mono focus:outline-none focus:border-[#D99B43]"
              >
                <option value={1}>Semana 1</option>
                <option value={2}>Semana 2</option>
                <option value={3}>Semana 3</option>
                <option value={4}>Semana 4</option>
              </select>
            </div>
          </div>

          {/* Portion Goals by Food Group */}
          <div>
            <label className="block text-xs font-bold text-[#DDD6C9] mb-2 font-serif">
              Metas Diarias por Grupo Alimenticio:
            </label>

            <div className="space-y-2">
              {(Object.keys(FOOD_GROUPS_CATALOG) as FoodGroupKey[]).map((key) => {
                const meta = FOOD_GROUPS_CATALOG[key];
                const val = dailyGoals[key] ?? meta.defaultDailyTarget;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[#2A2723] bg-[#121110]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.icon}</span>
                      <div>
                        <span className="text-xs font-semibold text-[#F5F2EB] block font-serif">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-[#8E867B] font-mono">
                          {meta.standardPortionDesc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        value={val}
                        onChange={(e) => handleGoalChange(key, parseFloat(e.target.value) || 0)}
                        className="w-16 rounded-md border border-[#2A2723] bg-[#181715] px-2 py-1 text-center font-mono text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                      />
                      <span className="text-[11px] text-[#8E867B] font-mono w-14">
                        {meta.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#2A2723] flex justify-end gap-2 font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] font-bold text-xs text-[#121110] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
          >
            {isPending ? "Guardando..." : "Guardar Ajustes"}
          </button>
        </div>
      </div>
    </div>
  );
}
