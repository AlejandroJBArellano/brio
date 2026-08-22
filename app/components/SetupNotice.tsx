"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, ExternalLink, KeyRound, X } from "lucide-react";

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
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-neutral-950 p-4 backdrop-blur-md transition-all">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Demo / Preview Mode
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                In-Memory Store Active
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-300">
              Connect your live Habitica character by adding{" "}
              <code className="rounded bg-neutral-900/80 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">
                HABITICA_USER_ID
              </code>{" "}
              and{" "}
              <code className="rounded bg-neutral-900/80 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">
                HABITICA_API_KEY
              </code>{" "}
              to <span className="font-mono text-white">.env.local</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-neutral-400" />
                <span>Copy Template</span>
              </>
            )}
          </button>
          <a
            href="https://habitica.com/user/settings/api"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/30 hover:text-amber-200"
          >
            <span>Get API Keys</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
