import { describe, it, expect } from "vitest";
import { simulatePayment } from "./payment";

describe("payment.ts - Test Payment Gateway Simulation Engine", () => {
  it("successfully processes a standard test credit card", () => {
    const res = simulatePayment({
      amount: 14560,
      paymentMethod: "CARD",
      cardNumber: "4111 1111 1111 1111",
      cardExpiry: "12/28",
      cardCvv: "123",
    });

    expect(res.success).toBe(true);
    expect(res.paidAmount).toBe(14560);
    expect(res.paymentReference).toMatch(/^PAY-RZP-2026-\d{6}$/);
    expect(res.paymentMethod).toBe("CARD");
  });

  it("declines a test card ending in 0000", () => {
    const res = simulatePayment({
      amount: 14560,
      paymentMethod: "CARD",
      cardNumber: "4111 1111 1111 0000",
      cardExpiry: "12/28",
      cardCvv: "123",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Card declined");
    expect(res.paymentReference).toBe("");
  });

  it("rejects an invalid card number with insufficient digits", () => {
    const res = simulatePayment({
      amount: 5000,
      paymentMethod: "CARD",
      cardNumber: "1234",
      cardExpiry: "12/28",
      cardCvv: "123",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid card number");
  });

  it("rejects an invalid card CVV", () => {
    const res = simulatePayment({
      amount: 5000,
      paymentMethod: "CARD",
      cardNumber: "4111 1111 1111 1111",
      cardExpiry: "12/28",
      cardCvv: "1",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid CVV");
  });

  it("successfully processes valid UPI simulation", () => {
    const res = simulatePayment({
      amount: 22420,
      paymentMethod: "UPI",
      upiId: "priya@okhdfcbank",
    });

    expect(res.success).toBe(true);
    expect(res.paidAmount).toBe(22420);
    expect(res.paymentMethod).toBe("UPI");
    expect(res.paymentReference).toMatch(/^PAY-RZP-2026-\d{6}$/);
  });

  it("rejects invalid UPI ID without @ symbol", () => {
    const res = simulatePayment({
      amount: 22420,
      paymentMethod: "UPI",
      upiId: "invalidupiid",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid UPI ID");
  });

  it("handles UPI payment failure simulation when id contains fail", () => {
    const res = simulatePayment({
      amount: 22420,
      paymentMethod: "UPI",
      upiId: "user.fail@paytm",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("declined");
  });

  it("rejects non-positive payment amount", () => {
    const res = simulatePayment({
      amount: 0,
      paymentMethod: "CARD",
      cardNumber: "4111 1111 1111 1111",
      cardCvv: "123",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("greater than zero");
  });
});
