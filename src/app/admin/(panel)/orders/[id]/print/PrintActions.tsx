"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrintActions() {
  return (
    <div className="print:hidden mb-6 flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
      <Link
        href="/admin/orders"
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Orders</span>
      </Link>

      <button
        onClick={() => window.print()}
        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20"
      >
        <Printer className="h-4 w-4" />
        <span>Print Invoice / Packing Slip</span>
      </button>
    </div>
  );
}
