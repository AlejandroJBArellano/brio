"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface UseResizableDrawerOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidthRatio?: number;
}

interface UseResizableDrawerReturn {
  width: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  resetWidth: () => void;
}

export function useResizableDrawer({
  storageKey,
  defaultWidth,
  minWidth = 420,
  maxWidthRatio = 0.92,
}: UseResizableDrawerOptions): UseResizableDrawerReturn {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === "undefined") return defaultWidth;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minWidth) {
          return parsed;
        }
      }
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
    return defaultWidth;
  });

  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef<number>(width);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  // Manejar arrastre continuo con el mouse
  useEffect(() => {
    if (!isResizing) return;

    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      const max = Math.min(
        window.innerWidth * maxWidthRatio,
        window.innerWidth - 48
      );
      const calculated = window.innerWidth - e.clientX;
      const clamped = Math.max(minWidth, Math.min(max, calculated));
      widthRef.current = clamped;
      setWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(storageKey, String(widthRef.current));
      } catch {
        // Ignorar fallos de guardado
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, storageKey, minWidth, maxWidthRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
    widthRef.current = defaultWidth;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignorar fallos de limpieza
    }
  }, [defaultWidth, storageKey]);

  return {
    width,
    isResizing,
    handleMouseDown,
    resetWidth,
  };
}

interface DrawerResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  isResizing: boolean;
}

export function DrawerResizeHandle({
  onMouseDown,
  onDoubleClick,
  isResizing,
}: DrawerResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar panel"
      title="Arrastra para cambiar ancho. Doble clic para reiniciar."
      className="hidden sm:flex absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize items-center justify-center group z-30 select-none"
    >
      <div
        className={`w-0.5 h-12 rounded-full transition-colors ${
          isResizing
            ? "bg-[#D99B43]"
            : "bg-[#3D3425] group-hover:bg-[#D99B43]/80"
        }`}
      />
    </div>
  );
}
