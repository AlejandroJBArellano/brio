"use client";

import {
  createFinanceAccountAction,
  createFinanceCategoryAction,
  deleteFinanceAccountAction,
  deleteFinanceCategoryAction,
  updateFinanceAccountAction,
  updateFinanceCategoryAction,
} from "@/app/actions/finance";
import { FinanceAccount, FinanceCategory } from "@/lib/types";
import {
  AlertCircle,
  Check,
  CreditCard,
  Edit2,
  Layers,
  Plus,
  Settings,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface ManageFinanceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  accounts: FinanceAccount[];
  onSuccess?: () => void;
}

const PRESET_ICONS = [
  "🍔", "☕", "🚗", "🏠", "💻", "💊", "🛍️", "💰",
  "🐾", "✈️", "📚", "🏋️", "🎮", "⚡", "🍿", "🎁",
  "👶", "🧹", "🎨", "🛠️", "🩺", "🎸", "🍣", "📱"
];

const ACCOUNT_TYPES = [
  { id: "credit", label: "Tarjeta de Crédito", icon: "💳" },
  { id: "debit", label: "Tarjeta de Débito", icon: "🏦" },
  { id: "cash", label: "Efectivo", icon: "💵" },
  { id: "bank", label: "Cuenta Bancaria / Ahorro", icon: "🏢" },
  { id: "other", label: "Otra / Billetera Digital", icon: "💼" },
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

  // Form states for Accounts
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accountType, setAccountType] = useState("credit");
  const [accountIcon, setAccountIcon] = useState("💳");

  // Form states for Categories
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("🏷️");
  const [categoryIsAnt, setCategoryIsAnt] = useState(false);
  const [categoryIsFixed, setCategoryIsFixed] = useState(false);

  if (!isOpen) return null;

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccountName("");
    setAccountId("");
    setAccountType("credit");
    setAccountIcon("💳");
    setError(null);
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryId("");
    setCategoryIcon("🏷️");
    setCategoryIsAnt(false);
    setCategoryIsFixed(false);
    setError(null);
  };

  const handleStartEditAccount = (acc: FinanceAccount) => {
    setEditingAccountId(acc.id);
    setAccountName(acc.name);
    setAccountId(acc.id);
    setAccountType(acc.type || "credit");
    setAccountIcon(acc.icon || "💳");
    setError(null);
  };

  const handleStartEditCategory = (cat: FinanceCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryId(cat.id);
    setCategoryIcon(cat.icon || "🏷️");
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
      if (onSuccess) onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-neutral-900/95 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-amber-600 font-bold text-neutral-950 shadow-md">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Catálogos de Brio Finanzas</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Personaliza tus cuentas, tarjetas y categorías de gastos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-3 border-b border-white/6 bg-neutral-950/20">
          <button
            type="button"
            onClick={() => {
              setActiveTab("accounts");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "accounts"
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Tarjetas & Cuentas ({accounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("categories");
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "categories"
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Categorías ({categories.length})</span>
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
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
              <div className="rounded-2xl border border-white/8 bg-neutral-950/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editingAccountId ? "Editar Tarjeta / Cuenta" : "Nueva Tarjeta o Cuenta"}</span>
                  </h3>
                  {editingAccountId && (
                    <button
                      type="button"
                      onClick={resetAccountForm}
                      className="text-[11px] text-neutral-400 hover:text-white underline"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveAccount} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
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
                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        ID / Atajo Rápido (@slug)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-500 text-xs">
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
                          className="w-full rounded-xl border border-white/10 bg-neutral-900 pl-7 pr-3 py-2 font-mono text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={accountType}
                        onChange={(e) => {
                          setAccountType(e.target.value);
                          if (e.target.value === "cash") setAccountIcon("💵");
                          else if (e.target.value === "debit" || e.target.value === "bank") setAccountIcon("🏦");
                          else setAccountIcon("💳");
                        }}
                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.icon} {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        Ícono Emoji
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={accountIcon}
                          onChange={(e) => setAccountIcon(e.target.value)}
                          className="w-14 text-center rounded-xl border border-white/10 bg-neutral-900 py-1.5 text-base text-white focus:border-amber-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5">
                          {["💳", "🏦", "💵", "🏢", "💼"].map((ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => setAccountIcon(ic)}
                              className={`p-1.5 rounded-lg text-sm transition-transform hover:scale-110 ${
                                accountIcon === ic ? "bg-white/20 scale-110" : "bg-white/5"
                              }`}
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingAccountId ? "Actualizar Tarjeta" : "Guardar Tarjeta"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of current accounts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Cuentas y Tarjetas Activas ({accounts.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-white/6 bg-neutral-950/60 hover:border-white/15 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{acc.icon || "💳"}</span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{acc.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                            <span className="font-mono text-indigo-400">@{acc.id}</span>
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
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
                          title="Editar cuenta"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
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
              <div className="rounded-2xl border border-white/8 bg-neutral-950/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editingCategoryId ? "Editar Categoría" : "Nueva Categoría"}</span>
                  </h3>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="text-[11px] text-neutral-400 hover:text-white underline"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveCategory} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
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
                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                        ID / Tag Rápido (#slug)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-500 text-xs">
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
                          className="w-full rounded-xl border border-white/10 bg-neutral-900 pl-7 pr-3 py-2 font-mono text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Icon presets */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                      Ícono Emoji
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-neutral-900/80 border border-white/6">
                      <input
                        type="text"
                        value={categoryIcon}
                        onChange={(e) => setCategoryIcon(e.target.value)}
                        className="w-12 text-center rounded-lg border border-white/10 bg-neutral-800 py-1 text-base text-white focus:outline-none mr-2"
                      />
                      {PRESET_ICONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setCategoryIcon(ic)}
                          className={`p-1.5 rounded-lg text-sm transition-transform hover:scale-125 ${
                            categoryIcon === ic ? "bg-amber-500/20 border border-amber-500/40 scale-110" : "hover:bg-white/10"
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkboxes: Ant Expense / Fixed Expense */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/6 bg-neutral-900/50 cursor-pointer hover:bg-neutral-900">
                      <input
                        type="checkbox"
                        checked={categoryIsAnt}
                        onChange={(e) => setCategoryIsAnt(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500/20"
                      />
                      <div>
                        <div className="text-xs font-semibold text-amber-300">Gasto Hormiga 🐜</div>
                        <div className="text-[10px] text-neutral-400">Marca gastos en esta categoría como antojos</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/6 bg-neutral-900/50 cursor-pointer hover:bg-neutral-900">
                      <input
                        type="checkbox"
                        checked={categoryIsFixed}
                        onChange={(e) => setCategoryIsFixed(e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500/20"
                      />
                      <div>
                        <div className="text-xs font-semibold text-indigo-300">Gasto Fijo Mensual 🏠</div>
                        <div className="text-[10px] text-neutral-400">Se contabiliza en el presupuesto fijo del mes</div>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{editingCategoryId ? "Actualizar Categoría" : "Guardar Categoría"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* List of current categories */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Categorías Activas ({categories.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-white/6 bg-neutral-950/60 hover:border-white/15 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{cat.icon || "🏷️"}</span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                            <span className="font-mono text-amber-400">#{cat.id}</span>
                            {cat.isAntDefault && (
                              <span className="rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[9px] font-bold">
                                Hormiga 🐜
                              </span>
                            )}
                            {cat.isFixed && (
                              <span className="rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.2 text-[9px] font-bold">
                                Fijo 🏠
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
                          title="Editar categoría"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
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
        <div className="flex items-center justify-between p-4 border-t border-white/8 bg-neutral-950/60 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">Brio Neon DB Storage</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
