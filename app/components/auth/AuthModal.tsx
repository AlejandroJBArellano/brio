"use client";

import { loginOwnerAction } from "@/app/actions/auth";
import { BrioLogo } from "@/app/components/BrioLogo";
import {
  AlertCircle,
  Lock,
  Mail,
  Sparkles,
  X
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div
        className="w-full max-w-md rounded-xl border border-[#2A2723] bg-[#181715] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2723]">
          <div className="flex items-center gap-3">
            <BrioLogo size="md" />
            <div>
              <h2 className="font-serif text-base font-bold text-[#F5F2EB] tracking-tight">
                Acceso Personal a Brio OS
              </h2>
              <p className="text-xs text-[#8E867B]">
                Instancia privada para el propietario
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E867B] hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#E05D52]/30 bg-[#2A1715] p-3 text-xs text-[#E05D52] font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 font-mono">
          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
              Correo Autorizado
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-9 pr-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:border-[#D99B43] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans font-medium text-[#DDD6C9] mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E867B]" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2A2723] bg-[#121110] pl-9 pr-3 py-2 text-xs text-[#F5F2EB] placeholder:text-[#8E867B]/50 focus:border-[#D99B43] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-lg bg-[#D99B43] font-bold text-xs text-[#121110] hover:bg-[#E8AF59] shadow-xs disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
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
