"use client";

import {
  addWaterAction,
  logSleepAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { DailyHealthData } from "@/lib/types";
import {
  ArrowRight,
  Check,
  Droplet,
  Flame,
  Moon,
  Pill,
  Plus,
  Salad,
  Settings2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HormonalCircadianWidget } from "./HormonalCircadianWidget";
import { ManageSupplementsModal } from "./ManageSupplementsModal";

interface DailyHealthViewProps {
  data: DailyHealthData;
  onRefresh?: () => void;
}

export function DailyHealthView({ data, onRefresh }: DailyHealthViewProps) {
  const router = useRouter();
  const [isManageSupplementsOpen, setIsManageSupplementsOpen] = useState(false);
  const [sleepHours, setSleepHours] = useState(data.todayHealth.sleepHours || 7.5);
  const [sleepQuality, setSleepQuality] = useState(data.todayHealth.sleepQuality || 4);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      router.refresh();
    }
  };

  const handleAddWater = (amount: number) => {
    startTransition(async () => {
      await addWaterAction(amount);
      handleRefresh();
    });
  };

  const handleToggleSupplement = (id: string) => {
    startTransition(async () => {
      await toggleSupplementAction(id);
      handleRefresh();
    });
  };

  const handleSaveSleep = () => {
    startTransition(async () => {
      await logSleepAction(sleepHours, sleepQuality);
      handleRefresh();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Hormonal Circadian Engine */}
      <HormonalCircadianWidget
        onOpenTraining={() => router.push("/health/training")}
        onOpenPantry={() => router.push("/health/nutrition")}
      />

      {/* 2. Top Metric Cards (4 Pillars: Training, Hydration, Nutrition, Sleep) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workout Streak */}
        <Link
          href="/health/training"
          className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs hover:border-[#D99B43]/50 transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Entrenamiento</span>
            <Flame className="h-4 w-4 text-[#D99B43]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#7EA35A]">
            {data.workoutStreak} días
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            {data.weeklyWorkoutsCount} sesiones esta semana
          </div>
        </Link>

        {/* Hydration */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Hidratación</span>
            <Droplet className="h-4 w-4 text-[#4EAB9E]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#4EAB9E]">
            {data.todayHealth.waterMl} / 3000 ml
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            {data.waterPercent}% de la meta
          </div>
        </div>

        {/* Nutrition */}
        <Link
          href="/health/nutrition"
          className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs hover:border-[#7EA35A]/50 transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Nutrición</span>
            <Salad className="h-4 w-4 text-[#7EA35A]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F2EB]">
            {data.nutritionSummary ? `${data.nutritionSummary.kcal} kcal` : "0 kcal"}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B] truncate">
            {data.nutritionSummary
              ? `P: ${data.nutritionSummary.proteinGrams}g | C: ${data.nutritionSummary.carbsGrams}g | G: ${data.nutritionSummary.fatGrams}g`
              : "Registrar porciones"}
          </div>
        </Link>

        {/* Sleep Average */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Sueño y descanso</span>
            <Moon className="h-4 w-4 text-[#DDD6C9]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F2EB]">
            {data.todayHealth.sleepHours} hrs
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B] flex items-center gap-1">
            <span>Calidad: {data.todayHealth.sleepQuality}/5</span>
            <Star className="h-3 w-3 text-[#D99B43] fill-[#D99B43]" />
            <span className="ml-1">• Prom: {data.averageSleepHours}h</span>
          </div>
        </div>
      </div>

      {/* 3. Core Interactive Widgets Grid (Balanced 2-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: Hidratación & Sueño */}
        <div className="space-y-5">
          {/* Hydration Tracker */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-[#4EAB9E]" />
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Hidratación (Meta 3L)
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#4EAB9E]">
                {data.todayHealth.waterMl} ml ({data.waterPercent}%)
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Progress bar */}
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
                <div
                  className="h-full bg-[#4EAB9E] transition-all duration-500"
                  style={{ width: `${data.waterPercent}%` }}
                />
              </div>

              {/* Quick add buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddWater(250)}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs font-semibold text-[#4EAB9E] hover:bg-[#162121] transition-all font-mono cursor-pointer"
                >
                  +250 ml (Vaso)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWater(500)}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs font-semibold text-[#4EAB9E] hover:bg-[#162121] transition-all font-mono cursor-pointer"
                >
                  +500 ml (Botella)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWater(1000)}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-[#121110] border border-[#2A2723] text-xs font-semibold text-[#4EAB9E] hover:bg-[#162121] transition-all font-mono cursor-pointer"
                >
                  +1,000 ml (Termo)
                </button>
              </div>
            </div>
          </div>

          {/* Sleep & Recovery Editor */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-[#D99B43]" />
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Sueño y recuperación
                </h3>
              </div>

              <button
                type="button"
                onClick={handleSaveSleep}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs cursor-pointer"
              >
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#DDD6C9] mb-1.5">
                  Horas dormidas: <strong className="text-[#F5F2EB] font-mono">{sleepHours} hrs</strong>
                </label>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-[#D99B43]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#8E867B] mt-1">
                  <span>4h</span>
                  <span>8h (Ideal)</span>
                  <span>12h</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#DDD6C9] mb-1.5">
                  Calidad: <strong className="text-[#F5F2EB] font-mono">{sleepQuality} / 5</strong>
                </label>
                <div className="flex items-center gap-2 font-mono">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSleepQuality(q)}
                      className={`flex-1 py-1.5 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        sleepQuality === q
                          ? "bg-[#221D16] border-[#D99B43]/40 text-[#D99B43]"
                          : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:text-[#DDD6C9]"
                      }`}
                    >
                      <span>{q}</span>
                      <Star
                        className={`h-3 w-3 ${
                          sleepQuality >= q ? "text-[#D99B43] fill-[#D99B43]" : "text-[#8E867B] fill-none"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Suplementos & Nutrición */}
        <div className="space-y-5">
          {/* Supplements Checklist */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-[#D99B43]" />
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Suplementos diarios
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#8E867B] font-mono">
                  {data.todayHealth.supplements.filter((s) => s.taken).length}/
                  {data.todayHealth.supplements.length} tomados
                </span>
                <button
                  type="button"
                  onClick={() => setIsManageSupplementsOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#221D16] hover:bg-[#3D3425] text-[#D99B43] border border-[#D99B43]/30 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  title="Configurar suplementos"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Configurar</span>
                </button>
              </div>
            </div>

            {data.todayHealth.supplements.length === 0 ? (
              <div className="mt-4 p-6 text-center rounded-lg border border-dashed border-[#2A2723] bg-[#121110]">
                <Pill className="h-7 w-7 text-[#8E867B] mx-auto mb-2" />
                <p className="text-xs text-[#8E867B] mb-3">
                  Sin suplementos configurados.
                </p>
                <button
                  type="button"
                  onClick={() => setIsManageSupplementsOpen(true)}
                  className="px-3 py-1.5 rounded-md bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-semibold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Configurar</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                {data.todayHealth.supplements.map((supp) => (
                  <button
                    key={supp.id}
                    type="button"
                    onClick={() => handleToggleSupplement(supp.id)}
                    disabled={isPending}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${
                      supp.taken
                        ? "border-[#7EA35A]/40 bg-[#1C2219] text-[#7EA35A]"
                        : "border-[#2A2723] bg-[#121110] text-[#DDD6C9] hover:border-[#38332D]"
                    }`}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span>{supp.name}</span>
                      {supp.timing && (
                        <span className="text-[10px] font-normal text-[#8E867B] mt-0.5">
                          {supp.timing}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ml-2 ${
                        supp.taken
                          ? "bg-[#7EA35A] border-[#7EA35A] text-[#121110]"
                          : "border-[#2A2723] bg-[#181715]"
                      }`}
                    >
                      {supp.taken && <Check className="h-3.5 w-3.5 stroke-3" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nutrition Summary Glance Card */}
          <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
              <div className="flex items-center gap-2">
                <Salad className="h-4 w-4 text-[#7EA35A]" />
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Nutrición y plan
                </h3>
              </div>
              <Link
                href="/health/nutrition"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7EA35A] hover:text-[#9DD16E] transition-colors cursor-pointer"
              >
                <span>Ir a Nutrición</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap font-mono">
                <span className="rounded bg-[#1C2219] border border-[#7EA35A]/30 px-2 py-1 text-xs text-[#7EA35A] font-bold">
                  {data.nutritionSummary ? `${data.nutritionSummary.kcal} kcal` : "0 kcal"}
                </span>
                {data.nutritionSummary && (
                  <span className="text-xs text-[#8E867B]">
                    P: <strong className="text-[#DDD6C9]">{data.nutritionSummary.proteinGrams}g</strong> | C: <strong className="text-[#DDD6C9]">{data.nutritionSummary.carbsGrams}g</strong> | G: <strong className="text-[#DDD6C9]">{data.nutritionSummary.fatGrams}g</strong>
                  </span>
                )}
              </div>

              <p className="text-xs text-[#8E867B]">
                {data.nutritionSummary?.nextMealTitle
                  ? `Próxima comida: ${data.nutritionSummary.nextMealTitle}`
                  : "Registra tus porciones diarias o consulta tus recetas."}
              </p>
            </div>

            <div className="pt-2 border-t border-[#2A2723]/60 flex items-center justify-between text-xs text-[#8E867B]">
              <span>Grupos completados:</span>
              <span className="font-mono font-bold text-[#F5F2EB]">
                {data.nutritionSummary?.groupsMetCount || 0} de 7
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Supplements Modal */}
      <ManageSupplementsModal
        isOpen={isManageSupplementsOpen}
        onClose={() => setIsManageSupplementsOpen(false)}
        supplements={data.supplementsCatalog || []}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
