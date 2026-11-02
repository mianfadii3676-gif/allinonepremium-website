"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnsubscribeClient({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!token) {
    return <p className="mt-4 text-ink-soft">This unsubscribe link is incomplete. Please use the link from one of our emails.</p>;
  }

  // Unsubscribing needs an explicit click so link scanners that prefetch URLs can't unsubscribe people.
  async function unsubscribe() {
    setState("loading");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setMessage(data.message);
      setState(res.ok ? "done" : "error");
    } catch {
      setMessage("Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="mt-6">
      {state === "done" ? (
        <p className="text-ink-soft">
          {message} <Link href="/" className="font-semibold text-gold-600 underline underline-offset-4">Back to the store</Link>
        </p>
      ) : (
        <>
          <p className="text-ink-soft">Stop receiving deals and new-arrival emails from Allinonepermium?</p>
          <button onClick={unsubscribe} disabled={state === "loading"} className="btn-ink mt-6 px-7 py-3 rounded-full font-semibold disabled:opacity-60">
            {state === "loading" ? "Unsubscribing…" : "Unsubscribe"}
          </button>
          {state === "error" && <p role="alert" className="mt-4 text-sm text-sale">{message}</p>}
        </>
      )}
    </div>
  );
}
