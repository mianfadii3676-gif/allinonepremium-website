import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    const maxFileSize = 5 * 1024 * 1024;
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPEG, PNG, WebP, and AVIF images are allowed." },
        { status: 415 }
      );
    }
    if (file.size <= 0 || file.size > maxFileSize) {
      return NextResponse.json(
        { success: false, message: "Image must be greater than 0 bytes and no larger than 5 MB." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If Cloudinary is configured, upload to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "allinonepremium" }, (err, result) => {
            if (err || !result) reject(err);
            else resolve(result);
          })
          .end(buffer);
      });

      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
      });
    }

    // Local file storage fallback
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const extensionByType: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/avif": ".avif",
    };
    const ext = extensionByType[file.type];
    const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Image upload failed" },
      { status: 500 }
    );
  }
}
