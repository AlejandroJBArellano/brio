"use client";

import {
  addWaterAction,
  importSamsungHealthDataAction,
  logSleepAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { DailyHealthData } from "@/lib/types";
import {
  Activity,
  ArrowRight,
  Check,
  Droplet,
  Flame,
  Moon,
  Pill,
  Plus,
  Salad,
  Settings2,
  UploadCloud,
  X
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManageSupplementsOpen, setIsManageSupplementsOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [sleepHours, setSleepHours] = useState(data.todayHealth.sleepHours || 10.0);
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

  const handleImportSamsungHealth = () => {
    if (!importJson.trim()) return;
    startTransition(async () => {
      await importSamsungHealthDataAction(importJson.trim());
      setIsImportModalOpen(false);
      setImportJson("");
      handleRefresh();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Hormonal Circadian Engine & 7 Androgenic Pillars */}
      <HormonalCircadianWidget
        onOpenHevy={() => router.push("/health/training")}
        onOpenPantry={() => router.push("/health/nutrition")}
      />

      {/* 2. Header Quick Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workout Streak */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Racha de Entrenamiento</span>
            <Flame className="h-4 w-4 text-[#D99B43]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#7EA35A]">
            {data.workoutStreak} días seguidos
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            {data.weeklyWorkoutsCount} sesiones esta semana
          </div>
        </div>

        {/* Hydration */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Hidratación Hoy</span>
            <Droplet className="h-4 w-4 text-[#4EAB9E]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#4EAB9E]">
            {data.todayHealth.waterMl} / 3000 ml
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            {data.waterPercent}% de tu meta diaria de 3L
          </div>
        </div>

        {/* Sleep Average */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Sueño & Descanso</span>
            <Moon className="h-4 w-4 text-[#DDD6C9]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F2EB]">
            {data.todayHealth.sleepHours} hrs
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            Calidad: {data.todayHealth.sleepQuality} de 5 ⭐ (Promedio: {data.averageSleepHours}h)
          </div>
        </div>

        {/* Daily Steps */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Pasos / Movimiento</span>
            <Activity className="h-4 w-4 text-[#D99B43]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F2EB]">
            {data.todayHealth.stepsCount > 0
              ? `${data.todayHealth.stepsCount.toLocaleString()} pasos`
              : "Samsung Sync"}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="text-[#D99B43] hover:underline font-semibold cursor-pointer"
            >
              Importar Samsung Health ↗
            </button>
          </div>
        </div>
      </div>

      {/* 3. Quick Glance Cards (Nutrición & Gym jump points) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nutrition Glance Card */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4.5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30">
              <Salad className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                  Nutrición: {data.nutritionSummary ? `${data.nutritionSummary.kcal} kcal` : "Plan Mariana Mont"}
                </h3>
                {data.nutritionSummary && (
                  <span className="rounded bg-[#1C2219] border border-[#7EA35A]/30 px-1.5 py-0.5 text-[10px] font-mono text-[#7EA35A] font-bold">
                    P: {data.nutritionSummary.proteinGrams}g | C: {data.nutritionSummary.carbsGrams}g | G: {data.nutritionSummary.fatGrams}g
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8E867B] mt-1 line-clamp-1">
                {data.nutritionSummary?.nextMealTitle
                  ? `Próxima comida: ${data.nutritionSummary.nextMealTitle}`
                  : "Plan Mariana Mont activo • Registra tus porciones del día"}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Link
              href="/health/nutrition"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7EA35A] hover:text-[#9DD16E] transition-colors cursor-pointer"
            >
              <span>Ir a Nutrición & Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Daily Interactive Logs Grid: Water & Supplements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hydration Tracker */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-[#4EAB9E]" />
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                Medidor de Hidratación (Meta 3L)
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

        {/* Supplements Checklist */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2723]">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-[#D99B43]" />
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                Checklist de Suplementos Diarios
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
                title="Configurar y gestionar suplementos"
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
                No tienes suplementos configurados en tu checklist diario.
              </p>
              <button
                type="button"
                onClick={() => setIsManageSupplementsOpen(true)}
                className="px-3 py-1.5 rounded-md bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-semibold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Configurar Suplementos</span>
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
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all text-xs font-semibold cursor-pointer ${supp.taken
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
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ml-2 ${supp.taken
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
      </div>

      {/* 5. Sleep & Recovery Editor */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#2A2723]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                Registro de Sueño & Recuperación
              </h3>
              <p className="text-xs text-[#8E867B]">
                Ajusta las horas de sueño y calidad de tu última noche
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSleep}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs cursor-pointer"
          >
            {isPending ? "Guardando..." : "Guardar Registro"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <span>4h (Insomnio)</span>
              <span>8h (Ideal)</span>
              <span>12h</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#DDD6C9] mb-1.5">
              Calidad de descanso: <strong className="text-[#F5F2EB]">{sleepQuality} / 5 ⭐</strong>
            </label>
            <div className="flex items-center gap-2 font-mono">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSleepQuality(q)}
                  className={`flex-1 py-2 rounded-md border text-xs font-bold transition-all cursor-pointer ${sleepQuality === q
                      ? "bg-[#221D16] border-[#D99B43]/40 text-[#D99B43]"
                      : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                >
                  {q} ⭐
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Samsung Health Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                    Importar Datos de Samsung Health
                  </h3>
                  <p className="text-xs text-[#8E867B]">
                    Pega el contenido JSON o registros exportados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono">
              <textarea
                rows={6}
                placeholder={'[{"date": "2026-08-22", "steps": 8500, "sleep_hours": 7.8}]'}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-3 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
              />
              <div className="flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImportSamsungHealth}
                  disabled={isPending || !importJson.trim()}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Importando..." : "Importar a Neon DB"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
