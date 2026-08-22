"use client";

import {
  deleteWishlistItemAction,
  dismissWishlistItemAction,
  purchaseWishlistItemAction,
} from "@/app/actions/wishlist";
import { WishlistDashboardData, WishlistItem, WishlistStatus } from "@/lib/types";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { AddWishlistModal } from "./AddWishlistModal";

interface WishlistViewProps {
  data: WishlistDashboardData;
  onRefresh?: () => void;
}

export function WishlistView({ data, onRefresh }: WishlistViewProps) {
  const [filterStatus, setFilterStatus] = useState<"all" | "cooling" | "ready" | "purchased" | "dismissed">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredItems = data.items.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const handlePurchase = (item: WishlistItem) => {
    if (!confirm(`¿Registrar compra de "${item.title}" por $${item.priceEstimated.toLocaleString("es-MX")} MXN en tus gastos?`)) return;

    startTransition(async () => {
      await purchaseWishlistItemAction(item.id, {
        actualAmount: item.priceEstimated,
        category: item.category,
      });
      if (onRefresh) onRefresh();
    });
  };

  const handleDismiss = (item: WishlistItem) => {
    if (!confirm(`¿Descartar "${item.title}"? ¡Esto sumará $${item.priceEstimated.toLocaleString("es-MX")} MXN a tu dinero ahorrado!`)) return;

    startTransition(async () => {
      await dismissWishlistItemAction(item.id);
      if (onRefresh) onRefresh();
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}" de la wishlist?`)) return;

    startTransition(async () => {
      await deleteWishlistItemAction(id);
      if (onRefresh) onRefresh();
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cooling Count */}
        <div className="rounded-2xl border border-cyan-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>En Enfriamiento</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {data.stats.coolingCount} items
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Filtrando impulsos de dopamina
          </div>
        </div>

        {/* Ready to Buy */}
        <div className="rounded-2xl border border-emerald-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Listos para Comprar</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {data.stats.readyCount} items
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Superaron los 30 días de reflexión
          </div>
        </div>

        {/* Total Saved in Dismissed Impulses */}
        <div className="rounded-2xl border border-violet-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Dinero Ahorrado</span>
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-violet-400">
            ${Math.round(data.stats.totalSavedImpulseValue).toLocaleString("es-MX")} MXN
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {data.stats.dismissedCount} caprichos evitados con éxito 🎉
          </div>
        </div>

        {/* Total Active Wishlist Value */}
        <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/60 p-4 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Valor en Lista</span>
            <ShoppingBag className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            ${Math.round(data.stats.totalWishlistValue).toLocaleString("es-MX")} MXN
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Deseos activos presupuestados
          </div>
        </div>
      </div>

      {/* 2. Top Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/8">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950/80 rounded-2xl border border-white/8 overflow-x-auto">
          {[
            { id: "all", label: `Todos (${data.items.length})` },
            { id: "cooling", label: `Enfriando 🧊 (${data.stats.coolingCount})` },
            { id: "ready", label: `Listos 🎯 (${data.stats.readyCount})` },
            { id: "purchased", label: `Comprados ✅ (${data.stats.purchasedCount})` },
            { id: "dismissed", label: `Ahorrados 💎 (${data.stats.dismissedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id as WishlistStatus | "all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterStatus === tab.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 font-bold text-xs text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20 active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Deseo (Anti-Impulso)</span>
        </button>
      </div>

      {/* 3. Wishlist Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-white/8 bg-neutral-950/40 space-y-3">
          <ShieldCheck className="h-9 w-9 text-violet-400/40 mx-auto" />
          <p className="text-sm font-bold text-neutral-300">
            No hay artículos en esta categoría
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Usa la Wishlist Anti-Impulso cada vez que veas un gadget o capricho en internet antes de pagar.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar primer deseo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isCooling = item.status === "cooling";
            const isReady = item.status === "ready";
            const isPurchased = item.status === "purchased";
            const isDismissed = item.status === "dismissed";

            const percentCooling = Math.min(
              100,
              Math.round((item.daysElapsed / item.coolingDaysTotal) * 100)
            );

            const priorityBadge =
              item.priority === "high"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                : item.priority === "medium"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300";

            return (
              <div
                key={item.id}
                className={`rounded-3xl border p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all group ${
                  isReady
                    ? "border-emerald-500/40 bg-neutral-900/80 shadow-emerald-950/20"
                    : isDismissed
                    ? "border-violet-500/20 bg-neutral-950/40 opacity-75"
                    : isPurchased
                    ? "border-white/4 bg-neutral-950/30 opacity-60"
                    : "border-white/8 bg-neutral-900/60 hover:border-white/18"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category, Priority, Delete */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-white/8 text-neutral-300 font-semibold">
                        {item.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md border font-semibold capitalize ${priorityBadge}`}>
                        {item.priority}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-all"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                      {item.title}
                    </h4>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        ${item.priceEstimated.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">MXN</span>
                    </div>
                  </div>

                  {/* Store Link if available */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:underline"
                    >
                      <span>Ver en tienda</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {/* Justification Notes */}
                  {item.reasonOrNotes && (
                    <p className="text-xs text-neutral-400 italic bg-neutral-950/60 p-2.5 rounded-xl border border-white/4">
                      &ldquo;{item.reasonOrNotes}&rdquo;
                    </p>
                  )}

                  {/* Cooling Progress Bar */}
                  {(isCooling || isReady) && (
                    <div className="p-3 rounded-2xl bg-neutral-950/80 border border-white/6 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          <span>Día {item.daysElapsed} de {item.coolingDaysTotal}</span>
                        </span>
                        <span className={isReady ? "text-emerald-400 font-bold" : "text-cyan-400 font-bold"}>
                          {isReady ? "¡30d Superados!" : `${item.daysRemaining}d restantes`}
                        </span>
                      </div>

                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-900">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isReady
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : "bg-gradient-to-r from-cyan-500 to-blue-500"
                          }`}
                          style={{ width: `${percentCooling}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Banner for Completed/Dismissed */}
                  {isPurchased && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Comprado y registrado en gastos</span>
                    </div>
                  )}

                  {isDismissed && (
                    <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      <span>Capricho evitado (+${item.priceEstimated.toLocaleString("es-MX")} ahorrados)</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Controls */}
                {(isCooling || isReady) && (
                  <div className="mt-4 pt-3 border-t border-white/6 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDismiss(item)}
                      disabled={isPending}
                      className="flex-1 py-2 rounded-xl bg-neutral-950 hover:bg-rose-500/10 border border-white/8 hover:border-rose-500/30 text-xs font-semibold text-neutral-400 hover:text-rose-300 transition-all"
                      title="Descartar y sumar al contador de dinero ahorrado"
                    >
                      Descartar ❌
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePurchase(item)}
                      disabled={isPending}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all shadow-md ${
                        isReady
                          ? "bg-emerald-500 text-neutral-950 hover:bg-emerald-400 shadow-emerald-500/20"
                          : "bg-white/8 text-neutral-200 hover:bg-white/15"
                      }`}
                    >
                      Comprar 🛍️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AddWishlistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
