"use client";

import { createVaultItemAction } from "@/app/actions/vault";
import { VaultItemCategory, VaultItemStatus } from "@/lib/types";
import {
  BookOpen,
  FileText,
  FolderGit2,
  GraduationCap,
  Link as LinkIcon,
  Music,
  Plus,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface AddVaultItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: VaultItemCategory;
  onSuccess?: () => void;
}

const INSTRUMENTS = ["Piano", "Guitarra", "Voz", "Batería", "Bajo", "Violín", "Producción", "Otro"];
const PLATFORMS = ["Udemy", "YouTube", "Platzi", "Coursera", "Frontend Masters", "GitHub", "Notion", "Web"];
const DIFFICULTIES = [
  { id: "beginner", label: "Principiante 🟢" },
  { id: "intermediate", label: "Intermedio 🟡" },
  { id: "advanced", label: "Avanzado 🔴" },
];

export function AddVaultItemModal({
  isOpen,
  onClose,
  defaultCategory = "book",
  onSuccess,
}: AddVaultItemModalProps) {
  const [category, setCategory] = useState<VaultItemCategory>(defaultCategory);
  const [title, setTitle] = useState("");
  const [authorOrCreator, setAuthorOrCreator] = useState("");
  const [status, setStatus] = useState<VaultItemStatus>("backlog");
  const [platform, setPlatform] = useState("Udemy");
  const [url, setUrl] = useState("");
  const [instrument, setInstrument] = useState("Piano");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [totalPages, setTotalPages] = useState("");
  const [progress, setProgress] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverUrl, _setCoverUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const low = newUrl.toLowerCase();
    if (low.includes("notion.so") || low.includes("notion.site")) {
      setPlatform("Notion");
      if (category !== "link") setCategory("link");
    } else if (low.includes("youtube.com") || low.includes("youtu.be")) {
      setPlatform("YouTube");
      if (category !== "video") setCategory("video");
    } else if (low.includes("github.com")) {
      setPlatform("GitHub");
      if (category !== "link") setCategory("link");
    } else if (low.includes("udemy.com")) {
      setPlatform("Udemy");
      if (category !== "course") setCategory("course");
    } else if (low.includes("platzi.com")) {
      setPlatform("Platzi");
      if (category !== "course") setCategory("course");
    } else if (low.includes("coursera.org")) {
      setPlatform("Coursera");
      if (category !== "course") setCategory("course");
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("El título es obligatorio.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("authorOrCreator", authorOrCreator.trim());
    formData.append("status", status);
    formData.append("notes", notes.trim());
    formData.append("tags", tags.trim());
    if (url.trim()) formData.append("url", url.trim());
    if (platform.trim()) formData.append("platform", platform.trim());

    if (category === "sheet_music") {
      formData.append("instrument", instrument);
      formData.append("difficulty", difficulty);
    }

    if (totalPages) formData.append("totalPages", totalPages);
    if (progress) formData.append("progress", progress);
    if (coverUrl.trim()) formData.append("coverUrl", coverUrl.trim());

    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    if (selectedCover) {
      formData.append("coverFile", selectedCover);
    }

    startTransition(async () => {
      const res = await createVaultItemAction(formData);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
        // Reset form
        setTitle("");
        setAuthorOrCreator("");
        setUrl("");
        setNotes("");
        setTags("");
        setSelectedFile(null);
        setSelectedCover(null);
      } else {
        setErrorMessage(res.error || "No se pudo guardar el elemento.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-xl max-h-[90vh] rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2723] bg-[#121110] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43]">
              {category === "sheet_music" && <Music className="h-4 w-4" />}
              {category === "book" && <BookOpen className="h-4 w-4" />}
              {category === "course" && <GraduationCap className="h-4 w-4" />}
              {category === "video" && <Video className="h-4 w-4" />}
              {category === "link" && <LinkIcon className="h-4 w-4" />}
              {category === "document" && <FileText className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Agregar a la Bóveda
              </h3>
              <p className="text-xs text-[#8E867B]">
                Almacenamiento en AWS S3 & seguimiento de progreso
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 font-mono">
          {errorMessage && (
            <div className="p-3 rounded-lg border border-[#E05D52]/30 bg-[#2A1715] text-xs font-semibold text-[#E05D52]">
              {errorMessage}
            </div>
          )}

          {/* Category Selector Buttons */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-2">
              Tipo de Elemento
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 font-sans">
              {[
                { id: "course", label: "Curso", icon: GraduationCap },
                { id: "book", label: "Libro", icon: BookOpen },
                { id: "sheet_music", label: "Partitura", icon: Music },
                { id: "video", label: "Video/YT", icon: Video },
                { id: "link", label: "GitHub/Link", icon: FolderGit2 },
                { id: "document", label: "Doc S3", icon: FileText },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as VaultItemCategory)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                      category === c.id
                        ? "bg-[#221D16] border-[#D99B43]/40 text-[#D99B43]"
                        : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Título *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === "sheet_music"
                    ? "Ej. Clair de Lune"
                    : category === "course"
                    ? "Ej. Next.js 15 & React 19 Pro"
                    : category === "video"
                    ? "Ej. Charla Arquitectura Distribuida"
                    : "Ej. Designing Data-Intensive Applications"
                }
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                {category === "sheet_music"
                  ? "Compositor"
                  : category === "course" || category === "video"
                  ? "Instructor / Canal"
                  : "Autor"}
              </label>
              <input
                type="text"
                value={authorOrCreator}
                onChange={(e) => setAuthorOrCreator(e.target.value)}
                placeholder="Ej. Claude Debussy / Martin Kleppmann"
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
              />
            </div>
          </div>

          {/* URL & Platform if Course, Video, or Link */}
          {(category === "course" || category === "video" || category === "link") && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                  Plataforma
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none cursor-pointer"
                >
                  {PLATFORMS.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                  Enlace Web (URL de YouTube / Notion / GitHub / Curso)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://notion.so/... o https://youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>
            </div>
          )}

          {/* Sheet Music Specific Fields */}
          {category === "sheet_music" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                  Instrumento
                </label>
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none cursor-pointer"
                >
                  {INSTRUMENTS.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                  Nivel de Dificultad
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none cursor-pointer"
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff.id} value={diff.id}>
                      {diff.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Progress / Lessons / Pages */}
          {(category === "book" || category === "course" || category === "sheet_music") && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                  {category === "course" ? "Lecciones Totales" : "Páginas Totales"}
                </label>
                <input
                  type="number"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  placeholder={category === "course" ? "Ej. 48 clases" : "Ej. 320 págs"}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs font-mono text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                  Progreso Actual
                </label>
                <input
                  type="number"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder={category === "course" ? "Clases hechas" : "Págs leídas"}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs font-mono text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                  Estado Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VaultItemStatus)}
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none cursor-pointer"
                >
                  <option value="backlog">Por Empezar / Backlog</option>
                  <option value="in_progress">En Curso / Práctica</option>
                  <option value="completed">Completado / Dominado</option>
                </select>
              </div>
            </div>
          )}

          {/* S3 File Upload Box (PDF / Archivo) */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5 flex items-center justify-between">
              <span>
                {category === "sheet_music"
                  ? "Partitura PDF (Subir a AWS S3)"
                  : category === "course"
                  ? "Certificado o Notas PDF (AWS S3)"
                  : "Archivo PDF / Documento (AWS S3)"}
              </span>
              <span className="text-[10px] text-[#4EAB9E] font-mono">Bucket: brio-media-vault-2026</span>
            </label>

            <div className="relative rounded-xl border-2 border-dashed border-[#2A2723] bg-[#121110] p-4 text-center hover:border-[#D99B43]/50 transition-all">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <UploadCloud className="h-6 w-6 text-[#D99B43]" />
                {selectedFile ? (
                  <div className="text-xs font-bold text-[#7EA35A]">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-sans font-semibold text-[#DDD6C9]">
                      Arrastra tu PDF aquí o haz clic para examinar
                    </p>
                    <p className="text-[10px] text-[#8E867B] font-sans">
                      Se subirá de forma segura y privada a tu bucket de S3
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Notes & Takeaways */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Notas, Digitaciones o Conceptos Clave
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Apuntes rápidos sobre este recurso..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Etiquetas (Separadas por comas)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="piano, clasica, debussy o react, backend, ai"
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-[#2A2723] font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-[#8E867B] hover:text-[#DDD6C9] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] font-bold text-xs text-[#121110] transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isPending ? "Subiendo a S3..." : "Guardar en Bóveda"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
