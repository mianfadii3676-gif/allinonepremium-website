import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <div className="w-16 h-16 rounded-full bg-paper-deep flex items-center justify-center text-ink-faint mb-6">
        <Compass className="h-8 w-8" />
      </div>
      <p className="text-sm text-ink-faint">Page not found</p>
      <h1 className="font-display text-3xl sm:text-4xl text-ink mt-2">
        Off the map
      </h1>
      <p className="text-[15px] text-ink-faint max-w-sm mt-3 leading-relaxed">
        The link you followed may have expired, or the item moved to another shelf.
      </p>
      <Link
        href="/shop"
        className="btn-ink mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to the catalogue</span>
      </Link>
    </div>
  );
}
