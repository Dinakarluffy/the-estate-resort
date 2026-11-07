export interface PaymentRequest {
  amount: number;
  paymentMethod: "CARD" | "UPI" | "NETBANKING";
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  upiId?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentReference: string;
  paidAmount: number;
  paymentMethod: string;
  paidAt: string;
  error?: string;
}

/**
 * Simulates a Razorpay Test-Mode Payment Gateway for direct hotel bookings.
 * In a real production environment, this integrates with Razorpay Checkout / Orders API.
 */
export function simulatePayment(req: PaymentRequest): PaymentResponse {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const paymentReference = `PAY-RZP-2026-${randomSuffix}`;

  if (req.amount <= 0) {
    return {
      success: false,
      paymentReference: "",
      paidAmount: 0,
      paymentMethod: req.paymentMethod,
      paidAt: timestamp,
      error: "Payment amount must be greater than zero",
    };
  }

  // UPI Simulation
  if (req.paymentMethod === "UPI") {
    if (!req.upiId || !req.upiId.includes("@")) {
      return {
        success: false,
        paymentReference: "",
        paidAmount: 0,
        paymentMethod: "UPI",
        paidAt: timestamp,
        error: "Invalid UPI ID. Expected format: username@bank",
      };
    }

    if (req.upiId.toLowerCase().includes("fail")) {
      return {
        success: false,
        paymentReference: "",
        paidAmount: 0,
        paymentMethod: "UPI",
        paidAt: timestamp,
        error: "UPI transaction timed out or was declined by user",
      };
    }

    return {
      success: true,
      paymentReference,
      paidAmount: req.amount,
      paymentMethod: "UPI",
      paidAt: timestamp,
    };
  }

  // Credit / Debit Card Simulation
  if (req.paymentMethod === "CARD") {
    const sanitizedCard = req.cardNumber ? req.cardNumber.replace(/\s+/g, "") : "";

    if (!sanitizedCard || sanitizedCard.length < 13 || sanitizedCard.length > 19) {
      return {
        success: false,
        paymentReference: "",
        paidAmount: 0,
        paymentMethod: "CARD",
        paidAt: timestamp,
        error: "Invalid card number. Please provide a valid 16-digit card number",
      };
    }

    // Trigger explicit test failure card
    if (sanitizedCard.endsWith("0000")) {
      return {
        success: false,
        paymentReference: "",
        paidAmount: 0,
        paymentMethod: "CARD",
        paidAt: timestamp,
        error: "Card declined by issuing bank (insufficient funds or blocked)",
      };
    }

    if (!req.cardCvv || req.cardCvv.length < 3) {
      return {
        success: false,
        paymentReference: "",
        paidAmount: 0,
        paymentMethod: "CARD",
        paidAt: timestamp,
        error: "Invalid CVV security code",
      };
    }

    return {
      success: true,
      paymentReference,
      paidAmount: req.amount,
      paymentMethod: "CARD",
      paidAt: timestamp,
    };
  }

  // Netbanking Simulation
  return {
    success: true,
    paymentReference,
    paidAmount: req.amount,
    paymentMethod: "NETBANKING",
    paidAt: timestamp,
  };
}
