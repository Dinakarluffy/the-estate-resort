import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface PromoValidationResult {
  isValid: boolean;
  code?: string;
  discountPercent?: number;
  discountAmount?: number;
  maxDiscount?: number | null;
  error?: string;
}

/**
 * Validates a promo code against the database rules and computes the eligible discount.
 * 
 * @param code The promo code entered by the guest (e.g. "COFFEE10")
 * @param baseTariffTotal The total accommodation tariff before discount (in INR)
 * @param checkInDate The date of stay or booking in "YYYY-MM-DD" format
 * @param dbClient Optional PrismaClient instance for testing / transactions
 */
export async function validateAndApplyPromo(
  code: string,
  baseTariffTotal: number,
  checkInDate: string = new Date().toISOString().split("T")[0],
  dbClient: PrismaClient = prisma
): Promise<PromoValidationResult> {
  const normalizedCode = code?.trim().toUpperCase();

  if (!normalizedCode) {
    return { isValid: false, error: "Please enter a promo code" };
  }

  if (baseTariffTotal <= 0) {
    return { isValid: false, error: "Booking amount must be greater than zero to apply a promo code" };
  }

  const promo = await dbClient.promoCode.findUnique({
    where: { code: normalizedCode },
  });

  if (!promo) {
    return { isValid: false, error: "Invalid promo code" };
  }

  if (!promo.isActive) {
    return { isValid: false, error: "This promo code is no longer active" };
  }

  // Date validity check
  if (checkInDate < promo.validFrom || checkInDate > promo.validTo) {
    return { isValid: false, error: "This promo code has expired or is not yet valid for these dates" };
  }

  // Max usage check
  if (promo.currentUses >= promo.maxUses) {
    return { isValid: false, error: "This promo code has reached its maximum redemption limit" };
  }

  // Minimum booking tariff check
  if (promo.minTariff && baseTariffTotal < promo.minTariff) {
    return {
      isValid: false,
      error: `Minimum booking tariff of ₹${promo.minTariff.toLocaleString("en-IN")} required to use this code`,
    };
  }

  // Calculate discount percentage
  let calculatedDiscount = (baseTariffTotal * promo.discountPercent) / 100;

  // Apply maximum cap if specified
  if (promo.maxDiscount && calculatedDiscount > promo.maxDiscount) {
    calculatedDiscount = promo.maxDiscount;
  }

  // Never discount more than the base tariff
  calculatedDiscount = Math.min(calculatedDiscount, baseTariffTotal);
  calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

  return {
    isValid: true,
    code: promo.code,
    discountPercent: promo.discountPercent,
    discountAmount: calculatedDiscount,
    maxDiscount: promo.maxDiscount,
  };
}

/**
 * Increments the promo redemption count upon confirmed booking
 */
export async function incrementPromoUsage(
  code: string,
  dbClient: PrismaClient = prisma
): Promise<void> {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return;

  await dbClient.promoCode.update({
    where: { code: normalizedCode },
    data: { currentUses: { increment: 1 } },
  });
}
