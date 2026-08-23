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
          {/* Precision Rayito (Lightning Momentum Mark) */}
          {/* Left / Shaded Facet */}
          <path
            d="M 22.5 7 L 13.5 21 H 19 L 17 33 L 19.8 20 Z"
            fill="#D99B43"
          />

          {/* Right / Luminous Facet */}
          <path
            d="M 22.5 7 L 19.8 20 L 17 33 L 26.5 19 H 21 Z"
            fill="#F5F2EB"
          />

          {/* Center Spine Ridge */}
          <line
            x1="22.5"
            y1="7"
            x2="17"
            y2="33"
            stroke="#FFFDF7"
            strokeWidth="0.5"
            opacity="0.8"
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
