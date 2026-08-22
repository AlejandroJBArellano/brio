"use client";

import {
  deleteVaultItemAction,
  incrementVaultItemProgressAction,
  updateVaultItemStatusAction,
} from "@/app/actions/vault";
import { VaultItem, VaultItemCategory, VaultItemStatus } from "@/lib/types";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderGit2,
  GraduationCap,
  Music,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Video,
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
            badgeColor: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
            borderColor: "border-neutral-800",
            icon: "🎼",
          },
          {
            id: "in_progress",
            title: "En Práctica 🎹",
            badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
            borderColor: "border-cyan-500/20",
            icon: "🎹",
          },
          {
            id: "completed",
            title: "Dominada (Repertorio) ✨",
            badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
            borderColor: "border-emerald-500/20",
            icon: "✨",
          },
        ];
      case "course":
        return [
          {
            id: "backlog",
            title: "Por Empezar 🎓",
            badgeColor: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
            borderColor: "border-neutral-800",
            icon: "🎓",
          },
          {
            id: "in_progress",
            title: "En Curso (Estudiando) 📖",
            badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
            borderColor: "border-cyan-500/20",
            icon: "📖",
          },
          {
            id: "completed",
            title: "Completado & Certificado ✨",
            badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
            borderColor: "border-emerald-500/20",
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
            badgeColor: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
            borderColor: "border-neutral-800",
            icon: "📺",
          },
          {
            id: "in_progress",
            title: "En Revisión / Viendo 📑",
            badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
            borderColor: "border-amber-500/20",
            icon: "📑",
          },
          {
            id: "completed",
            title: "Visto & Asimilado ✅",
            badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
            borderColor: "border-emerald-500/20",
            icon: "✅",
          },
        ];
      case "book":
      default:
        return [
          {
            id: "backlog",
            title: "Por Leer 📚",
            badgeColor: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
            borderColor: "border-neutral-800",
            icon: "📚",
          },
          {
            id: "in_progress",
            title: "Leyendo Actualmente 📖",
            badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
            borderColor: "border-amber-500/20",
            icon: "📖",
          },
          {
            id: "completed",
            title: "Completado & Leído ✅",
            badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
            borderColor: "border-emerald-500/20",
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
    <div className="space-y-4">
      {/* Kanban 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const colItems = items.filter((item) => item.status === col.id);

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-3xl border ${col.borderColor} bg-neutral-900/40 p-4 backdrop-blur-xl min-h-[420px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {col.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border ${col.badgeColor}`}
                  >
                    {colItems.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                  title="Agregar a esta categoría"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Items List in Column */}
              <div className="flex-1 space-y-3">
                {colItems.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/[0.06] bg-neutral-950/20 p-4">
                    <span className="text-xs text-neutral-500">Sin elementos</span>
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
                        className="group rounded-2xl border border-white/[0.08] bg-neutral-950/80 p-4 shadow-xl hover:border-white/[0.18] transition-all space-y-3"
                      >
                        {/* Top Row: Category Badges */}
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.platform && (
                              <span className={`px-2 py-0.5 rounded-md border font-semibold ${
                                item.platform === "Notion"
                                  ? "bg-neutral-900 border-white/20 text-white font-mono"
                                  : item.platform === "GitHub"
                                  ? "bg-neutral-900 border-white/20 text-white font-mono"
                                  : item.platform === "YouTube"
                                  ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                              }`}>
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
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                                🎹 {item.instrument}
                              </span>
                            )}
                            {item.difficulty && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold capitalize">
                                {item.difficulty}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-all"
                            title="Eliminar de la bóveda"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Main Title & Creator */}
                        <div>
                          <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                            {item.title}
                          </h4>
                          {item.authorOrCreator && (
                            <p className="text-xs text-neutral-400 mt-0.5">
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
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:underline bg-neutral-900/60 px-2.5 py-1 rounded-lg border border-white/[0.04] w-fit"
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
                          <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/[0.04] space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-neutral-400">
                                {isCourse ? `Clase ${currentProg} de ${totalUnits}` : `Pág ${currentProg} de ${totalUnits}`}
                              </span>
                              <span className="font-bold text-cyan-400">{percent}%</span>
                            </div>

                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-950">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
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
                                  className="px-2 py-0.5 rounded-md bg-neutral-950 border border-white/[0.08] hover:border-cyan-500/40 text-[10px] font-mono text-neutral-300 hover:text-white transition-all"
                                >
                                  {isCourse ? "+1 clase" : "+10 págs"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIncrementProgress(item.id, isCourse ? 5 : 25)}
                                  disabled={isPending}
                                  className="px-2 py-0.5 rounded-md bg-neutral-950 border border-white/[0.08] hover:border-cyan-500/40 text-[10px] font-mono text-neutral-300 hover:text-white transition-all"
                                >
                                  {isCourse ? "+5 clases" : "+25 págs"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Notes Preview if available */}
                        {item.notes && (
                          <p className="text-[11px] text-neutral-400 italic line-clamp-2 bg-neutral-900/60 p-2 rounded-xl border border-white/[0.04]">
                            {item.notes}
                          </p>
                        )}

                        {/* PDF S3 Viewer Action Button */}
                        {item.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingPdfItem(item)}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-xs font-bold text-cyan-300 transition-all shadow-sm"
                          >
                            <FileText className="h-3.5 w-3.5" />
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
                        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between gap-1 text-[11px]">
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
                              className="flex items-center gap-0.5 text-neutral-400 hover:text-white transition-colors"
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
                              className="flex items-center gap-0.5 font-semibold text-cyan-400 hover:text-cyan-300 transition-colors ml-auto"
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
