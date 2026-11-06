import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  createSessionToken,
  verifySessionToken,
  hasRole,
  canAccessStaffRoutes,
  canAccessGmRoutes,
  type Role,
  type UserSession,
} from "./jwt";

// Re-export for convenience
export {
  createSessionToken,
  verifySessionToken,
  hasRole,
  canAccessStaffRoutes,
  canAccessGmRoutes,
  type Role,
  type UserSession,
};

const prisma = new PrismaClient();

export interface AuthResult {
  success: boolean;
  user?: UserSession;
  token?: string;
  error?: string;
}

/**
 * Hashes a plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Authenticates user credentials against the database
 */
export async function authenticateUser(
  email: string,
  password: string,
  dbClient: PrismaClient = prisma
): Promise<AuthResult> {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const user = await dbClient.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: "Invalid email or password" };
  }

  const sessionPayload: UserSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };

  const token = await createSessionToken(sessionPayload);

  return {
    success: true,
    user: sessionPayload,
    token,
  };
}
