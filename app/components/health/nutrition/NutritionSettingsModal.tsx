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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Configuración de Metas de Nutrición
              </h3>
              <p className="text-xs text-neutral-400">
                Personaliza tus porciones recomendadas y metas diarias
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* General Targets (Water & Week) */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-neutral-950/60 border border-white/6">
            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
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
                  className="w-full rounded-xl border border-white/10 bg-neutral-900 p-2 font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
                <span className="text-xs text-neutral-500 font-mono">ml</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                Semana Activa del Plan:
              </label>
              <select
                value={activeWeek}
                onChange={(e) => setActiveWeek(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-neutral-900 p-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
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
            <label className="block text-xs font-bold text-neutral-300 mb-2">
              Metas Diarias por Grupo Alimenticio:
            </label>

            <div className="space-y-2">
              {(Object.keys(FOOD_GROUPS_CATALOG) as FoodGroupKey[]).map((key) => {
                const meta = FOOD_GROUPS_CATALOG[key];
                const val = dailyGoals[key] ?? meta.defaultDailyTarget;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/4 bg-neutral-950/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.icon}</span>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {meta.standardPortionDesc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        value={val}
                        onChange={(e) => handleGoalChange(key, parseFloat(e.target.value) || 0)}
                        className="w-16 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <span className="text-[11px] text-neutral-400 font-mono w-14">
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
        <div className="mt-4 pt-3 border-t border-white/8 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-500 disabled:opacity-40 transition-all shadow-lg shadow-emerald-600/20"
          >
            {isPending ? "Guardando..." : "Guardar Ajustes"}
          </button>
        </div>
      </div>
    </div>
  );
}
