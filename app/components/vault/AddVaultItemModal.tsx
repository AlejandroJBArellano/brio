"use client";

import { createVaultItemAction } from "@/app/actions/vault";
import { VaultItemCategory, VaultItemStatus } from "@/lib/types";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Music,
  Plus,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface AddVaultItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: VaultItemCategory;
  onSuccess?: () => void;
}

const INSTRUMENTS = ["Piano", "Guitarra", "Voz", "Batería", "Bajo", "Violín", "Otro"];
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
  const [instrument, setInstrument] = useState("Piano");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [totalPages, setTotalPages] = useState("");
  const [progress, setProgress] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        setNotes("");
        setTags("");
        setSelectedFile(null);
        setSelectedCover(null);
        setCoverUrl("");
      } else {
        setErrorMessage(res.error || "No se pudo guardar el elemento.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-white/[0.12] bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Agregar a la Bóveda de Intereses
              </h3>
              <p className="text-xs text-neutral-400">
                Almacenamiento en S3, visor de partituras y seguimiento Kanban
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Tipo de Interés
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory("book")}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  category === "book"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10"
                    : "bg-neutral-950/60 border-white/[0.06] text-neutral-400 hover:text-white"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Libro</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("sheet_music")}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  category === "sheet_music"
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10"
                    : "bg-neutral-950/60 border-white/[0.06] text-neutral-400 hover:text-white"
                }`}
              >
                <Music className="h-4 w-4" />
                <span>Partitura</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory("document")}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  category === "document"
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10"
                    : "bg-neutral-950/60 border-white/[0.06] text-neutral-400 hover:text-white"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Documento</span>
              </button>
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                {category === "sheet_music" ? "Título de la Obra / Pieza *" : "Título del Libro / Doc *"}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={category === "sheet_music" ? "Ej. Claro de Luna" : "Ej. Atomic Habits"}
                className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 p-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                {category === "sheet_music" ? "Compositor / Artista" : "Autor / Editorial"}
              </label>
              <input
                type="text"
                value={authorOrCreator}
                onChange={(e) => setAuthorOrCreator(e.target.value)}
                placeholder={category === "sheet_music" ? "Ej. Claude Debussy" : "Ej. James Clear"}
                className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 p-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Sheet Music Specific Fields */}
          {category === "sheet_music" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20">
              <div>
                <label className="block text-xs font-medium text-cyan-300 mb-1.5">
                  Instrumento
                </label>
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/30 bg-neutral-950 p-2.5 text-xs text-white focus:outline-none"
                >
                  {INSTRUMENTS.map((ins) => (
                    <option key={ins} value={ins}>
                      {ins}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-cyan-300 mb-1.5">
                  Nivel de Dificultad
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/30 bg-neutral-950 p-2.5 text-xs text-white focus:outline-none"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Status Column */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Estado en el Tablero Kanban
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "backlog",
                  label: category === "sheet_music" ? "Por aprender" : "Por leer",
                },
                {
                  id: "in_progress",
                  label: category === "sheet_music" ? "En práctica" : "Leyendo",
                },
                {
                  id: "completed",
                  label: category === "sheet_music" ? "Dominada" : "Completado",
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as VaultItemStatus)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    status === st.id
                      ? "bg-neutral-800 border-white/[0.3] text-white"
                      : "bg-neutral-950 border-white/[0.06] text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* S3 File Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Adjuntar Archivo PDF (Subida directa a AWS S3)
            </label>
            <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/[0.12] bg-neutral-950 hover:border-cyan-500/50 hover:bg-neutral-950/80 cursor-pointer transition-all">
              <UploadCloud className="h-7 w-7 text-neutral-500 mb-1.5" />
              <span className="text-xs font-semibold text-neutral-200">
                {selectedFile ? selectedFile.name : "Selecciona o arrastra el archivo PDF"}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para subir`
                  : "PDFs de partituras, libros o documentos (sin límite)"}
              </span>
              <input
                type="file"
                accept=".pdf,.epub,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Notes & Reflections */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Notas, Pasajes Clave o Digitación
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotaciones de práctica, tempo, conceptos destacados o reflexiones..."
              className="w-full rounded-xl border border-white/[0.1] bg-neutral-950 p-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-xs text-white hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <UploadCloud className="h-3.5 w-3.5 animate-spin" />
                  <span>Subiendo a S3...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Guardar en Bóveda</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
