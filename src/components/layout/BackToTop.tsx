"use client";

import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:text-navy-950 hover:bg-gold-300 hover:border-gold-300 transition"
    >
      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> Back to top
    </button>
  );
}
