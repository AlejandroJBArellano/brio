import { createTransactionAction, fetchFinanceCatalogAction } from "@/app/actions/finance";
import {
  fetchSupplementsCatalogAction,
  logWaterAction,
  toggleSupplementAction,
} from "@/app/actions/health";
import { quickAdjustPortionAction, toggleNutritionHabitAction } from "@/app/actions/nutrition";
import { createSingleTaskAction } from "@/app/actions/tasks";
import {
  DEFAULT_FINANCE_ACCOUNTS,
  DEFAULT_FINANCE_CATEGORIES,
  DEFAULT_USER_SUPPLEMENTS,
  FinanceAccount,
  FinanceCategory,
  FoodGroupKey,
  UserSupplement,
} from "@/lib/types";
import { FinanceIcon } from "@/app/components/finance/FinanceIcon";
import { getTodayDateStr } from "@/lib/dateUtils";
import {
  Check,
  CheckSquare,
  DollarSign,
  Droplet,
  Loader2,
  Salad,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type SheetTab = "expense" | "task" | "water" | "nutrition";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SheetTab;
  dailyAntRemaining?: number;
  categories?: FinanceCategory[];
  accounts?: FinanceAccount[];
}

function getSupplementEmoji(name: string, id: string): string {
  const lower = (name + " " + id).toLowerCase();
  if (lower.includes("ensalada") || lower.includes("salad")) return "🥗";
  if (lower.includes("procesado") || lower.includes("clean") || lower.includes("chatarra")) return "🚫";
  if (lower.includes("creatina") || lower.includes("creatine")) return "⚡";
  if (lower.includes("omega") || lower.includes("pescado") || lower.includes("fish")) return "🐟";
  if (lower.includes("b12") || lower.includes("vitamina b")) return "💊";
  if (lower.includes("magnesio") || lower.includes("zinc") || lower.includes("calcio")) return "🧪";
  if (lower.includes("proteina") || lower.includes("shake") || lower.includes("whey")) return "🥤";
  if (lower.includes("multivitamin") || lower.includes("vitamina") || lower.includes("vitamin")) return "💊";
  if (lower.includes("cafe") || lower.includes("te") || lower.includes("matcha")) return "🍵";
  if (lower.includes("ayuno") || lower.includes("fasting")) return "⏱️";
  if (lower.includes("agua") || lower.includes("water") || lower.includes("hidrata")) return "💧";
  return "✨";
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  initialTab = "expense",
  dailyAntRemaining: _dailyAntRemaining = 150,
  categories = [],
  accounts = [],
}: MobileBottomSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SheetTab>(initialTab);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [dbCategories, setDbCategories] = useState<FinanceCategory[]>(categories);
  const [dbAccounts, setDbAccounts] = useState<FinanceAccount[]>(accounts);
  const [dbSupplements, setDbSupplements] = useState<UserSupplement[]>(DEFAULT_USER_SUPPLEMENTS);

  // Sync props or fetch real catalog from Neon DB if empty
  useEffect(() => {
    if (categories.length > 0) {
      setDbCategories(categories);
    }
    if (accounts.length > 0) {
      setDbAccounts(accounts);
    }

    if (isOpen) {
      if (categories.length === 0 || accounts.length === 0) {
        fetchFinanceCatalogAction()
          .then((catalog) => {
            if (catalog.categories && catalog.categories.length > 0) {
              setDbCategories(catalog.categories);
            }
            if (catalog.accounts && catalog.accounts.length > 0) {
              setDbAccounts(catalog.accounts);
            }
          })
          .catch((err) => {
            console.error("[MobileBottomSheet] Failed to load finance catalog:", err);
          });
      }

      fetchSupplementsCatalogAction()
        .then((supps) => {
          if (supps && supps.length > 0) {
            setDbSupplements(supps);
          }
        })
        .catch((err) => {
          console.error("[MobileBottomSheet] Failed to load supplements catalog:", err);
        });
    }
  }, [isOpen, categories, accounts]);

  const effectiveCategories =
    dbCategories.length > 0 ? dbCategories : DEFAULT_FINANCE_CATEGORIES;

  const effectiveAccounts =
    dbAccounts.length > 0 ? dbAccounts : DEFAULT_FINANCE_ACCOUNTS;

  const effectiveSupplements =
    dbSupplements.length > 0 ? dbSupplements : DEFAULT_USER_SUPPLEMENTS;

  // Expense form state
  const [amount, setAmount] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [category, setCategory] = useState<string>(effectiveCategories[0]?.id || "comida");
  const [account, setAccount] = useState<string>(effectiveAccounts[0]?.id || "nu");
  const [isAntExpense, setIsAntExpense] = useState<boolean>(true);

  // Sync selected category and account when dynamic catalog loads
  useEffect(() => {
    if (effectiveCategories.length > 0 && !effectiveCategories.some((c) => c.id === category)) {
      const firstCat = effectiveCategories[0];
      setCategory(firstCat.id);
      if (firstCat.isAntDefault || firstCat.id === "antojo") {
        setIsAntExpense(true);
      }
    }
  }, [effectiveCategories, category]);

  useEffect(() => {
    if (effectiveAccounts.length > 0 && !effectiveAccounts.some((a) => a.id === account)) {
      setAccount(effectiveAccounts[0].id);
    }
  }, [effectiveAccounts, account]);

  // Task form state
  const [taskText, setTaskText] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<"normal" | "urgent" | "habit">("normal");


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

  const handleQuickSupplementOrHabit = (item: UserSupplement) => {
    const todayStr = getTodayDateStr();
    startTransition(async () => {
      if (item.id === "salad" || item.id === "dailySalad") {
        await toggleNutritionHabitAction(todayStr, "dailySalad");
      } else if (item.id === "clean_eating" || item.id === "noUltraProcessed") {
        await toggleNutritionHabitAction(todayStr, "noUltraProcessed");
      } else if (item.id === "b12" || item.id === "b12Weekly") {
        await toggleNutritionHabitAction(todayStr, "b12Weekly");
      }

      const res = await toggleSupplementAction(item.id);
      if (res.success) {
        setSuccessMessage(`✓ ${item.name} registrado ✨`);
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
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {effectiveCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategory(c.id);
                        if (c.isAntDefault || c.id === "antojo") {
                          setIsAntExpense(true);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer font-sans ${
                        category === c.id
                          ? "bg-[#221716] text-[#E05D52] border border-[#E05D52]/40"
                          : "bg-[#121110] text-[#8E867B] border border-[#2A2723] hover:text-[#DDD6C9]"
                      }`}
                    >
                      <FinanceIcon icon={c.icon || "tag"} className="h-3.5 w-3.5 shrink-0" />
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                        account === acc.id
                          ? "bg-[#221D16] text-[#D99B43] border border-[#D99B43]/40"
                          : "bg-[#121110] text-[#8E867B] border border-[#2A2723]"
                      }`}
                    >
                      <FinanceIcon
                        icon={acc.icon || (acc.type === "cash" ? "banknote" : "credit-card")}
                        className="h-3.5 w-3.5 shrink-0"
                      />
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "fruits" as const, name: "Fruta", icon: "🍎", color: "border-[#E05D52]/30 bg-[#221716] text-[#E05D52]" },
                    { key: "vegetables" as const, name: "Verdura", icon: "🥦", color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]" },
                    { key: "cereals" as const, name: "Cereal", icon: "🌾", color: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]" },
                    { key: "legumes" as const, name: "Legumbre/Tofu", icon: "🫘", color: "border-[#4EAB9E]/30 bg-[#162121] text-[#4EAB9E]" },
                    { key: "fats_seeds" as const, name: "Semillas/Grasa", icon: "🥑", color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]" },
                    { key: "leafy_greens" as const, name: "Hojas", icon: "🥬", color: "border-[#7EA35A]/30 bg-[#1C2219] text-[#7EA35A]" },
                    { key: "tubers" as const, name: "Tubérculo", icon: "🍠", color: "border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]" },
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#DDD6C9] font-serif">
                    Hábitos & Suplementos Diarios ({effectiveSupplements.length}):
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                  {effectiveSupplements.map((item) => {
                    const emoji = getSupplementEmoji(item.name, item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleQuickSupplementOrHabit(item)}
                        disabled={isPending}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#121110] border border-[#2A2723] hover:border-[#D99B43]/40 text-xs font-semibold text-[#DDD6C9] hover:text-[#F5F2EB] hover:bg-[#181715] transition-all text-left cursor-pointer active:scale-95 group"
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                          <span className="text-base shrink-0">{emoji}</span>
                          <div className="truncate">
                            <div className="text-xs font-bold truncate text-[#F5F2EB] group-hover:text-[#D99B43] transition-colors">
                              {item.name}
                            </div>
                            {item.dosage && (
                              <div className="text-[10px] text-[#8E867B] font-mono truncate">
                                {item.dosage} {item.timing ? `• ${item.timing}` : ""}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] font-mono font-bold text-[#D99B43] bg-[#221D16] border border-[#D99B43]/30 px-2 py-0.5 rounded-md">
                          +1
                        </span>
                      </button>
                    );
                  })}
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

        </div>
      </div>
    </div>
  );
}
