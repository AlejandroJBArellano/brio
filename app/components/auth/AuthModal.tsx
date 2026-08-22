"use client";

import { loginOwnerAction, logoutOwnerAction } from "@/app/actions/auth";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await loginOwnerAction(email, password);
      if (!res.success) {
        setError(res.error || "Credenciales no autorizadas");
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
      window.location.reload();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Acceso Personal a Brio OS
              </h2>
              <p className="text-xs text-neutral-400">
                Instancia privada para el propietario
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Correo Autorizado
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                placeholder="arellanodev2021@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-xs text-neutral-950 hover:brightness-110 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isPending ? "Verificando..." : "Acceder a Brio"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
