"use client";

import { useEffect, useRef } from "react";

/**
 * Lifts content into place with a short 3D rotate when it scrolls into view.
 * Content is visible without JavaScript; reduced-motion users get no animation (see globals.css).
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    // Anything already on screen at load stays put; only content below the fold animates in.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.reveal = "pending";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "shown";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal-3d ${className}`} style={{ transitionDelay: delay ? `${delay}ms` : undefined }}>
      {children}
    </Tag>
  );
}
