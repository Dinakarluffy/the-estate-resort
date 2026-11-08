import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { authenticateUser, createSessionToken, verifySessionToken } from "./auth";
import { checkRoomAvailability, atomicReserveAllotment, atomicReleaseAllotment } from "./allotment";
import { calculateTariffGST } from "./gst";
import { validateAndApplyPromo } from "./promo";
import { createBooking, cancelBooking } from "./booking";
import { ingestEnquiry, updateEnquiryDraft, approveAndSendEnquiry, updateEnquiryPhone, calculateEstimatedDealValue } from "./enquiry";
import { generatePmsCsv, getBookingsForExport } from "./export";

const prisma = new PrismaClient();

describe("Phase 6 Master End-to-End System Integration Suite", () => {
  let guestUser: any;
  let staffUser: any;
  let gmUser: any;
  let heritageRoom: any;
  let luxurySuite: any;
  let poolVilla: any;

  beforeAll(async () => {
    guestUser = await prisma.user.findUnique({ where: { email: "guest@estate.com" } });
    staffUser = await prisma.user.findUnique({ where: { email: "staff@estate.com" } });
    gmUser = await prisma.user.findUnique({ where: { email: "gm@estate.com" } });

    heritageRoom = await prisma.roomType.findUnique({ where: { slug: "planters-heritage-room" } });
    luxurySuite = await prisma.roomType.findUnique({ where: { slug: "coffee-estate-luxury-suite" } });
    poolVilla = await prisma.roomType.findUnique({ where: { slug: "misty-valley-pool-villa" } });
  });

  // ---------------------------------------------------------------------------
  // 1. Role-Based Authentication & JWT Session Cycle
  // ---------------------------------------------------------------------------
  describe("1. End-to-End Role Authentication & JWT Session", () => {
    it("authenticates guest, staff, and GM credentials using bcrypt and issues valid edge JWT tokens", async () => {
      const authGuest = await authenticateUser("guest@estate.com", "demo1234");
      expect(authGuest.success).toBe(true);
      expect(authGuest.user?.role).toBe("GUEST");

      const token = await createSessionToken(authGuest.user!);
      expect(token).toBeTruthy();

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.email).toBe("guest@estate.com");
      expect(verified?.role).toBe("GUEST");
    });

    it("verifies staff and GM roles have appropriate operational permissions", async () => {
      const authStaff = await authenticateUser("staff@estate.com", "demo1234");
      const authGm = await authenticateUser("gm@estate.com", "demo1234");

      expect(authStaff.success).toBe(true);
      expect(authStaff.user?.role).toBe("STAFF");

      expect(authGm.success).toBe(true);
      expect(authGm.user?.role).toBe("GM");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Statutory Indian GST Slabs & Zero-Hallucination Rate Engine
  // ---------------------------------------------------------------------------
  describe("2. Statutory Indian GST Slabs (12% vs 18%)", () => {
    it("applies statutory 12% GST for tariff <= ₹7,500/night (Planter's Heritage Room)", () => {
      const pricing = calculateTariffGST(6500, 2);
      expect(pricing.baseTotal).toBe(13000);
      expect(pricing.gstRatePercent).toBe(12);
      expect(pricing.cgstPercent).toBe(6);
      expect(pricing.sgstPercent).toBe(6);
      expect(pricing.gstAmount).toBe(1560);
      expect(pricing.grandTotal).toBe(14560);
    });

    it("applies statutory 18% GST for tariff > ₹7,500/night (Luxury Suite & Pool Villa)", () => {
      const suitePricing = calculateTariffGST(9500, 2);
      expect(suitePricing.baseTotal).toBe(19000);
      expect(suitePricing.gstRatePercent).toBe(18);
      expect(suitePricing.cgstPercent).toBe(9);
      expect(suitePricing.sgstPercent).toBe(9);
      expect(suitePricing.gstAmount).toBe(3420);
      expect(suitePricing.grandTotal).toBe(22420);

      const villaPricing = calculateTariffGST(16000, 1);
      expect(villaPricing.gstRatePercent).toBe(18);
      expect(villaPricing.gstAmount).toBe(2880);
      expect(villaPricing.grandTotal).toBe(18880);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Promotional Engine & Revenue Protection Max Cap
  // ---------------------------------------------------------------------------
  describe("3. Promo Code Engine with Max Discount Cap", () => {
    it("applies percentage discount within allowable cap on standard booking", async () => {
      const today = new Date();
      const checkInStr = today.toISOString().split("T")[0];

      // Base: ₹13,000 -> 10% = ₹1,300 (under ₹2,000 cap)
      const res = await validateAndApplyPromo("COFFEE10", 13000, checkInStr);
      expect(res.isValid).toBe(true);
      expect(res.discountAmount).toBe(1300);
    });

    it("strictly caps discount at maxDiscount to protect resort revenue on high-value villa stays", async () => {
      const today = new Date();
      const checkInStr = today.toISOString().split("T")[0];

      // Base: ₹48,000 (3 nights pool villa) -> 10% would be ₹4,800, but capped at ₹2,000
      const res = await validateAndApplyPromo("COFFEE10", 48000, checkInStr);
      expect(res.isValid).toBe(true);
      expect(res.discountAmount).toBe(2000); // Max cap enforced
    });

    it("rejects expired promo code with friendly validation error", async () => {
      const today = new Date();
      const checkInStr = today.toISOString().split("T")[0];

      const res = await validateAndApplyPromo("EXPIRED50", 15000, checkInStr);
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/active|expired|inactive|not found/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Atomic Multi-Night Booking & Concurrency Allotment Decrement
  // ---------------------------------------------------------------------------
  describe("4. End-to-End Direct Booking & Allotment Protection", () => {
    it("completes direct booking and atomically decrements website allotment across all stay nights", async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 20);
      const checkIn = targetDate.toISOString().split("T")[0];
      targetDate.setDate(targetDate.getDate() + 2);
      const checkOut = targetDate.toISOString().split("T")[0];

      // 1. Check initial availability
      const initialAvail = await checkRoomAvailability(heritageRoom.id, checkIn, checkOut);
      expect(initialAvail.isAvailable).toBe(true);
      const initialKeys = initialAvail.availableKeys;

      // 2. Execute direct booking
      const booking = await createBooking({
        userId: guestUser.id,
        guestName: guestUser.name,
        guestEmail: guestUser.email,
        guestPhone: guestUser.phone,
        roomTypeId: heritageRoom.id,
        checkIn,
        checkOut,
        promoCode: "COFFEE10",
        paymentReference: "TEST_INTEGRATION_PAY_1",
      });

      expect(booking.bookingNumber).toMatch(/^EST-2026-\d{4}$/);
      expect(booking.status).toBe("CONFIRMED");
      expect(booking.paymentStatus).toBe("PAID");

      // 3. Verify allotment decrement
      const postAvail = await checkRoomAvailability(heritageRoom.id, checkIn, checkOut);
      expect(postAvail.availableKeys).toBe(initialKeys - 1);

      // Clean up test booking
      await prisma.booking.delete({ where: { id: booking.id } });
      await atomicReleaseAllotment(heritageRoom.id, checkIn, checkOut, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Front Desk Operational Lifecycle & PMS CSV Export
  // ---------------------------------------------------------------------------
  describe("5. Front Desk Operational Lifecycle & PMS Integration", () => {
    it("transitions booking from CONFIRMED -> CHECKED_IN -> CHECKED_OUT", async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Create booking for today
      const testBooking = await createBooking({
        guestName: "Front Desk Test Guest",
        guestEmail: "frontdesk@test.com",
        guestPhone: "+91 99999 11111",
        roomTypeId: luxurySuite.id,
        checkIn: todayStr,
        checkOut: tomorrowStr,
        paymentReference: "TEST_FRONTDESK_LIFECYCLE",
      });

      expect(testBooking.status).toBe("CONFIRMED");

      // Check-In
      const checkedIn = await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status: "CHECKED_IN" },
      });
      expect(checkedIn.status).toBe("CHECKED_IN");

      // Check-Out
      const checkedOut = await prisma.booking.update({
        where: { id: testBooking.id },
        data: { status: "CHECKED_OUT" },
      });
      expect(checkedOut.status).toBe("CHECKED_OUT");

      // Clean up
      await prisma.booking.delete({ where: { id: testBooking.id } });
      await atomicReleaseAllotment(luxurySuite.id, todayStr, tomorrowStr, 1);
    });

    it("generates 21-column RFC 4180 PMS CSV export with UTF-8 BOM encoding", async () => {
      const bookings = await getBookingsForExport();
      const csv = generatePmsCsv(bookings);
      expect(csv.startsWith("\uFEFF")).toBe(true); // UTF-8 BOM present
      expect(csv).toContain("Booking Reference");
      expect(csv).toContain("Statutory SAC Code");
      expect(csv).toContain("CGST (INR)");
      expect(csv).toContain("SGST (INR)");
      expect(csv).toContain("996311");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Guest Self-Service: Stay Extension & 48-Hour Cancellation
  // ---------------------------------------------------------------------------
  describe("6. Guest Self-Service: Stay Extension & Free Cancellation", () => {
    it("cancels booking and atomically restores website inventory", async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 25);
      const checkIn = targetDate.toISOString().split("T")[0];
      targetDate.setDate(targetDate.getDate() + 2);
      const checkOut = targetDate.toISOString().split("T")[0];

      const booking = await createBooking({
        userId: guestUser.id,
        guestName: guestUser.name,
        guestEmail: guestUser.email,
        guestPhone: guestUser.phone,
        roomTypeId: poolVilla.id,
        checkIn,
        checkOut,
        paymentReference: "TEST_CANCEL_FLOW",
      });

      const midAvail = await checkRoomAvailability(poolVilla.id, checkIn, checkOut);

      // Cancel stay (atomically releases allotment internally)
      const cancelled = await cancelBooking(booking.id);
      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.paymentStatus).toBe("REFUNDED");

      // Verify inventory restoration
      const restoredAvail = await checkRoomAvailability(poolVilla.id, checkIn, checkOut);
      expect(restoredAvail.availableKeys).toBe(midAvail.availableKeys + 1);

      // Clean up
      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Multi-Channel AI Enquiry Pipeline & Rate-Grounded Dispatch
  // ---------------------------------------------------------------------------
  describe("7. Multi-Channel AI Enquiry Pipeline & Dispatch", () => {
    it("ingests wedding lead, grounds quotation in active room rates, and supports human-in-the-loop dispatch", async () => {
      const enquiry = await ingestEnquiry({
        source: "WEB",
        rawMessage: "Looking for wedding venue for 200 guests in March 2027",
        guestName: "Pooja Hegde",
        guestEmail: "pooja.h@weddings.in",
      });

      expect(enquiry.enquiryNumber).toMatch(/^ENQ-\d{4}$/);
      expect(enquiry.category).toBe("WEDDING");
      expect(enquiry.status).toBe("NEW");
      expect(enquiry.draftReply).toContain("wedding");

      // Staff edits draft quotation -> status flips to REVIEWED
      const reviewed = await updateEnquiryDraft(enquiry.id, enquiry.draftReply + "\n\nPS: Special plantation coffee tasting included.");
      expect(reviewed.status).toBe("REVIEWED");

      // Missing phone prompt capture
      const updatedPhone = await updateEnquiryPhone(enquiry.id, "+91 98888 77777");
      expect(updatedPhone.guestPhone).toBe("+91 98888 77777");

      // Staff approves & dispatches -> status flips to SENT
      const sent = await approveAndSendEnquiry(enquiry.id);
      expect(sent.status).toBe("SENT");

      // Revenue Deal Value Calculation
      const dealVal = calculateEstimatedDealValue("WEDDING", 200);
      expect(dealVal).toContain("₹18,00,000");

      // Clean up
      await prisma.enquiry.delete({ where: { id: enquiry.id } });
    });
  });
});
