import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getGeminiClient,
  fallbackClassifyEnquiry,
  classifyAndExtractEnquiry,
  testGeminiConnection,
} from "./gemini";

describe("gemini.ts - AI Enquiry Router & Fallback Logic", () => {
  let envBackup: NodeJS.ProcessEnv;

  beforeEach(() => {
    envBackup = { ...process.env };
  });

  afterEach(() => {
    process.env = envBackup;
  });

  describe("getGeminiClient()", () => {
    it("returns null when GEMINI_API_KEY is not set or empty", () => {
      delete process.env.GEMINI_API_KEY;

      const client = getGeminiClient();
      expect(client).toBeNull();
    });

    it("returns GoogleGenerativeAI client when a key is provided", () => {
      process.env.GEMINI_API_KEY = "test-api-key";

      const client = getGeminiClient();
      expect(client).not.toBeNull();
    });
  });

  describe("fallbackClassifyEnquiry() - IsoCode Sample Data Benchmarks", () => {
    it("classifies ENQ-4410 correctly as Wedding", () => {
      const message = "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights";
      const result = fallbackClassifyEnquiry(message);

      expect(result.category).toBe("WEDDING");
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8);
      expect(result.extractedGuests).toBe(250);
      expect(result.assignedRole).toBe("STAFF");
      expect(result.requiresGmReview).toBe(false);
      expect(result.draftReply).toContain("wedding");
    });

    it("classifies ENQ-4411 correctly as Room Booking", () => {
      const message = "Is a villa free 14-16 Nov for 2 adults and a child?";
      const result = fallbackClassifyEnquiry(message);

      expect(result.category).toBe("ROOM");
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8);
      expect(result.assignedRole).toBe("STAFF");
      expect(result.requiresGmReview).toBe(false);
      expect(result.draftReply).toContain("Reservations Team");
    });

    it("classifies ENQ-4412 correctly as Corporate Offsite", () => {
      const message = "Team of 45 wants a January offsite with a conference hall";
      const result = fallbackClassifyEnquiry(message);

      expect(result.category).toBe("OFFSITE");
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8);
      expect(result.extractedGuests).toBe(45);
      expect(result.assignedRole).toBe("STAFF");
      expect(result.requiresGmReview).toBe(false);
      expect(result.draftReply).toContain("conference hall");
    });

    it("classifies urgent complaint, alerts GM and flags for GM review", () => {
      const message = "Hot water in villa 4 is not working, front desk is terrible and not picking up!";
      const result = fallbackClassifyEnquiry(message);

      expect(result.category).toBe("COMPLAINT");
      expect(result.assignedRole).toBe("GM");
      expect(result.requiresGmReview).toBe(true);
      expect(result.draftReply).toContain("Vikram Hegde");
    });

    it("classifies vague/short message into UNSORTED lane with GM review required", () => {
      const message = "Hi please call me back";
      const result = fallbackClassifyEnquiry(message);

      expect(result.category).toBe("UNSORTED");
      expect(result.confidenceScore).toBeLessThan(0.7);
      expect(result.assignedRole).toBe("GM");
      expect(result.requiresGmReview).toBe(true);
    });
  });

  describe("classifyAndExtractEnquiry() - Safety & Grounding", () => {
    it("falls back gracefully and enforces safety guardrails without API key", async () => {
      delete process.env.GEMINI_API_KEY;

      const result = await classifyAndExtractEnquiry(
        "Is a luxury suite available for next weekend?"
      );

      expect(result.category).toBe("ROOM");
      expect(result.draftReply.length).toBeGreaterThan(20);
    });

    it("ensures complaints always route to GM regardless of source", async () => {
      delete process.env.GEMINI_API_KEY;

      const result = await classifyAndExtractEnquiry(
        "Urgent: Power backup has failed in room 12"
      );

      expect(result.category).toBe("COMPLAINT");
      expect(result.assignedRole).toBe("GM");
      expect(result.requiresGmReview).toBe(true);
    });
  });

  describe("testGeminiConnection()", () => {
    it("reports missing key when GEMINI_API_KEY is not defined", async () => {
      delete process.env.GEMINI_API_KEY;

      const result = await testGeminiConnection();
      expect(result.success).toBe(false);
      expect(result.message).toContain("GEMINI_API_KEY is missing");
    });
  });
});
