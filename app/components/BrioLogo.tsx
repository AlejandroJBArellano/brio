"use client";

import React from "react";

interface BrioLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

export function BrioLogo({
  size = "md",
  showWordmark = false,
  className = "",
}: BrioLogoProps) {
  const sizeMap = {
    xs: { box: "w-5 h-5", text: "text-xs", sub: "text-[9px]" },
    sm: { box: "w-7 h-7", text: "text-sm", sub: "text-[10px]" },
    md: { box: "w-8 h-8", text: "text-base", sub: "text-[11px]" },
    lg: { box: "w-10 h-10", text: "text-lg", sub: "text-xs" },
    xl: { box: "w-14 h-14", text: "text-2xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Archival Monogram Seal */}
      <div
        className={`relative ${currentSize.box} shrink-0 flex items-center justify-center rounded-md border border-[#3D3425] bg-[#1C1A17] text-[#D99B43]`}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-0.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Razor-Sharp Editorial Monogram B with Inlaid Momentum Spark */}
          {/* Main Serif Stem */}
          <rect x="10" y="8" width="3" height="24" rx="0.5" fill="#F5F2EB" />
          <path d="M 8 9 L 15 9 M 8 31 L 15 31" stroke="#F5F2EB" strokeWidth="1.2" strokeLinecap="square" />

          {/* Top Bow */}
          <path
            d="M 13 9.5 H 22 C 26 9.5 28.5 12 28.5 15.5 C 28.5 18.5 26.5 20.5 22.5 20.5 H 13"
            stroke="#D99B43"
            strokeWidth="2"
            strokeLinecap="square"
          />

          {/* Bottom Bow */}
          <path
            d="M 13 20.5 H 23.5 C 28 20.5 30.5 23 30.5 27 C 30.5 30.5 27.5 31.5 22.5 31.5 H 13"
            stroke="#D99B43"
            strokeWidth="2"
            strokeLinecap="square"
          />

          {/* Inlaid Precision Energy Spark (⚡) */}
          <path
            d="M 23 15 L 27 15 L 19 26 L 22 26 L 16 33 L 19 23 L 16 23 Z"
            fill="#F5F2EB"
            opacity="0.9"
          />

          {/* Fine Cardinal Corner Ticks */}
          <circle cx="4" cy="4" r="0.75" fill="#D99B43" opacity="0.6" />
          <circle cx="36" cy="4" r="0.75" fill="#D99B43" opacity="0.6" />
          <circle cx="4" cy="36" r="0.75" fill="#D99B43" opacity="0.6" />
          <circle cx="36" cy="36" r="0.75" fill="#D99B43" opacity="0.6" />
        </svg>
      </div>

      {/* Wordmark (if enabled) */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-serif font-bold text-[#F5F2EB] tracking-tight ${currentSize.text}`}>
              Brio
            </span>
            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#D99B43] bg-[#1C1A17] border border-[#38332D] rounded px-1 py-0.2">
              OS
            </span>
          </div>
          <span className={`font-mono text-[#8E867B] tracking-wide mt-0.5 ${currentSize.sub}`}>
            Archival Cockpit
          </span>
        </div>
      )}
    </div>
  );
}
