"use client";

import {
  VaultDashboardData,
  VaultItemCategory,
} from "@/lib/types";
import {
  BookOpen,
  GraduationCap,
  Music,
  Plus,
  Video,
} from "lucide-react";
import { useState } from "react";
import { AddVaultItemModal } from "./AddVaultItemModal";
import { VaultKanbanBoard } from "./VaultKanbanBoard";

interface VaultViewProps {
  data: VaultDashboardData;
  onRefresh?: () => void;
  onOpenScratchpad?: () => void;
}

type VaultTab = "courses" | "books" | "sheet_music" | "resources";

export function VaultView({ data, onRefresh, onOpenScratchpad }: VaultViewProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("courses");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<VaultItemCategory>("course");

  const handleOpenAddModal = (cat: VaultItemCategory) => {
    setAddModalCategory(cat);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* 2. Top Navigation Bar: Sub-Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2723] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121110] rounded-lg border border-[#2A2723] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeTab === "courses"
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeTab === "books"
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeTab === "sheet_music"
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${activeTab === "resources"
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

      {/* Add Item Modal */}
      <AddVaultItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategory={addModalCategory}
        onSuccess={onRefresh}
      />
    </div>
  );
}
