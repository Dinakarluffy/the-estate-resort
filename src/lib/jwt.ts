import { SignJWT, jwtVerify } from "jose";

export type Role = "GUEST" | "STAFF" | "GM";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "isocode-estate-secret-jwt-key-chikkamagaluru-2026-production"
);

/**
 * Creates a signed JWT session token (valid for 7 days)
 * Edge runtime compatible (Web Crypto API)
 */
export async function createSessionToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a signed JWT session token
 * Edge runtime compatible (Web Crypto API)
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/**
 * Role hierarchy checks
 */
export function hasRole(userRole: string, requiredRole: Role): boolean {
  if (!userRole) return false;
  const normalized = userRole.toUpperCase();

  if (requiredRole === "GUEST") {
    return ["GUEST", "STAFF", "GM"].includes(normalized);
  }
  if (requiredRole === "STAFF") {
    return ["STAFF", "GM"].includes(normalized);
  }
  if (requiredRole === "GM") {
    return normalized === "GM";
  }
  return false;
}

export function canAccessStaffRoutes(userRole: string): boolean {
  return hasRole(userRole, "STAFF");
}

export function canAccessGmRoutes(userRole: string): boolean {
  return hasRole(userRole, "GM");
}
