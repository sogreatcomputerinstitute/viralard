"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

const noopSubscribe = () => () => {};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduce && panelRef.current && backdropRef.current) {
      gsap.fromTo(backdropRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      gsap.fromTo(
        panelRef.current,
        { autoAlpha: 0, y: 18, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.out" },
      );
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      <div
        ref={backdropRef}
        onClick={onClose}
        className="absolute inset-0 bg-void/85 backdrop-blur-md"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass-strong relative w-full ${width} max-h-[85vh] overflow-y-auto rounded-3xl p-6`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-ink-muted transition hover:border-accent/50 hover:text-ink"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 1 11 11M11 1 1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}