import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { ingestEnquiry, getFilteredEnquiries } from "@/lib/enquiry";
import { applyRateLimit, RATE_LIMIT_TIERS } from "@/lib/rateLimit";
import { sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  // Phase 7: Sliding-window rate limit on enquiry ingestion (prevents spam lead flooding)
  const rateLimitError = applyRateLimit(req, RATE_LIMIT_TIERS.ENQUIRY);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const { source, rawMessage, guestName, guestEmail, guestPhone } = body;

    if (!rawMessage || typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const validSources = ["WEB", "EMAIL", "WHATSAPP"];
    const chosenSource = validSources.includes(source) ? source : "WEB";

    // DPDP Act 2023 & XSS Sanitization
    const cleanedMessage = sanitizeString(rawMessage);
    const cleanedGuestName = guestName ? sanitizeString(guestName) : undefined;
    const cleanedGuestEmail = guestEmail ? sanitizeEmail(guestEmail) : undefined;
    const cleanedGuestPhone = guestPhone ? sanitizePhone(guestPhone) : undefined;

    const created = await ingestEnquiry({
      source: chosenSource,
      rawMessage: cleanedMessage,
      guestName: cleanedGuestName,
      guestEmail: cleanedGuestEmail,
      guestPhone: cleanedGuestPhone,
    });

    return NextResponse.json({ success: true, enquiry: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const user = await verifySessionToken(token);
  if (!user || (user.role !== "STAFF" && user.role !== "GM")) {
    return NextResponse.json({ error: "Forbidden. Staff or GM role required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;
  const requiresGmReviewStr = searchParams.get("requiresGmReview");
  const requiresGmReview = requiresGmReviewStr === "true" ? true : undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const enquiries = await getFilteredEnquiries({
      category,
      status,
      requiresGmReview,
      search,
    });

    return NextResponse.json({ success: true, enquiries });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
