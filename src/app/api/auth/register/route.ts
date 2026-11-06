import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    const result = await registerUser({ name, email, password, phone });

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
