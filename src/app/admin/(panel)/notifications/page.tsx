import dbConnect from "@/lib/db";
import { Notification } from "@/lib/models";
import NotificationsClient from "./NotificationsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification Center | allinonepermium Admin",
};

export const revalidate = 0;

export default async function AdminNotificationsPage() {
  await dbConnect();
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();

  return <NotificationsClient initialNotifications={JSON.parse(JSON.stringify(notifications))} />;
}
