"use client";

import { useRef } from "react";

const TILT_ON = false;

/**
 * Pointer-driven 3D tilt. Children can opt into depth with `[transform:translateZ(..)]`.
 * Pure CSS transforms (no WebGL); skipped for touch input and reduced-motion users.
 */
export default function Tilt3D({
  children,
  className = "",
  max = 8,
  glare = false,
  wrapperClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  max?: number;
  glare?: boolean;
  /** Classes for the outer perspective wrapper (e.g. grid placement). */
  wrapperClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const enabled = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    // Tilt is off store-wide: a flat, steady layout reads as more trustworthy than moving cards.
    if (!TILT_ON || !enabled() || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
      el.style.setProperty("--go", "1");
    });
  }

  function onLeave() {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--go", "0");
  }

  return (
    <div className={`[perspective:1200px] ${wrapperClassName}`}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`tilt-3d relative ${className}`}
      >
        {children}
        {glare && <span aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0 rounded-[inherit] z-20" />}
      </div>
    </div>
  );
}
