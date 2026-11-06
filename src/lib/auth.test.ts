import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  hasRole,
  canAccessStaffRoutes,
  canAccessGmRoutes,
  authenticateUser,
  UserSession,
} from "./auth";

describe("auth.ts - Authentication & Role Access Engine", () => {
  describe("hashPassword & verifyPassword", () => {
    it("hashes a valid password and successfully verifies it", async () => {
      const password = "mySecurePassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2")).toBe(true); // standard bcrypt format

      const isMatch = await verifyPassword(password, hash);
      expect(isMatch).toBe(true);

      const isWrong = await verifyPassword("wrongPassword", hash);
      expect(isWrong).toBe(false);
    });

    it("rejects passwords shorter than 6 characters", async () => {
      await expect(hashPassword("123")).rejects.toThrow(
        "Password must be at least 6 characters long"
      );
    });

    it("returns false when verifying with empty input", async () => {
      const isMatch = await verifyPassword("", "$2a$10$dummyHash");
      expect(isMatch).toBe(false);
    });
  });

  describe("createSessionToken & verifySessionToken", () => {
    it("creates a signed JWT and verifies its payload correctly", async () => {
      const sessionPayload: UserSession = {
        userId: "user_test_99",
        email: "staff@estate.com",
        name: "Karthik Rao",
        role: "STAFF",
      };

      const token = await createSessionToken(sessionPayload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // Header.Payload.Signature

      const decoded = await verifySessionToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(sessionPayload.userId);
      expect(decoded?.email).toBe(sessionPayload.email);
      expect(decoded?.role).toBe(sessionPayload.role);
    });

    it("returns null for tampered or invalid tokens", async () => {
      const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
      const result = await verifySessionToken(invalidToken);
      expect(result).toBeNull();

      const emptyResult = await verifySessionToken("");
      expect(emptyResult).toBeNull();
    });
  });

  describe("Role Hierarchy & Permission Checks", () => {
    it("validates hasRole correctly across role hierarchy", () => {
      // GUEST permission
      expect(hasRole("GUEST", "GUEST")).toBe(true);
      expect(hasRole("STAFF", "GUEST")).toBe(true);
      expect(hasRole("GM", "GUEST")).toBe(true);

      // STAFF permission
      expect(hasRole("GUEST", "STAFF")).toBe(false);
      expect(hasRole("STAFF", "STAFF")).toBe(true);
      expect(hasRole("GM", "STAFF")).toBe(true);

      // GM permission (strictly GM only)
      expect(hasRole("GUEST", "GM")).toBe(false);
      expect(hasRole("STAFF", "GM")).toBe(false);
      expect(hasRole("GM", "GM")).toBe(true);

      // Invalid roles
      expect(hasRole("", "GUEST")).toBe(false);
      expect(hasRole("UNKNOWN", "STAFF")).toBe(false);
    });

    it("evaluates canAccessStaffRoutes correctly", () => {
      expect(canAccessStaffRoutes("GUEST")).toBe(false);
      expect(canAccessStaffRoutes("STAFF")).toBe(true);
      expect(canAccessStaffRoutes("GM")).toBe(true);
    });

    it("evaluates canAccessGmRoutes correctly", () => {
      expect(canAccessGmRoutes("GUEST")).toBe(false);
      expect(canAccessGmRoutes("STAFF")).toBe(false);
      expect(canAccessGmRoutes("GM")).toBe(true);
    });
  });

  describe("authenticateUser", () => {
    it("fails with missing email or password", async () => {
      const res1 = await authenticateUser("", "password");
      expect(res1.success).toBe(false);
      expect(res1.error).toContain("required");

      const res2 = await authenticateUser("test@estate.com", "");
      expect(res2.success).toBe(false);
      expect(res2.error).toContain("required");
    });

    it("fails with non-existent email using mock DB", async () => {
      const mockPrisma = {
        user: {
          findUnique: async () => null,
        },
      } as any;

      const res = await authenticateUser("nonexistent@estate.com", "pass1234", mockPrisma);
      expect(res.success).toBe(false);
      expect(res.error).toBe("Invalid email or password");
    });

    it("authenticates correctly with valid user and bcrypt hash", async () => {
      const plainPassword = "demoPassword123";
      const hash = await hashPassword(plainPassword);

      const mockPrisma = {
        user: {
          findUnique: async () => ({
            id: "user_123",
            email: "gm@estate.com",
            name: "Vikram Hegde",
            role: "GM",
            passwordHash: hash,
          }),
        },
      } as any;

      const res = await authenticateUser("gm@estate.com", plainPassword, mockPrisma);
      expect(res.success).toBe(true);
      expect(res.user?.role).toBe("GM");
      expect(res.token).toBeDefined();

      const decoded = await verifySessionToken(res.token!);
      expect(decoded?.email).toBe("gm@estate.com");
    });
  });
});
