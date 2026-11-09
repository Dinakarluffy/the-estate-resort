import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

declare global {
  var globalPrisma: PrismaClient | undefined;
}

function getDatabaseUrl(): string | undefined {
  // When running on Vercel or any serverless runtime where root is read-only
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "estate.db");

    // Copy seed.db to /tmp if not already present
    if (!fs.existsSync(tmpDbPath)) {
      const candidatePaths = [
        path.join(process.cwd(), "prisma", "seed.db"),
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(__dirname, "prisma", "seed.db"),
        path.join(__dirname, "..", "prisma", "seed.db"),
      ];

      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath);
            break;
          } catch (e) {
            console.error(`[Vercel DB Init] Error copying from ${p}:`, e);
          }
        }
      }
    }

    return `file:${tmpDbPath}`;
  }

  // Fallback for local development
  return process.env.DATABASE_URL || "file:./dev.db";
}

export function getPrismaClient(): PrismaClient {
  if (global.globalPrisma) {
    return global.globalPrisma;
  }

  const dbUrl = getDatabaseUrl();
  const client = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  if (process.env.NODE_ENV !== "production") {
    global.globalPrisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
export default prisma;
