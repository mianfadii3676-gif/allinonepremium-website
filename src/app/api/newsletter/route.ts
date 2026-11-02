import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Subscriber } from "@/lib/models";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(`newsletter:${clientIp(req.headers)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Please enter a valid email address and accept the terms." }, { status: 400 });
  }

  try {
    await dbConnect();
    const { email } = parsed.data;
    const existing = await Subscriber.findOne({ email });

    if (existing?.status === "subscribed") {
      // Same response as a fresh signup so the endpoint can't be used to check who is subscribed.
      return NextResponse.json({ success: true, message: "Thanks! You're on the list." });
    }

    if (existing) {
      existing.status = "subscribed";
      existing.consentAt = new Date();
      existing.unsubscribedAt = undefined;
      await existing.save();
    } else {
      await Subscriber.create({ email, consentAt: new Date(), unsubscribeToken: randomBytes(24).toString("hex") });
    }

    return NextResponse.json({ success: true, message: "Thanks! You're on the list." });
  } catch (err) {
    // A concurrent duplicate signup hits the unique index; treat it as success.
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ success: true, message: "Thanks! You're on the list." });
    }
    console.error("Newsletter signup failed:", err);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
