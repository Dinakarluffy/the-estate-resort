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
  registerUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
  UserSession,
} from "./auth";

describe("auth.ts - Authentication & Role Access Engine", () => {
  describe("hashPassword & verifyPassword", () => {
    it("hashes a valid password and successfully verifies it", async () => {
      const password = "mySecurePassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2")).toBe(true);

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
      expect(token.split(".").length).toBe(3);

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
      expect(hasRole("GUEST", "GUEST")).toBe(true);
      expect(hasRole("STAFF", "GUEST")).toBe(true);
      expect(hasRole("GM", "GUEST")).toBe(true);

      expect(hasRole("GUEST", "STAFF")).toBe(false);
      expect(hasRole("STAFF", "STAFF")).toBe(true);
      expect(hasRole("GM", "STAFF")).toBe(true);

      expect(hasRole("GUEST", "GM")).toBe(false);
      expect(hasRole("STAFF", "GM")).toBe(false);
      expect(hasRole("GM", "GM")).toBe(true);

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

  describe("registerUser", () => {
    it("fails with invalid email or short password or empty name", async () => {
      const res1 = await registerUser({ name: "A", email: "valid@test.com", password: "password123" });
      expect(res1.success).toBe(false);
      expect(res1.error).toContain("minimum 2 characters");

      const res2 = await registerUser({ name: "Ravi Kumar", email: "notanemail", password: "password123" });
      expect(res2.success).toBe(false);
      expect(res2.error).toContain("valid email");

      const res3 = await registerUser({ name: "Ravi Kumar", email: "ravi@test.com", password: "123" });
      expect(res3.success).toBe(false);
      expect(res3.error).toContain("at least 6 characters");
    });

    it("prevents duplicate account creation", async () => {
      const mockPrisma = {
        user: {
          findUnique: async () => ({ id: "existing_user" }),
        },
      } as any;

      const res = await registerUser(
        { name: "Existing Guest", email: "guest@estate.com", password: "password123" },
        mockPrisma
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain("already exists");
    });

    it("creates a new GUEST user with hashed password and session token", async () => {
      const mockPrisma = {
        user: {
          findUnique: async () => null,
          create: async ({ data }: any) => ({
            id: "new_guest_101",
            email: data.email,
            name: data.name,
            role: data.role,
            passwordHash: data.passwordHash,
          }),
        },
      } as any;

      const res = await registerUser(
        { name: "Aditi Rao", email: "aditi@test.com", password: "secret123Password" },
        mockPrisma
      );

      expect(res.success).toBe(true);
      expect(res.user?.role).toBe("GUEST");
      expect(res.user?.email).toBe("aditi@test.com");
      expect(res.token).toBeDefined();

      const decoded = await verifySessionToken(res.token!);
      expect(decoded?.email).toBe("aditi@test.com");
      expect(decoded?.role).toBe("GUEST");
    });
  });

  describe("Admin User Management & Peer GM Security Guardrails", () => {
    it("lists all users safely", async () => {
      const mockPrisma = {
        user: {
          findMany: async () => [
            { id: "1", name: "Guest", email: "g@test.com", role: "GUEST" },
            { id: "2", name: "Staff", email: "s@test.com", role: "STAFF" },
          ],
        },
      } as any;

      const users = await getAllUsers(mockPrisma);
      expect(users.length).toBe(2);
      expect(users[0].role).toBe("GUEST");
    });

    it("promotes a GUEST to STAFF successfully", async () => {
      const mockPrisma = {
        user: {
          findUnique: async () => ({ id: "guest_1", role: "GUEST" }),
          update: async ({ data }: any) => ({ id: "guest_1", role: data.role }),
        },
      } as any;

      const res = await updateUserRole("admin_gm", "guest_1", "STAFF", mockPrisma);
      expect(res.success).toBe(true);
      expect(res.user?.role).toBe("STAFF");
    });

    it("allows a GM to promote a STAFF member to GM", async () => {
      const mockPrisma = {
        user: {
          findUnique: async () => ({ id: "staff_1", role: "STAFF" }),
          update: async ({ data }: any) => ({ id: "staff_1", role: data.role }),
        },
      } as any;

      const res = await updateUserRole("admin_gm", "staff_1", "GM", mockPrisma);
      expect(res.success).toBe(true);
      expect(res.user?.role).toBe("GM");
    });

    it("strictly blocks a GM from demoting another GM (Peer Protection)", async () => {
      const mockPrisma = {
        user: {
          findUnique: async () => ({ id: "fellow_gm", role: "GM" }),
        },
      } as any;

      const res = await updateUserRole("admin_gm_1", "fellow_gm", "STAFF", mockPrisma);
      expect(res.success).toBe(false);
      expect(res.error).toContain("cannot demote another General Manager");
    });

    it("strictly blocks a GM from deleting another GM (Peer Protection)", async () => {
      const mockPrisma = {
        user: {
          findUnique: async () => ({ id: "fellow_gm", role: "GM" }),
        },
      } as any;

      const res = await deleteUser("admin_gm_1", "fellow_gm", mockPrisma);
      expect(res.success).toBe(false);
      expect(res.error).toContain("cannot delete another General Manager");
    });

    it("prevents an admin from demoting their own GM account", async () => {
      const res = await updateUserRole("admin_gm", "admin_gm", "GUEST");
      expect(res.success).toBe(false);
      expect(res.error).toContain("cannot demote your own account");
    });

    it("prevents an admin from deleting their own account", async () => {
      const res = await deleteUser("admin_gm", "admin_gm");
      expect(res.success).toBe(false);
      expect(res.error).toContain("cannot delete your own account");
    });

    it("deletes a non-GM user successfully", async () => {
      let deletedId = "";
      const mockPrisma = {
        user: {
          findUnique: async () => ({ id: "target_guest", role: "GUEST" }),
          delete: async ({ where }: any) => {
            deletedId = where.id;
          },
        },
      } as any;

      const res = await deleteUser("admin_gm", "target_guest", mockPrisma);
      expect(res.success).toBe(true);
      expect(deletedId).toBe("target_guest");
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
