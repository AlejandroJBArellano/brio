"use client";

import { loginOwnerAction } from "@/app/actions/auth";
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState, useTransition } from "react";

export function AuthGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor ingresa tu correo y contraseña");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await loginOwnerAction(email, password);
      if (!res.success) {
        setError(res.error || "Acceso denegado");
        return;
      }

      // Reload upon successful login
      window.location.reload();
    });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-neutral-950 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-linear-to-tr from-violet-600 to-indigo-500 text-white font-mono text-2xl font-bold shadow-2xl shadow-indigo-500/30">
            B
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Brio OS ⚡
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mx-auto">
            Sistema operativo personal y privado. Ingresa tus credenciales para desbloquear tu centro de comando.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-white/8 bg-neutral-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/6 mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Iniciar Sesión Personal
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300">
              Instancia Privada
            </span>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Correo Autorizado
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-neutral-950/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Contraseña / Clave de Acceso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-neutral-950/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 font-bold text-xs text-neutral-950 hover:brightness-110 shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isPending ? "Verificando acceso..." : "Desbloquear Brio OS"}
              </span>
              {!isPending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Security Badge Footer */}
          <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Registro público deshabilitado • Acceso exclusivo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
