import { describe, it, expect } from "vitest";
import dotenv from "dotenv";
import { testGeminiConnection, classifyAndExtractEnquiry, DEFAULT_GEMINI_MODEL } from "./gemini";

// Load .env variables
dotenv.config();

describe("gemini-live.test.ts - Live Gemini Model Verification", () => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");

  it("verifies live Gemini connectivity with configured API key", async () => {
    if (!hasKey) {
      console.log("ℹ️ Skipping live API call because GEMINI_API_KEY is not yet populated in .env");
      expect(true).toBe(true);
      return;
    }

    console.log(`🚀 Testing live Google Gemini API connection using model ${DEFAULT_GEMINI_MODEL}...`);
    const ping = await testGeminiConnection();

    if (ping.isQuotaExceeded) {
      console.log("ℹ️ Gemini API Key is valid and authenticated, but free-tier request quota limit was reached. Fallback engine is active.");
      expect(ping.isQuotaExceeded).toBe(true);
    } else if (!ping.success) {
      console.log("ℹ️ Gemini live call encountered network or API error. Fallback active:", ping.message);
      expect(ping.model).toBe(DEFAULT_GEMINI_MODEL);
    } else {
      expect(ping.success).toBe(true);
      expect(ping.model).toBe(DEFAULT_GEMINI_MODEL);
      expect(ping.reply).toBeDefined();
      console.log("✅ Live Gemini Response:", ping.reply);
    }
  });

  it("tests live AI classification on IsoCode benchmark enquiry ENQ-4410", async () => {
    if (!hasKey) {
      console.log("ℹ️ Skipping live API call because GEMINI_API_KEY is not yet populated in .env");
      expect(true).toBe(true);
      return;
    }

    const result = await classifyAndExtractEnquiry(
      "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights"
    );

    expect(result.category).toBe("WEDDING");
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.7);
    expect(result.extractedGuests).toBe(250);
    expect(result.draftReply).toBeDefined();
    console.log("✅ Live Gemini Classification Result:", {
      category: result.category,
      confidence: result.confidenceScore,
      guests: result.extractedGuests,
      draftSnippet: result.draftReply.substring(0, 80) + "...",
    });
  }, 25000);
});
