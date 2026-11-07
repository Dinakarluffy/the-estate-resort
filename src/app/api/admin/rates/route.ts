import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import {
  getRatesAndAllotmentsMatrix,
  updateDailyRate,
  bulkUpdateDailyRates,
  updateWebsiteAllotment,
} from "@/lib/rates";

async function verifyGmAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user || user.role !== "GM") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await verifyGmAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. GM role required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const roomTypeId = searchParams.get("roomTypeId") || undefined;

  try {
    const matrix = await getRatesAndAllotmentsMatrix(startDate, endDate, roomTypeId);
    return NextResponse.json({ success: true, matrix });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyGmAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. GM role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, roomTypeId, date, startDate, endDate, pricePerNight, websiteAllotment } = body;

    if (!roomTypeId) {
      return NextResponse.json({ error: "Missing required roomTypeId" }, { status: 400 });
    }

    if (action === "updateRate") {
      if (!date || pricePerNight === undefined) {
        return NextResponse.json({ error: "Missing date or pricePerNight" }, { status: 400 });
      }
      const updated = await updateDailyRate(roomTypeId, date, Number(pricePerNight));
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "bulkUpdateRate") {
      if (!startDate || !endDate || pricePerNight === undefined) {
        return NextResponse.json({ error: "Missing startDate, endDate, or pricePerNight" }, { status: 400 });
      }
      const updated = await bulkUpdateDailyRates(roomTypeId, startDate, endDate, Number(pricePerNight));
      return NextResponse.json({ success: true, count: updated.length });
    }

    if (action === "updateAllotment") {
      if (!date || websiteAllotment === undefined) {
        return NextResponse.json({ error: "Missing date or websiteAllotment" }, { status: 400 });
      }
      const updated = await updateWebsiteAllotment(roomTypeId, date, Number(websiteAllotment));
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: "Invalid action. Supported: updateRate, bulkUpdateRate, updateAllotment" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
