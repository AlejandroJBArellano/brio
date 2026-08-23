"use client";

import { createWishlistItemAction } from "@/app/actions/wishlist";
import { WishlistPriority } from "@/lib/types";
import { soundFx } from "@/lib/soundFx";
import { calculateWorkTimeForExpense } from "@/lib/utils";
import {
  Clock,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface AddWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = ["Tech", "Música", "Gym & Salud", "Libros", "Ropa", "Hogar", "General"];
const COOLING_OPTIONS = [
  { days: 15, label: "15 días (Compras menores <$1,000)" },
  { days: 30, label: "30 días (Regla estándar recomendada)" },
  { days: 60, label: "60 días (Compras mayores >$5,000)" },
];

export function AddWishlistModal({
  isOpen,
  onClose,
  onSuccess,
}: AddWishlistModalProps) {
  const [title, setTitle] = useState("");
  const [priceEstimated, setPriceEstimated] = useState("");
  const [category, setCategory] = useState("Tech");
  const [priority, setPriority] = useState<WishlistPriority>("medium");
  const [url, setUrl] = useState("");
  const [coolingDays, setCoolingDays] = useState(30);
  const [reasonOrNotes, setReasonOrNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const price = parseFloat(priceEstimated);
    if (!title.trim()) {
      setErrorMessage("El título del artículo es requerido.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setErrorMessage("Ingresa un precio estimado válido.");
      return;
    }

    startTransition(async () => {
      const res = await createWishlistItemAction({
        title: title.trim(),
        priceEstimated: price,
        category,
        priority,
        url: url.trim() || undefined,
        reasonOrNotes: reasonOrNotes.trim() || undefined,
        coolingDaysTotal: coolingDays,
      });

      if (res.success) {
        soundFx.click();
        if (onSuccess) onSuccess();
        onClose();
        // Reset
        setTitle("");
        setPriceEstimated("");
        setUrl("");
        setReasonOrNotes("");
      } else {
        setErrorMessage(res.error || "No se pudo registrar el deseo.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2723] bg-[#121110]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Agregar a Wishlist Anti-Impulso
              </h3>
              <p className="text-xs text-[#8E867B]">
                Aplica la regla de 30 días de enfriamiento antes de comprar
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono">
          {errorMessage && (
            <div className="p-3 rounded-lg border border-[#E05D52]/40 bg-[#221716] text-xs font-semibold text-[#E05D52]">
              {errorMessage}
            </div>
          )}

          {/* Title & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Artículo / Deseo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Audífonos Sony WH-1000XM5"
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Precio Estimado (MXN) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={priceEstimated}
                onChange={(e) => setPriceEstimated(e.target.value)}
                placeholder="$4,500.00"
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs font-mono text-[#7EA35A] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
              />
            </div>
          </div>

          {parseFloat(priceEstimated) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-[#3D3425] bg-[#1E1912] px-3 py-2 text-[11px] text-[#D99B43] font-sans animate-in fade-in duration-150">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#D99B43]" />
              <span>
                Costo en tiempo de vida: <strong className="font-mono text-[#F5F2EB]">{calculateWorkTimeForExpense(parseFloat(priceEstimated)).formattedTime}</strong>
              </span>
            </div>
          )}

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] focus:outline-none focus:border-[#D99B43]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#181715] text-[#F5F2EB]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Nivel de Prioridad
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "low", label: "Baja 🟢" },
                  { id: "medium", label: "Media 🟡" },
                  { id: "high", label: "Alta 🔴" },
                ].map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setPriority(pr.id as WishlistPriority)}
                    className={`py-2 rounded-md border text-[11px] font-semibold transition-all cursor-pointer ${
                      priority === pr.id
                        ? "bg-[#221D16] border-[#D99B43]/40 text-[#D99B43] font-bold"
                        : "bg-[#121110] border-[#2A2723] text-[#8E867B] hover:text-[#DDD6C9]"
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cooling Period Selector */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#4EAB9E]" />
              <span>Período de Enfriamiento (Anti-Impulso)</span>
            </label>
            <select
              value={coolingDays}
              onChange={(e) => setCoolingDays(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#4EAB9E] focus:outline-none focus:border-[#D99B43]"
            >
              {COOLING_OPTIONS.map((opt) => (
                <option key={opt.days} value={opt.days} className="bg-[#181715] text-[#F5F2EB]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Store URL */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              Enlace de Tienda (Amazon, MercadoLibre, etc.)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://amazon.com.mx/dp/..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
            />
          </div>

          {/* Justification Notes */}
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
              ¿Por qué lo quieres? ¿Qué problema real resuelve?
            </label>
            <textarea
              rows={2}
              value={reasonOrNotes}
              onChange={(e) => setReasonOrNotes(e.target.value)}
              placeholder="Escribe la justificación para evaluar tu autocontrol cuando pasen los 30 días..."
              className="w-full rounded-lg border border-[#2A2723] bg-[#121110] p-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:outline-none focus:border-[#D99B43]"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex justify-end gap-2 border-t border-[#2A2723]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-sans text-[#8E867B] hover:text-[#F5F2EB] hover:bg-[#22201D] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isPending ? "Guardando..." : "Iniciar Enfriamiento (30d)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
