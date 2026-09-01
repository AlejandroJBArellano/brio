"use client";

import {
  createFinanceAccountAction,
  createFinanceCategoryAction,
  deleteFinanceAccountAction,
  deleteFinanceCategoryAction,
  fetchFinanceCatalogAction,
  updateFinanceAccountAction,
  updateFinanceCategoryAction,
} from "@/app/actions/finance";
import {
  FinanceIcon,
  LUCIDE_ACCOUNT_ICONS,
  LUCIDE_CATEGORY_ICONS,
} from "@/app/components/finance/FinanceIcon";
import {
  DEFAULT_FINANCE_ACCOUNTS,
  DEFAULT_FINANCE_CATEGORIES,
  FinanceAccount,
  FinanceCategory,
} from "@/lib/types";
import {
  AlertCircle,
  Check,
  Coffee,
  CreditCard,
  Edit2,
  Home,
  Layers,
  Plus,
  Settings,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface ManageFinanceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: FinanceCategory[];
  accounts?: FinanceAccount[];
  onSuccess?: () => void;
}

const ACCOUNT_TYPES = [
  { id: "credit", label: "Tarjeta de Crédito", defaultIcon: "credit-card" },
  { id: "debit", label: "Tarjeta de Débito", defaultIcon: "landmark" },
  { id: "cash", label: "Efectivo", defaultIcon: "banknote" },
  { id: "bank", label: "Cuenta Bancaria / Ahorro", defaultIcon: "building-2" },
  { id: "other", label: "Otra / Billetera Digital", defaultIcon: "wallet" },
];

