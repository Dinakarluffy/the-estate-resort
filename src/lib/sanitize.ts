/**
 * Input Sanitization & DPDP Act 2023 Data Protection Engine
 * Phase 7: Production Hardening & Security Resilience
 *
 * Enforces strict XSS prevention and input hygiene across all public-facing forms:
 * Guest bookings, stay extensions, multi-channel event enquiries, and promo codes.
 */

/**
 * Strips executable script tags, event handlers, and dangerous HTML entities
 * while preserving valid punctuation, accents, numbers, and multilingual text.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") {
    if (input === null || input === undefined) return "";
    return String(input);
  }

  return input
    // Strip HTML script, style, iframe, object, embed, form tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    // Strip generic HTML tags
    .replace(/<[^>]*>?/gm, "")
    // Strip dangerous inline protocol prefixes like javascript:, vbscript:, data:text/html
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:\s*text\/html/gi, "")
    // Strip inline event attributes if any remain
    .replace(/on\w+\s*=/gi, "")
    // Trim leading/trailing whitespace
    .trim();
}

/**
 * Sanitizes phone numbers by stripping script/HTML tags and keeping only allowed telecom characters: digits, +, -, spaces, ()
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== "string") return "";
  // First strip any HTML or script blocks
  const stripped = sanitizeString(phone);
  const cleaned = stripped.replace(/[^0-9+\s\-()]/g, "").trim();
  // Limit to reasonable phone length
  return cleaned.slice(0, 25);
}

/**
 * Sanitizes and normalizes email addresses to lowercase trimmed strings
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== "string") return "";
  return sanitizeString(email).toLowerCase().slice(0, 150);
}

/**
 * Sanitizes promo code input: uppercase alphanumeric characters, dashes, and underscores only
 */
export function sanitizePromoCode(code: unknown): string {
  if (typeof code !== "string") return "";
  return code.toUpperCase().replace(/[^A-Z0-9_\-]/g, "").trim().slice(0, 30);
}

/**
 * Batch sanitizes specific fields of an input object
 */
export function sanitizePayload<T extends Record<string, any>>(
  payload: T,
  stringFields: (keyof T)[] = [],
  phoneFields: (keyof T)[] = [],
  emailFields: (keyof T)[] = []
): T {
  const result = { ...payload };

  for (const field of stringFields) {
    if (field in result && result[field] !== undefined) {
      result[field] = sanitizeString(result[field]) as any;
    }
  }

  for (const field of phoneFields) {
    if (field in result && result[field] !== undefined) {
      result[field] = sanitizePhone(result[field]) as any;
    }
  }

  for (const field of emailFields) {
    if (field in result && result[field] !== undefined) {
      result[field] = sanitizeEmail(result[field]) as any;
    }
  }

  return result;
}
