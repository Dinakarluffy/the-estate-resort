import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { createBooking, getUserBookings, getAllBookings } from "@/lib/booking";
import { applyRateLimit, RATE_LIMIT_TIERS } from "@/lib/rateLimit";
import { sanitizeString, sanitizeEmail, sanitizePhone, sanitizePromoCode } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  // Phase 7: Rate limit direct booking creation (prevents bot hoarding)
  const rateLimitError = applyRateLimit(request, RATE_LIMIT_TIERS.BOOKING);
  if (rateLimitError) return rateLimitError;

  try {
    const sessionToken = request.cookies.get("estate_session")?.value;
    const user = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to complete a direct booking.",
          requiresLogin: true,
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      roomTypeId,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      guestPhone,
      promoCode,
      paymentReference,
      keysCount,
    } = body;

    if (!roomTypeId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: "Missing required booking details (roomTypeId, checkIn, checkOut)" },
        { status: 400 }
      );
    }

    const cleanedGuestName = guestName ? sanitizeString(guestName) : user.name;
    const cleanedGuestEmail = guestEmail ? sanitizeEmail(guestEmail) : user.email;
    const cleanedGuestPhone = guestPhone ? sanitizePhone(guestPhone) : "+91 98765 43210";
    const cleanedPromoCode = promoCode ? sanitizePromoCode(promoCode) : undefined;
    const cleanedPaymentRef = paymentReference ? sanitizeString(paymentReference) : `SIM-${Date.now()}`;

    const booking = await createBooking({
      userId: user.userId,
      guestName: cleanedGuestName,
      guestEmail: cleanedGuestEmail,
      guestPhone: cleanedGuestPhone,
      roomTypeId,
      checkIn,
      checkOut,
      promoCode: cleanedPromoCode,
      paymentReference: cleanedPaymentRef,
      keysCount: keysCount || 1,
    });

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    const status = error.message?.includes("sold out") ||
      error.message?.includes("allotment") ||
      error.message?.includes("Cannot book")
      ? 409
      : 400;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process booking",
      },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("estate_session")?.value;
    const user = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (user.role === "STAFF" || user.role === "GM") {
      const bookings = await getAllBookings();
      return NextResponse.json({ success: true, bookings });
    }

    const bookings = await getUserBookings(user.userId);
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
