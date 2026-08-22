"use client";

import { BiomarkerPanelCard } from "./BiomarkerPanelCard";
import { AddLabReportModal } from "./AddLabReportModal";
import { BIOMARKER_CATEGORIES_META } from "@/lib/labPresets";
import {
  BiomarkerCategoryKey,
  BiomarkerLog,
  BiomarkersDashboardData,
  LabTestReport,
} from "@/lib/types";
import {
  Activity,
  AlertTriangle,
  Dumbbell,
  FlaskConical,
  Heart,
  Layers,
  Mountain,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

interface BiomarkersViewProps {
  data?: BiomarkersDashboardData;
  onRefresh?: () => void;
}

export function BiomarkersView({ data, onRefresh }: BiomarkersViewProps) {
  const [activeCategory, setActiveCategory] = useState<BiomarkerCategoryKey | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "abnormal" | "optimal">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAthleticContext, setShowAthleticContext] = useState(true);

  const report: LabTestReport | undefined = data?.latestReport;
  const biomarkers: BiomarkerLog[] = useMemo(() => {
    return report?.biomarkers || [];
  }, [report]);

  // Compute summary stats
  const totalCount = biomarkers.length;
  const abnormalCount = biomarkers.filter(
    (b) => b.status === "high" || b.status === "low" || b.status === "critical"
  ).length;
  const optimalCount = totalCount - abnormalCount;
  const healthScorePercent = totalCount > 0 ? Math.round((optimalCount / totalCount) * 100) : 100;

  // Filter biomarkers based on category, status, and search query
  const filteredBiomarkers = useMemo(() => {
    return biomarkers.filter((b) => {
      // Category filter
      if (activeCategory !== "all" && b.category !== activeCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === "abnormal" && b.status !== "high" && b.status !== "low" && b.status !== "critical") {
        return false;
      }
      if (statusFilter === "optimal" && b.status !== "optimal" && b.status !== "normal") {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesCode = b.code?.toLowerCase().includes(q);
        const matchesNotes = b.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [biomarkers, activeCategory, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Overview Banner */}
      <div className="rounded-2xl border border-cyan-500/20 bg-linear-to-br from-neutral-900/90 via-neutral-900/60 to-cyan-950/20 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-lg shadow-cyan-500/10">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Estudios Clínicos & Biomarcadores
                </h2>
                {report && (
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 border border-cyan-500/20 font-mono">
                    {report.labName}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {report ? (
                  <>
                    {report.orderNumber && (
                      <>Orden: <span className="font-mono text-neutral-300">{report.orderNumber}</span> • </>
                    )}
                    Fecha:{" "}
                    <strong className="text-neutral-200">
                      {new Date(report.date + "T00:00:00").toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </strong>
                  </>
                ) : (
                  <span>Sin estudios clínicos registrados aún</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Estudio</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Health Score */}
          <div className="rounded-xl border border-emerald-500/20 bg-neutral-950/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Score Clínico</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {healthScorePercent}%
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">en rango óptimo</span>
            </div>
            <div className="mt-1 text-[10px] text-neutral-400">
              {optimalCount} de {totalCount} parámetros evaluados
            </div>
          </div>

          {/* Filtration Rate TFGe */}
          <div className="rounded-xl border border-cyan-500/20 bg-neutral-950/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Filtración Renal (TFGe)</span>
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-cyan-400">120.8</span>
              <span className="text-[10px] text-neutral-500 font-mono">mL/min</span>
            </div>
            <div className="mt-1 text-[10px] text-emerald-400 font-medium">
              Estadio G1: Función renal excelente
            </div>
          </div>

          {/* Cardiovascular LDL */}
          <div className="rounded-xl border border-rose-500/20 bg-neutral-950/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Colesterol LDL / Triglicéridos</span>
              <Heart className="h-4 w-4 text-rose-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-rose-300">97</span>
              <span className="text-[10px] text-neutral-400 font-mono">/ 88 mg/dL</span>
            </div>
            <div className="mt-1 text-[10px] text-emerald-400 font-medium">
              Índice Aterogénico 3.9 (Óptimo)
            </div>
          </div>

          {/* Abnormal / Monitored Items */}
          <div className="rounded-xl border border-amber-500/20 bg-neutral-950/60 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Atención / Monitoreo</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {abnormalCount}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">biomarcadores</span>
            </div>
            <div className="mt-1 text-[10px] text-neutral-400">
              Adaptaciones de fuerza y altitud
            </div>
          </div>
        </div>
      </div>

      {/* 2. Athletic Context & Sports Performance Interpretation Banner */}
      {showAthleticContext && (
        <div className="rounded-2xl border border-amber-500/25 bg-neutral-900/70 p-4 sm:p-5 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Interpretación Contextual: Atleta de Fuerza & Altitud (22 Años)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowAthleticContext(false)}
              className="text-neutral-500 hover:text-neutral-300 text-xs p-1"
            >
              Ocultar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* 1. Muscular & Enzyme Turn-over */}
            <div className="rounded-xl bg-neutral-950/70 border border-white/6 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Dumbbell className="h-3.5 w-3.5 text-amber-400" />
                <span>Recambio Muscular (LDH & Albúmina)</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                La <strong>LDH en 287 U/L</strong> (ref 125-239) y la <strong>Albúmina en 5.2 g/dL</strong> son marcadores clásicos de microdaño y alta síntesis de tejido por entrenamiento de hipertrofia en Gym / Hevy.
              </p>
            </div>

            {/* 2. Altitude & Oxygen Delivery */}
            <div className="rounded-xl bg-neutral-950/70 border border-white/6 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <Mountain className="h-3.5 w-3.5 text-rose-400" />
                <span>Oxigenación & Altitud (CDMX 2,240m)</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                <strong>Hemoglobina 19.1 g/dL</strong> y <strong>Hematócrito 56.7%</strong> reflejan una respuesta eritropoyética adaptada a la altitud geográfica y entrenamiento de alta intensidad. Mantener meta de 3L de agua.
              </p>
            </div>

            {/* 3. Renal & Lipid Balance */}
            <div className="rounded-xl bg-neutral-950/70 border border-white/6 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span>Salud Renal & Metabolismo</span>
              </div>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                <strong>Creatinina 0.90 mg/dL</strong> y <strong>TFGe 120.8</strong> demuestran riñones 100% sanos y tolerantes a creatina. Glucosa 83 mg/dL y triglicéridos 88 mg/dL excelentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filters & Category Navigation Ribbon */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-2xl border border-white/8 bg-neutral-900/60 backdrop-blur-xl shadow-lg">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-950/80 border border-white/6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === "all"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Todos</span>
            <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-neutral-300">
              {totalCount}
            </span>
          </button>

          {(Object.keys(BIOMARKER_CATEGORIES_META) as BiomarkerCategoryKey[]).map((catKey) => {
            const meta = BIOMARKER_CATEGORIES_META[catKey];
            const catBiomarkers = biomarkers.filter((b) => b.category === catKey);
            const count = catBiomarkers.length;
            const hasAbnormal = catBiomarkers.some(
              (b) => b.status === "high" || b.status === "low" || b.status === "critical"
            );
            const isSelected = activeCategory === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategory(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>{meta.shortLabel}</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-mono text-neutral-300">
                  {count}
                </span>
                {hasAbnormal && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar biomarcador..."
              className="w-full rounded-xl border border-white/8 bg-neutral-950/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Status Quick Toggle */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "abnormal" | "optimal")}
            className="rounded-xl border border-white/8 bg-neutral-950/90 px-3 py-1.5 text-xs text-neutral-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="abnormal">Solo fuera de rango ({abnormalCount})</option>
            <option value="optimal">Solo óptimos ({optimalCount})</option>
          </select>
        </div>
      </div>

      {/* 4. Active Category Info Header (if specific category selected) */}
      {activeCategory !== "all" && (
        <div className="flex items-center justify-between px-2 py-1 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {BIOMARKER_CATEGORIES_META[activeCategory].label}
            </span>
            <span className="text-[11px] text-neutral-500">
              — {BIOMARKER_CATEGORIES_META[activeCategory].description}
            </span>
          </div>
          <span className="font-mono text-[11px] text-neutral-400">
            {filteredBiomarkers.length} pruebas
          </span>
        </div>
      )}

      {/* 5. Biomarkers Responsive Grid */}
      {filteredBiomarkers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBiomarkers.map((biomarker) => (
            <BiomarkerPanelCard
              key={biomarker.id}
              biomarker={biomarker}
              accentColor={BIOMARKER_CATEGORIES_META[biomarker.category]?.color || "cyan"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-neutral-900/40 p-8 text-center backdrop-blur-xl">
          <FlaskConical className="h-8 w-8 text-neutral-500 mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-bold text-neutral-300">No se encontraron biomarcadores</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Prueba ajustando los filtros de categoría, estado o la búsqueda de texto.
          </p>
        </div>
      )}

      {/* 6. Add Lab Report Modal */}
      <AddLabReportModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
