import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface DailyMatrixItem {
  date: string;
  pricePerNight: number;
  isCustomRate: boolean;
  websiteAllotment: number;
  bookedCount: number;
  availableKeys: number;
  isBlackout: boolean;
  blackoutReason?: string | null;
  blackoutId?: string | null;
}

export interface RoomTypeMatrix {
  roomType: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    totalKeys: number;
    defaultAllotment: number;
  };
  calendar: DailyMatrixItem[];
}

/**
 * Helper to generate a continuous array of ISO "YYYY-MM-DD" dates between start and end (inclusive)
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startDate);
  const end = new Date(endDate);

  while (curr <= end) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Retrieves 45-day (or custom range) Rate, Allotment, and Blackout matrix for admin dashboard
 */
export async function getRatesAndAllotmentsMatrix(
  startDate?: string,
  endDate?: string,
  targetRoomTypeId?: string
): Promise<RoomTypeMatrix[]> {
  const start = startDate || new Date().toISOString().split("T")[0];
  const defaultEnd = new Date(start);
  defaultEnd.setDate(defaultEnd.getDate() + 44); // 45 days total
  const end = endDate || defaultEnd.toISOString().split("T")[0];

  const dateList = generateDateRange(start, end);

  // 1. Fetch Room Types
  const roomTypes = await prisma.roomType.findMany({
    where: targetRoomTypeId ? { id: targetRoomTypeId } : undefined,
    orderBy: { basePrice: "asc" },
  });

  // 2. Fetch all rates, allotments, and blackouts in range
  const [rates, allotments, blackouts] = await Promise.all([
    prisma.rate.findMany({
      where: {
        date: { gte: start, lte: end },
        roomTypeId: targetRoomTypeId ? targetRoomTypeId : undefined,
      },
    }),
    prisma.allotment.findMany({
      where: {
        date: { gte: start, lte: end },
        roomTypeId: targetRoomTypeId ? targetRoomTypeId : undefined,
      },
    }),
    prisma.blackoutDate.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(targetRoomTypeId
          ? {
              OR: [
                { roomTypeId: targetRoomTypeId },
                { roomTypeId: null },
              ],
            }
          : {}),
      },
    }),
  ]);

  // Index maps for O(1) fast lookup
  const rateMap = new Map<string, number>();
  for (const r of rates) {
    rateMap.set(`${r.roomTypeId}_${r.date}`, r.pricePerNight);
  }

  const allotmentMap = new Map<string, { websiteAllotment: number; bookedCount: number }>();
  for (const a of allotments) {
    allotmentMap.set(`${a.roomTypeId}_${a.date}`, {
      websiteAllotment: a.websiteAllotment,
      bookedCount: a.bookedCount,
    });
  }

  const blackoutMap = new Map<string, { id: string; reason: string }>();
  for (const b of blackouts) {
    if (b.roomTypeId) {
      blackoutMap.set(`${b.roomTypeId}_${b.date}`, { id: b.id, reason: b.reason });
    } else {
      blackoutMap.set(`RESORT_${b.date}`, { id: b.id, reason: b.reason });
    }
  }

  return roomTypes.map((rt) => {
    const calendar: DailyMatrixItem[] = dateList.map((d) => {
      const customRate = rateMap.get(`${rt.id}_${d}`);
      const pricePerNight = customRate ?? rt.basePrice;

      const alt = allotmentMap.get(`${rt.id}_${d}`);
      const websiteAllotment = alt ? alt.websiteAllotment : rt.defaultAllotment;
      const bookedCount = alt ? alt.bookedCount : 0;
      const specificBlackout = blackoutMap.get(`${rt.id}_${d}`);
      const resortBlackout = blackoutMap.get(`RESORT_${d}`);
      const activeBlackout = specificBlackout || resortBlackout;
      const isBlackout = !!activeBlackout;
      const availableKeys = isBlackout ? 0 : Math.max(0, websiteAllotment - bookedCount);

      return {
        date: d,
        pricePerNight,
        isCustomRate: customRate !== undefined,
        websiteAllotment,
        bookedCount,
        availableKeys,
        isBlackout,
        blackoutReason: activeBlackout?.reason || null,
        blackoutId: activeBlackout?.id || null,
      };
    });

    return {
      roomType: {
        id: rt.id,
        name: rt.name,
        slug: rt.slug,
        basePrice: rt.basePrice,
        totalKeys: rt.totalKeys,
        defaultAllotment: rt.defaultAllotment,
      },
      calendar,
    };
  });
}

/**
 * Updates a single day's rate for a specific room type
 */
export async function updateDailyRate(
  roomTypeId: string,
  date: string,
  pricePerNight: number
) {
  if (pricePerNight <= 0) {
    throw new Error("Nightly rate must be greater than 0");
  }

  return prisma.rate.upsert({
    where: {
      roomTypeId_date: {
        roomTypeId,
        date,
      },
    },
    update: {
      pricePerNight,
    },
    create: {
      roomTypeId,
      date,
      pricePerNight,
    },
  });
}

/**
 * Bulk updates rates across a date range
 */
export async function bulkUpdateDailyRates(
  roomTypeId: string,
  startDate: string,
  endDate: string,
  pricePerNight: number
) {
  if (pricePerNight <= 0) {
    throw new Error("Nightly rate must be greater than 0");
  }
  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }

  const dates = generateDateRange(startDate, endDate);
  const results = [];

  for (const date of dates) {
    const res = await updateDailyRate(roomTypeId, date, pricePerNight);
    results.push(res);
  }

  return results;
}

/**
 * Updates website allotment for a room type on a specific date.
 * Enforces critical hospitality rule: Cannot reduce allotment below already booked keys!
 */
