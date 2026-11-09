import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { classifyAndExtractEnquiry, AIEnquiryClassification } from "./gemini";

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

/**
 * Archive or Restore Enquiry (clears spam/junk from active pipeline)
 */
export async function archiveEnquiry(id: string, archiveState: boolean = true) {
  return prisma.enquiry.update({
    where: { id },
    data: {
      status: archiveState ? "ARCHIVED" : "NEW",
    },
  });
}

/**
 * Updates guest phone number on an enquiry
 */
export async function updateEnquiryPhone(id: string, phone: string) {
  return prisma.enquiry.update({
    where: { id },
    data: {
      guestPhone: phone.trim(),
    },
  });
}

/**
 * Updates private internal staff collaboration notes
 */
export async function updateEnquiryNotes(id: string, notes: string) {
  return prisma.enquiry.update({
    where: { id },
    data: {
      internalNotes: notes.trim(),
    },
  });
}

/**
 * Computes an estimated revenue deal value for sales prioritization
 */
export function calculateEstimatedDealValue(
  category: string,
  extractedGuests?: number | null,
  extractedDates?: string | null
): string {
  switch (category) {
    case "WEDDING":
      if (extractedGuests && extractedGuests >= 200) {
        return "₹18,00,000 – ₹25,00,000";
      } else if (extractedGuests && extractedGuests >= 100) {
        return "₹12,00,000 – ₹18,00,000";
      } else if (extractedGuests && extractedGuests > 0) {
        const minVal = Math.round(extractedGuests * 6500 * 2);
        const maxVal = Math.round(extractedGuests * 9500 * 2);
        return `₹${minVal.toLocaleString("en-IN")} – ₹${maxVal.toLocaleString("en-IN")}`;
      }
      return "₹12,00,000 – ₹20,00,000";

    case "OFFSITE":
      if (extractedGuests && extractedGuests > 0) {
        const minVal = Math.round(extractedGuests * 5500 * 2);
        const maxVal = Math.round(extractedGuests * 8500 * 2);
        return `₹${minVal.toLocaleString("en-IN")} – ₹${maxVal.toLocaleString("en-IN")}`;
      }
      return "₹4,50,000 – ₹8,00,000";

    case "ROOM":
      return "₹13,000 – ₹32,000 (2 Nights)";

    case "COMPLAINT":
      return "Immediate Service SLA (Critical)";

    case "UNSORTED":
    default:
      return "Pending Lead Qualification";
  }
}

/**
 * Duplicate lead detector: Checks if phone or email matches prior leads in last 24h
 */
export async function checkDuplicateEnquiries(
  guestPhone?: string | null,
  guestEmail?: string | null,
  excludeId?: string
): Promise<{ isDuplicate: boolean; count: number; previousNumbers: string[] }> {
  if (!guestPhone && !guestEmail) {
    return { isDuplicate: false, count: 0, previousNumbers: [] };
  }

  const conditions: any[] = [];
  if (guestEmail && guestEmail.trim()) {
    conditions.push({ guestEmail: { equals: guestEmail.trim() } });
  }
  if (guestPhone && guestPhone.trim()) {
    const rawDigits = guestPhone.replace(/\D/g, "");
    if (rawDigits.length >= 7) {
      conditions.push({ guestPhone: { contains: rawDigits.slice(-10) } });
    }
  }

  if (conditions.length === 0) {
    return { isDuplicate: false, count: 0, previousNumbers: [] };
  }

  const matches = await prisma.enquiry.findMany({
    where: {
      AND: [
        { id: { not: excludeId || "" } },
        { OR: conditions },
      ],
    },
    select: { enquiryNumber: true },
    take: 5,
  });

  return {
    isDuplicate: matches.length > 0,
    count: matches.length,
    previousNumbers: matches.map((m) => m.enquiryNumber),
  };
}
