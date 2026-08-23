"use client";

import { generateGroceryListAction } from "@/app/actions/nutrition";
import { GroceryListCategory } from "@/lib/types";
import { getWeekDateRange } from "@/lib/dateUtils";
import {
  Check,
  ClipboardCheck,
  Copy,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface SmartGroceryListProps {
  initialStartDate?: string;
  initialEndDate?: string;
}

export function SmartGroceryList({
  initialStartDate,
  initialEndDate,
}: SmartGroceryListProps) {
  // Default range: Monday to Sunday of current week in CDMX
  const { mondayStr, sundayStr } = getWeekDateRange();

  const [startDate, setStartDate] = useState<string>(
    initialStartDate || mondayStr
  );
  const [endDate, setEndDate] = useState<string>(
    initialEndDate || sundayStr
  );
  const [categories, setCategories] = useState<GroceryListCategory[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateGroceryListAction(startDate, endDate);
      setCategories(res);
      setCheckedIds(new Set());
    });
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  const toggleItemChecked = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyClipboard = () => {
    if (categories.length === 0) return;

    let text = `🛒 *LISTA DEL SÚPER - BRIO NUTRICIÓN*\n📅 Del ${startDate} al ${endDate}\n\n`;

    categories.forEach((cat) => {
      text += `*${cat.icon} ${cat.categoryTitle}*\n`;
      cat.items.forEach((item) => {
        const isChecked = checkedIds.has(item.id);
        const marker = isChecked ? "✅" : "▫️";
        text += `${marker} ${item.name}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const totalChecked = checkedIds.size;

  return (
    <div className="space-y-5">
      {/* Date Range & Generator Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/8 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <span>Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-neutral-950/80 px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <span>Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-neutral-950/80 px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-500 disabled:opacity-40 transition-all shadow-md shadow-emerald-600/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>{isPending ? "Generando..." : "Actualizar Lista"}</span>
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">
              {totalChecked} de {totalItems} comprados
            </span>

            <button
              type="button"
              onClick={handleCopyClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/8 bg-neutral-950/80 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-all"
              title="Copiar para WhatsApp o Notas"
            >
              {copied ? (
                <>
                  <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {categories.length === 0 && !isPending && (
        <div className="p-8 text-center rounded-2xl border border-dashed border-white/8 bg-neutral-950/30">
          <ShoppingCart className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">
            Sin comidas programadas en este rango
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Ve a la pestaña del <strong>Planificador & Calendario</strong> y asigna tus comidas de la semana. La lista de compras se armará automáticamente con todos los ingredientes.
          </p>
        </div>
      )}

      {/* Categorized Grocery List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.categoryKey}
            className="flex flex-col justify-between rounded-2xl border border-white/8 bg-neutral-900/60 p-4.5 backdrop-blur-xl shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/6">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {cat.categoryTitle}
                  </h4>
                </div>
                <span className="rounded-full bg-neutral-950 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-400 border border-white/6">
                  {cat.items.length}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {cat.items.map((item) => {
                  const isChecked = checkedIds.has(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItemChecked(item.id)}
                      className={`w-full flex items-start justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isChecked
                          ? "bg-emerald-500/10 border-emerald-500/20 text-neutral-400 opacity-60"
                          : "bg-neutral-950/60 border-white/4 text-neutral-200 hover:border-white/10"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span
                          className={`text-xs font-semibold block leading-tight ${
                            isChecked ? "line-through" : "text-white"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.sourceRecipes && item.sourceRecipes.length > 0 && (
                          <span className="text-[10px] text-neutral-500 line-clamp-1">
                            Para: {item.sourceRecipes.join(", ")}
                          </span>
                        )}
                      </div>

                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ml-2 mt-0.5 ${
                          isChecked
                            ? "bg-emerald-500 border-emerald-400 text-neutral-950"
                            : "border-neutral-700 bg-neutral-900"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
