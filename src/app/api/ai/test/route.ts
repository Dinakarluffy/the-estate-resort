import { NextResponse } from "next/server";
import { testGeminiConnection, classifyAndExtractEnquiry, DEFAULT_GEMINI_MODEL } from "@/lib/gemini";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sampleQuery = searchParams.get("q") || "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights";

  const connection = await testGeminiConnection();
  const classification = await classifyAndExtractEnquiry(sampleQuery);

  return NextResponse.json({
    status: connection.success ? "READY" : "FALLBACK_MODE",
    model: DEFAULT_GEMINI_MODEL,
    connectionCheck: connection,
    sampleBenchmark: {
      inputMessage: sampleQuery,
      aiResult: classification,
    },
    apiKeyPresent: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ""),
    instructions: connection.success
      ? "Google Gemini model is live, operational, and classifying enquiries!"
      : "Gemini API key is missing or invalid. App is operating safely using deterministic fallback parser.",
  });
}
