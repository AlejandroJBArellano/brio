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
    <div className="space-y-6 font-sans">
      {/* 1. Header Overview Banner */}
      <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F5F2EB] tracking-tight">
                  Estudios Clínicos & Biomarcadores
                </h2>
                {report && (
                  <span className="rounded-md bg-[#221D16] px-2.5 py-0.5 text-[11px] font-bold text-[#D99B43] border border-[#D99B43]/30 font-mono">
                    {report.labName}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8E867B] mt-0.5 font-mono">
                {report ? (
                  <>
                    {report.orderNumber && (
                      <>Orden: <span className="font-mono text-[#DDD6C9]">{report.orderNumber}</span> • </>
                    )}
                    Fecha:{" "}
                    <strong className="text-[#F5F2EB]">
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
              className="px-3.5 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer font-sans"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Estudio</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Health Score */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
            <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
              <span>Score Clínico</span>
              <ShieldCheck className="h-4 w-4 text-[#7EA35A]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#7EA35A]">
                {healthScorePercent}%
              </span>
              <span className="text-[10px] text-[#8E867B] font-mono">en rango óptimo</span>
            </div>
            <div className="mt-1 text-[10px] text-[#8E867B] font-mono">
              {optimalCount} de {totalCount} parámetros
            </div>
          </div>

          {/* Filtration Rate TFGe */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
            <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
              <span>Filtración Renal (TFGe)</span>
              <Activity className="h-4 w-4 text-[#4EAB9E]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#4EAB9E]">120.8</span>
              <span className="text-[10px] text-[#8E867B] font-mono">mL/min</span>
            </div>
            <div className="mt-1 text-[10px] text-[#7EA35A] font-medium font-mono">
              Estadio G1: Excelente
            </div>
          </div>

          {/* Cardiovascular LDL */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
            <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
              <span>LDL / Triglicéridos</span>
              <Heart className="h-4 w-4 text-[#D99B43]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#F5F2EB]">97</span>
              <span className="text-[10px] text-[#8E867B] font-mono">/ 88 mg/dL</span>
            </div>
            <div className="mt-1 text-[10px] text-[#7EA35A] font-medium font-mono">
              Índice Aterogénico 3.9 (Óptimo)
            </div>
          </div>

          {/* Abnormal / Monitored Items */}
          <div className="rounded-lg border border-[#2A2723] bg-[#121110] p-3.5">
            <div className="flex items-center justify-between text-[11px] text-[#8E867B]">
              <span>Atención / Monitoreo</span>
              <AlertTriangle className="h-4 w-4 text-[#D99B43]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#D99B43]">
                {abnormalCount}
              </span>
              <span className="text-[10px] text-[#8E867B] font-mono">biomarcadores</span>
            </div>
            <div className="mt-1 text-[10px] text-[#8E867B] font-mono">
              Adaptaciones de fuerza y altitud
            </div>
          </div>
        </div>
      </div>

      {/* 2. Athletic Context & Sports Performance Interpretation Banner */}
      {showAthleticContext && (
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 sm:p-5 shadow-sm relative">
          <div className="flex items-start justify-between gap-3 mb-3 border-b border-[#2A2723] pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                Interpretación Contextual: Atleta de Fuerza & Altitud (22 Años)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowAthleticContext(false)}
              className="text-[#8E867B] hover:text-[#DDD6C9] text-xs p-1 cursor-pointer"
            >
              Ocultar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
            {/* 1. Muscular & Enzyme Turn-over */}
            <div className="rounded-lg bg-[#121110] border border-[#2A2723] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#D99B43]">
                <Dumbbell className="h-3.5 w-3.5 text-[#D99B43]" />
                <span className="font-serif">Recambio Muscular (LDH & Albúmina)</span>
              </div>
              <p className="text-[#8E867B] text-[11px] leading-relaxed">
                La <strong className="text-[#DDD6C9]">LDH en 287 U/L</strong> (ref 125-239) y la <strong className="text-[#DDD6C9]">Albúmina en 5.2 g/dL</strong> son marcadores clásicos de microdaño y alta síntesis de tejido por entrenamiento de hipertrofia en Gym / Hevy.
              </p>
            </div>

            {/* 2. Altitude & Oxygen Delivery */}
            <div className="rounded-lg bg-[#121110] border border-[#2A2723] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#E05D52]">
                <Mountain className="h-3.5 w-3.5 text-[#E05D52]" />
                <span className="font-serif">Oxigenación & Altitud (CDMX 2,240m)</span>
              </div>
              <p className="text-[#8E867B] text-[11px] leading-relaxed">
                <strong className="text-[#DDD6C9]">Hemoglobina 19.1 g/dL</strong> y <strong className="text-[#DDD6C9]">Hematócrito 56.7%</strong> reflejan una respuesta eritropoyética adaptada a la altitud geográfica y entrenamiento de alta intensidad. Mantener meta de 3L de agua.
              </p>
            </div>

            {/* 3. Renal & Lipid Balance */}
            <div className="rounded-lg bg-[#121110] border border-[#2A2723] p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#4EAB9E]">
                <Activity className="h-3.5 w-3.5 text-[#4EAB9E]" />
                <span className="font-serif">Salud Renal & Metabolismo</span>
              </div>
              <p className="text-[#8E867B] text-[11px] leading-relaxed">
                <strong className="text-[#DDD6C9]">Creatinina 0.90 mg/dL</strong> y <strong className="text-[#DDD6C9]">TFGe 120.8</strong> demuestran riñones 100% sanos y tolerantes a creatina. Glucosa 83 mg/dL y triglicéridos 88 mg/dL excelentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filters & Category Navigation Ribbon */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-xl border border-[#2A2723] bg-[#181715]">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#121110] border border-[#2A2723] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeCategory === "all"
                ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Todos</span>
            <span className="ml-1 rounded bg-[#181715] px-1.5 py-0.2 text-[9px] font-mono text-[#DDD6C9]">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 shadow-xs"
                    : "text-[#8E867B] hover:text-[#DDD6C9]"
                }`}
              >
                <span>{meta.shortLabel}</span>
                <span className="rounded bg-[#181715] px-1.5 py-0.2 text-[9px] font-mono text-[#DDD6C9]">
                  {count}
                </span>
                {hasAbnormal && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D99B43]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E867B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar biomarcador..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-8 pr-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:border-[#D99B43] focus:outline-none"
            />
          </div>

          {/* Status Quick Toggle */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "abnormal" | "optimal")}
            className="rounded-lg border border-[#2A2723] bg-[#121110] px-3 py-1.5 text-xs text-[#DDD6C9] focus:border-[#D99B43] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="abnormal">Solo fuera de rango ({abnormalCount})</option>
            <option value="optimal">Solo óptimos ({optimalCount})</option>
          </select>
        </div>
      </div>

      {/* 4. Active Category Info Header (if specific category selected) */}
      {activeCategory !== "all" && (
        <div className="flex items-center justify-between px-2 py-1 text-xs text-[#8E867B]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#F5F2EB]">
              {BIOMARKER_CATEGORIES_META[activeCategory].label}
            </span>
            <span className="text-[11px] text-[#8E867B]">
              — {BIOMARKER_CATEGORIES_META[activeCategory].description}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#8E867B]">
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
              accentColor={BIOMARKER_CATEGORIES_META[biomarker.category]?.color || "amber"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-8 text-center">
          <FlaskConical className="h-8 w-8 text-[#8E867B] mx-auto mb-2 opacity-50" />
          <h4 className="font-serif text-sm font-bold text-[#DDD6C9]">No se encontraron biomarcadores</h4>
          <p className="text-xs text-[#8E867B] mt-1 max-w-sm mx-auto">
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
