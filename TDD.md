# Technical Design Document (TDD)
## The Estate Resort — Direct-Booking Platform & AI Operations Router

**GitHub Repository:** `https://github.com/<YOUR_GITHUB_USERNAME>/the-estate-resort` *(Replace `<YOUR_GITHUB_USERNAME>` with your GitHub username)*  
**Live Local Application:** `http://localhost:3000`  
**Assessment:** IsoCode Labs Take-Home Assessment — Problem #5: Hill Resort Direct-Booking Website with AI Enquiry Routing  
**Client:** Company A — Luxury 76-Key Coffee-Estate Resort, Mullayanagiri Hills, Chikkamagaluru, Karnataka  
**Scale:** 76 Keys total (64 Luxury Heritage Rooms + 12 Private Plunge Pool Villas)  
**Author:** Full-Stack & AI Systems Architect  
**Date:** November 2026  
**Status:** Shipped, Verified & Production-Hardened (160/160 Tests Passing)  

---

## 1. Executive Summary & Plain-English Business Case

### 1.1 The Business Problem in Plain English (Layman's Guide)
The Estate is a luxury 76-room coffee plantation resort in Chikkamagaluru, Karnataka, commanding high tariffs (₹6,500 to ₹16,000 per night) and generating ₹24–28 Crore in annual revenue. Despite strong guest demand, **the resort was suffering an annual profit leakage of ₹1.05 Crore across two core areas**:

1. **The 20% OTA Commission Tax (₹33.3 Lakhs Lost Annually):**  
   68 out of every 100 room nights came through Online Travel Agencies (OTAs) such as MakeMyTrip, Booking.com, and Agoda. These middlemen charge a 20% commission on every booking. Only 12% of guests booked directly because the resort’s website was merely an unbookable brochure with a telephone number. Moving just 15% of those OTA nights to direct bookings saves the resort **₹33.3 Lakhs every single year**.
   
2. **The High-Ticket Event Delay Trap (₹72.0 Lakhs Lost Annually):**  
   The resort receives approximately 90 inquiries every month for high-paying destination weddings (250+ guests) and corporate leadership offsites (45+ attendees) via WhatsApp, email, and web forms. Because pricing lived in scattered Excel sheets, **30% of inquiries waited over 24 hours for a quotation**. Wealthy event planners cannot wait; they quickly booked competing properties in Coorg or Kabini. Losing just 3 destination events a month at a conservative ₹2 Lakh contribution each resulted in **₹72 Lakhs in lost annual profit**.

```
+-----------------------------------------------------------------------------------+
| Metric                                   | Baseline (Before) | With Platform (Year 1) |
+-----------------------------------------------------------------------------------+
| Direct Booking Share                     | 12%               | 20% Target (+8%)       |
| Annual OTA Commission Savings            | ₹0                | ₹33.3 Lakhs / year     |
| Median Event Lead Response Time          | 4.5 Hours         | < 2 Minutes (AI Draft) |
| High-Value Event Lead Recovery           | ₹0                | ₹72.0 Lakhs / year     |
| Website Overbooking Incidents            | 3-4 per quarter   | 0 (Guaranteed ACID)    |
| Total Annual Financial Value Delivered   | -                 | ₹1.053 Crore / year    |
| Development Cost                         | -                 | ₹8.0 Lakhs (13.1x ROI) |
+-----------------------------------------------------------------------------------+
```

---

## 2. Labeled Business & Technical Assumptions

Per the assessment brief, all design decisions are grounded in the following labeled assumptions:

* **[Assumption A1 — Key Inventory Breakdown]:** Total physical resort capacity is exactly 76 keys, divided into:
  * 32 *Planter's Heritage Rooms* (Base ₹6,500/night $\rightarrow$ 12% GST)
  * 32 *Coffee Estate Luxury Suites* (Base ₹9,500/night $\rightarrow$ 18% GST)
  * 12 *Misty Valley Private Pool Villas* (Base ₹16,000/night $\rightarrow$ 18% GST)
