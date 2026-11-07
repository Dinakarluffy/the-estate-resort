import { describe, it, expect } from "vitest";
import { getGSTRatePercent, calculateTariffGST } from "./gst";

describe("gst.ts - Statutory Indian Hotel GST Engine", () => {
  describe("getGSTRatePercent() - Threshold Boundary Tests", () => {
    it("returns 12% GST for tariff below ₹7,500", () => {
      expect(getGSTRatePercent(4500)).toBe(12);
      expect(getGSTRatePercent(6500)).toBe(12); // Planter's Heritage Room
    });

    it("returns 12% GST for tariff exactly at ₹7,500 threshold", () => {
      expect(getGSTRatePercent(7500)).toBe(12);
    });

    it("returns 18% GST for tariff just above ₹7,500 threshold", () => {
      expect(getGSTRatePercent(7501)).toBe(18);
    });

    it("returns 18% GST for luxury tariff above ₹7,500", () => {
      expect(getGSTRatePercent(9500)).toBe(18); // Coffee Estate Luxury Suite
      expect(getGSTRatePercent(16000)).toBe(18); // Misty Valley Pool Villa
    });
  });

  describe("calculateTariffGST() - Full Calculation & Breakdown", () => {
    it("calculates 12% GST accurately for 1 night of Planter's Heritage Room (₹6,500)", () => {
      const breakdown = calculateTariffGST(6500, 1);

      expect(breakdown.ratePerNight).toBe(6500);
      expect(breakdown.nights).toBe(1);
      expect(breakdown.baseTotal).toBe(6500);
      expect(breakdown.discountAmount).toBe(0);
      expect(breakdown.netTaxableAmount).toBe(6500);
      expect(breakdown.gstRatePercent).toBe(12);
      expect(breakdown.cgstPercent).toBe(6);
      expect(breakdown.sgstPercent).toBe(6);
      expect(breakdown.cgstAmount).toBe(390); // 6% of 6,500
      expect(breakdown.sgstAmount).toBe(390); // 6% of 6,500
      expect(breakdown.gstAmount).toBe(780); // 12% of 6,500
      expect(breakdown.grandTotal).toBe(7280); // 6500 + 780
    });

    it("calculates 18% GST accurately for 2 nights of Luxury Suite (₹9,500/night)", () => {
      const breakdown = calculateTariffGST(9500, 2);

      expect(breakdown.baseTotal).toBe(19000); // 9500 * 2
      expect(breakdown.gstRatePercent).toBe(18);
      expect(breakdown.cgstAmount).toBe(1710); // 9% of 19000
      expect(breakdown.sgstAmount).toBe(1710); // 9% of 19000
      expect(breakdown.gstAmount).toBe(3420); // 18% of 19000
      expect(breakdown.grandTotal).toBe(22420); // 19000 + 3420
    });

    it("calculates multi-night stay with discount applied before GST", () => {
      // 3 nights at ₹16,000/night = ₹48,000 base
      // With ₹2,000 discount = ₹46,000 net taxable
      const breakdown = calculateTariffGST(16000, 3, 2000);

      expect(breakdown.baseTotal).toBe(48000);
      expect(breakdown.discountAmount).toBe(2000);
      expect(breakdown.netTaxableAmount).toBe(46000);
      expect(breakdown.gstRatePercent).toBe(18);
      expect(breakdown.cgstAmount).toBe(4140); // 9% of 46,000
      expect(breakdown.sgstAmount).toBe(4140); // 9% of 46,000
      expect(breakdown.gstAmount).toBe(8280); // 18% of 46,000
      expect(breakdown.grandTotal).toBe(54280); // 46000 + 8280
    });

    it("caps discount amount to base total if discount exceeds base price", () => {
      const breakdown = calculateTariffGST(5000, 1, 99999);
      expect(breakdown.discountAmount).toBe(5000);
      expect(breakdown.netTaxableAmount).toBe(0);
      expect(breakdown.gstAmount).toBe(0);
      expect(breakdown.grandTotal).toBe(0);
    });

    it("throws error for non-positive rate or invalid nights", () => {
      expect(() => calculateTariffGST(0, 2)).toThrow("greater than zero");
      expect(() => calculateTariffGST(-500, 2)).toThrow("greater than zero");
      expect(() => calculateTariffGST(6500, 0)).toThrow("integer greater than zero");
      expect(() => calculateTariffGST(6500, 1.5)).toThrow("integer greater than zero");
    });
  });
});
