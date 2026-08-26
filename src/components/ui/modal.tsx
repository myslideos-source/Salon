"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-2xl bg-cream border border-border shadow-xl animate-rise max-h-[90vh] overflow-y-auto scroll-thin",
          widths[width]
        )}
      >
        {(title || subtitle) && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-cream px-6 py-4 rounded-t-2xl">
            <div>
              {title && <h2 className="font-display text-xl text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-soft hover:bg-sand hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
