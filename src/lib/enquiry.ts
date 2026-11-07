import { PrismaClient } from "@prisma/client";
import { classifyAndExtractEnquiry, AIEnquiryClassification } from "./gemini";

const prisma = new PrismaClient();

export interface CreateEnquiryInput {
  source: "WEB" | "EMAIL" | "WHATSAPP";
  rawMessage: string;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
}

/**
 * Generates an sequential or timestamp-based enquiry reference (e.g. ENQ-4420)
 */
export async function generateEnquiryNumber(): Promise<string> {
  const count = await prisma.enquiry.count();
  const nextNumber = 4410 + count + 1;
  return `ENQ-${nextNumber}`;
}

/**
 * Ingests a new message, runs Gemini AI classification, extracts dates/guests,
 * grounds draft quotation in DB rates, and persists enquiry.
 */
export async function ingestEnquiry(input: CreateEnquiryInput) {
  if (!input.rawMessage || input.rawMessage.trim().length === 0) {
    throw new Error("Enquiry message cannot be empty");
  }

  // 1. Fetch dynamic rate context from DB for grounding
  let rateContext: { minRate: number; maxRate: number } | undefined;
  try {
    const minMax = await prisma.roomType.aggregate({
      _min: { basePrice: true },
      _max: { basePrice: true },
    });
    if (minMax._min.basePrice && minMax._max.basePrice) {
      rateContext = {
        minRate: minMax._min.basePrice,
        maxRate: minMax._max.basePrice,
      };
    }
  } catch {
    // fallback if db error
  }

  // 2. Run Gemini 3.5 Flash (or deterministic fallback)
  const aiResult: AIEnquiryClassification = await classifyAndExtractEnquiry(
    input.rawMessage,
    rateContext
  );

  const enquiryNumber = await generateEnquiryNumber();

  return prisma.enquiry.create({
    data: {
      enquiryNumber,
      source: input.source,
      rawMessage: input.rawMessage.trim(),
      guestName: input.guestName?.trim() || "Prospective Guest",
      guestEmail: input.guestEmail?.trim() || null,
      guestPhone: input.guestPhone?.trim() || null,
      category: aiResult.category,
      confidenceScore: Math.round(aiResult.confidenceScore * 100) / 100,
      extractedDates: aiResult.extractedDates,
      extractedGuests: aiResult.extractedGuests,
      extractedBudget: aiResult.extractedBudget,
      assignedRole: aiResult.assignedRole,
      draftReply: aiResult.draftReply,
      isAiGenerated: true,
      requiresGmReview: aiResult.requiresGmReview,
      status: "NEW",
    },
  });
}

/**
 * Queries filtered enquiries for the Unified Inbox
 */
export async function getFilteredEnquiries(filters?: {
  category?: string;
  status?: string;
  requiresGmReview?: boolean;
  assignedRole?: "STAFF" | "GM";
  search?: string;
}) {
  const where: any = {};

  if (filters?.category && filters.category !== "ALL") {
    where.category = filters.category;
  }

  if (filters?.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (typeof filters?.requiresGmReview === "boolean") {
    where.requiresGmReview = filters.requiresGmReview;
  }

  if (filters?.assignedRole) {
    where.assignedRole = filters.assignedRole;
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    where.OR = [
      { enquiryNumber: { contains: q } },
      { rawMessage: { contains: q } },
      { guestName: { contains: q } },
      { guestEmail: { contains: q } },
      { guestPhone: { contains: q } },
    ];
  }

  return prisma.enquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Allows staff to edit the draft reply
 */
export async function updateEnquiryDraft(id: string, newDraftReply: string) {
  if (!newDraftReply || newDraftReply.trim().length === 0) {
    throw new Error("Draft reply cannot be empty");
  }

  return prisma.enquiry.update({
    where: { id },
    data: {
      draftReply: newDraftReply.trim(),
      status: "REVIEWED",
    },
  });
}

/**
 * Human-in-the-loop: Approves and marks reply as sent
 */
export async function approveAndSendEnquiry(id: string, finalReplyText?: string) {
  const existing = await prisma.enquiry.findUnique({ where: { id } });
  if (!existing) throw new Error(`Enquiry ${id} not found`);

  return prisma.enquiry.update({
    where: { id },
    data: {
      draftReply: finalReplyText ? finalReplyText.trim() : existing.draftReply,
      status: "SENT",
      requiresGmReview: false,
    },
  });
}

/**
 * 1-Click Re-route: Reclassifies category and reassigned team
 */
export async function rerouteEnquiry(
  id: string,
  newCategory: "ROOM" | "WEDDING" | "OFFSITE" | "COMPLAINT" | "UNSORTED",
  newAssignedRole?: "STAFF" | "GM"
) {
  const assignedRole = newAssignedRole || (newCategory === "COMPLAINT" || newCategory === "UNSORTED" ? "GM" : "STAFF");
  const requiresGmReview = newCategory === "COMPLAINT" || newCategory === "UNSORTED";

  return prisma.enquiry.update({
    where: { id },
    data: {
      category: newCategory,
      assignedRole,
      requiresGmReview,
      status: "REVIEWED",
    },
  });
}
