import { PrismaClient } from "@prisma/client";
import { calculateTariffGST, GSTBreakdown } from "./gst";

const prisma = new PrismaClient();

export class OverbookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OverbookingError";
  }
}

export interface DailyRateAndAllotment {
  date: string;
  price: number;
  websiteAllotment: number;
  bookedCount: number;
  availableKeys: number;
  isBlackedOut: boolean;
}

export interface RoomAvailabilityResult {
  roomTypeId: string;
  roomTypeName: string;
  roomSlug: string;
  maxGuests: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  isAvailable: boolean;
  availableKeys: number;
  dailyRates: DailyRateAndAllotment[];
  pricing: GSTBreakdown;
  blackoutReason?: string;
  description: string;
  photos: string[];
  amenities: string[];
}

/**
 * Generates an array of "YYYY-MM-DD" date strings for each night of a stay.
 * A stay from 2026-11-14 to 2026-11-16 has 2 nights: ["2026-11-14", "2026-11-15"].
 */
export function getDateRangeArray(checkIn: string, checkOut: string): string[] {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  if (start >= end) {
    throw new Error("Check-out date must be strictly after check-in date.");
  }

  const dates: string[] = [];
  const current = new Date(start);

  while (current < end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Checks live availability and calculates rates with GST for a specific room type across dates.
 */
export async function checkRoomAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  dbClient: PrismaClient = prisma
): Promise<RoomAvailabilityResult> {
  const dates = getDateRangeArray(checkIn, checkOut);
  const nights = dates.length;

  const roomType = await dbClient.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      allotments: {
        where: { date: { in: dates } },
      },
      rates: {
        where: { date: { in: dates } },
      },
      blackoutDates: {
        where: { date: { in: dates } },
      },
    },
  });

  if (!roomType) {
    throw new Error(`Room type with ID ${roomTypeId} not found`);
  }

  // Also check for resort-wide blackout dates (roomTypeId is null)
  const resortWideBlackouts = await dbClient.blackoutDate.findMany({
    where: {
      roomTypeId: null,
      date: { in: dates },
    },
  });

  const dailyRates: DailyRateAndAllotment[] = [];
  let availableKeys = Infinity;
  let totalPrice = 0;
  let blackoutReason: string | undefined;

  for (const date of dates) {
    // 1. Blackout Check
    const specificBlackout = roomType.blackoutDates.find((b) => b.date === date);
    const resortBlackout = resortWideBlackouts.find((b) => b.date === date);
    const isBlackedOut = Boolean(specificBlackout || resortBlackout);

    if (isBlackedOut && !blackoutReason) {
      blackoutReason = specificBlackout?.reason || resortBlackout?.reason || "Date is blocked for private events";
    }

    // 2. Rate Check (Fallback to base price if no specific daily rate)
    const rateRecord = roomType.rates.find((r) => r.date === date);
    const price = rateRecord ? rateRecord.pricePerNight : roomType.basePrice;
    totalPrice += price;

    // 3. Website Allotment Check
    const allotmentRecord = roomType.allotments.find((a) => a.date === date);
    const websiteAllotment = allotmentRecord ? allotmentRecord.websiteAllotment : roomType.defaultAllotment;
    const bookedCount = allotmentRecord ? allotmentRecord.bookedCount : 0;
    const freeKeys = isBlackedOut ? 0 : Math.max(0, websiteAllotment - bookedCount);

    if (freeKeys < availableKeys) {
      availableKeys = freeKeys;
    }

    dailyRates.push({
      date,
      price,
      websiteAllotment,
      bookedCount,
      availableKeys: freeKeys,
      isBlackedOut,
    });
  }

  const finalAvailableKeys = availableKeys === Infinity ? 0 : availableKeys;
  const isAvailable = finalAvailableKeys > 0 && !blackoutReason;
  const avgNightlyRate = Math.round((totalPrice / nights) * 100) / 100;

  const pricing = calculateTariffGST(avgNightlyRate, nights, 0);

  let photos: string[] = [];
  let amenities: string[] = [];
  try {
    photos = JSON.parse(roomType.photos);
  } catch {
    photos = [];
  }
  try {
    amenities = JSON.parse(roomType.amenities);
  } catch {
    amenities = [];
  }

  return {
    roomTypeId: roomType.id,
    roomTypeName: roomType.name,
    roomSlug: roomType.slug,
    maxGuests: roomType.maxGuests,
    checkIn,
    checkOut,
    nights,
    isAvailable,
    availableKeys: finalAvailableKeys,
    dailyRates,
    pricing,
    blackoutReason,
    description: roomType.description,
    photos,
    amenities,
  };
}

