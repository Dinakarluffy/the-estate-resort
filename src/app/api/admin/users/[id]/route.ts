import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, updateUserRole, deleteUser, type Role } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const admin = token ? await verifySessionToken(token) : null;

  if (!admin || admin.role !== "GM") {
    return NextResponse.json({ success: false, error: "Unauthorized: GM role required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { role } = body as { role: Role };

    const result = await updateUserRole(admin.userId, params.id, role);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const admin = token ? await verifySessionToken(token) : null;

  if (!admin || admin.role !== "GM") {
    return NextResponse.json({ success: false, error: "Unauthorized: GM role required" }, { status: 403 });
  }

  const result = await deleteUser(admin.userId, params.id);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "User deleted successfully" });
}