export function ManageFinanceCatalogModal({
  isOpen,
  onClose,
  categories = [],
  accounts = [],
  onSuccess,
}: ManageFinanceCatalogModalProps) {
  const [activeTab, setActiveTab] = useState<"accounts" | "categories">("accounts");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [dbCategories, setDbCategories] = useState<FinanceCategory[]>(categories);
  const [dbAccounts, setDbAccounts] = useState<FinanceAccount[]>(accounts);

  const reloadCatalog = async () => {
    try {
      const catalog = await fetchFinanceCatalogAction();
      if (catalog.categories && catalog.categories.length > 0) {
        setDbCategories(catalog.categories);
      }
      if (catalog.accounts && catalog.accounts.length > 0) {
        setDbAccounts(catalog.accounts);
      }
    } catch (err) {
      console.error("[ManageFinanceCatalogModal] Failed to reload catalog:", err);
    }
  };

  useEffect(() => {
    if (categories.length > 0) setDbCategories(categories);
    if (accounts.length > 0) setDbAccounts(accounts);

    if (isOpen && (categories.length === 0 || accounts.length === 0)) {
      reloadCatalog();
    }
  }, [isOpen, categories, accounts]);

  const effectiveCategories =
    dbCategories.length > 0 ? dbCategories : DEFAULT_FINANCE_CATEGORIES;
  const effectiveAccounts =
    dbAccounts.length > 0 ? dbAccounts : DEFAULT_FINANCE_ACCOUNTS;

  // Form states for Accounts
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accountType, setAccountType] = useState("credit");
  const [accountIcon, setAccountIcon] = useState("credit-card");

  // Form states for Categories
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("tag");
  const [categoryIsAnt, setCategoryIsAnt] = useState(false);
  const [categoryIsFixed, setCategoryIsFixed] = useState(false);

  if (!isOpen) return null;

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccountName("");
    setAccountId("");
    setAccountType("credit");
    setAccountIcon("credit-card");
    setError(null);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryId("");
    setCategoryIcon("tag");
    setCategoryIsAnt(false);
    setCategoryIsFixed(false);
    setError(null);
  };

  const handleStartEditAccount = (acc: FinanceAccount) => {
    setEditingAccountId(acc.id);
    setAccountName(acc.name);
    setAccountId(acc.id);
    setAccountType(acc.type || "credit");
    setAccountIcon(acc.icon || "credit-card");
    setError(null);
  };

  const handleStartEditCategory = (cat: FinanceCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryId(cat.id);
    setCategoryIcon(cat.icon || "tag");
    setCategoryIsAnt(Boolean(cat.isAntDefault));
    setCategoryIsFixed(Boolean(cat.isFixed));
    setError(null);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setError("El nombre de la cuenta/tarjeta es requerido");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (editingAccountId) {
        const res = await updateFinanceAccountAction(editingAccountId, {
          name: accountName.trim(),
          type: accountType,
          icon: accountIcon,
        });
        if (!res.success) {
          setError(res.error || "No se pudo actualizar la cuenta");
          return;
        }
      } else {
        const res = await createFinanceAccountAction({
          id: accountId.trim() || undefined,
          name: accountName.trim(),
          type: accountType,
          icon: accountIcon,
        });
        if (!res.success) {
          setError(res.error || "No se pudo crear la cuenta");
          return;
        }
      }

      resetAccountForm();
      await reloadCatalog();
      if (onSuccess) onSuccess();
    });
  };

  const handleDeleteAccount = (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta cuenta/tarjeta?")) return;
    startTransition(async () => {
      const res = await deleteFinanceAccountAction(id);
      if (!res.success) {
        setError(res.error || "No se pudo eliminar la cuenta");
        return;
      }
      if (editingAccountId === id) resetAccountForm();
      await reloadCatalog();
      if (onSuccess) onSuccess();
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError("El nombre de la categoría es requerido");
      return;
    }

    setError(null);
    startTransition(async () => {
      if (editingCategoryId) {
        const res = await updateFinanceCategoryAction(editingCategoryId, {
          name: categoryName.trim(),
          icon: categoryIcon,
          isAntDefault: categoryIsAnt,
          isFixed: categoryIsFixed,
        });
        if (!res.success) {
          setError(res.error || "No se pudo actualizar la categoría");
          return;
        }
      } else {
        const res = await createFinanceCategoryAction({
          id: categoryId.trim() || undefined,
          name: categoryName.trim(),
          icon: categoryIcon,
          isAntDefault: categoryIsAnt,
          isFixed: categoryIsFixed,
        });
        if (!res.success) {
          setError(res.error || "No se pudo crear la categoría");
          return;
        }
      }

      resetCategoryForm();
      await reloadCatalog();
      if (onSuccess) onSuccess();
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    startTransition(async () => {
      const res = await deleteFinanceCategoryAction(id);
      if (!res.success) {
        setError(res.error || "No se pudo eliminar la categoría");
        return;
      }
      if (editingCategoryId === id) resetCategoryForm();
      await reloadCatalog();
      if (onSuccess) onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-xl border border-[#2A2723] bg-[#181715] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2723] bg-[#121110]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] font-bold shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight flex items-center gap-2">
                <span>Catálogos de Brio Finanzas</span>
              </h2>
              <p className="text-xs text-[#8E867B]">
                Personaliza tus cuentas, tarjetas y categorías de gastos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-3 border-b border-[#2A2723] bg-[#121110]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("accounts");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "accounts"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Tarjetas & Cuentas ({effectiveAccounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("categories");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-[#D99B43] text-[#121110] font-bold shadow-xs"
                : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Categorías ({effectiveCategories.length})</span>
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-[#E05D52]/40 bg-[#221716] p-3 text-xs text-[#E05D52] font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: ACCOUNTS & CARDS */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              {/* Add / Edit Form */}
              <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#D99B43] flex items-center gap-1.5 font-mono">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editingAccountId ? "Editar Tarjeta / Cuenta" : "Nueva Tarjeta o Cuenta"}</span>
                  </h3>
                  {editingAccountId && (
                    <button
                      type="button"
                      onClick={resetAccountForm}
                      className="text-[11px] text-[#8E867B] hover:text-[#DDD6C9] underline cursor-pointer"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-sans font-medium text-[#DDD6C9] mb-1">
                        Nombre de la tarjeta / cuenta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Tarjeta Nu, BBVA Débito, AMEX..."
                        value={accountName}
                        onChange={(e) => {
                          setAccountName(e.target.value);
                          if (!editingAccountId && !accountId) {
                            setAccountId(
                              e.target.value
                                .toLowerCase()
                                .trim()
                                .replace(/[^a-z0-9]+/g, "-")
                            );
                          }
                        }}
                        required
                        className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans font-medium text-[#DDD6C9] mb-1">
                        ID / Atajo Rápido (@slug)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#8E867B] text-xs">
                          @
                        </span>
                        <input
                          type="text"
                          placeholder="nu, bbva, amex, efectivo..."
                          value={accountId}
                          disabled={Boolean(editingAccountId)}
                          onChange={(e) =>
                            setAccountId(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-_]/g, "")
                            )
                          }
                          className="w-full rounded-lg border border-[#2A2723] bg-[#181715] pl-7 pr-3 py-2 font-mono text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-sans font-medium text-[#DDD6C9] mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={accountType}
                        onChange={(e) => {
                          const selectedType = e.target.value;
                          setAccountType(selectedType);
                          const matching = ACCOUNT_TYPES.find((t) => t.id === selectedType);
                          if (matching) setAccountIcon(matching.defaultIcon);
                        }}
                        className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-2 text-xs text-[#F5F2EB] focus:border-[#D99B43] focus:outline-none"
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t.id} value={t.id} className="bg-[#181715] text-[#F5F2EB]">
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans font-medium text-[#DDD6C9] mb-1">
                        Ícono (Lucide)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#D99B43]/40 bg-[#221D16] text-[#D99B43]">
                          <FinanceIcon icon={accountIcon} className="h-4 w-4" />
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {LUCIDE_ACCOUNT_ICONS.map((ic) => {
                            const IconComponent = ic.icon;
                            const isSelected = accountIcon === ic.id;
                            return (
                              <button
                                key={ic.id}
                                type="button"
                                onClick={() => setAccountIcon(ic.id)}
                                title={ic.label}
                                className={`flex size-7.5 items-center justify-center rounded-md transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#221D16] border border-[#D99B43] text-[#D99B43] scale-105 shadow-xs"
                                    : "bg-[#181715] border border-[#2A2723] text-[#8E867B] hover:text-[#F5F2EB] hover:border-[#38332D]"
                                }`}
                              >
                                <IconComponent className="h-3.5 w-3.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingAccountId ? "Actualizar Tarjeta" : "Guardar Tarjeta"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of current accounts */}
              <div className="space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs text-[#8E867B] px-1">
                  <span>Cuentas y Tarjetas Activas ({effectiveAccounts.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {effectiveAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#2A2723] bg-[#121110] hover:border-[#38332D] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#2A2723] bg-[#181715] text-[#D99B43]">
                          <FinanceIcon icon={acc.icon || "credit-card"} className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#F5F2EB] flex items-center gap-1.5">
                            <span>{acc.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8E867B] mt-0.5">
                            <span className="font-mono text-[#D99B43]">@{acc.id}</span>
                            <span>•</span>
                            <span className="capitalize">
                              {ACCOUNT_TYPES.find((t) => t.id === acc.type)?.label || acc.type || "Cuenta"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditAccount(acc)}
                          className="p-1.5 rounded-md text-[#8E867B] hover:text-[#D99B43] hover:bg-[#181715] transition-colors cursor-pointer"
                          title="Editar cuenta"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-md text-[#8E867B] hover:text-[#E05D52] hover:bg-[#221716] transition-colors cursor-pointer"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              {/* Add / Edit Category Form */}
              <div className="rounded-xl border border-[#2A2723] bg-[#121110] p-4 space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#D99B43] flex items-center gap-1.5 font-mono">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editingCategoryId ? "Editar Categoría" : "Nueva Categoría"}</span>
                  </h3>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="text-[11px] text-[#8E867B] hover:text-[#DDD6C9] underline cursor-pointer"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-sans font-medium text-[#DDD6C9] mb-1">
                        Nombre de la Categoría
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Mascotas, Viajes, Educación..."
                        value={categoryName}
                        onChange={(e) => {
                          setCategoryName(e.target.value);
                          if (!editingCategoryId && !categoryId) {
                            setCategoryId(
                              e.target.value
                                .toLowerCase()
                                .trim()
                                .replace(/[^a-z0-9]+/g, "-")
                            );
                          }
                        }}
                        required
                        className="w-full rounded-lg border border-[#2A2723] bg-[#181715] px-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-sans font-medium text-[#DDD6C9] mb-1">
                        ID / Tag Rápido (#slug)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#8E867B] text-xs">
                          #
                        </span>
                        <input
                          type="text"
                          placeholder="mascotas, viajes, educacion..."
                          value={categoryId}
                          disabled={Boolean(editingCategoryId)}
                          onChange={(e) =>
                            setCategoryId(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-_]/g, "")
                            )
                          }
                          className="w-full rounded-lg border border-[#2A2723] bg-[#181715] pl-7 pr-3 py-2 font-mono text-xs text-[#F5F2EB] placeholder:text-[#8E867B] focus:border-[#D99B43] focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Icon presets */}
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-[#DDD6C9] mb-1">
                      Ícono (Lucide)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#D99B43]/40 bg-[#221D16] text-[#D99B43]">
                        <FinanceIcon icon={categoryIcon} className="h-4 w-4" />
                      </div>
                      <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg bg-[#181715] border border-[#2A2723] max-h-32 overflow-y-auto">
                        {LUCIDE_CATEGORY_ICONS.map((ic) => {
                          const IconComponent = ic.icon;
                          const isSelected = categoryIcon === ic.id;
                          return (
                            <button
                              key={ic.id}
                              type="button"
                              onClick={() => setCategoryIcon(ic.id)}
                              title={ic.label}
                              className={`flex size-7.5 items-center justify-center rounded-md transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#221D16] border border-[#D99B43] text-[#D99B43] scale-105 shadow-xs"
                                  : "bg-[#121110] border border-[#2A2723] text-[#8E867B] hover:text-[#F5F2EB] hover:border-[#38332D]"
                              }`}
                            >
                              <IconComponent className="h-3.5 w-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Checkboxes: Ant Expense / Fixed Expense */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#2A2723] bg-[#181715] cursor-pointer hover:bg-[#22201D]">
                      <input
                        type="checkbox"
                        checked={categoryIsAnt}
                        onChange={(e) => setCategoryIsAnt(e.target.checked)}
                        className="h-4 w-4 rounded border-[#2A2723] bg-[#121110] text-[#D99B43] focus:ring-[#D99B43]/20 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#D99B43] flex items-center gap-1.5">
                          <Coffee className="h-3.5 w-3.5" />
                          <span>Gasto Hormiga (Antojo)</span>
                        </div>
                        <div className="text-[10px] text-[#8E867B]">Descuenta del límite diario de gustitos</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#2A2723] bg-[#181715] cursor-pointer hover:bg-[#22201D]">
                      <input
                        type="checkbox"
                        checked={categoryIsFixed}
                        onChange={(e) => setCategoryIsFixed(e.target.checked)}
                        className="h-4 w-4 rounded border-[#2A2723] bg-[#121110] text-[#4EAB9E] focus:ring-[#4EAB9E]/20 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-semibold text-[#4EAB9E] flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5" />
                          <span>Gasto Fijo Mensual</span>
                        </div>
                        <div className="text-[10px] text-[#8E867B]">Se contabiliza en el presupuesto fijo del mes</div>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-lg bg-[#D99B43] hover:bg-[#E8AF59] text-[#121110] font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingCategoryId ? "Actualizar Categoría" : "Guardar Categoría"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of current categories */}
              <div className="space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs text-[#8E867B] px-1">
                  <span>Categorías Activas ({effectiveCategories.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {effectiveCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#2A2723] bg-[#121110] hover:border-[#38332D] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#2A2723] bg-[#181715] text-[#D99B43]">
                          <FinanceIcon icon={cat.icon || "tag"} className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#F5F2EB] flex items-center gap-1.5">
                            <span>{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8E867B] mt-0.5">
                            <span className="font-mono text-[#D99B43]">#{cat.id}</span>
                            {cat.isAntDefault && (
                              <span className="rounded bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] px-1.5 py-0.2 text-[9px] font-bold flex items-center gap-1">
                                <Coffee className="size-2.5" />
                                <span>Hormiga</span>
                              </span>
                            )}
                            {cat.isFixed && (
                              <span className="rounded bg-[#162121] border border-[#4EAB9E]/30 text-[#4EAB9E] px-1.5 py-0.2 text-[9px] font-bold flex items-center gap-1">
                                <Home className="size-2.5" />
                                <span>Fijo</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="p-1.5 rounded-md text-[#8E867B] hover:text-[#D99B43] hover:bg-[#181715] transition-colors cursor-pointer"
                          title="Editar categoría"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-md text-[#8E867B] hover:text-[#E05D52] hover:bg-[#221716] transition-colors cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#2A2723] bg-[#121110] text-xs text-[#8E867B] font-mono">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#D99B43]" />
            <span className="text-[11px]">Brio Neon DB Storage</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#181715] hover:bg-[#22201D] text-[#DDD6C9] hover:text-[#F5F2EB] text-xs font-semibold transition-colors cursor-pointer border border-[#2A2723]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
