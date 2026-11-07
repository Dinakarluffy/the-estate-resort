import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  generateDateRange,
  getRatesAndAllotmentsMatrix,
  updateDailyRate,
  bulkUpdateDailyRates,
  updateWebsiteAllotment,
  setBlackoutDate,
  removeBlackoutDate,
  getAllBlackoutDates,
  createPromoCode,
  togglePromoCodeStatus,
  getAllPromoCodes,
} from "./rates";

const prisma = new PrismaClient();

describe("rates.ts - Dynamic Rates, Allotment Matrix & GM Inventory Controls", () => {
  let testRoomTypeId: string;
  const testDate1 = "2026-11-25";
  const testDate2 = "2026-11-26";
  const testPromoCode = "TESTOFF20";

  beforeEach(async () => {
    const roomType = await prisma.roomType.findFirst();
    if (!roomType) {
      throw new Error("No room type found in database. Seed data must be present.");
    }
    testRoomTypeId = roomType.id;
  });

  afterAll(async () => {
    // Cleanup any test rates, blackouts, or promo codes
    await prisma.rate.deleteMany({
      where: {
        roomTypeId: testRoomTypeId,
        date: { in: [testDate1, testDate2, "2026-11-27", "2026-11-28"] },
      },
    });
    await prisma.blackoutDate.deleteMany({
      where: {
        date: { in: [testDate1, testDate2] },
      },
    });
    await prisma.promoCode.deleteMany({
      where: { code: testPromoCode },
    });
    await prisma.$disconnect();
  });

  describe("generateDateRange", () => {
    it("generates a continuous array of YYYY-MM-DD dates", () => {
      const dates = generateDateRange("2026-11-01", "2026-11-04");
      expect(dates).toEqual([
        "2026-11-01",
        "2026-11-02",
        "2026-11-03",
        "2026-11-04",
      ]);
    });

    it("handles single date range", () => {
      const dates = generateDateRange("2026-11-01", "2026-11-01");
      expect(dates).toEqual(["2026-11-01"]);
    });
  });

  describe("updateDailyRate & bulkUpdateDailyRates", () => {
    it("updates a single daily rate override", async () => {
      const updated = await updateDailyRate(testRoomTypeId, testDate1, 8500);
      expect(updated.pricePerNight).toBe(8500);
      expect(updated.date).toBe(testDate1);

      const fetched = await prisma.rate.findUnique({
        where: {
          roomTypeId_date: { roomTypeId: testRoomTypeId, date: testDate1 },
        },
      });
      expect(fetched?.pricePerNight).toBe(8500);
    });

    it("throws error for zero or negative rates", async () => {
      await expect(updateDailyRate(testRoomTypeId, testDate1, 0)).rejects.toThrow(
        "Nightly rate must be greater than 0"
      );
      await expect(updateDailyRate(testRoomTypeId, testDate1, -500)).rejects.toThrow(
        "Nightly rate must be greater than 0"
      );
    });

    it("bulk updates rates across a date range", async () => {
      const bulk = await bulkUpdateDailyRates(
        testRoomTypeId,
        testDate1,
        testDate2,
        9200
      );
      expect(bulk.length).toBe(2);
      expect(bulk[0].pricePerNight).toBe(9200);
      expect(bulk[1].pricePerNight).toBe(9200);
    });

    it("throws error when bulk start date is after end date", async () => {
      await expect(
        bulkUpdateDailyRates(testRoomTypeId, testDate2, testDate1, 9200)
      ).rejects.toThrow("Start date must be before or equal to end date");
    });
  });

  describe("updateWebsiteAllotment", () => {
    it("updates website allotment when >= current booked keys", async () => {
      const updated = await updateWebsiteAllotment(testRoomTypeId, testDate1, 10);
      expect(updated.websiteAllotment).toBe(10);
    });

    it("throws error if trying to set allotment below already booked keys", async () => {
      // Simulate 3 booked keys
      await prisma.allotment.upsert({
        where: {
          roomTypeId_date: { roomTypeId: testRoomTypeId, date: testDate1 },
        },
        update: { bookedCount: 3 },
        create: {
          roomTypeId: testRoomTypeId,
          date: testDate1,
          websiteAllotment: 5,
          bookedCount: 3,
        },
      });

      await expect(
        updateWebsiteAllotment(testRoomTypeId, testDate1, 2)
      ).rejects.toThrow(/Cannot reduce website allotment to 2: 3 rooms are already booked/);

      // Clean up booked count back to 0
      await prisma.allotment.update({
        where: {
          roomTypeId_date: { roomTypeId: testRoomTypeId, date: testDate1 },
        },
        data: { bookedCount: 0 },
      });
    });

    it("throws error for negative allotment", async () => {
      await expect(
        updateWebsiteAllotment(testRoomTypeId, testDate1, -1)
      ).rejects.toThrow("Website allotment cannot be negative");
    });
  });

  describe("setBlackoutDate, removeBlackoutDate & getAllBlackoutDates", () => {
    it("sets a room-specific blackout date and retrieves it", async () => {
      const blackout = await setBlackoutDate(
        testRoomTypeId,
        testDate1,
        "Villa Maintenance"
      );
      expect(blackout.reason).toBe("Villa Maintenance");
      expect(blackout.date).toBe(testDate1);

      const all = await getAllBlackoutDates();
      expect(all.some((b) => b.id === blackout.id)).toBe(true);

      // Remove it
      await removeBlackoutDate(blackout.id);
      const after = await getAllBlackoutDates();
      expect(after.some((b) => b.id === blackout.id)).toBe(false);
    });

    it("sets a resort-wide blackout date (roomTypeId = null)", async () => {
      const blackout = await setBlackoutDate(
        null,
        testDate2,
        "Full Estate Buyout Wedding"
      );
      expect(blackout.roomTypeId).toBeNull();
      expect(blackout.reason).toBe("Full Estate Buyout Wedding");

      // Clean up
      await removeBlackoutDate(blackout.id);
    });

    it("throws error if blackout reason is empty", async () => {
      await expect(setBlackoutDate(testRoomTypeId, testDate1, "")).rejects.toThrow(
        "A reason must be provided for blackout dates"
      );
    });
  });

  describe("getRatesAndAllotmentsMatrix", () => {
    it("returns matrix with accurate rates, allotments, and blackout status", async () => {
      // Set test rate and blackout
      await updateDailyRate(testRoomTypeId, testDate1, 7900);
      const blackout = await setBlackoutDate(testRoomTypeId, testDate1, "Private VIP");

      const matrix = await getRatesAndAllotmentsMatrix(
        testDate1,
        testDate2,
        testRoomTypeId
      );
      expect(matrix.length).toBe(1);
      expect(matrix[0].calendar.length).toBe(2);

      const day1 = matrix[0].calendar[0];
      expect(day1.date).toBe(testDate1);
      expect(day1.pricePerNight).toBe(7900);
      expect(day1.isCustomRate).toBe(true);
      expect(day1.isBlackout).toBe(true);
      expect(day1.blackoutReason).toBe("Private VIP");

      // Cleanup
      await removeBlackoutDate(blackout.id);
    });
  });

  describe("createPromoCode, togglePromoCodeStatus & getAllPromoCodes", () => {
    it("creates a new promo code, toggles status, and retrieves it", async () => {
      const promo = await createPromoCode({
        code: testPromoCode,
        discountPercent: 20,
        maxDiscount: 2500,
        minTariff: 10000,
        validFrom: "2026-11-01",
        validTo: "2026-12-31",
        maxUses: 50,
      });

      expect(promo.code).toBe(testPromoCode);
      expect(promo.discountPercent).toBe(20);
      expect(promo.isActive).toBe(true);

      const all = await getAllPromoCodes();
      expect(all.some((p) => p.code === testPromoCode)).toBe(true);

      // Toggle to inactive
      const updated = await togglePromoCodeStatus(promo.id, false);
      expect(updated.isActive).toBe(false);
    });

    it("validates discount percentage bounds", async () => {
      await expect(
        createPromoCode({
          code: "INVALID",
          discountPercent: 0,
          validFrom: "2026-11-01",
          validTo: "2026-12-31",
        })
      ).rejects.toThrow("Discount percentage must be between 1 and 100");

      await expect(
        createPromoCode({
          code: "INVALID2",
          discountPercent: 105,
          validFrom: "2026-11-01",
          validTo: "2026-12-31",
        })
      ).rejects.toThrow("Discount percentage must be between 1 and 100");
    });

    it("validates validFrom <= validTo", async () => {
      await expect(
        createPromoCode({
          code: "BAD_DATES",
          discountPercent: 10,
          validFrom: "2026-12-31",
          validTo: "2026-11-01",
        })
      ).rejects.toThrow("Valid from date must precede or match valid to date");
    });
  });
});
