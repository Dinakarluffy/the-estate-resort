import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { applyRateLimit, RATE_LIMIT_TIERS } from "@/lib/rateLimit";
import { sanitizeEmail } from "@/lib/sanitize";

export async function POST(request: Request) {
  // Phase 7: Sliding-window rate limit guardrail against credential stuffing
  const rateLimitError = applyRateLimit(request, RATE_LIMIT_TIERS.AUTH);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { email, password } = body;

    const cleanedEmail = sanitizeEmail(email);
    const result = await authenticateUser(cleanedEmail, password);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || "Authentication failed" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set secure HTTP-only cookie
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
