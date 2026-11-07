import { PrismaClient, Booking } from "@prisma/client";
import { checkRoomAvailability, atomicReserveAllotment, atomicReleaseAllotment, getDateRangeArray } from "./allotment";
import { calculateTariffGST } from "./gst";
import { validateAndApplyPromo, incrementPromoUsage } from "./promo";

const prisma = new PrismaClient();

export interface CreateBookingInput {
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  promoCode?: string;
  paymentReference: string;
  keysCount?: number;
}

export interface BookingDetails extends Booking {
  roomType: {
    name: string;
    slug: string;
    basePrice: number;
    photos: string;
  };
}

/**
 * Generates an authoritative resort booking reference number:
 * Format: EST-2026-XXXX (e.g. EST-2026-4821)
 */
export function generateBookingNumber(): string {
  const year = 2026;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EST-${year}-${random}`;
}

/**
 * Core Booking Creation Engine:
 * 1. Validates inputs & dates
 * 2. Checks live availability & rates
 * 3. Applies promo discount if code provided
 * 4. Atomically reserves room allotment inside a database transaction (Overbooking protection)
 * 5. Computes statutory Indian GST slabs (12% vs 18%)
 * 6. Records confirmed booking with unique reference ID
 * 7. Increments promo usage if applied
 */
export async function createBooking(
  input: CreateBookingInput,
  dbClient: PrismaClient = prisma
): Promise<Booking> {
  const {
    userId,
    guestName,
    guestEmail,
    guestPhone,
    roomTypeId,
    checkIn,
    checkOut,
    promoCode,
    paymentReference,
    keysCount = 1,
  } = input;

  if (!guestName || guestName.trim().length < 2) {
    throw new Error("Guest name is required (minimum 2 characters)");
  }

  if (!guestEmail || !guestEmail.includes("@")) {
    throw new Error("A valid guest email address is required");
  }

  if (!guestPhone || guestPhone.trim().length < 8) {
    throw new Error("A valid guest contact phone number is required");
  }

  if (!paymentReference) {
    throw new Error("Payment reference is required to confirm booking");
  }

  // 1. Check live availability and pricing
  const availability = await checkRoomAvailability(roomTypeId, checkIn, checkOut, dbClient);

  if (!availability.isAvailable) {
    throw new Error(
      availability.blackoutReason
        ? `Cannot book: ${availability.blackoutReason}`
        : "Selected room type is sold out for these dates"
    );
  }

  if (availability.availableKeys < keysCount) {
    throw new Error(
      `Insufficient website allotment. Available: ${availability.availableKeys}, Requested: ${keysCount}`
    );
  }

  // 2. Compute Promo Code Discount (if any)
  let discountAmount = 0;
  let normalizedPromo: string | undefined = undefined;

  if (promoCode && promoCode.trim().length > 0) {
    const promoResult = await validateAndApplyPromo(
      promoCode,
      availability.pricing.baseTotal,
      checkIn,
      dbClient
    );

    if (promoResult.isValid && promoResult.discountAmount) {
      discountAmount = promoResult.discountAmount;
      normalizedPromo = promoResult.code;
    }
  }

  // 3. Calculate full statutory GST breakdown with discount applied
  const finalPricing = calculateTariffGST(
    availability.pricing.ratePerNight,
    availability.nights,
    discountAmount
  );

  // 4. Atomically reserve room keys in allotment table (rolls back if another guest grabbed it first)
  await atomicReserveAllotment(roomTypeId, checkIn, checkOut, keysCount, dbClient);

  // 5. Generate unique booking number
  let bookingNumber = generateBookingNumber();
  let attempts = 0;
  while (attempts < 5) {
    const exists = await dbClient.booking.findUnique({
      where: { bookingNumber },
    });
    if (!exists) break;
    bookingNumber = generateBookingNumber();
    attempts++;
  }

  // 6. Persist confirmed booking record
  const booking = await dbClient.booking.create({
    data: {
      bookingNumber,
      userId: userId || null,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      guestPhone: guestPhone.trim(),
      roomTypeId,
      checkIn,
      checkOut,
      totalNights: availability.nights,
      baseTariffTotal: finalPricing.baseTotal,
      discountAmount: finalPricing.discountAmount,
      netTaxableAmount: finalPricing.netTaxableAmount,
      gstRatePercent: finalPricing.gstRatePercent,
      gstAmount: finalPricing.gstAmount,
      grandTotal: finalPricing.grandTotal,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentReference,
      promoCode: normalizedPromo || null,
    },
  });

  // 7. Increment promo usage counter if applied
  if (normalizedPromo) {
    await incrementPromoUsage(normalizedPromo, dbClient);
  }

  return booking;
}

/**
 * Retrieves a booking by its database ID with room details.
 */
export async function getBookingById(
  id: string,
  dbClient: PrismaClient = prisma
): Promise<BookingDetails | null> {
  return dbClient.booking.findUnique({
    where: { id },
    include: {
      roomType: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          photos: true,
        },
      },
    },
  });
}

/**
 * Retrieves a booking by its human-readable booking number (e.g. EST-2026-4821).
 */
export async function getBookingByNumber(
  bookingNumber: string,
  dbClient: PrismaClient = prisma
): Promise<BookingDetails | null> {
  return dbClient.booking.findUnique({
    where: { bookingNumber },
    include: {
      roomType: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          photos: true,
        },
      },
    },
  });
}

/**
 * Cancels a booking and atomically releases the website allotment back to inventory.
 */
export async function cancelBooking(
  bookingId: string,
  dbClient: PrismaClient = prisma
): Promise<Booking> {
  const booking = await dbClient.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error(`Booking with ID ${bookingId} not found`);
  }

  if (booking.status === "CANCELLED") {
    throw new Error("This booking has already been cancelled");
  }

  // Atomically release allotment back to available inventory
  await atomicReleaseAllotment(booking.roomTypeId, booking.checkIn, booking.checkOut, 1, dbClient);

  // Update booking status
  return dbClient.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      paymentStatus: "REFUNDED",
    },
  });
}

/**
 * Retrieves all bookings belonging to a specific guest.
 */
export async function getUserBookings(
  userId: string,
  dbClient: PrismaClient = prisma
): Promise<BookingDetails[]> {
  return dbClient.booking.findMany({
    where: { userId },
    include: {
      roomType: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          photos: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves all resort bookings with optional status filter (for staff & GM).
 */
export async function getAllBookings(
  status?: string,
  dbClient: PrismaClient = prisma
): Promise<BookingDetails[]> {
  return dbClient.booking.findMany({
    where: status ? { status } : undefined,
    include: {
      roomType: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          photos: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Checks if a guest already has an active CONFIRMED booking overlapping these dates for this room.
 * Overlap formula: existing.checkIn < newCheckOut AND existing.checkOut > newCheckIn
 */
export async function checkUserExistingBooking(
  userId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  dbClient: PrismaClient = prisma
): Promise<BookingDetails | null> {
  return dbClient.booking.findFirst({
    where: {
      userId,
      roomTypeId,
      status: "CONFIRMED",
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
    include: {
      roomType: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          photos: true,
        },
      },
    },
  });
}

export interface ExtendBookingResult {
  booking: BookingDetails;
  additionalNights: number;
  additionalBaseTariff: number;
  additionalGstAmount: number;
  additionalGrandTotal: number;
  paymentReference: string;
}

/**
 * Real-world stay extension engine:
 * 1. Checks if subsequent extension dates have available website allotment
 * 2. If room is occupied / sold out, rejects extension with clear message
 * 3. If available, atomically reserves extension dates
 * 4. Calculates additional pro-rated tariff + statutory GST
 * 5. Updates the booking stay duration and invoice totals
 */
export async function extendBookingStay(
  bookingId: string,
  newCheckOut: string,
  paymentReference: string,
  dbClient: PrismaClient = prisma
): Promise<ExtendBookingResult> {
  const booking = await dbClient.booking.findUnique({
    where: { id: bookingId },
    include: { roomType: true },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  if (booking.status !== "CONFIRMED") {
    throw new Error("Cannot extend a booking that is not confirmed");
  }

  if (newCheckOut <= booking.checkOut) {
    throw new Error(`New check-out date (${newCheckOut}) must be strictly after current check-out date (${booking.checkOut})`);
  }

  // Calculate additional nights
  const additionalDates = getDateRangeArray(booking.checkOut, newCheckOut);
  const additionalNights = additionalDates.length;

  // 1. Verify availability on requested extension dates
  const availability = await checkRoomAvailability(booking.roomTypeId, booking.checkOut, newCheckOut, dbClient);

  if (!availability.isAvailable) {
    throw new Error(
      availability.blackoutReason
        ? `Cannot extend stay: Date blocked (${availability.blackoutReason})`
        : `Cannot extend stay: All rooms of this type are fully occupied on the requested extension dates (${booking.checkOut} to ${newCheckOut}).`
    );
  }

  // 2. Compute pro-rated tariff and statutory GST for additional nights
  const additionalPricing = calculateTariffGST(
    booking.roomType.basePrice,
    additionalNights,
    0
  );

  // 3. Atomically reserve inventory for the extended dates
  await atomicReserveAllotment(booking.roomTypeId, booking.checkOut, newCheckOut, 1, dbClient);

  // 4. Update booking record
  const updated = await dbClient.booking.update({
    where: { id: bookingId },
    data: {
      checkOut: newCheckOut,
      totalNights: booking.totalNights + additionalNights,
      baseTariffTotal: booking.baseTariffTotal + additionalPricing.baseTotal,
      netTaxableAmount: booking.netTaxableAmount + additionalPricing.netTaxableAmount,
      gstAmount: booking.gstAmount + additionalPricing.gstAmount,
      grandTotal: booking.grandTotal + additionalPricing.grandTotal,
    },
    include: {
      roomType: {
        select: {
          name: true,
          slug: true,
          basePrice: true,
          photos: true,
        },
      },
    },
  });

  return {
    booking: updated,
    additionalNights,
    additionalBaseTariff: additionalPricing.baseTotal,
    additionalGstAmount: additionalPricing.gstAmount,
    additionalGrandTotal: additionalPricing.grandTotal,
    paymentReference,
  };
}
