"use client";

import { createWishlistItemAction } from "@/app/actions/wishlist";
import { WishlistPriority } from "@/lib/types";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-white/12 bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Agregar a Wishlist Anti-Impulso
              </h3>
              <p className="text-xs text-neutral-400">
                Aplica la regla de 30 días de enfriamiento antes de comprar
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Title & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Artículo / Deseo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Audífonos Sony WH-1000XM5"
                className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Precio Estimado (MXN) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={priceEstimated}
                onChange={(e) => setPriceEstimated(e.target.value)}
                placeholder="$4,500.00"
                className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs font-mono text-emerald-400 placeholder:text-neutral-600 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs text-white focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
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
                    className={`py-2 rounded-xl border text-[11px] font-semibold transition-all ${
                      priority === pr.id
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                        : "bg-neutral-950 border-white/6 text-neutral-400"
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
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Período de Enfriamiento (Anti-Impulso)</span>
            </label>
            <select
              value={coolingDays}
              onChange={(e) => setCoolingDays(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-cyan-500/30 bg-neutral-950 p-2.5 text-xs text-cyan-300 focus:outline-none"
            >
              {COOLING_OPTIONS.map((opt) => (
                <option key={opt.days} value={opt.days}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Store URL */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Enlace de Tienda (Amazon, MercadoLibre, etc.)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://amazon.com.mx/dp/..."
              className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Justification Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              ¿Por qué lo quieres? ¿Qué problema real resuelve?
            </label>
            <textarea
              rows={2}
              value={reasonOrNotes}
              onChange={(e) => setReasonOrNotes(e.target.value)}
              placeholder="Escribe la justificación para evaluar tu autocontrol cuando pasen los 30 días..."
              className="w-full rounded-xl border border-white/10 bg-neutral-950 p-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex justify-end gap-2 border-t border-white/8">
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
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 font-bold text-xs text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 inline-flex items-center gap-2"
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
