import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  generateEnquiryNumber,
  ingestEnquiry,
  getFilteredEnquiries,
  updateEnquiryDraft,
  approveAndSendEnquiry,
  rerouteEnquiry,
} from "./enquiry";

const prisma = new PrismaClient();

describe("enquiry.ts - AI Enquiry Routing, Entity Extraction & Human-in-the-Loop", () => {
  let testEnquiryId: string;
  let testEnquiryNumber: string;

  afterAll(async () => {
    await prisma.enquiry.deleteMany({
      where: { guestEmail: "enquiry.test@example.com" },
    });
    await prisma.$disconnect();
  });

  describe("generateEnquiryNumber", () => {
    it("generates formatted enquiry number starting with ENQ-", async () => {
      const num = await generateEnquiryNumber();
      expect(num).toMatch(/^ENQ-\d+$/);
    });
  });

  describe("ingestEnquiry", () => {
    it("ingests wedding enquiry and classifies as WEDDING with extracted guests", async () => {
      const enquiry = await ingestEnquiry({
        source: "WEB",
        rawMessage: "Looking for venue for my sister's wedding with 250 guests in February 2027.",
        guestName: "Ananya Rao",
        guestEmail: "enquiry.test@example.com",
        guestPhone: "+91 98888 77777",
      });

      expect(enquiry.category).toBe("WEDDING");
      expect(enquiry.assignedRole).toBe("STAFF");
      expect(enquiry.requiresGmReview).toBe(false);
      expect(enquiry.status).toBe("NEW");
      expect(enquiry.draftReply).toContain("wedding");
      expect(enquiry.extractedGuests).toBe(250);

      testEnquiryId = enquiry.id;
      testEnquiryNumber = enquiry.enquiryNumber;
    });

    it("ingests urgent complaint and automatically routes to GM with alert flag", async () => {
      const enquiry = await ingestEnquiry({
        source: "WHATSAPP",
        rawMessage: "AC in my room is not working, very hot and leaking water! Urgent complaint!",
        guestName: "Dissatisfied Guest",
        guestEmail: "enquiry.test@example.com",
      });

      expect(enquiry.category).toBe("COMPLAINT");
      expect(enquiry.assignedRole).toBe("GM");
      expect(enquiry.requiresGmReview).toBe(true);
      expect(enquiry.draftReply).toContain("apologize");
    });

    it("throws error for empty raw message", async () => {
      await expect(
        ingestEnquiry({
          source: "EMAIL",
          rawMessage: "",
        })
      ).rejects.toThrow("Enquiry message cannot be empty");
    });
  });

  describe("getFilteredEnquiries", () => {
    it("filters enquiries by category and status", async () => {
      const results = await getFilteredEnquiries({
        category: "WEDDING",
        search: "Ananya Rao",
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].category).toBe("WEDDING");
    });

    it("filters enquiries by requiresGmReview flag", async () => {
      const gmItems = await getFilteredEnquiries({
        requiresGmReview: true,
      });
      expect(gmItems.length).toBeGreaterThanOrEqual(1);
      expect(gmItems.every((item) => item.requiresGmReview === true)).toBe(true);
    });
  });

  describe("updateEnquiryDraft & approveAndSendEnquiry", () => {
    it("updates draft reply and marks status as REVIEWED", async () => {
      const updated = await updateEnquiryDraft(
        testEnquiryId,
        "Custom human staff edited reply."
      );
      expect(updated.draftReply).toBe("Custom human staff edited reply.");
      expect(updated.status).toBe("REVIEWED");
    });

    it("approves and marks enquiry as SENT", async () => {
      const sent = await approveAndSendEnquiry(
        testEnquiryId,
        "Final approved reply sent to guest."
      );
      expect(sent.status).toBe("SENT");
      expect(sent.draftReply).toBe("Final approved reply sent to guest.");
      expect(sent.requiresGmReview).toBe(false);
    });
  });

  describe("rerouteEnquiry", () => {
    it("allows 1-click re-routing to another category", async () => {
      const rerouted = await rerouteEnquiry(testEnquiryId, "OFFSITE");
      expect(rerouted.category).toBe("OFFSITE");
      expect(rerouted.assignedRole).toBe("STAFF");
      expect(rerouted.requiresGmReview).toBe(false);
    });

    it("routes to GM when reclassified as COMPLAINT", async () => {
      const rerouted = await rerouteEnquiry(testEnquiryId, "COMPLAINT");
      expect(rerouted.category).toBe("COMPLAINT");
      expect(rerouted.assignedRole).toBe("GM");
      expect(rerouted.requiresGmReview).toBe(true);
    });
  });
});