export async function updateWebsiteAllotment(
  roomTypeId: string,
  date: string,
  websiteAllotment: number
) {
  if (websiteAllotment < 0) {
    throw new Error("Website allotment cannot be negative");
  }

  const existing = await prisma.allotment.findUnique({
    where: {
      roomTypeId_date: {
        roomTypeId,
        date,
      },
    },
  });

  const currentBooked = existing?.bookedCount || 0;
  if (websiteAllotment < currentBooked) {
    throw new Error(
      `Cannot reduce website allotment to ${websiteAllotment}: ${currentBooked} rooms are already booked for this date.`
    );
  }

  return prisma.allotment.upsert({
    where: {
      roomTypeId_date: {
        roomTypeId,
        date,
      },
    },
    update: {
      websiteAllotment,
    },
    create: {
      roomTypeId,
      date,
      websiteAllotment,
      bookedCount: 0,
    },
  });
}

/**
 * Inspects a date for existing blackouts or active guest reservations before scheduling
 */
export async function checkBlackoutPreconditions(date: string, roomTypeId: string | null) {
  const [resortWide, specificRoom, activeBookings] = await Promise.all([
    prisma.blackoutDate.findFirst({
      where: { date, roomTypeId: null },
    }),
    roomTypeId
      ? prisma.blackoutDate.findFirst({
          where: { date, roomTypeId },
          include: { roomType: { select: { name: true } } },
        })
      : null,
    prisma.booking.findMany({
      where: {
        checkIn: { lte: date },
        checkOut: { gt: date },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        ...(roomTypeId ? { roomTypeId } : {}),
      },
      select: {
        bookingNumber: true,
        guestName: true,
        status: true,
        roomType: { select: { name: true } },
      },
    }),
  ]);

  return {
    isResortWideBlocked: !!resortWide,
    resortWideReason: resortWide?.reason || null,
    isRoomTypeBlocked: !!specificRoom,
    roomTypeReason: specificRoom?.reason || null,
    roomTypeName: specificRoom?.roomType?.name || null,
    activeBookingsCount: activeBookings.length,
    activeBookings: activeBookings.map((b) => ({
      bookingNumber: b.bookingNumber,
      guestName: b.guestName,
      roomType: b.roomType.name,
    })),
  };
}

/**
 * Sets a blackout date (roomTypeId = null for resort-wide blackout).
 * Enforces real-world hospitality hierarchy:
 * 1. If date is already blocked Resort-Wide, individual room types cannot be redundantly blacked out.
 * 2. If scheduling Resort-Wide, any individual room blackouts on that date are consolidated.
 */
export async function setBlackoutDate(
  roomTypeId: string | null,
  date: string,
  reason: string
) {
  if (!reason || reason.trim().length === 0) {
    throw new Error("A reason must be provided for blackout dates");
  }

  const trimmedReason = reason.trim();

  // 1. Room-specific blackout requested
  if (roomTypeId) {
    // Check if Resort-Wide blackout already exists for this date
    const existingResort = await prisma.blackoutDate.findFirst({
      where: { date, roomTypeId: null },
    });

    if (existingResort) {
      throw new Error(
        `Date ${date} is already blocked Resort-Wide ("${existingResort.reason}"). All 76 rooms are already closed for online booking.`
      );
    }

    return prisma.blackoutDate.upsert({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date,
        },
      },
      update: {
        reason: trimmedReason,
      },
      create: {
        roomTypeId,
        date,
        reason: trimmedReason,
      },
    });
  }

  // 2. Resort-wide blackout requested (all 76 keys)
  // Clean up any individual room blackouts for this date so they don't duplicate under resort-wide
  await prisma.blackoutDate.deleteMany({
    where: {
      date,
      roomTypeId: { not: null },
    },
  });

  const existingResort = await prisma.blackoutDate.findFirst({
    where: { date, roomTypeId: null },
  });

  if (existingResort) {
    return prisma.blackoutDate.update({
      where: { id: existingResort.id },
      data: { reason: trimmedReason },
    });
  }

  return prisma.blackoutDate.create({
    data: {
      date,
      reason: trimmedReason,
      roomTypeId: null,
    },
  });
}

/**
 * Removes a blackout date
 */
export async function removeBlackoutDate(id: string) {
  return prisma.blackoutDate.delete({
    where: { id },
  });
}

/**
 * Fetches all scheduled blackout dates
 */
export async function getAllBlackoutDates() {
  return prisma.blackoutDate.findMany({
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });
}

/**
 * Creates or updates a promotional voucher code
 */
export async function createPromoCode(data: {
  code: string;
  discountPercent: number;
  maxDiscount?: number | null;
  minTariff?: number | null;
  validFrom: string;
  validTo: string;
  maxUses?: number;
}) {
  const normalizedCode = data.code.trim().toUpperCase();
  if (data.discountPercent <= 0 || data.discountPercent > 100) {
    throw new Error("Discount percentage must be between 1 and 100");
  }
  if (data.validFrom > data.validTo) {
    throw new Error("Valid from date must precede or match valid to date");
  }

  return prisma.promoCode.create({
    data: {
      code: normalizedCode,
      discountPercent: data.discountPercent,
      maxDiscount: data.maxDiscount || null,
      minTariff: data.minTariff || null,
      validFrom: data.validFrom,
      validTo: data.validTo,
      maxUses: data.maxUses ?? 100,
      isActive: true,
    },
  });
}

/**
 * Toggles or updates promo code status
 */
export async function togglePromoCodeStatus(id: string, isActive: boolean) {
  return prisma.promoCode.update({
    where: { id },
    data: { isActive },
  });
}

/**
 * Lists all promo codes
 */
export async function getAllPromoCodes() {
  return prisma.promoCode.findMany({
    orderBy: { validFrom: "desc" },
  });
}
