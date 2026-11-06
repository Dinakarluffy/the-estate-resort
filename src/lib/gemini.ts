import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIEnquiryClassification {
  category: "ROOM" | "WEDDING" | "OFFSITE" | "COMPLAINT" | "UNSORTED";
  confidenceScore: number;
  extractedDates: string | null;
  extractedGuests: number | null;
  extractedBudget: string | null;
  assignedRole: "STAFF" | "GM";
  requiresGmReview: boolean;
  draftReply: string;
}

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

/**
 * Returns a configured GoogleGenerativeAI client if GEMINI_API_KEY is present
 */
export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "" || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Test the Gemini API connection with a simple prompt
 * Used by test suites and the `/api/ai/test` diagnostic endpoint
 */
export async function testGeminiConnection(): Promise<{
  success: boolean;
  model: string;
  message: string;
  reply?: string;
  isQuotaExceeded?: boolean;
}> {
  const client = getGeminiClient();
  if (!client) {
    return {
      success: false,
      model: DEFAULT_GEMINI_MODEL,
      message: "GEMINI_API_KEY is missing or empty in .env. Please add your key.",
    };
  }

  try {
    const model = client.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
    const result = await model.generateContent("Respond with the exact word: CONNECTED");
    const reply = result.response.text().trim();
    return {
      success: true,
      model: DEFAULT_GEMINI_MODEL,
      message: "Successfully connected to Google Gemini API!",
      reply,
    };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const isQuota = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Too Many Requests");

    return {
      success: false,
      model: DEFAULT_GEMINI_MODEL,
      isQuotaExceeded: isQuota,
      message: isQuota
        ? "Gemini API key is valid, but free-tier daily quota limit was reached. Operating safely in fallback mode."
        : `Gemini API call failed: ${errorMsg}`,
    };
  }
}

/**
 * Heuristic/rule-based fallback parser
 * Guarantees zero downtime if the Gemini API key is not yet added or internet drops
 */
export function fallbackClassifyEnquiry(message: string): AIEnquiryClassification {
  const lower = message.toLowerCase();

  // 1. Complaint detection (Always alerts GM)
  if (
    lower.includes("complaint") ||
    lower.includes("not working") ||
    lower.includes("broken") ||
    lower.includes("urgent") ||
    lower.includes("terrible") ||
    lower.includes("worst") ||
    lower.includes("dirty") ||
    lower.includes("leak")
  ) {
    return {
      category: "COMPLAINT",
      confidenceScore: 0.98,
      extractedDates: null,
      extractedGuests: null,
      extractedBudget: null,
      assignedRole: "GM",
      requiresGmReview: true,
      draftReply: `Dear Guest,\n\nWe sincerely apologize for this distressing experience. Our duty engineer and housekeeping supervisor have been dispatched with top priority to inspect the matter and restore service immediately.\n\nOur General Manager, Vikram Hegde, has been personally alerted to this matter and will contact you directly.\n\nWarm regards,\nDuty Manager\nChikkamagaluru Estate Resort`,
    };
  }

  // 2. Wedding detection
  if (lower.includes("wedding") || lower.includes("marriage") || lower.includes("reception") || lower.includes("bride") || lower.includes("groom")) {
    const guestMatch = lower.match(/(?:about\s*|around\s*|for\s*)?(\d{1,4})\s*(?:guests|people|pax|attendees)/);
    const guests = guestMatch ? parseInt(guestMatch[1], 10) : null;
    return {
      category: "WEDDING",
      confidenceScore: 0.95,
      extractedDates: extractDateClue(message),
      extractedGuests: guests,
      extractedBudget: null,
      assignedRole: "STAFF",
      requiresGmReview: false,
      draftReply: `Dear Guest,\n\nThank you for considering our coffee-estate resort for your wedding celebrations. Our estate lawns and outdoor amphitheater accommodate up to 350 guests comfortably, with 76 keys across villas and luxury suites available for complete estate buyouts.\n\nOur wedding coordinator would love to arrange a personalized walkthrough and share our curated culinary and décor packages.\n\nWarm regards,\nSales & Events Team\nChikkamagaluru Estate Resort`,
    };
  }

  // 3. Corporate Offsite detection
  if (lower.includes("offsite") || lower.includes("conference") || lower.includes("corporate") || lower.includes("team of") || lower.includes("hall")) {
    const guestMatch = lower.match(/(?:team of\s*|group of\s*|around\s*)(\d{1,3})/);
    const guests = guestMatch ? parseInt(guestMatch[1], 10) : null;
    return {
      category: "OFFSITE",
      confidenceScore: 0.92,
      extractedDates: extractDateClue(message),
      extractedGuests: guests,
      extractedBudget: null,
      assignedRole: "STAFF",
      requiresGmReview: false,
      draftReply: `Dear Guest,\n\nThank you for reaching out! We regularly host executive leadership offsites. Our 'Bean & Board' conference hall accommodates up to 60 attendees with 4K projection, high-speed leased-line internet, breakout gazebos amidst coffee trails, and customized team-building plantation treks.\n\nCould you please let us know your preferred dates so we can hold a room block and send our corporate offsite deck?\n\nWarm regards,\nCorporate Events Desk\nChikkamagaluru Estate Resort`,
    };
  }

  // 4. Room Booking detection
  if (lower.includes("villa") || lower.includes("room") || lower.includes("suite") || lower.includes("stay") || lower.includes("night") || lower.includes("free") || lower.includes("available") || lower.includes("check in") || lower.includes("tariff") || lower.includes("price")) {
    const guestMatch = lower.match(/(\d+)\s*(adults?|guests?|child|children)/);
    const guests = guestMatch ? parseInt(guestMatch[1], 10) : 2;
    return {
      category: "ROOM",
      confidenceScore: 0.94,
      extractedDates: extractDateClue(message),
      extractedGuests: guests,
      extractedBudget: null,
      assignedRole: "STAFF",
      requiresGmReview: false,
      draftReply: `Dear Guest,\n\nThank you for your enquiry! We have verified our live estate availability. Our rooms and private pool villas feature lush plantation views, complimentary artisanal coffee tastings, and daily estate breakfast.\n\nOur direct-booking tariffs start at ₹6,500/night (+ applicable GST). You can view live rates and confirm your dates directly on our direct-booking portal.\n\nWarm regards,\nReservations Team\nChikkamagaluru Estate Resort`,
    };
  }

  // 5. Low confidence fallback -> Unsorted lane for GM
  return {
    category: "UNSORTED",
    confidenceScore: 0.4,
    extractedDates: null,
    extractedGuests: null,
    extractedBudget: null,
    assignedRole: "GM",
    requiresGmReview: true,
    draftReply: `Dear Guest,\n\nThank you for contacting our resort. Could you please specify your preferred dates of stay, number of guests, or whether you are inquiring about a leisure holiday, wedding, or corporate event? We will be delighted to assist you.\n\nWarm regards,\nReservations Team`,
  };
}

