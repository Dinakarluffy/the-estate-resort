/**
 * In-Memory Sliding-Window Rate Limiter
 * Phase 7: Production Hardening & Anti-Abuse Guardrail Engine
 *
 * Protects critical resort API endpoints against credential stuffing,
 * denial-of-service, reservation bot hoarding, and enquiry lead spam.
 */

import { NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in that window
  bucketName: string; // Identifier for logging/metrics
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix epoch seconds
  retryAfter: number; // Seconds to wait before retry
}

// In-memory sliding window store: Map<`${bucket}:${ip}`, timestamp[]>
const requestStore = new Map<string, number[]>();

/**
 * Extracts client IP from request headers with fallback
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "127.0.0.1";
}

/**
 * Checks and records a request against sliding window rate limit
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const storeKey = `${config.bucketName}:${key}`;

  const timestamps = requestStore.get(storeKey) || [];
  // Filter out timestamps outside the active sliding window
  const activeTimestamps = timestamps.filter((t) => t > windowStart);

  const resetEpochSeconds = Math.ceil((now + config.windowMs) / 1000);

  if (activeTimestamps.length >= config.maxRequests) {
    // Oldest timestamp in window determines when first slot opens
    const oldestTimestamp = activeTimestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestTimestamp + config.windowMs - now) / 1000)
    );

    requestStore.set(storeKey, activeTimestamps);

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetEpochSeconds,
      retryAfter: retryAfterSeconds,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  requestStore.set(storeKey, activeTimestamps);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - activeTimestamps.length),
    reset: resetEpochSeconds,
    retryAfter: 0,
  };
}

/**
 * Helper to apply rate limiting in Next.js Route Handlers.
 * Returns a 429 NextResponse if rate limit exceeded, or null if allowed.
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, config);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many requests for ${config.bucketName}. Please wait ${result.retryAfter} seconds before trying again.`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": result.retryAfter.toString(),
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Pre-configured rate limit tiers for resort operations
 */
export const RATE_LIMIT_TIERS = {
  // Authentication: 10 attempts per minute per IP (prevents password brute-forcing)
  AUTH: {
    bucketName: "auth",
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  // Bookings: 30 bookings per minute per IP (prevents inventory-holding bot attacks)
  BOOKING: {
    bucketName: "booking",
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  // Payment Simulation: 20 per minute per IP
  PAYMENT: {
    bucketName: "payment",
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
  // Enquiry Ingestion: 20 leads per minute per IP (prevents spam flooding)
  ENQUIRY: {
    bucketName: "enquiry",
    windowMs: 60 * 1000,
    maxRequests: 20,
  },
  // Public Availability & Rates: 120 requests per minute per IP
  PUBLIC_API: {
    bucketName: "public_api",
    windowMs: 60 * 1000,
    maxRequests: 120,
  },
} as const;

/**
 * Test helper to clear stored timestamps between test suites
 */
export function resetRateLimits(): void {
  requestStore.clear();
}
