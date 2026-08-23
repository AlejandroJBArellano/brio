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
    <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
            <Coffee className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
              Detector de Gastos Hormiga & Antojos
            </h3>
            <p className="text-xs text-[#8E867B]">
              Límite diario: <span className="font-mono font-semibold text-[#DDD6C9]">${dailyLimit.toFixed(2)} MXN</span>
            </p>
          </div>
        </div>

        {isExceeded ? (
          <span className="inline-flex items-center gap-1 rounded border border-[#E05D52]/40 bg-[#221716] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#E05D52]">
            <AlertTriangle className="h-3 w-3" />
            Límite Excedido
          </span>
        ) : isClose ? (
          <span className="inline-flex items-center gap-1 rounded border border-[#D99B43]/40 bg-[#221D16] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#D99B43]">
            <Flame className="h-3 w-3" />
            Alerta 75%
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-[#7EA35A]/40 bg-[#1C2219] px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[#7EA35A]">
            <CheckCircle2 className="h-3 w-3" />
            Bajo Control
          </span>
        )}
      </div>

      {/* Thermometer Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#8E867B]">
            Gastado hoy: <strong className="text-[#F5F2EB]">${spentToday.toFixed(2)}</strong>
          </span>
          <span className={isExceeded ? "text-[#E05D52] font-bold" : "text-[#D99B43] font-bold"}>
            {isExceeded
              ? `+$${(spentToday - dailyLimit).toFixed(2)} excedido`
              : `$${remaining.toFixed(2)} disponible`}
          </span>
        </div>

        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
          <div
            className={`h-full transition-all duration-500 ${
              isExceeded
                ? "bg-[#E05D52]"
                : isClose
                ? "bg-[#D99B43]"
                : "bg-[#7EA35A]"
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* Month context & tip */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#2A2723] text-xs">
        <div className="text-[#8E867B] font-mono">
          Acumulado del mes: <span className="font-semibold text-[#F5F2EB]">${spentThisMonth.toFixed(2)} MXN</span>
        </div>
        <div className="text-[11px] text-[#8E867B]">
          💡 Usa <code className="rounded bg-[#121110] border border-[#2A2723] px-1 py-0.5 text-[#D99B43] font-mono">-$50 Café #antojo @nu</code> en el Omnibar
        </div>
      </div>
    </div>
  );
}
