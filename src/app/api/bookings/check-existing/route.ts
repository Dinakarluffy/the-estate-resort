import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { checkUserExistingBooking } from "@/lib/booking";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("estate_session")?.value;
    const user = sessionToken ? await verifySessionToken(sessionToken) : null;

    if (!user) {
      return NextResponse.json({
        success: true,
        hasExistingBooking: false,
        existingBooking: null,
      });
    }

    const body = await request.json();
    const { roomTypeId, checkIn, checkOut } = body;

    if (!roomTypeId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (roomTypeId, checkIn, checkOut)" },
        { status: 400 }
      );
    }

    const existing = await checkUserExistingBooking(user.userId, roomTypeId, checkIn, checkOut);

    return NextResponse.json({
      success: true,
      hasExistingBooking: Boolean(existing),
      existingBooking: existing || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check existing booking" },
      { status: 500 }
    );
  }
}
