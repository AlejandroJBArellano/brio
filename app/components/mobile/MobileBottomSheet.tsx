import { createTransactionAction } from "@/app/actions/finance";
import { createBodyCompositionAction, logWaterAction } from "@/app/actions/health";
import { quickAdjustPortionAction, toggleNutritionHabitAction } from "@/app/actions/nutrition";
import { createSingleTaskAction } from "@/app/actions/tasks";
import { FoodGroupKey } from "@/lib/types";
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
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  initialTab = "expense",
  dailyAntRemaining = 150,
}: MobileBottomSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SheetTab>(initialTab);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Expense form state
  const [amount, setAmount] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [category, setCategory] = useState<string>("comida");
  const [account, setAccount] = useState<string>("nu");
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-up Container */}
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl border-t border-x border-white/10 bg-neutral-900 p-5 shadow-2xl backdrop-blur-2xl transition-all pb-safe animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="flex justify-center mb-3">
          <div className="h-1.5 w-12 rounded-full bg-white/20" />
        </div>

        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-800/80 border border-white/6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("expense")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "expense"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <DollarSign className="size-3.5" />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("task")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "task"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <CheckSquare className="size-3.5" />
              Tarea
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("nutrition")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "nutrition"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Salad className="size-3.5" />
              Nutrición
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("water")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "water"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Droplet className="size-3.5" />
              Agua
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("weight")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "weight"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Scale className="size-3.5" />
              Peso
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-emerald-300 text-sm font-semibold animate-in zoom-in-95">
            <Check className="size-4 text-emerald-400" />
            {successMessage}
          </div>
        )}

        {/* 1. Gasto View */}
        {activeTab === "expense" && (
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            {/* Amount Big Input */}
            <div className="relative flex items-center justify-center rounded-2xl bg-neutral-950/80 border border-white/10 p-4">
              <span className="text-2xl font-bold text-rose-400 mr-1">$</span>
              <input
                type="number"
                step="0.5"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full text-center text-3xl font-extrabold text-white bg-transparent focus:outline-none placeholder:text-neutral-600"
              />
              <span className="text-xs font-medium text-neutral-500 ml-1">MXN</span>
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center justify-between gap-2">
              {[20, 50, 100, 150].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/6 text-xs font-semibold text-neutral-300 transition-colors active:scale-95"
                >
                  +${val}
                </button>
              ))}
            </div>

            {/* Concept input */}
            <input
              type="text"
              placeholder="Concepto (ej. Café con pan, Taxi, Oxxo)..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full rounded-xl bg-neutral-950/60 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
            />

            {/* Category Chips */}
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Categoría
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "comida", label: "#comida" },
                  { id: "antojo", label: "#antojo" },
                  { id: "transporte", label: "#transporte" },
                  { id: "super", label: "#super" },
                  { id: "salud", label: "#salud" },
                  { id: "servicios", label: "#servicios" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      category === c.id
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-white/5 text-neutral-400 border border-white/5 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account & Ant-expense row */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                {["nu", "bbva", "efectivo"].map((acc) => (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => setAccount(acc)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono uppercase transition-all ${
                      account === acc
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "bg-white/5 text-neutral-400 border border-white/5"
                    }`}
                  >
                    @{acc}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={isAntExpense}
                  onChange={(e) => setIsAntExpense(e.target.checked)}
                  className="size-3.5 rounded accent-rose-500"
                />
                <span>Gasto hormiga 🐜</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !amount}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
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
              rows={3}
              autoFocus
              className="w-full rounded-2xl bg-neutral-950/80 border border-white/10 p-3.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
            />

            {/* Priority chips */}
            <div className="flex items-center gap-2">
              {[
                { id: "normal", label: "To-Do Normal" },
                { id: "urgent", label: "Alta / Must-Win ⚡" },
                { id: "habit", label: "Hábito Positivo +" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTaskPriority(p.id as "normal" | "urgent" | "habit")}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    taskPriority === p.id
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-white/5 text-neutral-400 border border-white/5"
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
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin text-white" />
              ) : (
                <>
                  <Zap className="size-4 text-white" />
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
              <span className="text-xs font-bold text-neutral-300 block mb-2">
                1-Tap: Sumar Porción (+1)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "fruits" as const, name: "Fruta", icon: "🍎", color: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
                  { key: "vegetables" as const, name: "Verdura", icon: "🥦", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
                  { key: "cereals" as const, name: "Cereal", icon: "🌾", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
                  { key: "legumes" as const, name: "Legumbre/Tofu", icon: "🫘", color: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
                  { key: "fats_seeds" as const, name: "Semillas/Grasa", icon: "🥑", color: "border-lime-500/30 bg-lime-500/10 text-lime-300" },
                  { key: "leafy_greens" as const, name: "Hojas", icon: "🥬", color: "border-teal-500/30 bg-teal-500/10 text-teal-300" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleQuickPortion(item.key, item.name)}
                    disabled={isPending}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${item.color}`}
                  >
                    <span className="text-xl mb-1">{item.icon}</span>
                    <span>+1 {item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/8">
              <span className="text-xs font-bold text-neutral-300 block mb-2">
                Hábitos Clave de Mariana Mont:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickHabit("dailySalad", "Ensalada Diaria")}
                  disabled={isPending}
                  className="py-2.5 px-2 rounded-xl bg-neutral-950 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/10 transition-all text-center"
                >
                  🥗 Ensalada Diaria
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickHabit("noUltraProcessed", "Cero Procesados")}
                  disabled={isPending}
                  className="py-2.5 px-2 rounded-xl bg-neutral-950 border border-amber-500/30 text-[11px] font-bold text-amber-300 hover:bg-amber-500/10 transition-all text-center"
                >
                  🚫 Cero Procesados
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickHabit("b12Weekly", "Vitamina B12")}
                  disabled={isPending}
                  className="py-2.5 px-2 rounded-xl bg-neutral-950 border border-violet-500/30 text-[11px] font-bold text-violet-300 hover:bg-violet-500/10 transition-all text-center"
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
            <p className="text-xs text-neutral-400 text-center">
              Selecciona la cantidad de agua consumida para sumar a tu meta de 3,000ml:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAddWater(250)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition-all active:scale-95 disabled:opacity-50"
              >
                <Droplet className="size-6 text-sky-400" />
                <span className="text-sm font-bold">+250ml</span>
                <span className="text-[10px] text-sky-400/80">Vaso</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAddWater(500)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 transition-all active:scale-95 disabled:opacity-50"
              >
                <Droplet className="size-7 text-sky-400" />
                <span className="text-base font-extrabold">+500ml</span>
                <span className="text-[10px] text-sky-300">Botella</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAddWater(1000)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition-all active:scale-95 disabled:opacity-50"
              >
                <Droplet className="size-8 text-sky-400" />
                <span className="text-sm font-bold">+1,000ml</span>
                <span className="text-[10px] text-sky-400/80">Termo</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Peso View */}
        {activeTab === "weight" && (
          <form onSubmit={handleWeightSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">
                  Peso Actual (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="78.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl bg-neutral-950/80 border border-white/10 px-3.5 py-2.5 text-base font-bold text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">
                  % Grasa (Opcional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="24.5"
                  value={fatPercent}
                  onChange={(e) => setFatPercent(e.target.value)}
                  className="w-full rounded-xl bg-neutral-950/80 border border-white/10 px-3.5 py-2.5 text-base font-bold text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !weightKg}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin text-white" />
              ) : (
                <>
                  <Check className="size-4 text-white" />
                  Guardar Pesaje
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
