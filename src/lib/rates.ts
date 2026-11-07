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
        OR: [
          { roomTypeId: targetRoomTypeId ? targetRoomTypeId : undefined },
          { roomTypeId: null }, // resort-wide
        ],
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
      const availableKeys = Math.max(0, websiteAllotment - bookedCount);

      const specificBlackout = blackoutMap.get(`${rt.id}_${d}`);
      const resortBlackout = blackoutMap.get(`RESORT_${d}`);
      const activeBlackout = specificBlackout || resortBlackout;

      return {
        date: d,
        pricePerNight,
        isCustomRate: customRate !== undefined,
        websiteAllotment,
        bookedCount,
        availableKeys,
        isBlackout: !!activeBlackout,
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
 * Sets a blackout date (roomTypeId = null for resort-wide blackout)
 */
export async function setBlackoutDate(
  roomTypeId: string | null,
  date: string,
  reason: string
) {
  if (!reason || reason.trim().length === 0) {
    throw new Error("A reason must be provided for blackout dates");
  }

  // If resort-wide, check if already blacked out
  if (!roomTypeId) {
    const existing = await prisma.blackoutDate.findFirst({
      where: { date, roomTypeId: null },
    });
    if (existing) {
      return prisma.blackoutDate.update({
        where: { id: existing.id },
        data: { reason: reason.trim() },
      });
    }
    return prisma.blackoutDate.create({
      data: {
        date,
        reason: reason.trim(),
        roomTypeId: null,
      },
    });
  }

  return prisma.blackoutDate.upsert({
    where: {
      roomTypeId_date: {
        roomTypeId,
        date,
      },
    },
    update: {
      reason: reason.trim(),
    },
    create: {
      roomTypeId,
      date,
      reason: reason.trim(),
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
