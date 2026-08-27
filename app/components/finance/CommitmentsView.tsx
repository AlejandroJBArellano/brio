"use client";

import { deleteFinanceCommitmentAction } from "@/app/actions/finance";
import {
  CommitmentSummaryStats,
  FinanceAccount,
  FinanceCategory,
  FinanceCommitment,
} from "@/lib/types";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Hash,
  Layers,
  Plus,
  Repeat,
  Search,
  Trash2,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { AddCommitmentModal } from "./AddCommitmentModal";
import { SettleCommitmentModal } from "./SettleCommitmentModal";

interface CommitmentsViewProps {
  commitments?: FinanceCommitment[];
  stats?: CommitmentSummaryStats;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  onRefresh?: () => void;
}

export function CommitmentsView({
  commitments = [],
  stats,
  categories = [],
  accounts = [],
  onRefresh,
}: CommitmentsViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<FinanceCommitment | null>(null);
  const [editingCommitment, setEditingCommitment] = useState<FinanceCommitment | null>(null);
  const [filterType, setFilterType] = useState<"all" | "installment" | "recurring" | "variable_schedule" | "due_soon" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Filtered commitments
  const filteredCommitments = useMemo(() => {
    return commitments.filter((c) => {
      if (filterType === "installment" && c.type !== "installment") return false;
      if (filterType === "recurring" && c.type !== "recurring") return false;
      if (filterType === "variable_schedule" && c.type !== "variable_schedule") return false;
      if (filterType === "due_soon" && (c.status !== "active" || c.daysUntilDue === undefined || c.daysUntilDue > 7)) return false;
      if (filterType === "completed" && c.status !== "completed") return false;
      if (filterType === "all" && c.status === "completed") return false; // Show active by default in "all"

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title?.toLowerCase().includes(q);
        const matchesCat = c.category?.toLowerCase().includes(q);
        const matchesAcc = c.defaultAccount?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        return matchesTitle || matchesCat || matchesAcc || matchesNotes;
      }

      return true;
    });
  }, [commitments, filterType, searchQuery]);

  const handleDelete = (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este compromiso?")) return;
    startTransition(async () => {
      await deleteFinanceCommitmentAction(id);
      if (onRefresh) onRefresh();
    });
  };

  const handleOpenSettle = (cmt: FinanceCommitment) => {
    setSelectedCommitment(cmt);
    setIsSettleModalOpen(true);
  };

  const handleOpenEdit = (cmt: FinanceCommitment) => {
    setEditingCommitment(cmt);
    setIsAddModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCommitment(null);
    setIsAddModalOpen(true);
  };

  const getAccountLabel = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? `${acc.icon || "💳"} ${acc.name}` : accId;
  };

  const getCategoryLabel = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? `${cat.icon || "🏷️"} ${cat.name}` : catId;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Commitments */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Compromisos de este Mes</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#221716] text-[#E05D52] border border-[#E05D52]/30">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#E05D52] tracking-tight">
            ${(stats?.totalMonthlyCommitment || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            Suma de pagos exigibles este mes
          </div>
        </div>

        {/* Total Debt / Balance to Pay */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Deuda Total en Cuotas</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#D99B43] tracking-tight">
            ${(stats?.totalRemainingDebt || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            Saldo pendiente en todos tus plazos
          </div>
        </div>

        {/* Due Soon (< 7 days) */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Próximos a Vencer (&lt; 7d)</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#221B16] text-[#F59E0B] border border-[#F59E0B]/30">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F59E0B] tracking-tight">
            {stats?.dueSoonCount || 0}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            {stats?.dueSoonCount ? "Requieren atención inmediata" : "Al día y sin urgencias"}
          </div>
        </div>

        {/* Active Installments */}
        <div className="rounded-lg border border-[#2A2723] bg-[#181715] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8E867B] font-mono">
            <span>Cuotas Activas</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#162121] text-[#4EAB9E] border border-[#4EAB9E]/30">
              <Hash className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#4EAB9E] tracking-tight">
            {stats?.installmentCount || 0}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#8E867B]">
            De {stats?.activeCount || 0} compromisos activos
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#181715] p-3 rounded-lg border border-[#2A2723]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E867B]" />
          <input
            type="text"
            placeholder="Buscar por concepto, categoría o cuenta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#121110] border border-[#2A2723] text-xs text-[#F5F2EB] placeholder-[#8E867B] focus:outline-hidden focus:border-[#D99B43] transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterType === "all"
                ? "bg-[#D99B43] text-[#121110] font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            Activos ({commitments.filter((c) => c.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("installment")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterType === "installment"
                ? "bg-[#D99B43] text-[#121110] font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            Cuotas (X/Y)
          </button>
          <button
            type="button"
            onClick={() => setFilterType("recurring")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterType === "recurring"
                ? "bg-[#D99B43] text-[#121110] font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            Recurrentes
          </button>
          <button
            type="button"
            onClick={() => setFilterType("variable_schedule")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterType === "variable_schedule"
                ? "bg-[#D99B43] text-[#121110] font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            Cronogramas
          </button>
          <button
            type="button"
            onClick={() => setFilterType("due_soon")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterType === "due_soon"
                ? "bg-[#E05D52] text-[#121110] font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            Por Vencer ⚠️
          </button>
          <button
            type="button"
            onClick={() => setFilterType("completed")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              filterType === "completed"
                ? "bg-[#7EA35A] text-[#121110] font-bold"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            Completados
          </button>
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Compromiso</span>
        </button>
      </div>

      {/* 3. Commitments Grid */}
      {filteredCommitments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#2A2723] bg-[#181715]/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#221D16] text-[#D99B43] mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h4 className="font-serif text-base font-semibold text-[#F5F2EB]">
            No hay compromisos registrados en esta vista
          </h4>
          <p className="text-xs text-[#8E867B] mt-1 max-w-md">
            Registra cuotas fijas (ej. Hybridge 26 de 36), deudas con fechas variables, mensualidades o pagos únicos para tener control total de tus vencimientos.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D99B43] text-[#121110] font-bold text-xs hover:bg-[#E8AF59] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Crear mi primer compromiso</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommitments.map((cmt) => {
            const isInstallment = cmt.type === "installment";
            const isVariable = cmt.type === "variable_schedule";
            const isRecurring = cmt.type === "recurring";
            const isOneTime = cmt.type === "one_time";
            const isCompleted = cmt.status === "completed";

            const paidCount = cmt.installmentsPaid || 0;
            const totalCount = cmt.installmentsTotal || 0;
            const percentProgress = totalCount > 0 ? Math.min(100, Math.round((paidCount / totalCount) * 100)) : 0;

            return (
              <div
                key={cmt.id}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-all shadow-sm ${
                  isCompleted
                    ? "border-[#2A2723] bg-[#181715]/60 opacity-80"
                    : cmt.isOverdue
                    ? "border-[#E05D52]/50 bg-[#221716]/40"
                    : cmt.daysUntilDue !== undefined && cmt.daysUntilDue <= 3
                    ? "border-[#F59E0B]/50 bg-[#221B16]/30"
                    : "border-[#2A2723] bg-[#181715] hover:border-[#D99B43]/40"
                }`}
              >
                <div>
                  {/* Top Bar: Type Badge & Status */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#2A2723]">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#121110] border border-[#2A2723] text-[#DDD6C9]">
                      {isInstallment && <><Hash className="size-3 text-[#D99B43]" /> Cuotas ({paidCount}/{totalCount})</>}
                      {isVariable && <><Calendar className="size-3 text-[#4EAB9E]" /> Cronograma ({cmt.variableSchedule?.length || 0} hitos)</>}
                      {isRecurring && <><Repeat className="size-3 text-[#6366f1]" /> Recurrente ({cmt.frequency})</>}
                      {isOneTime && <><Zap className="size-3 text-[#E05D52]" /> Pago Único</>}
                    </span>

                    {/* Due Date Badge */}
                    {cmt.nextDueDate && !isCompleted && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          cmt.isOverdue
                            ? "bg-[#E05D52]/20 text-[#E05D52] border border-[#E05D52]/30 animate-pulse"
                            : cmt.daysUntilDue !== undefined && cmt.daysUntilDue <= 3
                            ? "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
                            : "bg-[#121110] text-[#8E867B] border border-[#2A2723]"
                        }`}
                      >
                        <Clock className="size-3" />
                        {cmt.isOverdue
                          ? `Venció hace ${Math.abs(cmt.daysUntilDue || 0)}d`
                          : cmt.daysUntilDue === 0
                          ? "Vence HOY"
                          : `En ${cmt.daysUntilDue}d (${cmt.nextDueDate.slice(5)})`}
                      </span>
                    )}

                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/30 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Liquidado
                      </span>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div className="mt-3">
                    <h4 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight truncate">
                      {cmt.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8E867B]">
                      <span>{getCategoryLabel(cmt.category)}</span>
                      <span>•</span>
                      <span>Sugerido: {getAccountLabel(cmt.defaultAccount)}</span>
                    </div>
                  </div>

                  {/* Schema Details */}
                  {/* 1. Installment Progress Bar */}
                  {isInstallment && (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-[#8E867B]">
                          Cuota {paidCount} de {totalCount}
                        </span>
                        <span className="text-[#7EA35A] font-bold">{percentProgress}%</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#121110] border border-[#2A2723]">
                        <div
                          className="h-full bg-[#D99B43] transition-all duration-500"
                          style={{ width: `${percentProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[#8E867B] pt-1">
                        <span>${(cmt.installmentAmount || 0).toLocaleString()} / cuota</span>
                        <span>Faltan ${(cmt.remainingBalance || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* 2. Variable Schedule Timeline */}
                  {isVariable && cmt.variableSchedule && cmt.variableSchedule.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <div className="text-[11px] font-mono text-[#8E867B] flex justify-between">
                        <span>Próximo pago:</span>
                        <strong className="text-[#D99B43]">
                          ${(cmt.nextPaymentAmount || 0).toLocaleString()} MXN
                        </strong>
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto bg-[#121110] p-2 rounded-md border border-[#2A2723] text-[10px] font-mono">
                        {cmt.variableSchedule.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className={`flex justify-between items-center py-0.5 ${
                              item.isPaid ? "text-[#7EA35A] line-through opacity-60" : "text-[#DDD6C9]"
                            }`}
                          >
                            <span>{item.date} • {item.note || `Pago ${idx + 1}`}</span>
                            <span className="font-bold">${Number(item.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Recurring */}
                  {isRecurring && (
                    <div className="mt-4 p-2.5 rounded-lg bg-[#121110] border border-[#2A2723] flex justify-between items-center text-xs font-mono">
                      <span className="text-[#8E867B]">Cuota Periódica:</span>
                      <strong className="text-[#F5F2EB] text-sm">
                        ${(cmt.installmentAmount || cmt.totalAmount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                      </strong>
                    </div>
                  )}

                  {/* 4. One Time */}
                  {isOneTime && (
                    <div className="mt-4 p-2.5 rounded-lg bg-[#121110] border border-[#2A2723] flex justify-between items-center text-xs font-mono">
                      <span className="text-[#8E867B]">Monto a Liquidar:</span>
                      <strong className="text-[#F5F2EB] text-sm">
                        ${(cmt.totalAmount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                      </strong>
                    </div>
                  )}

                  {/* Notes if any */}
                  {cmt.notes && (
                    <p className="mt-3 text-[11px] text-[#8E867B] line-clamp-2 italic bg-[#121110]/50 p-2 rounded-md border border-[#2A2723]/50">
                      "{cmt.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-[#2A2723] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cmt)}
                      className="p-1.5 rounded-md text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D] transition-all cursor-pointer"
                      title="Editar compromiso"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cmt.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-md text-[#8E867B] hover:text-[#E05D52] hover:bg-[#221716] transition-all cursor-pointer"
                      title="Eliminar compromiso"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleOpenSettle(cmt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7EA35A] hover:bg-[#8eb865] text-[#121110] font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>
                        {isInstallment ? `Pagar Cuota ${paidCount + 1}` : "Liquidar Pago"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settle Modal */}
      {isSettleModalOpen && selectedCommitment && (
        <SettleCommitmentModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          commitment={selectedCommitment}
          accounts={accounts}
          onSuccess={onRefresh}
        />
      )}

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <AddCommitmentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          commitmentToEdit={editingCommitment}
          categories={categories}
          accounts={accounts}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
