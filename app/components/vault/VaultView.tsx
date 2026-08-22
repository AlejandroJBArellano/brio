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
  FolderGit2,
  GraduationCap,
  Layers,
  Music,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  Tv,
  UploadCloud,
  Video,
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

type VaultTab = "courses" | "books" | "sheet_music" | "resources" | "projects";

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string }> = {
  idea: { label: "💡 Idea", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  in_progress: { label: "⚡ En Desarrollo", color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300" },
  paused: { label: "⏸️ Pausado", color: "border-neutral-700 bg-neutral-800 text-neutral-400" },
  launched: { label: "🚀 Lanzado", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
};

export function VaultView({ data, onRefresh, onOpenScratchpad }: VaultViewProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("courses");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<VaultItemCategory>("course");

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
    if (!confirm("¿Eliminar este proyecto?")) return;
    startTransition(async () => {
      await deleteProjectAction(id);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Courses Metric */}
        <div className="rounded-2xl border border-indigo-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Cursos en Marcha</span>
            <GraduationCap className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-400">
            {data.stats.coursesCompleted || 0} / {data.stats.totalCourses || 0}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Certificaciones y talleres completados
          </div>
        </div>

        {/* Books Metric */}
        <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Libros Leídos</span>
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {data.stats.booksCompleted} / {data.stats.totalBooks}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Páginas & síntesis asimiladas
          </div>
        </div>

        {/* Sheet Music Metric */}
        <div className="rounded-2xl border border-cyan-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Repertorio Dominado</span>
            <Music className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {data.stats.sheetMusicMastered} / {data.stats.totalSheetMusic}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Piezas musicales en repertorio
          </div>
        </div>

        {/* S3 Storage Status */}
        <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Bóveda AWS S3</span>
            <UploadCloud className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>S3 Online</span>
          </div>
          <div className="mt-1 text-[10px] text-neutral-500 font-mono truncate">
            brio-media-vault-2026
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Bar: Sub-Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950/80 rounded-2xl border border-white/8 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "courses"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>🎓 Cursos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
              {data.courses?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "books"
                ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>📚 Libros</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
              {data.books.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sheet_music")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "sheet_music"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>🎼 Partituras</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
              {data.sheetMusic.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "resources"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>📺 Watchlist & Recursos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
              {data.resources?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "projects"
                ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>🛠️ Proyectos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-mono">
              {data.projects.length}
            </span>
          </button>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenScratchpad && (
            <button
              type="button"
              onClick={onOpenScratchpad}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/8 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all"
            >
              <span>📝 Scratchpad</span>
              <kbd className="text-[10px] font-mono opacity-60">⌘J</kbd>
            </button>
          )}

          {activeTab === "projects" ? (
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-pink-600 to-rose-600 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-pink-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Proyecto</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                handleOpenAddModal(
                  activeTab === "courses"
                    ? "course"
                    : activeTab === "books"
                    ? "book"
                    : activeTab === "resources"
                    ? "video"
                    : "sheet_music"
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>
                {activeTab === "courses"
                  ? "Agregar Curso"
                  : activeTab === "books"
                  ? "Agregar Libro (S3)"
                  : activeTab === "resources"
                  ? "Guardar Video/Link"
                  : "Subir Partitura (S3)"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Sub-View Rendering */}
      {activeTab === "courses" && (
        <VaultKanbanBoard
          category="course"
          items={data.courses || []}
          onOpenAddModal={() => handleOpenAddModal("course")}
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

      {activeTab === "sheet_music" && (
        <VaultKanbanBoard
          category="sheet_music"
          items={data.sheetMusic}
          onOpenAddModal={() => handleOpenAddModal("sheet_music")}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === "resources" && (
        <VaultKanbanBoard
          category="video"
          items={data.resources || []}
          onOpenAddModal={() => handleOpenAddModal("video")}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.projects.length === 0 ? (
              <div className="col-span-full p-12 text-center rounded-3xl border border-dashed border-white/8 bg-neutral-950/40">
                <Code2 className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-neutral-400">
                  Aún no tienes proyectos registrados
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Agrega ideas de desarrollo, startups o experimentos técnicos.
                </p>
              </div>
            ) : (
              data.projects.map((proj) => {
                const statusMeta = STATUS_LABELS[proj.status] || STATUS_LABELS.idea;
                return (
                  <div
                    key={proj.id}
                    className="group rounded-3xl border border-white/8 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl hover:border-white/18 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Status and Action delete */}
                      <div className="flex items-center justify-between">
                        <select
                          value={proj.status}
                          onChange={(e) =>
                            handleUpdateProjectStatus(proj.id, e.target.value as ProjectStatus)
                          }
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${statusMeta.color} bg-neutral-950 focus:outline-none cursor-pointer`}
                        >
                          <option value="idea">💡 Idea</option>
                          <option value="in_progress">⚡ En Desarrollo</option>
                          <option value="paused">⏸️ Pausado</option>
                          <option value="launched">🚀 Lanzado</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="text-base font-bold text-white tracking-tight">
                          {proj.title}
                        </h4>
                        {proj.description && (
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      {/* Tech Stack Badges */}
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded-md bg-neutral-950 border border-white/6 text-[10px] font-mono text-neutral-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    {(proj.repoUrl || proj.liveUrl) && (
                      <div className="pt-4 mt-4 border-t border-white/4 flex items-center gap-3 text-xs">
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-400 hover:text-white flex items-center gap-1"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Repo</span>
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Live</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AddVaultItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategory={addModalCategory}
        onSuccess={onRefresh}
      />

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-white/12 bg-neutral-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <h3 className="text-base font-bold text-white">Nuevo Proyecto Técnico</h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Ej. Brio OS"
                  className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Objetivo principal del proyecto..."
                  className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tech Stack (separado por comas)
                </label>
                <input
                  type="text"
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  placeholder="Next.js, TypeScript, Tailwind, Neon"
                  className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition-all"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
