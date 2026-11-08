import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  sanitizePhone,
  sanitizeEmail,
  sanitizePromoCode,
  sanitizePayload,
} from "./sanitize";

describe("sanitize.ts - Input Sanitization & DPDP Act 2023 Data Protection (Phase 7)", () => {
  it("strips malicious script tags from text inputs", () => {
    const malicious = "Looking for wedding lawn <script>alert('pwned')</script> for 200 guests";
    const cleaned = sanitizeString(malicious);
    expect(cleaned).toBe("Looking for wedding lawn  for 200 guests");
    expect(cleaned).not.toContain("<script>");
  });

  it("strips inline iframe, style, and object tags", () => {
    const xss = "Hello <iframe src='evil.com'></iframe><style>body{display:none}</style>world";
    const cleaned = sanitizeString(xss);
    expect(cleaned).toBe("Hello world");
  });

  it("strips malicious pseudo-protocols like javascript: and data:text/html", () => {
    const input = "javascript:alert(1) and data:text/html;base64,...";
    const cleaned = sanitizeString(input);
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).not.toContain("data:text/html");
  });

  it("preserves valid hotel booking notes, special requests, and punctuation", () => {
    const valid = "Quiet corner room on 2nd floor, extra baby cot & feather pillows please! (Arrival around 4:30 PM)";
    const cleaned = sanitizeString(valid);
    expect(cleaned).toBe(valid);
  });

  it("sanitizes and normalizes phone numbers safely", () => {
    expect(sanitizePhone("+91 98765-43210")).toBe("+91 98765-43210");
    expect(sanitizePhone("+91 (080) 1234 5678")).toBe("+91 (080) 1234 5678");
    // Strips malicious characters or scripts injected in phone field
    expect(sanitizePhone("<script>alert()</script>+919876543210")).toBe("+919876543210");
  });

  it("sanitizes and normalizes email addresses to lower-case", () => {
    expect(sanitizeEmail("  Guest.Luxury@Estate.COM  ")).toBe("guest.luxury@estate.com");
    expect(sanitizeEmail("<script>evil()</script>guest@estate.com")).toBe("guest@estate.com");
  });

  it("sanitizes promo codes to alphanumeric uppercase with hyphens", () => {
    expect(sanitizePromoCode("  coffee-10!  ")).toBe("COFFEE-10");
    expect(sanitizePromoCode("monsoon_15' OR '1'='1")).toBe("MONSOON_15OR11");
  });

  it("batch sanitizes payloads using sanitizePayload", () => {
    const rawPayload = {
      name: "Dr. <script>evil()</script>Ravi Kumar",
      email: "RAVI@GMAIL.COM ",
      phone: "+91 9988776655 <xss>",
      unaffectedNumber: 42,
    };

    const cleaned = sanitizePayload(
      rawPayload,
      ["name"],
      ["phone"],
      ["email"]
    );

    expect(cleaned.name).toBe("Dr. Ravi Kumar");
    expect(cleaned.email).toBe("ravi@gmail.com");
    expect(cleaned.phone).toBe("+91 9988776655");
    expect(cleaned.unaffectedNumber).toBe(42);
  });
});
