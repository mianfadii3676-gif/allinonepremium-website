import type { Metadata } from "next";
import ManualOrderClient from "./ManualOrderClient";

export const metadata: Metadata = { title: "New manual order" };

export default function NewManualOrderPage() {
  return <ManualOrderClient />;
}
