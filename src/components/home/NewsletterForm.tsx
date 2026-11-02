"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setMessage("Please agree to receive emails from us.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent: true }),
      });
      const data = await res.json();
      setStatus(res.ok ? "success" : "error");
      setMessage(data.message);
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <div className="flex items-center gap-1.5 rounded-[var(--radius-btn)] bg-white p-1">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          aria-invalid={status === "error"}
          aria-describedby="newsletter-msg"
          className="flex-1 min-w-0 bg-transparent px-4 text-[14px] text-ink placeholder-ink-faint focus:outline-none"
        />
        <button type="submit" disabled={status === "loading"} className="btn-gold shrink-0 px-5 sm:px-6 h-10 text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-70">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          Subscribe
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-[12px] text-white/65 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-navy-700" />
        <span>
          I agree to receive marketing emails. Unsubscribe anytime. See our{" "}
          <Link href="/policies#privacy" className="underline underline-offset-2 hover:text-white">privacy policy</Link>.
        </span>
      </label>
      <p id="newsletter-msg" role="status" className={`mt-2 text-[13px] min-h-5 ${status === "error" ? "text-red-300" : "text-gold-200"}`}>
        {status === "success" || status === "error" ? message : ""}
      </p>
    </form>
  );
}
