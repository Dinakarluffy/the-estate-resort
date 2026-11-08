import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { applyRateLimit, RATE_LIMIT_TIERS } from "@/lib/rateLimit";
import { sanitizeString, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

export async function POST(request: Request) {
  // Phase 7: Sliding-window rate limit guardrail
  const rateLimitError = applyRateLimit(request, RATE_LIMIT_TIERS.AUTH);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    const cleanedName = sanitizeString(name);
    const cleanedEmail = sanitizeEmail(email);
    const cleanedPhone = phone ? sanitizePhone(phone) : undefined;

    const result = await registerUser({
      name: cleanedName,
      email: cleanedEmail,
      password,
      phone: cleanedPhone,
    });

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || "Registration failed" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set("estate_session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
