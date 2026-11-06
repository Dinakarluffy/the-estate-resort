import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, getAllUsers } from "@/lib/auth";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const admin = token ? await verifySessionToken(token) : null;

  if (!admin || admin.role !== "GM") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const users = await getAllUsers();
  return NextResponse.json({ success: true, users });
}
