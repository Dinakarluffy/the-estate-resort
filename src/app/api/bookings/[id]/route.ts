import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getBookingById, getBookingByNumber, cancelBooking } from "@/lib/booking";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    let booking = await getBookingById(id);

    // Also support looking up by human-readable booking number (e.g. EST-2026-4821)
    if (!booking) {
      booking = await getBookingByNumber(id);
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = request.cookies.get("estate_session")?.value;
    const user = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = params;
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only owner of booking or Staff/GM can cancel
    if (booking.userId !== user.userId && user.role !== "STAFF" && user.role !== "GM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized to cancel this booking" },
        { status: 403 }
      );
    }

    const cancelled = await cancelBooking(id);

    return NextResponse.json({
      success: true,
      message: "Booking cancelled and room inventory restored",
      booking: cancelled,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel booking" },
      { status: 400 }
    );
  }
}
