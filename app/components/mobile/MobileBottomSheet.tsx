import { createTransactionAction } from "@/app/actions/finance";
import { createBodyCompositionAction, logWaterAction } from "@/app/actions/health";
import { quickAdjustPortionAction, toggleNutritionHabitAction } from "@/app/actions/nutrition";
import { createSingleTaskAction } from "@/app/actions/tasks";
import { FinanceAccount, FinanceCategory, FoodGroupKey } from "@/lib/types";
import { getTodayDateStr } from "@/lib/dateUtils";
import {
  Check,
  CheckSquare,
  DollarSign,
  Droplet,
  Loader2,
  Salad,
  Scale,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SheetTab = "expense" | "task" | "water" | "weight" | "nutrition";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SheetTab;
  dailyAntRemaining?: number;
  categories?: FinanceCategory[];
  accounts?: FinanceAccount[];
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  initialTab = "expense",
  dailyAntRemaining = 150,
  categories = [],
  accounts = [],
}: MobileBottomSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SheetTab>(initialTab);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const effectiveCategories =
    categories.length > 0
      ? categories
      : [
          { id: "comida", name: "Comida", icon: "🍔", isAntDefault: false },
          { id: "antojo", name: "Antojo", icon: "☕", isAntDefault: true },
          { id: "transporte", name: "Transporte", icon: "🚗", isAntDefault: false },
          { id: "servicios", name: "Servicios", icon: "🏠", isAntDefault: false },
          { id: "salud", name: "Salud", icon: "💊", isAntDefault: false },
          { id: "compras", name: "Compras", icon: "🛍️", isAntDefault: false },
        ];

  const effectiveAccounts =
    accounts.length > 0
      ? accounts
      : [
          { id: "nu", name: "Nu" },
          { id: "bbva", name: "BBVA" },
          { id: "efectivo", name: "Efectivo" },
        ];

  // Expense form state
  const [amount, setAmount] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [category, setCategory] = useState<string>(effectiveCategories[0]?.id || "comida");
  const [account, setAccount] = useState<string>(effectiveAccounts[0]?.id || "nu");
  const [isAntExpense, setIsAntExpense] = useState<boolean>(true);

  // Task form state
  const [taskText, setTaskText] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<"normal" | "urgent" | "habit">("normal");

  // Weight form state
  const [weightKg, setWeightKg] = useState<string>("");
  const [fatPercent, setFatPercent] = useState<string>("");

  if (!isOpen) return null;

  const handleQuickAmount = (val: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    startTransition(async () => {
      const res = await createTransactionAction({
        amount: numAmount,
        type: "expense",
        concept: concept.trim() || undefined,
        category,
        account,
        isAntExpense,
      });

      if (res.success) {
        setSuccessMessage(`-$${numAmount.toFixed(2)} MXN registrado`);
        setTimeout(() => {
          setAmount("");
          setConcept("");
          setSuccessMessage(null);
          onClose();
          router.refresh();
        }, 700);
      }
    });
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    startTransition(async () => {
      let formattedText = taskText.trim();
      if (taskPriority === "urgent") {
        formattedText = `${formattedText} !urgent`;
      } else if (taskPriority === "habit") {
        formattedText = `+ ${formattedText}`;
      }

      const res = await createSingleTaskAction(formattedText);
      if (res.success) {
        setSuccessMessage("Tarea añadida a Habitica ⚡");
        setTimeout(() => {
          setTaskText("");
          setSuccessMessage(null);
          onClose();
          router.refresh();
        }, 700);
      }
    });
  };

  const handleAddWater = (ml: number) => {
    startTransition(async () => {
      const res = await logWaterAction(ml);
      if (res.success) {
        setSuccessMessage(`+${ml}ml de agua registrados 💧`);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
          router.refresh();
        }, 700);
      }
    });
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseFloat(weightKg);
    if (!numWeight || numWeight <= 0) return;

    startTransition(async () => {
      const res = await createBodyCompositionAction({
        weightKg: numWeight,
        bodyFatPercentage: fatPercent ? parseFloat(fatPercent) : undefined,
        notes: "Registro rápido desde móvil PWA",
      });

      if (res.success) {
        setSuccessMessage(`Peso ${numWeight} kg guardado ⚖️`);
        setTimeout(() => {
          setWeightKg("");
          setFatPercent("");
          setSuccessMessage(null);
          onClose();
          router.refresh();
        }, 700);
      }
    });
  };

  const handleQuickPortion = (group: FoodGroupKey, name: string) => {
    const todayStr = getTodayDateStr();
    startTransition(async () => {
      const res = await quickAdjustPortionAction(todayStr, group, 1.0);
      if (res.success) {
        setSuccessMessage(`+1 ${name} registrado 🥑`);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
          router.refresh();
        }, 700);
      }
    });
  };

  const handleQuickHabit = (habitKey: "dailySalad" | "noUltraProcessed" | "b12Weekly", name: string) => {
    const todayStr = getTodayDateStr();
    startTransition(async () => {
      const res = await toggleNutritionHabitAction(todayStr, habitKey);
      if (res.success) {
        setSuccessMessage(`${name} actualizado ✨`);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
          router.refresh();
        }, 700);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/85 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-up Container */}
      <div
        className="w-full max-w-lg mx-auto rounded-t-2xl border-t border-x border-[#2A2723] bg-[#181715] p-5 shadow-2xl transition-all pb-safe animate-in slide-in-from-bottom duration-300 max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="flex justify-center mb-3 shrink-0">
          <div className="h-1 w-10 rounded-full bg-[#38332D]" />
        </div>

        {/* Header Tabs (Sticky / Fixed top of sheet) */}
        <div className="flex items-center justify-between border-b border-[#2A2723] pb-3 mb-4 shrink-0 gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121110] border border-[#2A2723] overflow-x-auto no-scrollbar max-w-[calc(100%-2.5rem)]">
            <button
              type="button"
              onClick={() => setActiveTab("expense")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeTab === "expense"
                  ? "bg-[#221716] text-[#E05D52] border border-[#E05D52]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <DollarSign className="size-3.5" />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("task")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeTab === "task"
                  ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <CheckSquare className="size-3.5" />
              Tarea
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("nutrition")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeTab === "nutrition"
                  ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <Salad className="size-3.5" />
              Nutrición
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("water")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeTab === "water"
                  ? "bg-[#162121] text-[#4EAB9E] border border-[#4EAB9E]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <Droplet className="size-3.5" />
              Agua
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("weight")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeTab === "weight"
                  ? "bg-[#1C2219] text-[#7EA35A] border border-[#7EA35A]/40 shadow-xs"
                  : "text-[#8E867B] hover:text-[#DDD6C9]"
              }`}
            >
              <Scale className="size-3.5" />
              Peso
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-[#1C2219] border border-[#7EA35A]/40 p-3 text-[#7EA35A] text-sm font-semibold animate-in zoom-in-95 shrink-0">
            <Check className="size-4 text-[#7EA35A]" />
            {successMessage}
          </div>
        )}

        {/* Scrollable Form Body Container */}
        <div className="flex-1 overflow-y-auto overscroll-contain pr-1 pb-4 space-y-4">
          {/* 1. Gasto View */}
          {activeTab === "expense" && (
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              {/* Amount Big Input */}
              <div className="relative flex items-center justify-center rounded-lg bg-[#121110] border border-[#2A2723] p-4">
                <span className="text-2xl font-bold text-[#E05D52] mr-1">$</span>
                <input
                  type="number"
                  step="0.5"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="w-full text-center text-3xl font-bold text-[#F5F2EB] bg-transparent focus:outline-none placeholder:text-[#8E867B]/50 font-mono"
                />
                <span className="text-xs font-mono text-[#8E867B] ml-1">MXN</span>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex items-center justify-between gap-2 font-mono">
                {[20, 50, 100, 150].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className="flex-1 py-1.5 rounded-lg bg-[#121110] hover:bg-[#22201D] border border-[#2A2723] text-xs font-semibold text-[#DDD6C9] transition-colors active:scale-95 cursor-pointer"
                  >
                    +${val}
                  </button>
                ))}
              </div>

              {/* Concept input */}
              <input
                type="text"
                placeholder="Concepto (ej. Café de especialidad, uber, etc.)..."
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full rounded-lg bg-[#121110] border border-[#2A2723] px-3.5 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43] transition-all font-sans"
              />

              {/* Category Chips */}
              <div>
                <label className="text-[11px] font-semibold text-[#8E867B] uppercase tracking-wider block mb-1.5 font-mono">
                  Categoría
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {effectiveCategories.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategory(c.id);
                        if (c.isAntDefault || c.id === "antojo") {
                          setIsAntExpense(true);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer font-sans ${
                        category === c.id
                          ? "bg-[#221716] text-[#E05D52] border border-[#E05D52]/40"
                          : "bg-[#121110] text-[#8E867B] border border-[#2A2723] hover:text-[#DDD6C9]"
                      }`}
                    >
                      <span>{c.icon || "🏷️"}</span>
                      <span>#{c.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account & Ant-expense row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 font-mono">
                  {effectiveAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccount(acc.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition-all flex items-center gap-1 cursor-pointer ${
                        account === acc.id
                          ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/40"
                          : "bg-[#121110] text-[#8E867B] border border-[#2A2723]"
                      }`}
                    >
                      <span>{acc.icon || "💳"}</span>
                      <span>@{acc.id}</span>
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#DDD6C9]">
                  <input
                    type="checkbox"
                    checked={isAntExpense}
                    onChange={(e) => setIsAntExpense(e.target.checked)}
                    className="size-4 rounded accent-[#D99B43] cursor-pointer"
                  />
                  <span>Gasto hormiga 🐜</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || !amount}
                className="w-full py-3 rounded-lg bg-[#E05D52] hover:bg-[#EB7369] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin text-white" />
                ) : (
                  <>
                    <Check className="size-4 text-white" />
                    Guardar Gasto
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. Tarea View */}
          {activeTab === "task" && (
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <textarea
                placeholder="¿Qué necesitas hacer? (ej. Enviar reporte mensual #trabajo)..."
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                rows={4}
                autoFocus
                className="w-full rounded-lg bg-[#121110] border border-[#2A2723] p-3.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#D99B43] resize-none transition-all font-sans"
              />

              {/* Priority chips */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {[
                  { id: "normal", label: "To-Do Normal" },
                  { id: "urgent", label: "Alta / Must-Win ⚡" },
                  { id: "habit", label: "Hábito Positivo +" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTaskPriority(p.id as "normal" | "urgent" | "habit")}
                    className={`flex-1 min-w-[90px] py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      taskPriority === p.id
                        ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/40"
                        : "bg-[#121110] text-[#8E867B] border border-[#2A2723]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || !taskText.trim()}
                className="w-full py-3 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] disabled:opacity-50 text-[#121110] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin text-[#121110]" />
                ) : (
                  <>
                    <Zap className="size-4 text-[#121110]" />
                    Crear Tarea en Habitica
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2.5. Nutrición View */}
          {activeTab === "nutrition" && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#DDD6C9] block mb-2 font-serif">
                  1-Tap: Sumar Porción (+1)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "fruits" as const, name: "Fruta", icon: "🍎", color: "border-[#E05D52]/30 bg-[#221716] text-[#E05D52]" },
                    { key: "vegetables" as const, name: "Verdura", icon: "🥦", color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]" },
                    { key: "cereals" as const, name: "Cereal", icon: "🌾", color: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]" },
                    { key: "legumes" as const, name: "Legumbre/Tofu", icon: "🫘", color: "border-[#4EAB9E]/30 bg-[#162121] text-[#4EAB9E]" },
                    { key: "fats_seeds" as const, name: "Semillas/Grasa", icon: "🥑", color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]" },
                    { key: "leafy_greens" as const, name: "Hojas", icon: "🥬", color: "border-[#4EAB9E]/30 bg-[#162121] text-[#4EAB9E]" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleQuickPortion(item.key, item.name)}
                      disabled={isPending}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${item.color}`}
                    >
                      <span className="text-xl mb-1">{item.icon}</span>
                      <span>+1 {item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#2A2723]">
                <span className="text-xs font-semibold text-[#DDD6C9] block mb-2 font-serif">
                  Hábitos Clave de Mariana Mont:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickHabit("dailySalad", "Ensalada Diaria")}
                    disabled={isPending}
                    className="py-2.5 px-2 rounded-lg bg-[#121110] border border-[#7EA35A]/30 text-[11px] font-semibold text-[#7EA35A] hover:bg-[#1C2219] transition-all text-center cursor-pointer"
                  >
                    🥗 Ensalada Diaria
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickHabit("noUltraProcessed", "Cero Procesados")}
                    disabled={isPending}
                    className="py-2.5 px-2 rounded-lg bg-[#121110] border border-[#D99B43]/30 text-[11px] font-semibold text-[#D99B43] hover:bg-[#221D16] transition-all text-center cursor-pointer"
                  >
                    🚫 Cero Procesados
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickHabit("b12Weekly", "Vitamina B12")}
                    disabled={isPending}
                    className="py-2.5 px-2 rounded-lg bg-[#121110] border border-[#4EAB9E]/30 text-[11px] font-semibold text-[#4EAB9E] hover:bg-[#162121] transition-all text-center cursor-pointer"
                  >
                    💊 Vitamina B12
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Agua View */}
          {activeTab === "water" && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-[#8E867B] text-center">
                Selecciona la cantidad de agua consumida para sumar a tu meta de 3,000ml:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAddWater(250)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#121110] hover:bg-[#162121] border border-[#4EAB9E]/30 text-[#4EAB9E] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Droplet className="size-6 text-[#4EAB9E]" />
                  <span className="text-sm font-bold font-mono">+250ml</span>
                  <span className="text-[10px] text-[#8E867B]">Vaso</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAddWater(500)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#162121] hover:bg-[#1C2A2A] border border-[#4EAB9E]/50 text-[#4EAB9E] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Droplet className="size-7 text-[#4EAB9E]" />
                  <span className="text-base font-bold font-mono">+500ml</span>
                  <span className="text-[10px] text-[#DDD6C9]">Botella</span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAddWater(1000)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#121110] hover:bg-[#162121] border border-[#4EAB9E]/30 text-[#4EAB9E] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Droplet className="size-8 text-[#4EAB9E]" />
                  <span className="text-sm font-bold font-mono">+1,000ml</span>
                  <span className="text-[10px] text-[#8E867B]">Termo</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Peso View */}
          {activeTab === "weight" && (
            <form onSubmit={handleWeightSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8E867B] font-mono">
                    Peso Actual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="78.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    autoFocus
                    className="w-full rounded-lg bg-[#121110] border border-[#2A2723] px-3.5 py-2.5 text-base font-bold font-mono text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#7EA35A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#8E867B] font-mono">
                    % Grasa (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="24.5"
                    value={fatPercent}
                    onChange={(e) => setFatPercent(e.target.value)}
                    className="w-full rounded-lg bg-[#121110] border border-[#2A2723] px-3.5 py-2.5 text-base font-bold font-mono text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:outline-none focus:border-[#7EA35A]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || !weightKg}
                className="w-full py-3 rounded-lg bg-[#7EA35A] hover:bg-[#8FB866] disabled:opacity-50 text-[#121110] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin text-[#121110]" />
                ) : (
                  <>
                    <Check className="size-4 text-[#121110]" />
                    Guardar Pesaje
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
