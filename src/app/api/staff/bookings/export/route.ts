import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { getBookingsForExport, generatePmsCsv } from "@/lib/export";

async function verifyStaffOrGm() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  if (!token) return null;
  const user = await verifySessionToken(token);
  if (!user || (user.role !== "STAFF" && user.role !== "GM")) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await verifyStaffOrGm();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Staff or GM credentials required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const roomTypeId = searchParams.get("roomTypeId") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const bookings = await getBookingsForExport({
      status,
      startDate,
      endDate,
      roomTypeId,
      search,
    });

    const csvContent = generatePmsCsv(bookings);
    const today = new Date().toISOString().split("T")[0];
    const filename = `Estate-PMS-Arrivals-${today}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
