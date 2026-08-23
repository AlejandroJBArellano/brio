"use client";

import {
  deleteWishlistItemAction,
  dismissWishlistItemAction,
  purchaseWishlistItemAction,
} from "@/app/actions/wishlist";
import { soundFx } from "@/lib/soundFx";
import { calculateWorkTimeForExpense } from "@/lib/utils";
import { WishlistDashboardData, WishlistItem, WishlistStatus } from "@/lib/types";
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
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
      const res = await purchaseWishlistItemAction(item.id, {
        actualAmount: item.priceEstimated,
        category: item.category,
      });
      if (res.success) {
        soundFx.transactionAdded();
      }
      if (onRefresh) onRefresh();
    });
  };

  const handleDismiss = (item: WishlistItem) => {
    if (!confirm(`¿Descartar "${item.title}"? ¡Esto sumará $${item.priceEstimated.toLocaleString("es-MX")} MXN a tu dinero ahorrado!`)) return;

    startTransition(async () => {
      const res = await dismissWishlistItemAction(item.id);
      if (res.success) {
        soundFx.taskComplete();
      }
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
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>En Enfriamiento</span>
            <Clock className="h-4 w-4 text-[#4EAB9E]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#4EAB9E]">
            {data.stats.coolingCount} items
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B]">
            Filtrando impulsos de dopamina
          </div>
        </div>

        {/* Ready to Buy */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Listos para Comprar</span>
            <CheckCircle2 className="h-4 w-4 text-[#7EA35A]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#7EA35A]">
            {data.stats.readyCount} items
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B]">
            Superaron los 30 días de reflexión
          </div>
        </div>

        {/* Total Saved in Dismissed Impulses */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Dinero Ahorrado</span>
            <Sparkles className="h-4 w-4 text-[#D99B43]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#D99B43]">
            ${Math.round(data.stats.totalSavedImpulseValue).toLocaleString("es-MX")} MXN
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B] font-mono">
            🎉 {data.stats.dismissedCount} caprichos ({calculateWorkTimeForExpense(data.stats.totalSavedImpulseValue).shortFormattedTime} recuperados)
          </div>
        </div>

        {/* Total Active Wishlist Value */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Valor en Lista</span>
            <ShoppingBag className="h-4 w-4 text-[#DDD6C9]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F2EB]">
            ${Math.round(data.stats.totalWishlistValue).toLocaleString("es-MX")} MXN
          </div>
          <div className="mt-1 text-[11px] text-[#8E867B] font-mono">
            ⏱️ {calculateWorkTimeForExpense(data.stats.totalWishlistValue).formattedTime}
          </div>
        </div>
      </div>

      {/* 2. Top Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2723]">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#181715] rounded-lg border border-[#2A2723] overflow-x-auto">
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
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                filterStatus === tab.id
                  ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Deseo (Anti-Impulso)</span>
        </button>
      </div>

      {/* 3. Wishlist Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-[#2A2723] bg-[#181715] space-y-3">
          <ShieldCheck className="h-9 w-9 text-[#8E867B] mx-auto" />
          <p className="text-sm font-bold text-[#F5F2EB] font-serif">
            No hay artículos en esta categoría
          </p>
          <p className="text-xs text-[#8E867B] max-w-sm mx-auto">
            Usa la Wishlist Anti-Impulso cada vez que veas un gadget o capricho en internet antes de pagar.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs transition-all inline-flex items-center gap-2 cursor-pointer"
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

            const workTime = calculateWorkTimeForExpense(item.priceEstimated);

            const percentCooling = Math.min(
              100,
              Math.round((item.daysElapsed / item.coolingDaysTotal) * 100)
            );

            const priorityBadge =
              item.priority === "high"
                ? "bg-[#221716] border-[#E05D52]/40 text-[#E05D52]"
                : item.priority === "medium"
                ? "bg-[#221D16] border-[#D99B43]/40 text-[#D99B43]"
                : "bg-[#1C2219] border-[#7EA35A]/40 text-[#7EA35A]";

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-all group ${
                  isReady
                    ? "border-[#7EA35A]/40 bg-[#181715]"
                    : isDismissed
                    ? "border-[#2A2723] bg-[#181715] opacity-75"
                    : isPurchased
                    ? "border-[#2A2723] bg-[#181715]/60 opacity-60"
                    : "border-[#2A2723] bg-[#181715] hover:border-[#38332D]"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category, Priority, Delete */}
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-[#121110] border border-[#2A2723] text-[#DDD6C9] font-medium">
                        {item.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded border font-medium capitalize ${priorityBadge}`}>
                        {item.priority}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#8E867B] hover:text-[#E05D52] transition-all cursor-pointer"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight leading-snug">
                      {item.title}
                    </h4>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-[#7EA35A]">
                        ${item.priceEstimated.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-[#8E867B] font-mono">MXN</span>
                    </div>
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono font-medium ${workTime.badgeBg}`}>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{workTime.formattedTime}</span>
                    </div>
                  </div>

                  {/* Store Link if available */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[#4EAB9E] hover:underline"
                    >
                      <span>Ver en tienda</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {/* Justification Notes */}
                  {item.reasonOrNotes && (
                    <p className="text-xs text-[#DDD6C9] italic bg-[#121110] p-2.5 rounded-lg border border-[#2A2723]">
                      &ldquo;{item.reasonOrNotes}&rdquo;
                    </p>
                  )}

                  {/* Cooling Progress Bar */}
                  {(isCooling || isReady) && (
                    <div className="p-3 rounded-lg bg-[#121110] border border-[#2A2723] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#8E867B] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#4EAB9E]" />
                          <span>Día {item.daysElapsed} de {item.coolingDaysTotal}</span>
                        </span>
                        <span className={isReady ? "text-[#7EA35A] font-bold" : "text-[#4EAB9E] font-bold"}>
                          {isReady ? "¡30d Superados!" : `${item.daysRemaining}d restantes`}
                        </span>
                      </div>

                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#181715] border border-[#2A2723]">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isReady
                              ? "bg-[#7EA35A]"
                              : "bg-[#4EAB9E]"
                          }`}
                          style={{ width: `${percentCooling}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Banner for Completed/Dismissed */}
                  {isPurchased && (
                    <div className="p-2.5 rounded-lg bg-[#1C2219] border border-[#7EA35A]/30 text-xs font-mono font-bold text-[#7EA35A] flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-[#7EA35A]" />
                      <span>Comprado y registrado en gastos</span>
                    </div>
                  )}

                  {isDismissed && (
                    <div className="p-2.5 rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-xs font-mono font-bold text-[#D99B43] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#D99B43]" />
                      <span>Capricho evitado (+${item.priceEstimated.toLocaleString("es-MX")} ahorrados)</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Controls */}
                {(isCooling || isReady) && (
                  <div className="mt-4 pt-3 border-t border-[#2A2723] flex items-center gap-2 font-mono">
                    <button
                      type="button"
                      onClick={() => handleDismiss(item)}
                      disabled={isPending}
                      className="flex-1 py-1.5 rounded-md bg-[#121110] hover:bg-[#221716] border border-[#2A2723] hover:border-[#E05D52]/40 text-xs font-semibold text-[#8E867B] hover:text-[#E05D52] transition-all cursor-pointer"
                      title="Descartar y sumar al contador de dinero ahorrado"
                    >
                      Descartar ❌
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePurchase(item)}
                      disabled={isPending}
                      className={`flex-1 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isReady
                          ? "bg-[#7EA35A] text-[#121110] hover:bg-[#8FBA66]"
                          : "bg-[#22201D] text-[#DDD6C9] hover:bg-[#2E2B27] border border-[#2A2723]"
                      }`}
                    >
                      <ShoppingBag className="size-3.5" />
                      <span>Comprar</span>
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
