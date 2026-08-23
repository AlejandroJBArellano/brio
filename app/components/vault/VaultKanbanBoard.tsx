"use client";

import {
  deleteVaultItemAction,
  incrementVaultItemProgressAction,
  updateVaultItemStatusAction,
} from "@/app/actions/vault";
import { VaultItem, VaultItemCategory, VaultItemStatus } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { PdfViewerModal } from "./PdfViewerModal";

interface VaultKanbanBoardProps {
  category: VaultItemCategory;
  items: VaultItem[];
  onOpenAddModal: () => void;
  onRefresh?: () => void;
}

interface ColumnConfig {
  id: VaultItemStatus;
  title: string;
  badgeColor: string;
  borderColor: string;
  icon: string;
}

export function VaultKanbanBoard({
  category,
  items,
  onOpenAddModal,
  onRefresh,
}: VaultKanbanBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [viewingPdfItem, setViewingPdfItem] = useState<VaultItem | null>(null);

  const getColumns = (): ColumnConfig[] => {
    switch (category) {
      case "sheet_music":
        return [
          {
            id: "backlog",
            title: "Por Aprender 🎼",
            badgeColor: "bg-[#121110] text-[#8E867B] border-[#2A2723]",
            borderColor: "border-[#2A2723]",
            icon: "🎼",
          },
          {
            id: "in_progress",
            title: "En Práctica 🎹",
            badgeColor: "bg-[#162121] text-[#4EAB9E] border-[#4EAB9E]/30",
            borderColor: "border-[#2A2723]",
            icon: "🎹",
          },
          {
            id: "completed",
            title: "Dominada (Repertorio) ✨",
            badgeColor: "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/30",
            borderColor: "border-[#2A2723]",
            icon: "✨",
          },
        ];
      case "course":
        return [
          {
            id: "backlog",
            title: "Por Empezar 🎓",
            badgeColor: "bg-[#121110] text-[#8E867B] border-[#2A2723]",
            borderColor: "border-[#2A2723]",
            icon: "🎓",
          },
          {
            id: "in_progress",
            title: "En Curso (Estudiando) 📖",
            badgeColor: "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30",
            borderColor: "border-[#2A2723]",
            icon: "📖",
          },
          {
            id: "completed",
            title: "Completado & Certificado ✨",
            badgeColor: "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/30",
            borderColor: "border-[#2A2723]",
            icon: "✨",
          },
        ];
      case "video":
      case "link":
      case "document":
        return [
          {
            id: "backlog",
            title: "Por Ver / Estudiar 📺",
            badgeColor: "bg-[#121110] text-[#8E867B] border-[#2A2723]",
            borderColor: "border-[#2A2723]",
            icon: "📺",
          },
          {
            id: "in_progress",
            title: "En Revisión / Viendo 📑",
            badgeColor: "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30",
            borderColor: "border-[#2A2723]",
            icon: "📑",
          },
          {
            id: "completed",
            title: "Visto & Asimilado ✅",
            badgeColor: "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/30",
            borderColor: "border-[#2A2723]",
            icon: "✅",
          },
        ];
      case "book":
      default:
        return [
          {
            id: "backlog",
            title: "Por Leer 📚",
            badgeColor: "bg-[#121110] text-[#8E867B] border-[#2A2723]",
            borderColor: "border-[#2A2723]",
            icon: "📚",
          },
          {
            id: "in_progress",
            title: "Leyendo Actualmente 📖",
            badgeColor: "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30",
            borderColor: "border-[#2A2723]",
            icon: "📖",
          },
          {
            id: "completed",
            title: "Completado & Leído ✅",
            badgeColor: "bg-[#1C2219] text-[#7EA35A] border-[#7EA35A]/30",
            borderColor: "border-[#2A2723]",
            icon: "✅",
          },
        ];
    }
  };

  const columns = getColumns();

  const handleStatusChange = (id: string, newStatus: VaultItemStatus) => {
    startTransition(async () => {
      await updateVaultItemStatusAction(id, newStatus);
      if (onRefresh) onRefresh();
    });
  };

  const handleIncrementProgress = (id: string, amount: number) => {
    startTransition(async () => {
      await incrementVaultItemProgressAction(id, amount);
      if (onRefresh) onRefresh();
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}" de la bóveda?`)) return;
    startTransition(async () => {
      await deleteVaultItemAction(id);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Kanban 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colItems = items.filter((item) => item.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-xl border border-[#2A2723] bg-[#181715] p-4 min-h-105"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2723] mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-serif font-bold text-[#F5F2EB] tracking-tight">
                    {col.title}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold border ${col.badgeColor}`}
                  >
                    {colItems.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="p-1 rounded-md text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-all cursor-pointer"
                  title="Agregar a esta categoría"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Items List in Column */}
              <div className="flex-1 space-y-3">
                {colItems.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-[#2A2723] bg-[#121110] p-4">
                    <span className="text-xs text-[#8E867B]">Sin elementos</span>
                  </div>
                ) : (
                  colItems.map((item) => {
                    const isCourse = item.category === "course";
                    const isBook = item.category === "book";
                    const isSheetMusic = item.category === "sheet_music";
                    const isResource = item.category === "video" || item.category === "link" || item.category === "document";

                    const currentProg = item.progress || 0;
                    const totalUnits = item.totalPages || 0;
                    const percent = totalUnits > 0 ? Math.min(100, Math.round((currentProg / totalUnits) * 100)) : 0;

                    return (
                      <div
                        key={item.id}
                        className="group rounded-lg border border-[#2A2723] bg-[#121110] p-4 shadow-sm hover:border-[#38332D] transition-all space-y-3"
                      >
                        {/* Top Row: Category Badges */}
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.platform && (
                              <span className="px-2 py-0.5 rounded-md border font-semibold bg-[#181715] border-[#2A2723] text-[#DDD6C9]">
                                {item.platform === "YouTube"
                                  ? "📺 YouTube"
                                  : item.platform === "GitHub"
                                  ? "🐙 GitHub"
                                  : item.platform === "Notion"
                                  ? "📑 Notion"
                                  : `🎓 ${item.platform}`}
                              </span>
                            )}
                            {item.instrument && (
                              <span className="px-2 py-0.5 rounded-md bg-[#162121] text-[#4EAB9E] border border-[#4EAB9E]/30 font-semibold">
                                🎹 {item.instrument}
                              </span>
                            )}
                            {item.difficulty && (
                              <span className="px-2 py-0.5 rounded-md bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30 font-semibold capitalize">
                                {item.difficulty}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[#8E867B] hover:text-[#E05D52] transition-all cursor-pointer"
                            title="Eliminar de la bóveda"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Main Title & Creator */}
                        <div>
                          <h4 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight leading-snug">
                            {item.title}
                          </h4>
                          {item.authorOrCreator && (
                            <p className="text-xs text-[#8E867B] mt-0.5 font-sans">
                              {item.authorOrCreator}
                            </p>
                          )}
                        </div>

                        {/* External URL with specialized labels */}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4EAB9E] hover:underline bg-[#181715] px-2.5 py-1 rounded-md border border-[#2A2723] w-fit"
                          >
                            <span>
                              {item.platform === "Notion"
                                ? "📑 Abrir en Notion"
                                : item.platform === "GitHub"
                                ? "🐙 Ver en GitHub"
                                : item.platform === "YouTube"
                                ? "📺 Ver en YouTube"
                                : isCourse
                                ? "🎓 Abrir Clase / Curso"
                                : "Abrir Enlace"}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {/* Progress Bar & Quick Incrementers (for Courses & Books) */}
                        {(isCourse || isBook) && totalUnits > 0 && (
                          <div className="p-2.5 rounded-lg bg-[#181715] border border-[#2A2723] space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-[#8E867B]">
                                {isCourse ? `Clase ${currentProg} de ${totalUnits}` : `Pág ${currentProg} de ${totalUnits}`}
                              </span>
                              <span className="font-bold text-[#D99B43]">{percent}%</span>
                            </div>

                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#121110]">
                              <div
                                className="h-full bg-[#D99B43] transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            {/* Quick Increment Buttons */}
                            {col.id !== "completed" && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleIncrementProgress(item.id, 1)}
                                  disabled={isPending}
                                  className="px-2 py-0.5 rounded-md bg-[#121110] border border-[#2A2723] hover:border-[#D99B43]/40 text-[10px] font-mono text-[#DDD6C9] hover:text-[#F5F2EB] transition-all cursor-pointer"
                                >
                                  {isCourse ? "+1 clase" : "+10 págs"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIncrementProgress(item.id, isCourse ? 5 : 25)}
                                  disabled={isPending}
                                  className="px-2 py-0.5 rounded-md bg-[#121110] border border-[#2A2723] hover:border-[#D99B43]/40 text-[10px] font-mono text-[#DDD6C9] hover:text-[#F5F2EB] transition-all cursor-pointer"
                                >
                                  {isCourse ? "+5 clases" : "+25 págs"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes Preview if available */}
                        {item.notes && (
                          <p className="text-[11px] text-[#8E867B] italic line-clamp-2 bg-[#181715] p-2 rounded-lg border border-[#2A2723] font-sans">
                            {item.notes}
                          </p>
                        )}

                        {/* PDF S3 Viewer Action Button */}
                        {item.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingPdfItem(item)}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#181715] hover:bg-[#22201D] border border-[#2A2723] text-xs font-semibold text-[#DDD6C9] hover:text-[#F5F2EB] transition-all cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#D99B43]" />
                            <span>
                              {isSheetMusic
                                ? "Ver Partitura (PDF)"
                                : isCourse
                                ? "Ver Certificado/Notas (PDF)"
                                : "Abrir Archivo (PDF)"}
                            </span>
                          </button>
                        )}

                        {/* Bottom Controls: Quick 1-Click State Mover */}
                        <div className="pt-2 border-t border-[#2A2723] flex items-center justify-between gap-1 text-[11px]">
                          {col.id !== "backlog" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  item.id,
                                  col.id === "completed" ? "in_progress" : "backlog"
                                )
                              }
                              disabled={isPending}
                              className="flex items-center gap-0.5 text-[#8E867B] hover:text-[#DDD6C9] transition-colors cursor-pointer"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                              <span>
                                {col.id === "completed"
                                  ? isSheetMusic
                                    ? "Práctica"
                                    : isCourse
                                    ? "En curso"
                                    : "Leyendo"
                                  : "Pendiente"}
                              </span>
                            </button>
                          )}

                          <div className="flex-1" />

                          {col.id !== "completed" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  item.id,
                                  col.id === "backlog" ? "in_progress" : "completed"
                                )
                              }
                              disabled={isPending}
                              className="flex items-center gap-0.5 font-semibold text-[#D99B43] hover:text-[#E8AF59] transition-colors ml-auto cursor-pointer"
                            >
                              <span>
                                {col.id === "backlog"
                                  ? isSheetMusic
                                    ? "Estudiar"
                                    : isCourse
                                    ? "Comenzar"
                                    : "Empezar"
                                  : isSheetMusic
                                  ? "Dominada ✨"
                                  : isCourse
                                  ? "Certificar 🎓"
                                  : "Terminar ✅"}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* PDF Modal Viewer */}
      {viewingPdfItem && viewingPdfItem.fileUrl && (
        <PdfViewerModal
          isOpen={Boolean(viewingPdfItem)}
          onClose={() => setViewingPdfItem(null)}
          title={viewingPdfItem.title}
          authorOrCreator={viewingPdfItem.authorOrCreator}
          fileUrl={viewingPdfItem.fileUrl}
          fileName={viewingPdfItem.fileName}
        />
      )}
    </div>
  );
}
