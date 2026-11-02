import mongoose from "mongoose";
import dns from "dns";
import { ensureInitialSeed } from "./seedHelper";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  mongoServer?: any;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

global._mongooseCache = cached;

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      let connection: typeof mongoose;
      const uri = process.env.MONGODB_URI;
      const options: mongoose.ConnectOptions = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 4000,
      };

      const startMemoryServer = async () => {
        if (!cached.mongoServer) {
          const { MongoMemoryServer } = await import("mongodb-memory-server");
          cached.mongoServer = await MongoMemoryServer.create({
            instance: { dbName: "allinonepremium" },
          });
        }
        return cached.mongoServer.getUri("allinonepremium");
      };

      if (!uri || uri.includes("<username>") || uri.includes("<cluster>") || uri.trim() === "") {
        const memUri = await startMemoryServer();
        connection = await mongoose.connect(memUri, options);
        console.log(`🔌 Connected to local in-memory MongoDB: ${memUri}`);
      } else {
        try {
          if (uri.startsWith("mongodb+srv://")) {
            try {
              dns.setServers(["8.8.8.8", "1.1.1.1"]);
            } catch {}
          }
          connection = await mongoose.connect(uri, options);
          console.log("✅ MongoDB Atlas connected successfully");
        } catch (err: any) {
          // Never fall back to a throwaway database in live production runtime: orders written there would be lost on restart.
          // Allow fallback during `next build` prerendering if the build machine's IP is not on the Atlas whitelist.
          const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build";
          if (process.env.NODE_ENV === "production" && !isBuildPhase && process.env.ALLOW_FALLBACK_DB !== "true") {
            throw new Error(`MongoDB connection failed: ${err.message}`);
          }
          console.warn(`⚠️ Atlas connection failed (${err.message}). Using local MongoMemoryServer fallback...`);
          const memUri = await startMemoryServer();
          connection = await mongoose.connect(memUri, { bufferCommands: false, maxPoolSize: 10 });
          console.log(`🔌 Connected to local fallback MongoDB instance: ${memUri}`);
        }
      }

      // Seeding writes demo data, so it only runs automatically outside production unless explicitly enabled.
      const autoSeed = process.env.AUTO_SEED === "true" || process.env.NODE_ENV !== "production";
      try {
        if (autoSeed) await ensureInitialSeed();
      } catch (seedErr) {
        console.error("Auto-seed error:", seedErr);
      }

      return connection;
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
