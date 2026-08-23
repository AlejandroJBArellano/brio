"use client";

import {
  createProjectAction,
  deleteProjectAction,
  updateProjectStatusAction,
} from "@/app/actions/projects";
import {
  ProjectStatus,
  VaultDashboardData,
  VaultItemCategory,
} from "@/lib/types";
import {
  BookOpen,
  Code2,
  ExternalLink,
  GraduationCap,
  Music,
  Plus,
  Trash2,
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
  idea: { label: "💡 Idea", color: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]" },
  in_progress: { label: "⚡ En Desarrollo", color: "border-[#4EAB9E]/30 bg-[#162121] text-[#4EAB9E]" },
  paused: { label: "⏸️ Pausado", color: "border-[#2A2723] bg-[#181715] text-[#8E867B]" },
  launched: { label: "🚀 Lanzado", color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]" },
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
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Cursos en Marcha</span>
            <GraduationCap className="h-4 w-4 text-[#D99B43]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#F5F2EB]">
            {data.stats.coursesCompleted || 0} / {data.stats.totalCourses || 0}
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B]">
            Certificaciones y talleres completados
          </div>
        </div>

        {/* Books Metric */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Libros Leídos</span>
            <BookOpen className="h-4 w-4 text-[#D99B43]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#D99B43]">
            {data.stats.booksCompleted} / {data.stats.totalBooks}
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B]">
            Páginas & síntesis asimiladas
          </div>
        </div>

        {/* Sheet Music Metric */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Repertorio Dominado</span>
            <Music className="h-4 w-4 text-[#4EAB9E]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-[#4EAB9E]">
            {data.stats.sheetMusicMastered} / {data.stats.totalSheetMusic}
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B]">
            Piezas musicales en repertorio
          </div>
        </div>

        {/* S3 Storage Status */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Bóveda AWS S3</span>
            <UploadCloud className="h-4 w-4 text-[#7EA35A]" />
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-[#7EA35A] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7EA35A]" />
            <span>S3 Online</span>
          </div>
          <div className="mt-1 text-[10px] text-[#8E867B] font-mono truncate">
            brio-media-vault-2026
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Bar: Sub-Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2723] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121110] rounded-lg border border-[#2A2723] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "courses"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>🎓 Cursos</span>
            <span className="px-1.5 py-0.2 rounded bg-[#181715] text-[10px] font-mono">
              {data.courses?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "books"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>📚 Libros</span>
            <span className="px-1.5 py-0.2 rounded bg-[#181715] text-[10px] font-mono">
              {data.books.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sheet_music")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "sheet_music"
                ? "bg-[#4EAB9E] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>🎼 Partituras</span>
            <span className="px-1.5 py-0.2 rounded bg-[#181715] text-[10px] font-mono">
              {data.sheetMusic.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "resources"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>📺 Watchlist & Recursos</span>
            <span className="px-1.5 py-0.2 rounded bg-[#181715] text-[10px] font-mono">
              {data.resources?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === "projects"
                ? "bg-[#7EA35A] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>🛠️ Proyectos</span>
            <span className="px-1.5 py-0.2 rounded bg-[#181715] text-[10px] font-mono">
              {data.projects.length}
            </span>
          </button>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 shrink-0 font-sans">
          {onOpenScratchpad && (
            <button
              type="button"
              onClick={onOpenScratchpad}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2723] bg-[#181715] hover:bg-[#22201D] text-xs font-semibold text-[#DDD6C9] transition-all cursor-pointer"
            >
              <span>📝 Scratchpad</span>
              <kbd className="text-[10px] font-mono text-[#8E867B]">⌘J</kbd>
            </button>
          )}

          {activeTab === "projects" ? (
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-bold text-[#121110] shadow-xs transition-all cursor-pointer"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-bold text-[#121110] shadow-xs transition-all cursor-pointer"
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
              <div className="col-span-full p-12 text-center rounded-xl border border-dashed border-[#2A2723] bg-[#121110]">
                <Code2 className="h-8 w-8 text-[#8E867B] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#DDD6C9]">
                  Aún no tienes proyectos registrados
                </p>
                <p className="text-xs text-[#8E867B] mt-1">
                  Agrega ideas de desarrollo, startups o experimentos técnicos.
                </p>
              </div>
            ) : (
              data.projects.map((proj) => {
                const statusMeta = STATUS_LABELS[proj.status] || STATUS_LABELS.idea;
                return (
                  <div
                    key={proj.id}
                    className="group rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm hover:border-[#38332D] transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Status and Action delete */}
                      <div className="flex items-center justify-between font-mono">
                        <select
                          value={proj.status}
                          onChange={(e) =>
                            handleUpdateProjectStatus(proj.id, e.target.value as ProjectStatus)
                          }
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${statusMeta.color} bg-[#121110] focus:outline-none cursor-pointer`}
                        >
                          <option value="idea">💡 Idea</option>
                          <option value="in_progress">⚡ En Desarrollo</option>
                          <option value="paused">⏸️ Pausado</option>
                          <option value="launched">🚀 Lanzado</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#8E867B] hover:text-[#E05D52] transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                          {proj.title}
                        </h4>
                        {proj.description && (
                          <p className="text-xs text-[#8E867B] mt-1 line-clamp-2">
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
                              className="px-2 py-0.5 rounded-md bg-[#121110] border border-[#2A2723] text-[10px] font-mono text-[#DDD6C9]"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    {(proj.repoUrl || proj.liveUrl) && (
                      <div className="pt-4 mt-4 border-t border-[#2A2723] flex items-center gap-3 text-xs font-mono">
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#8E867B] hover:text-[#F5F2EB] flex items-center gap-1"
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
                            className="text-[#4EAB9E] hover:underline flex items-center gap-1 font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A2723] pb-3">
              <h3 className="font-serif text-base font-bold text-[#F5F2EB]">Nuevo Proyecto Técnico</h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-[#8E867B] hover:text-[#F5F2EB] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 font-mono">
              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Ej. Brio OS"
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Objetivo principal del proyecto..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
                  Tech Stack (separado por comas)
                </label>
                <input
                  type="text"
                  value={projectTech}
                  onChange={(e) => setProjectTech(e.target.value)}
                  placeholder="Next.js, TypeScript, Tailwind, Neon"
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#8E867B] hover:text-[#DDD6C9] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-xs font-bold text-[#121110] transition-all cursor-pointer"
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
