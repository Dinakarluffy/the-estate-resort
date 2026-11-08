import { NextRequest, NextResponse } from "next/server";
import { simulatePayment } from "@/lib/payment";
import { applyRateLimit, RATE_LIMIT_TIERS } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Phase 7: Rate limit payment simulations
  const rateLimitError = applyRateLimit(request, RATE_LIMIT_TIERS.PAYMENT);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { amount, paymentMethod, cardNumber, cardExpiry, cardCvv, upiId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid positive amount is required" },
        { status: 400 }
      );
    }

    const result = simulatePayment({
      amount,
      paymentMethod: paymentMethod || "CARD",
      cardNumber,
      cardExpiry,
      cardCvv,
      upiId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Payment was declined" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}
