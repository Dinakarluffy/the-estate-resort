import { NextRequest, NextResponse } from "next/server";
import { simulatePayment } from "@/lib/payment";

export async function POST(request: NextRequest) {
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
