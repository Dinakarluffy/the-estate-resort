import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getBookingById, extendBookingStay } from "@/lib/booking";
import { simulatePayment } from "@/lib/payment";
import { calculateTariffGST } from "@/lib/gst";
import { getDateRangeArray } from "@/lib/allotment";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("estate_session")?.value;
    const user = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to extend stay" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      bookingId,
      newCheckOut,
      paymentMethod = "CARD",
      cardNumber,
      cardExpiry,
      cardCvv,
      upiId,
    } = body;

    if (!bookingId || !newCheckOut) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (bookingId, newCheckOut)" },
        { status: 400 }
      );
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId !== user.userId && user.role !== "STAFF" && user.role !== "GM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized to extend this booking" },
        { status: 403 }
      );
    }

    if (newCheckOut <= booking.checkOut) {
      return NextResponse.json(
        {
          success: false,
          error: `New check-out date (${newCheckOut}) must be strictly after current check-out date (${booking.checkOut})`,
        },
        { status: 400 }
      );
    }

    // Calculate additional amount needed
    const additionalDates = getDateRangeArray(booking.checkOut, newCheckOut);
    const additionalPricing = calculateTariffGST(
      booking.roomType.basePrice,
      additionalDates.length,
      0
    );

    // Process simulated payment for difference
    const payment = simulatePayment({
      amount: additionalPricing.grandTotal,
      paymentMethod,
      cardNumber,
      cardExpiry,
      cardCvv,
      upiId,
    });

    if (!payment.success) {
      return NextResponse.json(
        { success: false, error: payment.error || "Extension payment failed" },
        { status: 400 }
      );
    }

    // Atomically extend booking
    const result = await extendBookingStay(bookingId, newCheckOut, payment.paymentReference);

    return NextResponse.json({
      success: true,
      message: `Stay successfully extended by ${result.additionalNights} nights until ${newCheckOut}!`,
      data: result,
    });
  } catch (error: any) {
    const status = error.message?.includes("Cannot extend stay") ? 409 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to extend booking stay" },
      { status }
    );
  }
}
