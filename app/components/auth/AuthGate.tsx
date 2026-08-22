"use client";

import { signIn, signUp } from "@/lib/auth-client";
import {
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User
} from "lucide-react";
import { useState, useTransition } from "react";

export function AuthGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        if (mode === "signup") {
          const res = await signUp.email({
            email: email.trim(),
            password: password.trim(),
            name: name.trim(),
          });

          if (res.error) {
            setError(res.error.message || "Error al registrar cuenta");
            return;
          }
        } else {
          const res = await signIn.email({
            email: email.trim(),
            password: password.trim(),
          });

          if (res.error) {
            setError(res.error.message || "Credenciales incorrectas o usuario no registrado");
            return;
          }
        }

        // Force page reload to load user dashboard session
        window.location.reload();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error de autenticación");
      }
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
            Sistema operativo personal de alta fidelidad. Inicia sesión para acceder a tu centro de comando.
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-white/8 bg-neutral-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-neutral-950/80 border border-white/6 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${mode === "signin"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-neutral-400 hover:text-white"
                }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${mode === "signup"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-neutral-400 hover:text-white"
                }`}
            >
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Alejandro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={mode === "signup"}
                    className="w-full rounded-xl border border-white/1 bg-neutral-950/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Correo Electrónico
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
                Contraseña
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
                {isPending
                  ? "Verificando credenciales..."
                  : mode === "signin"
                    ? "Entrar a Brio OS"
                    : "Registrar Cuenta en Neon"}
              </span>
              {!isPending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Security Badge Footer */}
          <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-center gap-2 text-[11px] text-neutral-500 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Neon Auth • Sesión Encriptada Serverless</span>
          </div>
        </div>
      </div>
    </div>
  );
}
