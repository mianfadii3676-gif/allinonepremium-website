import type { Metadata } from "next";
import UnsubscribeClient from "./UnsubscribeClient";

export const metadata: Metadata = {
  title: "Unsubscribe | Allinonepermium",
  robots: { index: false },
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <section className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-ink">Newsletter preferences</h1>
      <UnsubscribeClient token={token || ""} />
    </section>
  );
}
