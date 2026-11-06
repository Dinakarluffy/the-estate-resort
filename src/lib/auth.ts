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

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
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
 * Registers a new Guest user in the database
 */
export async function registerUser(
  input: RegisterInput,
  dbClient: PrismaClient = prisma
): Promise<AuthResult> {
  const normalizedEmail = input.email?.trim().toLowerCase();
  const name = input.name?.trim();
  const password = input.password;

  if (!name || name.length < 2) {
    return { success: false, error: "Please enter your full name (minimum 2 characters)" };
  }
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address" };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long" };
  }

  // Check if user already exists
  const existingUser = await dbClient.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await hashPassword(password);

  const newUser = await dbClient.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      role: "GUEST",
      phone: input.phone?.trim() || null,
    },
  });

  const sessionPayload: UserSession = {
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: "GUEST",
  };

  const token = await createSessionToken(sessionPayload);

  return {
    success: true,
    user: sessionPayload,
    token,
  };
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

/**
 * Lists all registered users for GM administration (passwords excluded)
 */
export async function getAllUsers(dbClient: PrismaClient = prisma) {
  return dbClient.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Updates a user's role (Promote / Demote)
 * Safety guards:
 * 1. An admin cannot demote their own active GM account.
 * 2. A GM cannot demote a fellow GM (Peer GM protection - requires Resort Owner).
 */
export async function updateUserRole(
  adminUserId: string,
  targetUserId: string,
  newRole: Role,
  dbClient: PrismaClient = prisma
): Promise<{ success: boolean; user?: any; error?: string }> {
  const validRoles: Role[] = ["GUEST", "STAFF", "GM"];
  if (!validRoles.includes(newRole)) {
    return { success: false, error: "Invalid role specified" };
  }

  if (adminUserId === targetUserId && newRole !== "GM") {
    return { success: false, error: "Security restriction: You cannot demote your own account from General Manager" };
  }

  const targetUser = await dbClient.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  // Peer GM protection: Cannot demote a fellow GM
  if (targetUser.role === "GM" && newRole !== "GM") {
    return {
      success: false,
      error: "Security restriction: A General Manager cannot demote another General Manager. Executive-level changes require Resort Owner authorization.",
    };
  }

  const updated = await dbClient.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      createdAt: true,
    },
  });

  return { success: true, user: updated };
}

/**
 * Deletes a user account
 * Safety guards:
 * 1. An admin cannot delete their own active account.
 * 2. A GM cannot delete a fellow GM (Peer GM protection - requires Resort Owner).
 */
export async function deleteUser(
  adminUserId: string,
  targetUserId: string,
  dbClient: PrismaClient = prisma
): Promise<{ success: boolean; error?: string }> {
  if (adminUserId === targetUserId) {
    return { success: false, error: "Security restriction: You cannot delete your own account" };
  }

  const targetUser = await dbClient.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  // Peer GM protection: Cannot delete a fellow GM
  if (targetUser.role === "GM") {
    return {
      success: false,
      error: "Security restriction: A General Manager cannot delete another General Manager. Executive-level changes require Resort Owner authorization.",
    };
  }

  await dbClient.user.delete({
    where: { id: targetUserId },
  });

  return { success: true };
}
