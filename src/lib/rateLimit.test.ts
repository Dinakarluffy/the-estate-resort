import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  applyRateLimit,
  resetRateLimits,
  RATE_LIMIT_TIERS,
} from "./rateLimit";

describe("rateLimit.ts - In-Memory Sliding-Window Rate Limiter (Phase 7)", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("permits requests within configured window limits", () => {
    const config = {
      bucketName: "test-bucket",
      windowMs: 60 * 1000,
      maxRequests: 3,
    };

    const res1 = checkRateLimit("192.168.1.1", config);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);
    expect(res1.limit).toBe(3);

    const res2 = checkRateLimit("192.168.1.1", config);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit("192.168.1.1", config);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("rejects requests when limit is exceeded with correct retryAfter", () => {
    const config = {
      bucketName: "auth-test",
      windowMs: 60 * 1000,
      maxRequests: 2,
    };

    checkRateLimit("10.0.0.5", config);
    checkRateLimit("10.0.0.5", config);

    // Third request exceeds limit
    const resBlocked = checkRateLimit("10.0.0.5", config);
    expect(resBlocked.success).toBe(false);
    expect(resBlocked.remaining).toBe(0);
    expect(resBlocked.retryAfter).toBeGreaterThan(0);
    expect(resBlocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("isolates quotas across distinct client IPs", () => {
    const config = {
      bucketName: "ip-isolation",
      windowMs: 60 * 1000,
      maxRequests: 1,
    };

    const ip1Res1 = checkRateLimit("1.1.1.1", config);
    expect(ip1Res1.success).toBe(true);

    // IP 1 blocked on 2nd request
    const ip1Res2 = checkRateLimit("1.1.1.1", config);
    expect(ip1Res2.success).toBe(false);

    // Distinct IP 2 is unaffected and succeeds
    const ip2Res = checkRateLimit("2.2.2.2", config);
    expect(ip2Res.success).toBe(true);
  });

  it("applyRateLimit returns HTTP 429 NextResponse with standard RFC headers on limit breach", async () => {
    const config = {
      bucketName: "api-test",
      windowMs: 60 * 1000,
      maxRequests: 1,
    };

    const mockRequest = new Request("http://localhost:3000/api/bookings", {
      headers: { "x-forwarded-for": "172.16.0.22" },
    });

    const allowed = applyRateLimit(mockRequest, config);
    expect(allowed).toBeNull(); // Allowed

    const blockedResponse = applyRateLimit(mockRequest, config);
    expect(blockedResponse).not.toBeNull();
    expect(blockedResponse?.status).toBe(429);

    const json = await blockedResponse?.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain("Too many requests");

    // Verify rate limit headers
    expect(blockedResponse?.headers.get("Retry-After")).toBeTruthy();
    expect(blockedResponse?.headers.get("X-RateLimit-Limit")).toBe("1");
    expect(blockedResponse?.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("pre-configured resort tiers have realistic production quotas", () => {
    expect(RATE_LIMIT_TIERS.AUTH.maxRequests).toBe(10);
    expect(RATE_LIMIT_TIERS.BOOKING.maxRequests).toBe(30);
    expect(RATE_LIMIT_TIERS.PAYMENT.maxRequests).toBe(20);
    expect(RATE_LIMIT_TIERS.ENQUIRY.maxRequests).toBe(20);
    expect(RATE_LIMIT_TIERS.PUBLIC_API.maxRequests).toBe(120);
  });
});
