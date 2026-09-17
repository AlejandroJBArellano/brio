"use client";

import { soundFx } from "@/lib/soundFx";
import { ExerciseCatalogItem, MuscleGroupId } from "@/lib/types";
import { MUSCLE_METADATA } from "@/lib/muscleRecovery";
import {
  Calendar,
  Dumbbell,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { CustomExerciseModal } from "./CustomExerciseModal";

interface ExerciseCatalogViewProps {
  catalog: ExerciseCatalogItem[];
  onRefresh: () => void;
}

export function ExerciseCatalogView({
  catalog,
  onRefresh,
}: ExerciseCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = catalog.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === "all" || item.muscleGroup === selectedMuscle;
    const matchesEquipment = selectedEquipment === "all" || item.equipmentType === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const muscleKeys = Object.keys(MUSCLE_METADATA) as MuscleGroupId[];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[#2A2723] bg-[#181715]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43]">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-[#F5F2EB]">
              Catálogo de Ejercicios y Récords
            </h2>
            <div className="text-xs text-[#8E867B] font-mono mt-0.5">
              {catalog.length} ejercicios registrados con historial de PRs
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.click();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo ejercicio</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl border border-[#2A2723] bg-[#181715] space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
            <input
              type="text"
              placeholder="Buscar ejercicio por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121110] border border-[#2A2723] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] outline-hidden"
            />
          </div>

          {/* Equipment Dropdown */}
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="w-full sm:w-48 bg-[#121110] border border-[#2A2723] rounded-xl px-3 py-2 text-xs text-[#DDD6C9] focus:border-[#D99B43] outline-hidden cursor-pointer"
          >
            <option value="all">Cualquier equipo</option>
            <option value="barbell">Barra</option>
            <option value="dumbbell">Mancuerna</option>
            <option value="cable">Polea / Cable</option>
            <option value="machine">Máquina</option>
            <option value="smith_machine">Multipower / Smith</option>
            <option value="bodyweight">Peso corporal</option>
            <option value="kettlebell">Pesa rusa</option>
            <option value="other">Otro</option>
          </select>
        </div>

        {/* Muscle Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedMuscle("all")}
            className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
              selectedMuscle === "all"
                ? "bg-[#D99B43] text-[#121110] font-bold"
                : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
            }`}
          >
            Todos los músculos
          </button>
          {muscleKeys.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMuscle(m)}
              className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                selectedMuscle === m
                  ? "bg-[#D99B43] text-[#121110] font-bold"
                  : "bg-[#121110] text-[#8E867B] hover:text-[#DDD6C9] border border-[#2A2723]"
              }`}
            >
              {MUSCLE_METADATA[m]?.name.split("/")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Table / Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2A2723] p-10 text-center space-y-2">
          <p className="text-xs text-[#8E867B]">
            No se encontraron ejercicios con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 flex flex-col justify-between space-y-3 hover:border-[#D99B43]/40 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[#F5F2EB] line-clamp-1">
                    {item.title}
                  </h3>
                  {item.isCustom && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] shrink-0">
                      <Sparkles className="h-3 w-3" />
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#8E867B] font-mono mt-1">
                  <span>{MUSCLE_METADATA[item.muscleGroup]?.name || "Músculo"}</span>
                  <span>•</span>
                  <span className="capitalize">{item.equipmentType}</span>
                </div>
              </div>

              {/* PRs and History Stats */}
              <div className="rounded-lg bg-[#121110] border border-[#2A2723] p-2.5 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[#8E867B] flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-[#D99B43]" />
                    <span>Récord Peso</span>
                  </div>
                  <div className="mt-0.5 font-bold text-[#7EA35A]">
                    {item.maxWeightKg ? `${item.maxWeightKg} kg` : "-"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#8E867B] flex items-center gap-1">
                    <Layers className="h-3 w-3 text-[#4EAB9E]" />
                    <span>1RM Estimado</span>
                  </div>
                  <div className="mt-0.5 font-bold text-[#4EAB9E]">
                    {item.maxEstimated1Rm ? `${item.maxEstimated1Rm} kg` : "-"}
                  </div>
                </div>
              </div>

              {item.lastTrainedAt && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#8E867B] font-mono">
                  <Calendar className="h-3 w-3" />
                  <span>Último entreno: {item.lastTrainedAt} ({item.totalSessionsCount || 1} sesiones)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom Exercise Modal */}
      {showCreateModal && (
        <CustomExerciseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
