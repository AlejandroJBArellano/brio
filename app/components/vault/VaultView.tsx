"use client";

import {
  createProjectAction,
  deleteProjectAction,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import {
  ProjectItem,
  ProjectStatus,
  VaultDashboardData,
  VaultItemCategory,
} from "@/lib/types";
import {
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  Flame,
  Layers,
  Music,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { AddVaultItemModal } from "./AddVaultItemModal";
import { VaultKanbanBoard } from "./VaultKanbanBoard";

interface VaultViewProps {
  data: VaultDashboardData;
  onRefresh?: () => void;
  onOpenScratchpad?: () => void;
}

type VaultTab = "sheet_music" | "books" | "projects";

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string }> = {
  idea: { label: "💡 Idea", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  in_progress: { label: "⚡ En Desarrollo", color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300" },
  paused: { label: "⏸️ Pausado", color: "border-neutral-700 bg-neutral-800 text-neutral-400" },
  launched: { label: "🚀 Lanzado", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
};

export function VaultView({ data, onRefresh, onOpenScratchpad }: VaultViewProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("sheet_music");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<VaultItemCategory>("sheet_music");

  // Project creator modal state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("idea");
  const [projectTech, setProjectTech] = useState("");
  const [projectRepo, setProjectRepo] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleOpenAddModal = (cat: VaultItemCategory) => {
    setAddModalCategory(cat);
    setIsAddModalOpen(true);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    startTransition(async () => {
      await createProjectAction({
        title: projectTitle.trim(),
        description: projectDesc.trim() || undefined,
        status: projectStatus,
        techStack: projectTech
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        repoUrl: projectRepo.trim() || undefined,
        progress: projectStatus === "launched" ? 100 : 20,
      });

      setIsNewProjectModalOpen(false);
      setProjectTitle("");
      setProjectDesc("");
      setProjectTech("");
      setProjectRepo("");
      if (onRefresh) onRefresh();
    });
  };

  const handleUpdateProjectStatus = (id: string, status: ProjectStatus) => {
    startTransition(async () => {
      await updateProjectStatusAction(id, status);
      if (onRefresh) onRefresh();
    });
  };

  const handleDeleteProject = (id: string) => {
    startTransition(async () => {
      await deleteProjectAction(id);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header Metrics Ribbon with S3 Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Sheet Music Stats */}
        <div className="rounded-2xl border border-cyan-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Partituras & Repertorio</span>
            <Music className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {data.stats.sheetMusicMastered} / {data.stats.totalSheetMusic}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Dominadas en repertorio activo
          </div>
        </div>

        {/* Books Stats */}
        <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Libros & Lecturas</span>
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {data.stats.booksCompleted} / {data.stats.totalBooks}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Libros completados & estudiados
          </div>
        </div>

        {/* Projects Stats */}
        <div className="rounded-2xl border border-indigo-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Proyectos Creativos</span>
            <Rocket className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-400">
            {data.stats.totalProjects} proyectos
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            En backlog y desarrollo
          </div>
        </div>

        {/* S3 Storage Vault Status */}
        <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Almacenamiento S3</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-emerald-400 truncate">
            brio-media-vault
          </div>
          <div className="mt-1 text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AWS us-east-1 • Conectado</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950/80 rounded-2xl border border-white/[0.08] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("sheet_music")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "sheet_music"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Music className="h-4 w-4" />
            <span>Música & Partituras ({data.sheetMusic.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "books"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Libros & Lecturas ({data.books.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "projects"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Rocket className="h-4 w-4" />
            <span>Proyectos ({data.projects.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenScratchpad && (
            <button
              type="button"
              onClick={onOpenScratchpad}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-sm"
              title="Abrir bloc de notas rápido"
            >
              <span>📝 Scratchpad (⌘J)</span>
            </button>
          )}

          {activeTab === "projects" ? (
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Proyecto</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                handleOpenAddModal(
                  activeTab === "sheet_music" ? "sheet_music" : "book"
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-xs text-white hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>
                {activeTab === "sheet_music"
                  ? "Subir Partitura (S3)"
                  : "Agregar Libro (S3)"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Content Views */}
      {activeTab === "sheet_music" && (
        <VaultKanbanBoard
          category="sheet_music"
          items={data.sheetMusic}
          onOpenAddModal={() => handleOpenAddModal("sheet_music")}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === "books" && (
        <VaultKanbanBoard
          category="book"
          items={data.books}
          onOpenAddModal={() => handleOpenAddModal("book")}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project) => {
            const statusConfig = STATUS_LABELS[project.status] || STATUS_LABELS.idea;

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Eliminar proyecto"
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 transition-opacity p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white tracking-tight">
                    {project.title}
                  </h3>

                  {project.description && (
                    <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Tech stack tags */}
                  {project.techStack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-neutral-950/80 border border-white/[0.06] text-[10px] font-mono text-neutral-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-950">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-neutral-400">
                      {project.progress}%
                    </span>
                  </div>

                  {/* Status dropdown */}
                  <select
                    value={project.status}
                    onChange={(e) =>
                      handleUpdateProjectStatus(
                        project.id,
                        e.target.value as ProjectStatus
                      )
                    }
                    className="rounded-lg border border-white/[0.08] bg-neutral-950 px-2 py-1 text-[11px] text-neutral-300 focus:outline-none"
                  >
                    <option value="idea">Idea</option>
                    <option value="in_progress">En Desarrollo</option>
                    <option value="paused">Pausado</option>
                    <option value="launched">Lanzado</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vault Item Modal */}
      <AddVaultItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategory={addModalCategory}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Nuevo Proyecto</h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  placeholder="Brio OS ⚡"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Sistema operativo personal..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tech Stack (separado por comas)
                </label>
                <input
                  type="text"
                  placeholder="Next.js, Tailwind, Neon DB"
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 font-bold text-xs text-white hover:bg-indigo-500"
                >
                  {isPending ? "Guardando..." : "Crear Proyecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
