import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import {
  setBlackoutDate,
  removeBlackoutDate,
  getAllBlackoutDates,
} from "@/lib/rates";

async function verifyGmAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user || user.role !== "GM") return null;
  return user;
}

export async function GET() {
  const user = await verifyGmAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. GM role required." }, { status: 403 });
  }

  try {
    const blackouts = await getAllBlackoutDates();
    return NextResponse.json({ success: true, blackouts });
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
    const { roomTypeId, date, reason } = body;

    if (!date || !reason) {
      return NextResponse.json({ error: "Date and reason are required" }, { status: 400 });
    }

    const created = await setBlackoutDate(roomTypeId || null, date, reason);
    return NextResponse.json({ success: true, blackout: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await verifyGmAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. GM role required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing blackout id" }, { status: 400 });
    }

    await removeBlackoutDate(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
