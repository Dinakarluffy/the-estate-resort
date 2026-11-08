import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import {
  createPromoCode,
  togglePromoCodeStatus,
  getAllPromoCodes,
  deletePromoCode,
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
    const promos = await getAllPromoCodes();
    return NextResponse.json({ success: true, promos });
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
    const created = await createPromoCode({
      code: body.code,
      discountPercent: Number(body.discountPercent),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      minTariff: body.minTariff ? Number(body.minTariff) : null,
      validFrom: body.validFrom,
      validTo: body.validTo,
      maxUses: body.maxUses ? Number(body.maxUses) : 100,
    });
    return NextResponse.json({ success: true, promo: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await verifyGmAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized. GM role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, isActive } = body;
    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing id or boolean isActive" }, { status: 400 });
    }

    const updated = await togglePromoCodeStatus(id, isActive);
    return NextResponse.json({ success: true, promo: updated });
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
      return NextResponse.json({ error: "Missing promo id parameter" }, { status: 400 });
    }

    await deletePromoCode(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