* **[Assumption A2 — Allotment Partitioning]:** To protect travel agency partner commitments and offline corporate buyouts, the website is allotted **17 keys daily** (8 Heritage, 6 Suites, 3 Villas). The remaining 59 keys are reserved for agency and offline distribution.
* **[Assumption A3 — Financial Model]:** 76 keys $\times$ 365 days $\times$ 62% average annual occupancy = 17,199 room nights at an average tariff of ₹9,500. 68% via agencies = 11,695 nights = ₹11.11 Crore. At 20% commission = ₹2.22 Crore/year. Shifting 15% of agency bookings to direct bookings saves ₹33.3 Lakhs/year.
* **[Assumption A4 — Event Conversion Economics]:** 90 monthly event inquiries. 30% wait $> 24$ hours, losing 3 bookings/month. Average event contribution = ₹2 Lakhs. 36 lost events $\times$ ₹2 Lakhs = ₹72 Lakhs/year.
* **[Assumption A5 — Form C & Data Privacy]:** Under the Digital Personal Data Protection (DPDP) Act 2023 and Indian hotel regulations, foreign guest passport scans and visa details are **not collected over online web forms**; they are taken in-person at front-desk check-in.
* **[Assumption A6 — Statutory Indian GST Threshold]:** Ministry of Finance notification mandates:
  * Room tariff $\le$ ₹7,500/night incurs **12% GST** (6% CGST + 6% Karnataka SGST).
  * Room tariff $>$ ₹7,500/night incurs **18% GST** (9% CGST + 9% Karnataka SGST).
  * Harmonized System Nomenclature (HSN/SAC) Code for Hotel Accommodation is **996311**.

---

## 3. High-Level System Architecture & Technology Choices

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Experience (Next.js 14 App Router)"]
        GuestView["Guest Portal\n(/rooms, /book, /my-bookings)"]
        StaffView["Staff AI Operations\n(/staff/inbox, /staff/bookings)"]
        AdminView["GM Control Center\n(/admin/rates, /admin/promos)"]
        EvalToolbar["Evaluator Showcase\n(1-Click Role Switcher & Live Diagnostics)"]
    end

    subgraph SecurityLayer["Edge Security & Middleware"]
        EdgeAuth["Jose Edge JWT Session Guard\n(estate_session HttpOnly Cookie)"]
        RateLimiter["Sliding-Window Rate Limiter\n(Anti-Brute Force Protection)"]
        Sanitizer["XSS Sanitization & Data Scrubber\n(DPDP Act 2023 Compliant)"]
    end

    subgraph BusinessLogic["Hard Business Logic Core (src/lib/)"]
        AllotmentEng["Atomic Allotment Engine\n(allotment.ts - Zero Overbooking)"]
        GstEng["Statutory GST Engine\n(gst.ts - SAC 996311, 12% vs 18%)"]
        BookingEng["Reservation Lifecycle\n(booking.ts - Stay Extensions & Cancel)"]
        RatesEng["Dynamic Matrix & Guardrails\n(rates.ts - Physical Key Caps)"]
        PmsEng["PMS CSV Exporter\n(export.ts - 21 Columns RFC 4180)"]
        AiRouter["Gemini AI & Fallback Heuristic\n(gemini.ts + enquiry.ts)"]
    end

    subgraph StorageLayer["Persistence & Database Invariants"]
        DB[("Prisma ORM with SQLite\n(dev.db - ACID Transactions)")]
    end

    ClientLayer --> SecurityLayer
    SecurityLayer --> BusinessLogic
    BusinessLogic --> StorageLayer
