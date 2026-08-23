"use client";

import { Check, Copy, ExternalLink, KeyRound, X } from "lucide-react";
import { useState } from "react";

interface SetupNoticeProps {
  isConfigured: boolean;
}

export function SetupNotice({ isConfigured }: SetupNoticeProps) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isConfigured || dismissed) return null;

  const envTemplate = `# Add to .env.local
HABITICA_USER_ID=your-user-id-here
HABITICA_API_KEY=your-api-token-here`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#3D3425] bg-[#181715] p-4 transition-all">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#221D16] text-[#D99B43] border border-[#D99B43]/30">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D99B43] font-mono">
                Modo Demo / Preview
              </span>
              <span className="inline-flex items-center rounded bg-[#221D16] px-2 py-0.5 text-[10px] font-mono text-[#E8AF59] border border-[#D99B43]/20">
                In-Memory Store Activo
              </span>
            </div>
            <p className="mt-1 text-xs text-[#DDD6C9]">
              Conecta tu personaje real de Habitica añadiendo{" "}
              <code className="rounded bg-[#121110] border border-[#2A2723] px-1.5 py-0.5 font-mono text-[11px] text-[#D99B43]">
                HABITICA_USER_ID
              </code>{" "}
              y{" "}
              <code className="rounded bg-[#121110] border border-[#2A2723] px-1.5 py-0.5 font-mono text-[11px] text-[#D99B43]">
                HABITICA_API_KEY
              </code>{" "}
              a <span className="font-mono text-[#F5F2EB]">.env.local</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center font-mono">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-[#2A2723] bg-[#121110] px-2.5 py-1.5 text-xs font-medium text-[#DDD6C9] transition-colors hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#7EA35A]" />
                <span className="text-[#7EA35A]">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#8E867B]" />
                <span>Copiar Plantilla</span>
              </>
            )}
          </button>
          <a
            href="https://habitica.com/user/settings/api"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[#221D16] border border-[#D99B43]/30 px-2.5 py-1.5 text-xs font-medium text-[#D99B43] transition-colors hover:bg-[#3D3425] hover:text-[#E8AF59]"
          >
            <span>Obtener API Keys</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar banner"
            className="rounded-lg p-1.5 text-[#8E867B] transition-colors hover:bg-[#22201D] hover:text-[#F5F2EB] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
