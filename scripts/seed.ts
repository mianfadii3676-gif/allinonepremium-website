import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import dbConnect from "../src/lib/db";
import { ensureInitialSeed } from "../src/lib/db/seedHelper";

async function main() {
  console.log("🌱 Starting database seed script...");
  await dbConnect();
  await ensureInitialSeed();
  console.log("✨ Database seed completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
