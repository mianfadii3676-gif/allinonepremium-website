import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Notification, StoreSettings } from "@/lib/models";
import { NotificationType } from "@/types";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const submissionSchema = {
  name: 120,
  email: 254,
  phone: 40,
  subject: 160,
  message: 4000,
} as const;

export async function POST(request: NextRequest) {
  if (!rateLimit(`contact:${clientIp(request.headers)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: "Too many messages. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || Object.entries(submissionSchema).some(([field, max]) => typeof body[field] !== "string" || !(body[field] as string).trim() || (body[field] as string).length > max)) {
    return NextResponse.json({ success: false, message: "Please complete every field and keep each message within the allowed length." }, { status: 400 });
  }

  const name = (body.name as string).trim();
  const email = (body.email as string).trim().toLowerCase();
  const phone = (body.phone as string).trim();
  const subject = (body.subject as string).trim();
  const message = (body.message as string).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await dbConnect();
    const settings = await StoreSettings.findOne().lean();
    const socialLinks = settings?.socialLinks as { whatsapp?: string } | undefined;
    const whatsapp = (socialLinks?.whatsapp || settings?.contactPhone || "").replace(/\\D/g, "");
    const contactLine = whatsapp
      ? `From ${name} · ${email} · ${phone} · https://wa.me/${whatsapp}`
      : `From ${name} · ${email} · ${phone}`;
    await Notification.create({
      type: NotificationType.SYSTEM_ERROR,
      title: `Website enquiry: ${subject}`,
      message: `${contactLine}\n\n${message}`,
      link: "/admin/notifications",
    });
    return NextResponse.json({ success: true, message: "Your message has been sent to our support team." });
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return NextResponse.json({ success: false, message: "We could not send your message right now. Please try again or contact us directly." }, { status: 500 });
  }
}