```

### Why These Specific Technologies Were Chosen:
1. **Next.js 14 App Router (React Server Components + Server Actions):**
   * *Hill-Station Network Optimization:* Mullayanagiri has intermittent 3G/4G connectivity. React Server Components stream lightweight pre-rendered HTML to phones with minimal client-side JavaScript bundle overhead, ensuring lightning-fast loads.
   * *Unified Full-Stack Architecture:* API routes and UI live in a single cohesive codebase without context-switching between separate microservices.
2. **Prisma ORM with SQLite (Development) / PostgreSQL (Production):**
   * *Zero-Config Local Evaluation:* SQLite embeds directly inside `prisma/dev.db`, allowing any reviewer to clone and run the app with `npm run dev` in seconds without installing Docker or PostgreSQL.
   * *ACID Transaction Primitives:* Full support for `prisma.$transaction`, providing multi-row transactional atomicity required for overbooking prevention.
3. **Google Gemini 3.5 Flash:**
   * Ultra-low inference latency (<1.2s), native structured JSON schema enforcement, and superior Indian contextual entity extraction (e.g., distinguishing wedding "sangeet" vs. corporate "offsite").
4. **Jose Edge JWT:**
   * Standard cryptographic session signing usable inside Next.js Edge Middleware without heavy Node.js runtime dependencies.

---

## 4. Relational Data Model & Entity Schema

The database model comprises 8 normalized entities enforcing strict integrity:

```mermaid
erDiagram
    User ||--o{ Booking : places
    RoomType ||--o{ Allotment : tracks_daily
    RoomType ||--o{ Rate : sets_daily
    RoomType ||--o{ BlackoutDate : blocks
    RoomType ||--o{ Booking : reserves
    Booking ||--o| PromoCode : applies
    User ||--o{ Enquiry : handles

    User {
        string id PK
        string email UK
        string passwordHash
        string role "GUEST | STAFF | GM"
        string name
        string phone
    }

    RoomType {
        string id PK
        string name
        string slug UK
        int basePrice
        int totalKeys "Physical Capacity (32/32/12)"
        int defaultAllotment "Website Share (8/6/3)"
        int maxGuests
    }

    Allotment {
        string id PK
        string roomTypeId FK
        string date "YYYY-MM-DD"
        int websiteAllotment
        int bookedCount
    }

    Rate {
        string id PK
        string roomTypeId FK
        string date "YYYY-MM-DD"
        int pricePerNight
    }

    BlackoutDate {
        string id PK
        string roomTypeId FK "Nullable for Resort-Wide"
        string date "YYYY-MM-DD"
        string reason
    }

    Booking {
        string id PK
        string bookingNumber UK "EST-2026-XXXX"
        string userId FK
        string roomTypeId FK
        string checkIn "YYYY-MM-DD"
        string checkOut "YYYY-MM-DD"
        int totalNights
        int baseTariffTotal
        int discountAmount
        int netTaxableAmount
        int cgstAmount
        int sgstAmount
        int grandTotal
        string status "CONFIRMED | CHECKED_IN | CANCELLED"
        string paymentReference
    }

    PromoCode {
        string id PK
        string code UK
        int discountPercent
        int maxDiscount "Rupee Cap"
        int minTariff
        boolean isActive
    }

    Enquiry {
        string id PK
        string channel "WEBSITE | EMAIL | WHATSAPP"
        string guestName
        string guestEmail
        string guestPhone
        string rawMessage
        string category "WEDDING | OFFSITE | ROOM | COMPLAINT | UNSORTED"
        float confidenceScore
        int extractedGuests
        string extractedDates
        string draftReply
        string status "PENDING | REVIEWED | SENT"
        string assignedRole "STAFF | GM"
        boolean requiresGmReview
    }
```

---

## 5. Main Workflows & Technical Implementation

### 5.1 The "Hard Part": Guaranteed Allotment Control & Overbooking Prevention
The core invariant of the brief is that **the website must never oversell room stock contracted to travel agencies**.

To solve this, we implemented the **Tatkal-Style Two-Tier Invariant**:
1. **Physical Key Capacity Ceiling:** The GM cannot set website allotment for a room higher than its physical count ($A_{rt,d} \le \text{TotalKeys}_{rt}$).
2. **Atomic Transactional Lock:** When a guest books across $N$ dates, `atomicReserveAllotment` executes within a single `prisma.$transaction`:

```typescript
// src/lib/allotment.ts (Simplified)
await prisma.$transaction(async (tx) => {
  for (const date of dateRange) {
    // 1. Fetch current allotment record
    const allotment = await tx.allotment.findUnique({
      where: { roomTypeId_date: { roomTypeId, date } }
    });

    const maxKeys = allotment?.websiteAllotment ?? roomType.defaultAllotment;
    const currentBooked = allotment?.bookedCount ?? 0;

    // Invariant check: Ensure at least 1 key is available
    if (currentBooked + 1 > maxKeys) {
      throw new Error(`Sold out on ${date}. Direct allotment exhausted.`);
    }

    // 2. Increment booked count atomically
    await tx.allotment.upsert({
      where: { roomTypeId_date: { roomTypeId, date } },
      update: { bookedCount: { increment: 1 } },
      create: { roomTypeId, date, websiteAllotment: maxKeys, bookedCount: 1 }
    });
  }
  // 3. Create confirmed booking record
  return await tx.booking.create({ data: bookingData });
});
```
* **Failure Guarantee:** If even one night in a 5-night reservation is sold out or blacked out, the entire transaction automatically rolls back. Zero keys are reserved, zero payments are charged, and zero overbookings occur.

---

### 5.2 Dynamic Indian GST Engine (SAC Code 996311)
Indian tax law mandates strict per-night room tariff slab differentiation:
$$\text{GST Rate} = \begin{cases} 
12\% \ (6\%\ \text{CGST} + 6\%\ \text{Karnataka SGST}) & \text{if } \text{Tariff/Night} \le ₹7,500 \\
18\% \ (9\%\ \text{CGST} + 9\%\ \text{Karnataka SGST}) & \text{if } \text{Tariff/Night} > ₹7,500 
\end{cases}$$

* Implemented in `src/lib/gst.ts` with financial rounding (`Math.round(val * 100) / 100`).
* When promo code `COFFEE10` is applied, the discount is deducted from the **Net Taxable Accommodation Value** *before* computing CGST/SGST, ensuring statutory tax precision.

---

### 5.3 Unified AI Enquiry Router & Human-in-the-Loop Workflow
High-value wedding and corporate offsite inquiries arrive across Web forms, Email, and WhatsApp.

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Event Planner / Bride
    participant Ingest as POST /api/enquiries
    participant AI as Gemini 3.5 Flash
    participant DB as SQLite / PostgreSQL
    actor Staff as Reservations Staff
    actor GM as General Manager

    Guest->>Ingest: Submits 250-Guest Wedding Enquiry
    Ingest->>AI: Classify Category & Extract Entities
    Note over AI: Extracts: 250 Guests, Feb 2027<br/>Classifies: WEDDING (0.95 confidence)
    AI->>DB: Fetch Active Room Rates & Ground Draft Quote
    AI-->>Ingest: Structured JSON with Rate-Grounded Draft
    Ingest->>DB: Save Enquiry (status: PENDING, timer: 30m)
    
    alt Confidence < 0.70 or Complaint
        Ingest->>GM: Escalate to GM Unsorted / Alert Queue
    else Standard High-Ticket Lead
        Ingest->>Staff: Surface in Staff AI Inbox (/staff/inbox)
    end

    Staff->>DB: Inspect AI Draft, Edit Terms if needed
    Staff->>Guest: Click "Approve & Dispatch" (status: SENT)
    Note over Staff,Guest: Median Reply Time: < 2 Minutes!
```

#### Non-Negotiable AI Safety Guardrails:
1. **Dynamic Rate Grounding:** Room rates in quotation drafts are fetched strictly from the database rate table. The AI prompt explicitly forbids fabricating prices.
2. **Human-in-the-Loop:** AI drafts are **never sent automatically**. Staff must review and click "Approve & Send".
3. **Deterministic Fallback Engine:** If Google Gemini quota limits (HTTP 429) or network interruptions occur, the system falls back to an internal heuristic regex router. Not a single customer inquiry is ever dropped.
4. **GM Complaint Escalation:** Maintenance or dissatisfaction keywords immediately flag `requiresGmReview = true` and alert the GM.

---

### 5.4 Guest Self-Service: Stay Extensions & 48-Hour Cancellation
* **In-House Stay Extension:** Guests checked into the resort can extend their stay (+1 night) directly from `/my-bookings` using their **Card on File**. The booking engine re-checks allotment and atomically appends the night. If the requested night falls on a full-estate wedding blackout, it is cleanly rejected with an explanatory notice.
* **48-Hour Cancellation Rule:** Guests can self-cancel with 1 click if check-in is $\ge 48$ hours away. The system atomically decrements `bookedCount`, restoring the key to the website allotment, and processes a full refund. Within 48 hours, cancellations are protected and routed to Front Desk phone support.

---

### 5.5 Statutory Hotel PMS CSV Export
Hospitality Property Management Systems (Opera PMS, IDS Next, Prologic) require daily arrivals exports:
* Handled by `src/lib/export.ts`, outputting an RFC 4180 compliant CSV.
* Includes 21 statutory columns: `Booking Reference`, `Guest Name`, `Phone`, `Email`, `Room Category`, `Check-In`, `Check-Out`, `Nights`, `Base Tariff`, `Discount`, `Net Taxable`, `SAC Code (996311)`, `CGST Rate`, `CGST Amount`, `SGST Rate`, `SGST Amount`, `Grand Total`, `Payment Ref`, `Booking Status`, `Created At`, and `Special Requests`.

---

## 6. UI and Design Decisions

The client brief stresses: *"The client values good, minimal design: clean layouts, white space, a restrained palette and clear type, with nothing on screen that lacks a purpose. Design counts as much as features."*

### 6.1 Visual Identity & Restrained Palette
* **Deep Coffee Estate Green (`#242e20`, `#384432`):** Evokes the lush, shade-grown Arabica coffee plantations of the Mullayanagiri hills. Used for primary CTAs and hero sections.
* **Warm Plantation Cream & Parchment (`#fbf8f5`, `#f5efe8`):** Replaces harsh sterile white with a relaxed, luxury resort paper tone.
* **Muted Harvest Gold (`#d97706`, `#b45309`):** Accent color reserved strictly for callout badges, special offers, and evaluator launchpad highlights.
* **Typography:** Elegant serif headings (`font-serif`, Playfair / Merriweather style) paired with clean, readable sans-serif body typography.

### 6.2 Key Screens & UX Rationale
1. **The Dual-Purpose Homepage (`/`):**
   * *For Guests:* Sells the coffee sanctuary experience with high-resolution imagery, direct perks badge (0% OTA commission, best rate guarantee), and a 1-step date-picker search bar.
   * *For Evaluators:* Features a neat, gold **Evaluator Showcase** below the header with 1-click role switcher buttons (Guest, Staff, GM) and direct diagnostic links (`/api/health`, `/api/ai/test`).
2. **The 3-Step Checkout Flow (`/book`):**
   * Keeping checkout under 3 steps eliminates drop-offs. Guests select room $\rightarrow$ enter contact info $\rightarrow$ view split GST summary $\rightarrow$ confirm with simulated Razorpay.
3. **Unified Staff Inbox (`/staff/inbox`):**
   * Designed like an executive dispatch console. Each inquiry card features an SLA countdown timer (green when $<30$ min, amber when $<1$ hr, red pulse when overdue). Clicking any card opens a side-by-side view with raw message on the left and editable AI quote on the right.
4. **GM 45-Day Matrix (`/admin/rates`):**
   * Built for operational speed. Inline numeric inputs allow the GM to adjust rates or allotments in seconds without navigating nested modals.

### 6.3 Resilience & State Handling
* **Loading States:** Subtle skeleton loaders prevent layout shift while data loads.
* **Empty States:** Friendly, actionable empty states on `/my-bookings` and `/staff/inbox` encourage browsing or simulation.
* **Zero Dead Buttons:** Every button across all 8 screens is connected to a live server action or API route.

---

## 7. What Was Cut, and What We Would Do Next

### 7.1 What Was Intentionally Cut (Out-of-Scope Boundaries)
In accordance with the assessment brief's instructions to *"build a small part really well instead of the whole scope badly"*, the following were intentionally excluded:
1. **Channel Manager Replacement:** We did not build a full 2-way OTA XML sync engine (e.g., RateGain or SiteMinder). Instead, we solved the core problem cleanly with **Allotment Partitioning** (dedicating 17 keys to direct booking and reserving 59 keys for travel agency contracts).
2. **Full Hotel PMS Replacement:** We did not build housekeeping shift rosters or billing folios. We cleanly integrated with existing hotel PMS software via daily **RFC 4180 CSV exports**.
3. **Loyalty / Rewards Points:** Cut per brief instructions. We substituted an immediate, tangible direct benefit: the `COFFEE10` direct promo voucher.
4. **Restaurant & Spa Bookings:** Dining table reservations were excluded to keep focus on the core room revenue and event lead recovery.

### 7.2 What We Would Build Next (Future Roadmap)
If allocated an additional 4 weeks of engineering time:
1. **Two-Way iCal / OTA Synchronization:** Implement an automated iCal synchronization feed so that when the GM blocks a blackout date on the resort website, it automatically syncs to Airbnb and Booking.com calendars.
2. **Official WhatsApp Business Cloud API Integration:** Wire the AI router directly to the Meta WhatsApp Cloud API webhooks so incoming WhatsApp messages from brides and event planners receive the staff-approved quote directly in their WhatsApp chat.
3. **Automated Post-Stay Review & Sentiment Pipeline:** Send an automated WhatsApp satisfaction survey 2 hours after checkout. High scores (5/5) receive a direct Google Maps review link; low scores trigger an immediate GM alert.
4. **Dynamic Surge Pricing Algorithm:** Introduce automated weekend/holiday tariff adjustments based on Mullayanagiri tourist season indicators.

---

## 8. Role-Based Access Control & Security Architecture

### 8.1 Three-Tier Permissions Matrix

| Resource / Action | Guest (Priya) | Reservations Staff (Karthik) | General Manager (Vikram) |
| :--- | :---: | :---: | :---: |
| Browse Rooms & Live Allotment (`/rooms`) | ✅ | ✅ | ✅ |
| Book Room & Apply Promo (`/book`) | ✅ | ✅ | ✅ |
| View Stays & Card-on-File Extension (`/my-bookings`) | ✅ (Own) | ✅ (All) | ✅ (All) |
| Staff Front Desk Roster & Check-In (`/staff/bookings`) | ❌ | ✅ | ✅ |
| 21-Column PMS Statutory CSV Export | ❌ | ✅ | ✅ |
| Review & Dispatch AI Enquiry Quotes (`/staff/inbox`) | ❌ | ✅ | ✅ |
| GM 45-Day Rate & Allotment Matrix (`/admin/rates`) | ❌ | ❌ | ✅ |
| Physical Key Ceiling Guardrail Enforcement | ❌ | ❌ | ✅ (Automatic) |
| Schedule Full-Property Blackouts (`/admin/rates`) | ❌ | ❌ | ✅ |
| Create & Cap Promo Codes (`/admin/promos`) | ❌ | ❌ | ✅ |
| Inspect GM Unsorted AI Queue & Urgent Alerts | ❌ | ❌ | ✅ |
| Demote or Delete Fellow GM Account | ❌ | ❌ | ❌ (Peer GM Protection) |

### 8.2 Security & DPDP Act 2023 Hardening
* **Sliding-Window Rate Limiting:** In-memory rate limiter on sensitive endpoints (`/api/auth/login`, `/api/bookings`) limits clients to 10 requests/minute, defending against bot scraping and credential stuffing.
* **XSS Sanitization:** All user inputs (names, emails, phone numbers, inquiry bodies) pass through HTML entity scrubbers and phone sanitizers before database persistence.
* **Peer GM Protection:** A General Manager cannot demote or delete a fellow GM account, preventing administrative lockout.

---

## 9. Verification & Test Matrix (160 Tests, 100% Green)

The platform is thoroughly verified through **15 Vitest test suites comprising 160 automated tests**:

```
+------------------------------------+------------+-----------------------------------------------------+
| Test Suite File                    | Tests Pass | Primary Architectural Scope Tested                  |
+------------------------------------+------------+-----------------------------------------------------+
| src/lib/gst.test.ts                | 10 Tests   | 12% vs 18% tiers, CGST/SGST split, ₹7,500 threshold |
| src/lib/promo.test.ts              | 8 Tests    | Percentage discounts, ₹2,000 caps, expiry dates     |
| src/lib/allotment.test.ts          | 13 Tests   | Atomic reserve, release, sold-out boundary guards   |
| src/lib/booking.test.ts            | 12 Tests   | EST reference format, stay extension, 48h cancel    |
| src/lib/auth.test.ts               | 22 Tests   | Bcrypt, Edge JWT, role access, peer GM protection   |
| src/lib/rates.test.ts              | 20 Tests   | 45-day matrix, physical key caps, blackout logic    |
| src/lib/export.test.ts             | 12 Tests   | RFC 4180 PMS CSV export, SAC 996311 compliance      |
| src/lib/enquiry.test.ts            | 15 Tests   | Multi-channel ingestion, SLA timers, human review   |
| src/lib/gemini.test.ts             | 10 Tests   | Entity extraction, wedding/offsite classification   |
| src/lib/gemini-live.test.ts        | 2 Tests    | Live Google Gemini connection & benchmark ENQ-4410  |
| src/lib/payment.test.ts            | 8 Tests    | Mock Razorpay Card & UPI simulation                 |
| src/lib/health.test.ts             | 3 Tests    | System health diagnostics, 76 keys audit, latency   |
| src/lib/rateLimit.test.ts          | 5 Tests    | Sliding-window rate limiter, bot anti-abuse (429)   |
| src/lib/sanitize.test.ts           | 8 Tests    | XSS prevention, HTML stripping, phone sanitization  |
| src/lib/integration.test.ts       | 12 Tests   | Master end-to-end integration across all 7 phases   |
+------------------------------------+------------+-----------------------------------------------------+
| TOTAL                              | 160 Tests  | 100% Pass Rate Across All 15 Test Suites            |
+------------------------------------+------------+-----------------------------------------------------+
```

### Production Build Verification
Executing `npm run build`:
* **All 33 static and dynamic routes compile cleanly with zero TypeScript errors.**

---
*Submitted for IsoCode Labs Technical Assessment — Problem #5: The Estate Resort, Chikkamagaluru.*
