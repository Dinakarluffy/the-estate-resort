import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface BookingExportRow {
  bookingNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  status: string;
  paymentStatus: string;
  paymentReference: string;
  baseTariffTotal: number;
  discountAmount: number;
  netTaxableAmount: number;
  gstRatePercent: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  sacCode: string;
  promoCode: string;
  createdAt: string;
}

export const PMS_CSV_HEADERS: (keyof BookingExportRow | string)[] = [
  "Booking Reference",
  "Guest Full Name",
  "Guest Email",
  "Guest Phone",
  "Room Category",
  "Check-In Date",
  "Check-Out Date",
  "Duration (Nights)",
  "Reservation Status",
  "Payment Status",
  "Payment Reference",
  "Base Tariff (INR)",
  "Discount Applied (INR)",
  "Net Taxable Value (INR)",
  "GST Slab Rate (%)",
  "CGST (INR)",
  "SGST (INR)",
  "Total Paid (INR)",
  "Statutory SAC Code",
  "Promo Code Used",
  "Booking Timestamp",
];

/**
 * Escapes CSV field value according to RFC 4180 specifications
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a single booking record into a typed export row
 */
export function formatBookingToExportRow(booking: {
  bookingNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomType?: { name: string } | null;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  status: string;
  paymentStatus: string;
  paymentReference: string;
  baseTariffTotal: number;
  discountAmount: number;
  netTaxableAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  grandTotal: number;
  promoCode?: string | null;
  createdAt: Date | string;
}): BookingExportRow {
  const halfGst = Math.round((booking.gstAmount / 2) * 100) / 100;
  const createdAtIso =
    booking.createdAt instanceof Date
      ? booking.createdAt.toISOString()
      : String(booking.createdAt);

  return {
    bookingNumber: booking.bookingNumber,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    roomType: booking.roomType?.name || "Standard Room",
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    totalNights: booking.totalNights,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentReference: booking.paymentReference,
    baseTariffTotal: booking.baseTariffTotal,
    discountAmount: booking.discountAmount,
    netTaxableAmount: booking.netTaxableAmount,
    gstRatePercent: booking.gstRatePercent,
    cgstAmount: halfGst,
    sgstAmount: halfGst,
    grandTotal: booking.grandTotal,
    sacCode: "996311",
    promoCode: booking.promoCode || "NONE",
    createdAt: createdAtIso,
  };
}

/**
 * Generates an RFC 4180 compliant CSV string for hotel PMS import
 */
export function generatePmsCsv(bookings: Parameters<typeof formatBookingToExportRow>[0][]): string {
  const headerLine = PMS_CSV_HEADERS.map(escapeCsvField).join(",");
  const lines: string[] = [headerLine];

  for (const b of bookings) {
    const row = formatBookingToExportRow(b);
    const line = [
      escapeCsvField(row.bookingNumber),
      escapeCsvField(row.guestName),
      escapeCsvField(row.guestEmail),
      escapeCsvField(row.guestPhone),
      escapeCsvField(row.roomType),
      escapeCsvField(row.checkIn),
      escapeCsvField(row.checkOut),
      escapeCsvField(row.totalNights),
      escapeCsvField(row.status),
      escapeCsvField(row.paymentStatus),
      escapeCsvField(row.paymentReference),
      escapeCsvField(row.baseTariffTotal.toFixed(2)),
      escapeCsvField(row.discountAmount.toFixed(2)),
      escapeCsvField(row.netTaxableAmount.toFixed(2)),
      escapeCsvField(`${row.gstRatePercent}%`),
      escapeCsvField(row.cgstAmount.toFixed(2)),
      escapeCsvField(row.sgstAmount.toFixed(2)),
      escapeCsvField(row.grandTotal.toFixed(2)),
      escapeCsvField(row.sacCode),
      escapeCsvField(row.promoCode),
      escapeCsvField(row.createdAt),
    ].join(",");

    lines.push(line);
  }

  return lines.join("\r\n");
}

/**
 * Retrieves filtered bookings from the database for export or front desk table
 */
export async function getBookingsForExport(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  roomTypeId?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters?.roomTypeId && filters.roomTypeId !== "ALL") {
    where.roomTypeId = filters.roomTypeId;
  }

  if (filters?.startDate && filters?.endDate) {
    where.checkIn = { gte: filters.startDate, lte: filters.endDate };
  } else if (filters?.startDate) {
    where.checkIn = { gte: filters.startDate };
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const query = filters.search.trim();
    where.OR = [
      { bookingNumber: { contains: query } },
      { guestName: { contains: query } },
      { guestEmail: { contains: query } },
      { guestPhone: { contains: query } },
    ];
  }

  return prisma.booking.findMany({
    where,
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { checkIn: "asc" },
  });
}

/**
 * Updates booking operational status (e.g., front desk marks as CHECKED_IN)
 */
export async function updateBookingOperationalStatus(
  idOrBookingNumber: string,
  newStatus: "CONFIRMED" | "CHECKED_IN" | "CANCELLED"
) {
  const existing = await prisma.booking.findFirst({
    where: {
      OR: [{ id: idOrBookingNumber }, { bookingNumber: idOrBookingNumber }],
    },
  });

  if (!existing) {
    throw new Error(`Booking ${idOrBookingNumber} not found`);
  }

  return prisma.booking.update({
    where: { id: existing.id },
    data: { status: newStatus },
  });
}
