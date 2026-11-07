import { NextRequest, NextResponse } from "next/server";
import { checkRoomAvailability, checkAllRoomsAvailability } from "@/lib/allotment";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const roomTypeId = searchParams.get("roomTypeId");
    const guestsStr = searchParams.get("guests");

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required query parameters: 'checkIn' and 'checkOut' (format: YYYY-MM-DD)",
        },
        { status: 400 }
      );
    }

    const guests = guestsStr ? parseInt(guestsStr, 10) : undefined;
    if (guestsStr && (isNaN(guests!) || guests! <= 0)) {
      return NextResponse.json(
        { success: false, error: "'guests' must be a positive integer" },
        { status: 400 }
      );
    }

    if (roomTypeId) {
      const roomAvailability = await checkRoomAvailability(roomTypeId, checkIn, checkOut);
      return NextResponse.json({
        success: true,
        data: roomAvailability,
      });
    }

    const allAvailability = await checkAllRoomsAvailability(checkIn, checkOut, guests);
    return NextResponse.json({
      success: true,
      data: allAvailability,
    });
  } catch (error: any) {
    const status = error.message?.includes("Invalid date") ||
      error.message?.includes("Check-out date must be") ||
      error.message?.includes("not found")
      ? 400
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve room availability",
      },
      { status }
    );
  }
}
