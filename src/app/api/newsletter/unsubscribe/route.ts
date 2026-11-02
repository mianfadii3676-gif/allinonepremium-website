import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import { Subscriber } from "@/lib/models";

const bodySchema = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid unsubscribe link." }, { status: 400 });
  }
  try {
    await dbConnect();
    const sub = await Subscriber.findOneAndUpdate(
      { unsubscribeToken: parsed.data.token },
      { status: "unsubscribed", unsubscribedAt: new Date() }
    );
    if (!sub) return NextResponse.json({ success: false, message: "This unsubscribe link is not valid." }, { status: 404 });
    return NextResponse.json({ success: true, message: "You have been unsubscribed." });
  } catch (err) {
    console.error("Unsubscribe failed:", err);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
