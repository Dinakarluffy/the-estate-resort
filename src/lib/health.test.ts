import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("health.test.ts - System Health & Diagnostics API (Phase 7)", () => {
  it("returns HTTP 200 with overall healthy status and core checks", async () => {
    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("healthy");
    expect(data.version).toContain("Phase 7");
    expect(data.timestamp).toBeTruthy();
    expect(typeof data.uptimeSeconds).toBe("number");
    expect(typeof data.responseTimeMs).toBe("number");

    // Database check
    expect(data.checks.database.status).toBe("healthy");
    expect(data.checks.database.provider).toBe("sqlite");
    expect(data.checks.database.recordsAccessible).toBe(true);

    // Inventory capacity check (76 keys invariant)
    expect(data.checks.inventory.status).toBe("healthy");
    expect(data.checks.inventory.totalKeys).toBe(76);
    expect(data.checks.inventory.roomCategories).toBe(3);
    expect(data.checks.inventory.breakdown["planters-heritage-room"]).toBe(32);
    expect(data.checks.inventory.breakdown["coffee-estate-luxury-suite"]).toBe(32);
    expect(data.checks.inventory.breakdown["misty-valley-pool-villa"]).toBe(12);

    // Allotment overbooking audit
    expect(data.checks.allotmentSanity.status).toBe("healthy");
    expect(data.checks.allotmentSanity.auditPassed).toBe(true);

    // AI router & SLA monitor
    expect(data.checks.aiRouter.status).toBe("healthy");
    expect(data.checks.aiRouter.slaThresholdMinutes).toBe(30);
    expect(data.checks.aiRouter.primaryModel).toBe("gemini-3.5-flash");
  });

  it("returns detailed runtime metrics when requested with ?detailed=true", async () => {
    const request = new Request("http://localhost:3000/api/health?detailed=true");
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.runtime).toBeDefined();
    expect(data.runtime.nodeVersion).toBeTruthy();
    expect(data.runtime.platform).toBeTruthy();
    expect(typeof data.runtime.memoryMb.heapUsed).toBe("number");
    expect(typeof data.runtime.memoryMb.rss).toBe("number");
  });

  it("sets correct anti-caching and diagnostic response headers", async () => {
    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);

    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(response.headers.get("X-Service-Name")).toBe("estate-resort-engine");
  });
});