/**
 * Checks availability across ALL room types at the resort (76 keys).
 */
export async function checkAllRoomsAvailability(
  checkIn: string,
  checkOut: string,
  guestCount?: number,
  dbClient: PrismaClient = prisma
): Promise<RoomAvailabilityResult[]> {
  const roomTypes = await dbClient.roomType.findMany({
    orderBy: { basePrice: "asc" },
  });

  const filtered = guestCount
    ? roomTypes.filter((rt) => rt.maxGuests >= guestCount)
    : roomTypes;

  const results = await Promise.all(
    filtered.map((rt) => checkRoomAvailability(rt.id, checkIn, checkOut, dbClient))
  );

  return results;
}

/**
 * THE HARD PART: Atomic allotment reservation with race-condition protection.
 * Ensures the website never overbooks agency inventory or exceeds admin allotment.
 * 
 * Executes inside an atomic database transaction. If any date has insufficient allotment,
 * it rolls back completely and throws an OverbookingError.
 */
export async function atomicReserveAllotment(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  keysRequested: number = 1,
  dbClient: PrismaClient = prisma
): Promise<{ success: boolean; reservedDates: string[] }> {
  const dates = getDateRangeArray(checkIn, checkOut);

  return dbClient.$transaction(async (tx) => {
    // 1. Check for blackouts
    const blackouts = await tx.blackoutDate.findMany({
      where: {
        OR: [{ roomTypeId }, { roomTypeId: null }],
        date: { in: dates },
      },
    });

    if (blackouts.length > 0) {
      throw new OverbookingError(
        `Cannot book: Date ${blackouts[0].date} is blocked (${blackouts[0].reason})`
      );
    }

    const roomType = await tx.roomType.findUnique({
      where: { id: roomTypeId },
    });

    if (!roomType) {
      throw new Error(`Room type ${roomTypeId} not found`);
    }

    // 2. Atomically verify and increment allotment for every date
    for (const date of dates) {
      const existing = await tx.allotment.findUnique({
        where: {
          roomTypeId_date: { roomTypeId, date },
        },
      });

      if (existing) {
        if (existing.bookedCount + keysRequested > existing.websiteAllotment) {
          throw new OverbookingError(
            `Allotment exhausted for ${date}. Available: ${existing.websiteAllotment - existing.bookedCount}, Requested: ${keysRequested}. Overbooking prevented.`
          );
        }

        await tx.allotment.update({
          where: { id: existing.id },
          data: {
            bookedCount: { increment: keysRequested },
          },
        });
      } else {
        // No allotment record existed yet for this date: initialize with roomType.defaultAllotment
        if (keysRequested > roomType.defaultAllotment) {
          throw new OverbookingError(
            `Requested keys (${keysRequested}) exceeds default website allotment (${roomType.defaultAllotment}) on ${date}`
          );
        }

        await tx.allotment.create({
          data: {
            roomTypeId,
            date,
            websiteAllotment: roomType.defaultAllotment,
            bookedCount: keysRequested,
          },
        });
      }
    }

    return { success: true, reservedDates: dates };
  });
}

/**
 * Atomically releases allotment back to website inventory upon booking cancellation.
 */
export async function atomicReleaseAllotment(
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  keysToRelease: number = 1,
  dbClient: PrismaClient = prisma
): Promise<{ success: boolean }> {
  const dates = getDateRangeArray(checkIn, checkOut);

  return dbClient.$transaction(async (tx) => {
    for (const date of dates) {
      const existing = await tx.allotment.findUnique({
        where: {
          roomTypeId_date: { roomTypeId, date },
        },
      });

      if (existing) {
        const newBookedCount = Math.max(0, existing.bookedCount - keysToRelease);
        await tx.allotment.update({
          where: { id: existing.id },
          data: { bookedCount: newBookedCount },
        });
      }
    }
    return { success: true };
  });
}
