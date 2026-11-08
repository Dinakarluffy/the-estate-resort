import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  escapeCsvField,
  formatBookingToExportRow,
  generatePmsCsv,
  getBookingsForExport,
  updateBookingOperationalStatus,
  PMS_CSV_HEADERS,
} from "./export";

const prisma = new PrismaClient();

describe("export.ts - Hotel PMS CSV Exporter & Front Desk Operations", () => {
  let sampleBooking: any;

  beforeEach(() => {
    sampleBooking = {
      bookingNumber: "EST-2026-9999",
      guestName: 'Ravi Kumar, Jr.',
      guestEmail: "ravi.kumar@example.com",
      guestPhone: "+91 98765 43210",
      roomType: { name: "Planter's Heritage Room" },
      checkIn: "2026-11-15",
      checkOut: "2026-11-17",
      totalNights: 2,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentReference: "MOCK-PAY-99999",
      baseTariffTotal: 13000,
      discountAmount: 1300,
      netTaxableAmount: 11700,
      gstRatePercent: 12,
      gstAmount: 1404,
      grandTotal: 13104,
      promoCode: "COFFEE10",
      createdAt: new Date("2026-11-01T10:00:00Z"),
    };
  });

  describe("escapeCsvField", () => {
    it("returns empty string for null or undefined", () => {
      expect(escapeCsvField(null)).toBe("");
      expect(escapeCsvField(undefined)).toBe("");
    });

    it("returns plain text without quotes if no comma or quotes present", () => {
      expect(escapeCsvField("StandardText")).toBe("StandardText");
      expect(escapeCsvField(12345)).toBe("12345");
    });

    it("escapes fields containing commas with enclosing quotes", () => {
      expect(escapeCsvField("Ravi Kumar, Jr.")).toBe('"Ravi Kumar, Jr."');
    });

    it("escapes fields containing quotes by doubling quotes", () => {
      expect(escapeCsvField('Room "Deluxe" View')).toBe('"Room ""Deluxe"" View"');
    });

    it("escapes fields with newlines", () => {
      expect(escapeCsvField("Line1\nLine2")).toBe('"Line1\nLine2"');
    });
  });

  describe("formatBookingToExportRow", () => {
    it("formats booking into typed export row with correct statutory SAC and split GST", () => {
      const row = formatBookingToExportRow(sampleBooking);
      expect(row.bookingNumber).toBe("EST-2026-9999");
      expect(row.roomType).toBe("Planter's Heritage Room");
      expect(row.sacCode).toBe("996311");
      expect(row.cgstAmount).toBe(702);
      expect(row.sgstAmount).toBe(702);
      expect(row.grandTotal).toBe(13104);
      expect(row.promoCode).toBe("COFFEE10");
    });

    it("handles missing roomType and promoCode gracefully", () => {
      const row = formatBookingToExportRow({
        ...sampleBooking,
        roomType: null,
        promoCode: null,
      });
      expect(row.roomType).toBe("Standard Room");
      expect(row.promoCode).toBe("NONE");
    });
  });

  describe("generatePmsCsv", () => {
    it("generates a valid CSV string with headers and data rows", () => {
      const csv = generatePmsCsv([sampleBooking]);
      const lines = csv.split("\r\n");

      // Verify header line
      expect(lines.length).toBe(2);
      expect(lines[0]).toContain("Booking Reference");
      expect(lines[0]).toContain("Statutory SAC Code");

      // Verify data line
      const dataLine = lines[1];
      expect(dataLine).toContain("EST-2026-9999");
      expect(dataLine).toContain('"Ravi Kumar, Jr."'); // Properly escaped
      expect(dataLine).toContain("996311");
      expect(dataLine).toContain("13104.00");
    });

    it("generates only header row when bookings array is empty with UTF-8 BOM", () => {
      const csv = generatePmsCsv([]);
      expect(csv).toBe("\uFEFF" + PMS_CSV_HEADERS.map(escapeCsvField).join(","));
    });
  });

  describe("Database Operations - getBookingsForExport & updateBookingOperationalStatus", () => {
    let testBookingId: string;
    let testBookingNumber: string;

    beforeEach(async () => {
      const roomType = await prisma.roomType.findFirst();
      if (!roomType) throw new Error("No room type");

      const created = await prisma.booking.create({
        data: {
          bookingNumber: `EST-TEST-CSV-${Date.now()}`,
          guestName: "PMS Test Guest",
          guestEmail: "pmstest@example.com",
          guestPhone: "+91 99999 11111",
          roomTypeId: roomType.id,
          checkIn: "2026-11-20",
          checkOut: "2026-11-22",
          totalNights: 2,
          baseTariffTotal: 14000,
          discountAmount: 0,
          netTaxableAmount: 14000,
          gstRatePercent: 12,
          gstAmount: 1680,
          grandTotal: 15680,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentReference: "TEST-REF-999",
        },
      });
      testBookingId = created.id;
      testBookingNumber = created.bookingNumber;
    });

    afterAll(async () => {
      await prisma.booking.deleteMany({
        where: { guestEmail: "pmstest@example.com" },
      });
      await prisma.$disconnect();
    });

    it("retrieves bookings filtered by search", async () => {
      const results = await getBookingsForExport({ search: "pmstest@example.com" });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((b) => b.id === testBookingId)).toBe(true);
    });

    it("updates booking operational status to CHECKED_IN and CHECKED_OUT", async () => {
      const checkedIn = await updateBookingOperationalStatus(testBookingId, "CHECKED_IN");
      expect(checkedIn.status).toBe("CHECKED_IN");

      const checkedOut = await updateBookingOperationalStatus(testBookingId, "CHECKED_OUT");
      expect(checkedOut.status).toBe("CHECKED_OUT");

      const fetched = await prisma.booking.findUnique({
        where: { id: testBookingId },
      });
      expect(fetched?.status).toBe("CHECKED_OUT");
    });

    it("throws error for non-existent booking status update", async () => {
      await expect(
        updateBookingOperationalStatus("NON-EXISTENT-ID", "CHECKED_IN")
      ).rejects.toThrow("not found");
    });
  });
});
