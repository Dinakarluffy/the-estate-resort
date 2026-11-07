import { describe, it, expect } from "vitest";
import { validateAndApplyPromo, incrementPromoUsage } from "./promo";

describe("promo.ts - Promo Code Engine", () => {
  const mockValidPromo = {
    id: "promo_1",
    code: "COFFEE10",
    discountPercent: 10,
    maxDiscount: 2000,
    minTariff: 5000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    maxUses: 100,
    currentUses: 5,
    isActive: true,
  };

  it("applies 10% discount correctly when within limits", async () => {
    const mockPrisma = {
      promoCode: {
        findUnique: async () => mockValidPromo,
      },
    } as any;

    const result = await validateAndApplyPromo("COFFEE10", 12000, "2026-11-15", mockPrisma);
    expect(result.isValid).toBe(true);
    expect(result.discountPercent).toBe(10);
    expect(result.discountAmount).toBe(1200); // 10% of 12000
    expect(result.code).toBe("COFFEE10");
  });

  it("caps discount to maxDiscount (₹2,000) for large booking tariffs", async () => {
    const mockPrisma = {
      promoCode: {
        findUnique: async () => mockValidPromo,
      },
    } as any;

    // 10% of ₹32,000 would be ₹3,200, but capped at ₹2,000
    const result = await validateAndApplyPromo("coffee10", 32000, "2026-11-15", mockPrisma);
    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(2000);
  });

  it("rejects non-existent promo codes", async () => {
    const mockPrisma = {
      promoCode: {
        findUnique: async () => null,
      },
    } as any;

    const result = await validateAndApplyPromo("NONEXISTENT", 10000, "2026-11-15", mockPrisma);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Invalid promo code");
  });

  it("rejects inactive promo codes", async () => {
    const mockPrisma = {
      promoCode: {
        findUnique: async () => ({ ...mockValidPromo, isActive: false }),
      },
    } as any;

    const result = await validateAndApplyPromo("COFFEE10", 10000, "2026-11-15", mockPrisma);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("no longer active");
  });

  it("rejects promo code if stay date is expired", async () => {
    const mockPrisma = {
      promoCode: {
        findUnique: async () => mockValidPromo,
      },
    } as any;

    const result = await validateAndApplyPromo("COFFEE10", 10000, "2027-02-01", mockPrisma);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("expired");
  });

  it("rejects promo code when maxUses limit has been reached", async () => {
    const mockPrisma = {
      promoCode: {
        findUnique: async () => ({ ...mockValidPromo, currentUses: 100, maxUses: 100 }),
      },
    } as any;

    const result = await validateAndApplyPromo("COFFEE10", 10000, "2026-11-15", mockPrisma);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("maximum redemption limit");
  });

  it("rejects promo code if booking amount does not meet minimum tariff", async () => {
    const mockPrisma = {
      promoCode: {
        findUnique: async () => mockValidPromo,
      },
    } as any;

    // Minimum required is ₹5,000; booking tariff is ₹3,500
    const result = await validateAndApplyPromo("COFFEE10", 3500, "2026-11-15", mockPrisma);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Minimum booking tariff");
  });

  it("increments promo redemption count correctly", async () => {
    let incrementCalled = false;
    const mockPrisma = {
      promoCode: {
        update: async ({ where, data }: any) => {
          if (where.code === "COFFEE10" && data.currentUses.increment === 1) {
            incrementCalled = true;
          }
        },
      },
    } as any;

    await incrementPromoUsage("coffee10", mockPrisma);
    expect(incrementCalled).toBe(true);
  });
});
