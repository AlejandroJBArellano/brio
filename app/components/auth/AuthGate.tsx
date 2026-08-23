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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#121110] overflow-hidden font-sans">
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#221D16] border border-[#D99B43]/30 text-[#D99B43] font-serif text-3xl font-bold shadow-sm">
            B
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F2EB]">
            Brio OS
          </h1>
          <p className="text-xs sm:text-sm text-[#8E867B] max-w-sm mx-auto">
            Sistema operativo personal y privado. Ingresa tus credenciales para desbloquear tu centro de comando.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-[#2A2723] bg-[#181715] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2723] mb-6">
            <div className="flex items-center gap-2 font-mono">
              <ShieldCheck className="h-4 w-4 text-[#7EA35A]" />
              <h2 className="font-serif text-sm font-bold text-[#F5F2EB] tracking-tight">
                Iniciar Sesión Personal
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-[#D99B43]/30 bg-[#221D16] text-[#D99B43]">
              Instancia Privada
            </span>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-[#E05D52]/30 bg-[#2A1715] p-3.5 text-xs text-[#E05D52] font-mono animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Correo Autorizado
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-10 pr-3.5 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:border-[#D99B43] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1.5">
                Contraseña / Clave de Acceso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-10 pr-3.5 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:border-[#D99B43] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isPending ? "Verificando acceso..." : "Desbloquear Brio OS"}
              </span>
              {!isPending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Security Badge Footer */}
          <div className="mt-6 pt-4 border-t border-[#2A2723] flex items-center justify-center gap-2 text-[11px] text-[#8E867B] font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-[#7EA35A]" />
            <span>Registro público deshabilitado • Acceso exclusivo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
