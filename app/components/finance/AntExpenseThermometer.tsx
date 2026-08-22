"use client";

import { AlertTriangle, CheckCircle2, Coffee, Flame } from "lucide-react";

interface AntExpenseThermometerProps {
  spentToday: number;
  dailyLimit: number;
  spentThisMonth: number;
  onOpenNewTransaction?: () => void;
}

export function AntExpenseThermometer({
  spentToday,
  dailyLimit,
  spentThisMonth,
  onOpenNewTransaction,
}: AntExpenseThermometerProps) {
  const percentUsed = Math.min(100, Math.round((spentToday / (dailyLimit || 1)) * 100));
  const remaining = Math.max(0, dailyLimit - spentToday);
  const isExceeded = spentToday > dailyLimit;
  const isClose = !isExceeded && percentUsed >= 75;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/60 p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Coffee className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Detector de Gastos Hormiga & Antojos
            </h3>
            <p className="text-xs text-neutral-400">
              Límite diario: <span className="font-mono font-semibold text-neutral-200">${dailyLimit.toFixed(2)} MXN</span>
            </p>
          </div>
        </div>

        {isExceeded ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-400 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Límite Excedido
          </span>
        ) : isClose ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400">
            <Flame className="h-3 w-3" />
            Alerta 75%
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Bajo Control
          </span>
        )}
      </div>

      {/* Thermometer Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-neutral-400">
            Gastado hoy: <strong className="text-white">${spentToday.toFixed(2)}</strong>
          </span>
          <span className={isExceeded ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>
            {isExceeded
              ? `+$${(spentToday - dailyLimit).toFixed(2)} excedido`
              : `$${remaining.toFixed(2)} disponible`}
          </span>
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-neutral-950/80 border border-white/6">
          <div
            className={`h-full transition-all duration-500 ${
              isExceeded
                ? "bg-gradient-to-r from-amber-500 to-rose-500"
                : isClose
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-emerald-500 to-amber-400"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Month context & tip */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/6 text-xs">
        <div className="text-neutral-400">
          Acumulado del mes: <span className="font-mono font-semibold text-white">${spentThisMonth.toFixed(2)} MXN</span>
        </div>
        <div className="text-[11px] text-neutral-500 italic">
          💡 Usa <code className="rounded bg-neutral-800 px-1 py-0.5 text-amber-300 font-mono">-$50 Café #antojo @nu</code> en el Omnibar
        </div>
      </div>
    </div>
  );
}
