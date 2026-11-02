import bcrypt from "bcryptjs";
import { AdminUser } from "@/lib/models";
import dbConnect from "@/lib/db";
import { AdminRole } from "@/types";
import { rateLimit } from "@/lib/rateLimit";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

/** Accepts either the admin username or email address. */
export async function verifyAdminCredentials(
  identifier: string,
  password: string
): Promise<{ id: string; email: string; name: string; role: AdminRole } | null> {
  const login = identifier.trim().toLowerCase();
  // Slow down password guessing: 8 attempts per login name per 15 minutes.
  if (!login || !rateLimit(`admin-login:${login}`, 8, 15 * 60 * 1000)) {
    return null;
  }
  await dbConnect();
  const user = await AdminUser.findOne({
    $or: [{ username: login }, { email: login }],
    isActive: true,
  }).select("+password");

  if (!user || !user.password) {
    return null;
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
