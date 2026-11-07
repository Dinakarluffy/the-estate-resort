/**
 * Indian Statutory Hotel Accommodation GST Engine
 * 
 * Rules defined under Indian GST council regulations for hotel rooms:
 * - Declared room tariff per unit per day <= ₹7,500: 12% GST (6% CGST + 6% SGST)
 * - Declared room tariff per unit per day > ₹7,500:  18% GST (9% CGST + 9% SGST)
 */

export interface GSTBreakdown {
  ratePerNight: number;
  nights: number;
  baseTotal: number;
  discountAmount: number;
  netTaxableAmount: number;
  gstRatePercent: 12 | 18;
  cgstPercent: 6 | 9;
  sgstPercent: 6 | 9;
  cgstAmount: number;
  sgstAmount: number;
  gstAmount: number;
  grandTotal: number;
}

/**
 * Returns the statutory Indian GST rate (12% or 18%) for a given nightly room tariff.
 * Under Indian GST law, the threshold is ₹7,500 per day.
 */
export function getGSTRatePercent(ratePerNight: number): 12 | 18 {
  if (ratePerNight <= 7500) {
    return 12;
  }
  return 18;
}

/**
 * Calculates complete Indian Hotel GST breakdown for a stay.
 * 
 * @param ratePerNight Base room price per night in INR
 * @param nights Total number of nights
 * @param discountAmount Any promo discount applied to base tariff (in INR)
 */
export function calculateTariffGST(
  ratePerNight: number,
  nights: number,
  discountAmount: number = 0
): GSTBreakdown {
  if (ratePerNight <= 0) {
    throw new Error("Room rate per night must be greater than zero");
  }
  if (nights <= 0 || !Number.isInteger(nights)) {
    throw new Error("Number of nights must be an integer greater than zero");
  }

  const baseTotal = Math.round(ratePerNight * nights * 100) / 100;
  const safeDiscount = Math.min(Math.max(0, discountAmount), baseTotal);
  const netTaxableAmount = Math.round((baseTotal - safeDiscount) * 100) / 100;

  // The GST slab percentage is determined by the declared tariff per night
  const gstRatePercent = getGSTRatePercent(ratePerNight);
  const halfRate = gstRatePercent / 2; // e.g. 6% or 9%

  const cgstAmount = Math.round(((netTaxableAmount * halfRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((netTaxableAmount * halfRate) / 100) * 100) / 100;
  const gstAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;

  const grandTotal = Math.round((netTaxableAmount + gstAmount) * 100) / 100;

  return {
    ratePerNight,
    nights,
    baseTotal,
    discountAmount: safeDiscount,
    netTaxableAmount,
    gstRatePercent,
    cgstPercent: halfRate as 6 | 9,
    sgstPercent: halfRate as 6 | 9,
    cgstAmount,
    sgstAmount,
    gstAmount,
    grandTotal,
  };
}

/**
 * Standard Indian Rupee currency formatter (e.g. ₹9,500)
 */
export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

