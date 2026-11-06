import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const redirectTarget = url.searchParams.get("from") || "/";
  const response = NextResponse.redirect(new URL(redirectTarget, url.origin), {
    status: 303, // See Other: standard HTTP status to redirect a POST to a GET
  });
  response.cookies.delete("estate_session");
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectTarget = url.searchParams.get("from") || "/";
  const response = NextResponse.redirect(new URL(redirectTarget, url.origin));
  response.cookies.delete("estate_session");
  return response;
}
