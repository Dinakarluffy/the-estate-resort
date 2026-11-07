import { NextRequest, NextResponse } from "next/server";
import { validateAndApplyPromo } from "@/lib/promo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, baseTariffTotal, checkInDate } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Promo code is required" },
        { status: 400 }
      );
    }

    if (baseTariffTotal === undefined || typeof baseTariffTotal !== "number" || baseTariffTotal <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid positive baseTariffTotal is required" },
        { status: 400 }
      );
    }

    const result = await validateAndApplyPromo(code, baseTariffTotal, checkInDate);

    if (!result.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Invalid or ineligible promo code",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      promo: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to validate promo code",
      },
      { status: 500 }
    );
  }
}
