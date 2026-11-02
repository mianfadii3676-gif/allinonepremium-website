"use client";

import { useToast } from "@/lib/store/toastStore";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon =
            t.type === "success"
              ? CheckCircle2
              : t.type === "error"
              ? AlertCircle
              : t.type === "warning"
              ? AlertTriangle
              : Info;

          const accent =
            t.type === "success"
              ? "text-ink"
              : t.type === "error"
              ? "text-red-700"
              : t.type === "warning"
              ? "text-navy-700"
              : "text-ink";

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border border-line bg-white shadow-xl"
              role="status"
            >
              <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${accent}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.message && <p className="text-[13px] text-ink-soft mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-ink-faint hover:text-ink transition p-0.5"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