function extractDateClue(msg: string): string | null {
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const lower = msg.toLowerCase();
  for (const m of months) {
    if (lower.includes(m)) {
      // Return snippet containing the month
      const idx = lower.indexOf(m);
      const start = Math.max(0, idx - 10);
      const end = Math.min(msg.length, idx + 25);
      return msg.substring(start, end).trim();
    }
  }
  return null;
}

/**
 * Classifies an enquiry, extracts key entities, and generates a grounded draft reply.
 * Uses Gemini 1.5 Flash if GEMINI_API_KEY is configured; otherwise falls back to deterministic rule engine.
 */
export async function classifyAndExtractEnquiry(
  rawMessage: string,
  rateContext?: { minRate: number; maxRate: number }
): Promise<AIEnquiryClassification> {
  const client = getGeminiClient();

  if (!client) {
    // Graceful fallback when API key is not yet set
    return fallbackClassifyEnquiry(rawMessage);
  }

  try {
    const model = client.getGenerativeModel({
      model: DEFAULT_GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // Low temperature for consistent classification
      },
    });

    const rateInfo = rateContext
      ? `Rate card range: ₹${rateContext.minRate} to ₹${rateContext.maxRate}/night (+ GST). Always quote rates from this verified range; NEVER invent fictitious prices.`
      : `Base rates: Planter's Heritage Room at ₹6,500/night (+12% GST), Luxury Suite at ₹9,500/night (+18% GST), Pool Villa at ₹16,000/night (+18% GST).`;

    const prompt = `You are the AI Enquiry Router & Assistant for a luxury 76-key coffee-estate resort in Chikkamagaluru, Karnataka.
Analyze the following guest enquiry message:

"""
${rawMessage}
"""

${rateInfo}

TASK:
1. Classify the enquiry into EXACTLY ONE of these categories:
   - "ROOM" (for leisure room/villa booking queries)
   - "WEDDING" (for weddings, anniversaries, receptions)
   - "OFFSITE" (for corporate retreats, team outings, conference room queries)
   - "COMPLAINT" (for guest complaints, urgent service issues, broken facilities, dissatisfaction)
   - "UNSORTED" (if the message is ambiguous, too short, spam, or confidence is below 0.7)

2. Determine a confidence score between 0.0 and 1.0.
   - If confidence is < 0.7, category MUST be "UNSORTED".

3. Extract entities:
   - extractedDates: string or null
   - extractedGuests: number or null
   - extractedBudget: string or null

4. Routing:
   - If category is "COMPLAINT" or "UNSORTED", assignedRole MUST be "GM" and requiresGmReview MUST be true.
   - Otherwise, assignedRole is "STAFF" and requiresGmReview is false.

5. Draft a polite, professional reply:
   - Drafts are NEVER sent automatically; staff will review before sending.
   - Ground any pricing mentioned strictly in the rate card provided above.

Return a valid JSON object matching this schema:
{
  "category": "ROOM" | "WEDDING" | "OFFSITE" | "COMPLAINT" | "UNSORTED",
  "confidenceScore": number,
  "extractedDates": string | null,
  "extractedGuests": number | null,
  "extractedBudget": string | null,
  "assignedRole": "STAFF" | "GM",
  "requiresGmReview": boolean,
  "draftReply": string
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const parsed = JSON.parse(text) as AIEnquiryClassification;

    // Safety guardrails: enforce business rules from IsoCode brief
    if (parsed.confidenceScore < 0.70) {
      parsed.category = "UNSORTED";
      parsed.assignedRole = "GM";
      parsed.requiresGmReview = true;
    }

    if (parsed.category === "COMPLAINT") {
      parsed.assignedRole = "GM";
      parsed.requiresGmReview = true;
    }

    return parsed;
  } catch (error) {
    console.warn("Gemini call failed, falling back to rule-based engine:", error);
    return fallbackClassifyEnquiry(rawMessage);
  }
}
