import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  getDateRangeArray,
  checkRoomAvailability,
  checkAllRoomsAvailability,
  atomicReserveAllotment,
  atomicReleaseAllotment,
  OverbookingError,
} from "./allotment";

const prisma = new PrismaClient();

describe("allotment.ts - Website Allotment & Overbooking Prevention Engine", () => {
  let heritageRoomId: string;
  let villaRoomId: string;
  let testCheckIn: string;
  let testCheckOut: string;

  beforeAll(async () => {
    // Look up seeded room types
    const heritage = await prisma.roomType.findFirst({
      where: { slug: "planters-heritage-room" },
    });
    const villa = await prisma.roomType.findFirst({
      where: { slug: "misty-valley-pool-villa" },
    });

    if (!heritage || !villa) {
      throw new Error("Seeded room types not found. Ensure prisma db seed was run.");
    }

    heritageRoomId = heritage.id;
    villaRoomId = villa.id;

    // Advance to a weekday Monday well clear of any immediate manual test blackouts
    const d1 = new Date();
    const dayOfWeek = d1.getDay();
    const daysUntilMonday = ((8 - dayOfWeek) % 7) || 7;
    d1.setDate(d1.getDate() + daysUntilMonday + 7);

    const d2 = new Date(d1);
    d2.setDate(d1.getDate() + 2); // Mon -> Wed (2 weekday nights)

    testCheckIn = d1.toISOString().split("T")[0];
    testCheckOut = d2.toISOString().split("T")[0];
  });

  describe("getDateRangeArray", () => {
    it("generates correct date strings array for a multi-night stay", () => {
      const dates = getDateRangeArray("2026-12-01", "2026-12-04");
      expect(dates).toEqual(["2026-12-01", "2026-12-02", "2026-12-03"]);
      expect(dates.length).toBe(3);
    });

    it("generates a single date string for a 1-night stay", () => {
      const dates = getDateRangeArray("2026-12-01", "2026-12-02");
      expect(dates).toEqual(["2026-12-01"]);
      expect(dates.length).toBe(1);
    });

    it("throws an error if check-in is the same as check-out", () => {
      expect(() => getDateRangeArray("2026-12-01", "2026-12-01")).toThrow(
        "Check-out date must be strictly after check-in date."
      );
    });

    it("throws an error if check-out is before check-in", () => {
      expect(() => getDateRangeArray("2026-12-05", "2026-12-01")).toThrow(
        "Check-out date must be strictly after check-in date."
      );
    });

    it("throws an error for invalid date formats", () => {
      expect(() => getDateRangeArray("invalid-date", "2026-12-01")).toThrow(
        "Invalid date format"
      );
    });
  });

  describe("checkRoomAvailability", () => {
    it("calculates live rates, GST, and allotment for valid dates", async () => {
      const result = await checkRoomAvailability(heritageRoomId, testCheckIn, testCheckOut, prisma);

      expect(result.roomTypeId).toBe(heritageRoomId);
      expect(result.nights).toBe(2);
      expect(result.isAvailable).toBe(true);
      expect(result.availableKeys).toBeGreaterThan(0);
      expect(result.dailyRates.length).toBe(2);
      expect(result.pricing).toBeDefined();
      expect(result.pricing.gstRatePercent).toBe(12); // Base price ₹6,500 <= ₹7,500
      expect(result.pricing.grandTotal).toBeGreaterThan(0);
    });

    it("correctly identifies blackout dates and blocks booking", async () => {
      // Create a temporary blackout date
      const blackoutDateStr = "2026-12-25";
      const nextDayStr = "2026-12-26";

      const createdBlackout = await prisma.blackoutDate.create({
        data: {
          roomTypeId: heritageRoomId,
          date: blackoutDateStr,
          reason: "Christmas Private Buyout Event",
        },
      });

      try {
        const result = await checkRoomAvailability(heritageRoomId, blackoutDateStr, nextDayStr, prisma);
        expect(result.isAvailable).toBe(false);
        expect(result.availableKeys).toBe(0);
        expect(result.blackoutReason).toContain("Christmas Private Buyout Event");
      } finally {
        await prisma.blackoutDate.delete({ where: { id: createdBlackout.id } });
      }
    });

    it("throws an error for non-existent room type ID", async () => {
      await expect(
        checkRoomAvailability("non-existent-id-9999", testCheckIn, testCheckOut, prisma)
      ).rejects.toThrow("not found");
    });
  });

  describe("checkAllRoomsAvailability", () => {
    it("fetches availability for all resort room types (76 keys total)", async () => {
      const results = await checkAllRoomsAvailability(testCheckIn, testCheckOut, undefined, prisma);
      expect(results.length).toBe(3); // 3 room types
      expect(results.some((r) => r.roomSlug === "planters-heritage-room")).toBe(true);
      expect(results.some((r) => r.roomSlug === "coffee-estate-luxury-suite")).toBe(true);
      expect(results.some((r) => r.roomSlug === "misty-valley-pool-villa")).toBe(true);
    });

    it("filters rooms by guest capacity", async () => {
      // Villa allows maxGuests: 4, Heritage allows 2
      const results = await checkAllRoomsAvailability(testCheckIn, testCheckOut, 4, prisma);
      expect(results.length).toBe(1);
      expect(results[0].roomSlug).toBe("misty-valley-pool-villa");
      expect(results[0].maxGuests).toBeGreaterThanOrEqual(4);
    });
  });

  describe("atomicReserveAllotment & atomicReleaseAllotment", () => {
    it("successfully reserves an allotment and releases it atomically", async () => {
      // Pick a distinct test date range 20 days ahead
      const d1 = new Date();
      d1.setDate(d1.getDate() + 20);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 22);

      const cin = d1.toISOString().split("T")[0];
      const cout = d2.toISOString().split("T")[0];

      // Check initial availability
      const before = await checkRoomAvailability(heritageRoomId, cin, cout, prisma);
      const initialKeys = before.availableKeys;

      // Reserve 2 keys
      const res = await atomicReserveAllotment(heritageRoomId, cin, cout, 2, prisma);
      expect(res.success).toBe(true);
      expect(res.reservedDates.length).toBe(2);

      // Verify available keys reduced by 2
      const afterReserve = await checkRoomAvailability(heritageRoomId, cin, cout, prisma);
      expect(afterReserve.availableKeys).toBe(initialKeys - 2);

      // Release the 2 keys back
      const rel = await atomicReleaseAllotment(heritageRoomId, cin, cout, 2, prisma);
      expect(rel.success).toBe(true);

      // Verify allotment restored
      const afterRelease = await checkRoomAvailability(heritageRoomId, cin, cout, prisma);
      expect(afterRelease.availableKeys).toBe(initialKeys);
    });

    it("prevents overbooking when requested keys exceed available website allotment", async () => {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 25);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 26);

      const cin = d1.toISOString().split("T")[0];
      const cout = d2.toISOString().split("T")[0];

      // Pool villa has total 3 website allotment keys
      // Requesting 99 keys must be rejected and trigger OverbookingError
      await expect(
        atomicReserveAllotment(villaRoomId, cin, cout, 99, prisma)
      ).rejects.toThrow(OverbookingError);
    });

    it("prevents booking on blacked out dates with OverbookingError", async () => {
      const blackoutDateStr = "2026-12-31";
      const nextDayStr = "2027-01-01";

      const blackout = await prisma.blackoutDate.create({
        data: {
          roomTypeId: null, // Resort-wide
          date: blackoutDateStr,
          reason: "New Year Eve Private Gala",
        },
      });

      try {
        await expect(
          atomicReserveAllotment(heritageRoomId, blackoutDateStr, nextDayStr, 1, prisma)
        ).rejects.toThrow(OverbookingError);
      } finally {
        await prisma.blackoutDate.delete({ where: { id: blackout.id } });
      }
    });
  });
});
