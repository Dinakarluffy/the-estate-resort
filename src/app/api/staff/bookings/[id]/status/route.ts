import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { updateBookingOperationalStatus } from "@/lib/export";

async function verifyStaffOrGm() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user || (user.role !== "STAFF" && user.role !== "GM")) return null;
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyStaffOrGm();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Staff or GM credentials required." }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be CONFIRMED, CHECKED_IN, CHECKED_OUT, or CANCELLED." }, { status: 400 });
    }

    const updated = await updateBookingOperationalStatus(id, status);
    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
