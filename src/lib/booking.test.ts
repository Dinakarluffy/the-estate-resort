import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createBooking,
  getBookingById,
  getBookingByNumber,
  cancelBooking,
  getUserBookings,
  getAllBookings,
  generateBookingNumber,
} from "./booking";

const prisma = new PrismaClient();

describe("booking.ts - Guest Booking & Statutory Reservation Engine", () => {
  let guestUserId: string;
  let heritageRoomId: string;
  let suiteRoomId: string;
  let testCheckIn: string;
  let testCheckOut: string;

  beforeAll(async () => {
    // Look up demo guest
    const guest = await prisma.user.findFirst({
      where: { email: "guest@estate.com" },
    });
    if (!guest) throw new Error("Demo guest not found");
    guestUserId = guest.id;

    // Look up room types
    const heritage = await prisma.roomType.findFirst({
      where: { slug: "planters-heritage-room" },
    });
    const suite = await prisma.roomType.findFirst({
      where: { slug: "coffee-estate-luxury-suite" },
    });
    if (!heritage || !suite) throw new Error("Room types not found");

    heritageRoomId = heritage.id;
    suiteRoomId = suite.id;

    // Choose dates 12 to 14 days in the future
    const d1 = new Date();
    d1.setDate(d1.getDate() + 12);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 14);

    testCheckIn = d1.toISOString().split("T")[0];
    testCheckOut = d2.toISOString().split("T")[0];
  });

  describe("generateBookingNumber", () => {
    it("generates booking numbers in EST-2026-XXXX format", () => {
      const num = generateBookingNumber();
      expect(num).toMatch(/^EST-2026-\d{4}$/);
    });
  });

  describe("createBooking", () => {
    it("creates a direct booking with statutory 12% GST for Planter's Heritage Room", async () => {
      const booking = await createBooking(
        {
          userId: guestUserId,
          guestName: "Priya Sharma",
          guestEmail: "priya@estate.com",
          guestPhone: "+91 98765 43210",
          roomTypeId: heritageRoomId,
          checkIn: testCheckIn,
          checkOut: testCheckOut,
          paymentReference: "PAY-RZP-2026-112233",
        },
        prisma
      );

      expect(booking.id).toBeDefined();
      expect(booking.bookingNumber).toMatch(/^EST-2026-\d{4}$/);
      expect(booking.status).toBe("CONFIRMED");
      expect(booking.paymentStatus).toBe("PAID");
      expect(booking.totalNights).toBe(2);
      expect(booking.gstRatePercent).toBe(12); // Base rate ₹6,500 <= ₹7,500
      expect(booking.grandTotal).toBeGreaterThan(booking.baseTariffTotal);
      expect(booking.netTaxableAmount).toBe(booking.baseTariffTotal);

      // Clean up booking
      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it("applies promo code COFFEE10 and decrements net taxable amount", async () => {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 15);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 17);
      const cin = d1.toISOString().split("T")[0];
      const cout = d2.toISOString().split("T")[0];

      const booking = await createBooking(
        {
          userId: guestUserId,
          guestName: "Priya Sharma",
          guestEmail: "priya@estate.com",
          guestPhone: "+91 98765 43210",
          roomTypeId: heritageRoomId,
          checkIn: cin,
          checkOut: cout,
          promoCode: "COFFEE10",
          paymentReference: "PAY-RZP-2026-998877",
        },
        prisma
      );

      expect(booking.promoCode).toBe("COFFEE10");
      expect(booking.discountAmount).toBeGreaterThan(0);
      expect(booking.netTaxableAmount).toBe(booking.baseTariffTotal - booking.discountAmount);

      // Clean up
      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it("applies statutory 18% GST for Coffee Estate Luxury Suite (> ₹7,500/night)", async () => {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 18);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 19);
      const cin = d1.toISOString().split("T")[0];
      const cout = d2.toISOString().split("T")[0];

      const booking = await createBooking(
        {
          userId: guestUserId,
          guestName: "Arun Patel",
          guestEmail: "arun@example.com",
          guestPhone: "+91 98200 11223",
          roomTypeId: suiteRoomId,
          checkIn: cin,
          checkOut: cout,
          paymentReference: "PAY-RZP-2026-554433",
        },
        prisma
      );

      expect(booking.gstRatePercent).toBe(18); // Base rate ₹9,500 > ₹7,500
      expect(booking.totalNights).toBe(1);

      // Clean up
      await prisma.booking.delete({ where: { id: booking.id } });
    });

    it("throws error for missing guest name", async () => {
      await expect(
        createBooking(
          {
            guestName: "",
            guestEmail: "test@example.com",
            guestPhone: "+91 98765 43210",
            roomTypeId: heritageRoomId,
            checkIn: testCheckIn,
            checkOut: testCheckOut,
            paymentReference: "PAY-123",
          },
          prisma
        )
      ).rejects.toThrow("Guest name is required");
    });

    it("throws error for invalid guest email", async () => {
      await expect(
        createBooking(
          {
            guestName: "Deepa Nair",
            guestEmail: "notanemail",
            guestPhone: "+91 98765 43210",
            roomTypeId: heritageRoomId,
            checkIn: testCheckIn,
            checkOut: testCheckOut,
            paymentReference: "PAY-123",
          },
          prisma
        )
      ).rejects.toThrow("valid guest email");
    });
  });

  describe("getBookingById & getBookingByNumber", () => {
    it("retrieves a booking by ID and human-readable booking number", async () => {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 22);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 23);
      const cin = d1.toISOString().split("T")[0];
      const cout = d2.toISOString().split("T")[0];

      const created = await createBooking(
        {
          userId: guestUserId,
          guestName: "Manish Joshi",
          guestEmail: "manish@example.com",
          guestPhone: "+91 97110 55667",
          roomTypeId: heritageRoomId,
          checkIn: cin,
          checkOut: cout,
          paymentReference: "PAY-RZP-2026-778899",
        },
        prisma
      );

      const byId = await getBookingById(created.id, prisma);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(created.id);
      expect(byId?.roomType.name).toContain("Planter's Heritage Room");

      const byNum = await getBookingByNumber(created.bookingNumber, prisma);
      expect(byNum).not.toBeNull();
      expect(byNum?.bookingNumber).toBe(created.bookingNumber);

      // Clean up
      await prisma.booking.delete({ where: { id: created.id } });
    });
  });

  describe("cancelBooking", () => {
    it("cancels booking and restores room inventory", async () => {
      const d1 = new Date();
      d1.setDate(d1.getDate() + 26);
      const d2 = new Date();
      d2.setDate(d2.getDate() + 27);
      const cin = d1.toISOString().split("T")[0];
      const cout = d2.toISOString().split("T")[0];

      const booking = await createBooking(
        {
          userId: guestUserId,
          guestName: "Sneha Reddy",
          guestEmail: "sneha@weddings.in",
          guestPhone: "+91 99000 77889",
          roomTypeId: heritageRoomId,
          checkIn: cin,
          checkOut: cout,
          paymentReference: "PAY-RZP-2026-443322",
        },
        prisma
      );

      const cancelled = await cancelBooking(booking.id, prisma);
      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.paymentStatus).toBe("REFUNDED");

      // Attempting to cancel again should throw an error
      await expect(cancelBooking(booking.id, prisma)).rejects.toThrow("already been cancelled");

      // Clean up
      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });

  describe("getUserBookings & getAllBookings", () => {
    it("returns list of bookings for a specific guest and resort-wide", async () => {
      const userBookings = await getUserBookings(guestUserId, prisma);
      expect(Array.isArray(userBookings)).toBe(true);

      const allBookings = await getAllBookings(undefined, prisma);
      expect(Array.isArray(allBookings)).toBe(true);
    });
  });
});
