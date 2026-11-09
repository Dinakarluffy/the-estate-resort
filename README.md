# The Estate Resort — Direct-Booking Platform & AI Operations Router

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%203.5%20Flash-4285f4?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)
[![Tests](https://img.shields.io/badge/Vitest-160%2F160%20Pass%20(100%25)-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)
[![Compliance](https://img.shields.io/badge/Compliance-DPDP%20Act%202023%20%26%20GST%20SAC%20996311-emerald?style=flat)](#statutory-compliance)

> **Assessment Submission:** IsoCode Labs Take-Home Assessment — Problem #5: Hill Resort Direct-Booking Website with AI Enquiry Routing  
> **Client:** Company A — Luxury 76-Key Coffee-Estate Resort, Mullayanagiri Hills, Chikkamagaluru, Karnataka  
> **Repository:** `https://github.com/Dinakarluffy/the-estate-resort`  
> **Live Application (Vercel):** `https://the-estate-resort.vercel.app` *(Local Review: `http://localhost:3000`)*  
> **Submission Package:** `TDD.pdf` (or `TDD.md`) and `deployment.md`  

---

## 📖 Table of Contents
1. [The Problem in Plain English (Layman's Guide)](#-the-problem-in-plain-english-laymans-guide)
2. [How This Product Solves It](#-how-this-product-solves-it)
3. [Financial Impact: ₹1.05 Crore / Year Saved](#-financial-impact-105-crore--year-saved)
4. [Quick Start (Run Locally in 2 Minutes)](#-quick-start-run-locally-in-2-minutes)
5. [Pre-Seeded Demo Accounts (1-Click Logins)](#-pre-seeded-demo-accounts-1-click-logins)
6. [Core System Architecture](#-core-system-architecture)
7. [Screen-by-Screen Walkthrough](#-screen-by-screen-walkthrough)
8. [The "Hard Part": How We Prevent Overbooking](#-the-hard-part-how-we-prevent-overbooking)
9. [The AI Router & Human-in-the-Loop Safety](#-the-ai-router--human-in-the-loop-safety)
10. [Statutory Indian Compliance (GST & DPDP Act 2023)](#-statutory-indian-compliance-gst--dpdp-act-2023)
11. [Automated Verification & Test Matrix (160 Tests)](#-automated-verification--test-matrix-160-tests)
12. [Submission Checklist & Assumptions](#-submission-checklist--assumptions)

---

## ☕ The Problem in Plain English (Layman's Guide)

Imagine you own a beautiful 76-room luxury resort nestled in the misty coffee hills of Chikkamagaluru, Karnataka. Business is good, but **money is silently leaking out of two major holes every single day**:

```
                                  WHERE THE RESORT LOSES MONEY
                                  
   HOLE 1: OTA COMMISSION LEAKAGE (₹33.3 Lakhs/yr)       HOLE 2: SLOW EVENT REPLIES (₹72.0 Lakhs/yr)
   =================================================     ===========================================
   • 68 out of every 100 guests book via portals         • 90 wedding & corporate offsite inquiries
     like MakeMyTrip, Agoda, or Booking.com.               arrive each month via WhatsApp, email, web.
   • Those portals charge a 20% commission on            • 30% wait more than 24 hours for a response
     every single room sold.                               because rates live in messy Excel sheets.
   • The hotel's website was just a static brochure      • High-net-worth brides & CEOs give up and book
     with a phone number that nobody answered.             rival properties in Coorg or Kabini instead.
```

### Why couldn't the hotel just sell rooms on its website before?
Because **hotels have contracts with travel agencies**. If the hotel's website accidentally sells a room that was already promised to MakeMyTrip, two different guests show up for the same room—a catastrophic **overbooking**. To prevent this, the hotel was afraid to take direct online bookings.

---

## 💡 How This Product Solves It

We built an integrated **Direct-Booking Engine & AI Operations Router** specifically tailored for Company A:

1. **Guaranteed "Allotment Control" (No Overbooking Ever):**
   * The General Manager (GM) sets aside a safe slice of rooms for the website (e.g., 8 out of 32 Heritage rooms).
   * The website **only ever sells from this slice**. It mathematically cannot touch the rooms reserved for agencies.
   * Every booking locks the room inside a sub-millisecond database transaction (`prisma.$transaction`), exactly like booking a Tatkal train ticket.

2. **Instant Direct Perks for Guests:**
   * Guests see real live prices, photo carousels, and statutory GST breakdowns.
   * Use promo code `COFFEE10` for an instant 10% discount—cheaper than MakeMyTrip, yet saving the resort 10% in net margin!
   * Immediate digital tax invoice and Card-on-File stay extensions.

3. **AI Concierge That Drafts Replies in Under 2 Minutes:**
   * When an inquiry arrives (via website form, forwarded email, or WhatsApp), Google Gemini 3.5 Flash instantly reads it.
   * It extracts the number of guests (e.g., 250 wedding attendees), dates, and catering needs.
   * It drafts a polite, customized quotation using **official prices from our rate table** (the AI is strictly forbidden from hallucinating prices).
   * Staff review the draft on their screen, make any changes, and click **"Approve & Send"** in one click.

---

## 💰 Financial Impact: ₹1.05 Crore / Year Saved

| Financial Metric | Baseline (Before) | With This Platform | Net Annual Benefit |
| :--- | :--- | :--- | :--- |
| **Total Annual Room Nights** (76 keys @ 62% occupancy) | 17,199 nights | 17,199 nights | — |
| **Direct Booking Share** | 12% | **20% (+8% target)** | Shifting 1,376 nights from OTAs to Direct |
| **Annual OTA Commission Paid** (at 20% commission) | ₹2.22 Crore / yr | ₹1.88 Crore / yr | **₹33.3 Lakhs Saved** |
| **Event Inquiries per Month** | 90 inquiries | 90 inquiries | — |
| **Lost Inquiries due to >24h delay** (at ₹2 Lakh contribution each) | 3 events / month | **0 events lost** (reply in <30 mins) | **₹72.0 Lakhs Recovered** |
| **Total Financial Value Delivered** | — | — | **₹1.053 Crore / Year** |
| **Development Budget & Timeline** | ₹8.00 Lakhs | Delivered in 7 Weeks | **13.1x First-Year ROI** |

---

## 🚀 Quick Start (Run Locally in 2 Minutes)

This project is built with **Next.js 14 App Router** and **Prisma ORM with SQLite**. It requires **zero external database setup, no Docker, and no cloud dependencies** to run locally.

### Prerequisites
* **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
* **npm**: `v9.0.0` or higher

### Step 1: Clone or Open the Repository
```bash
git clone https://github.com/Dinakarluffy/the-estate-resort.git
cd the-estate-resort
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Automated Test Suite (160 Tests)
Verify the core business invariants (allotment concurrency, GST calculation, promo validation, and AI routing):
```bash
npm test
```
> **Expected Output:** `15 passed (15 test files), 160 passed (160 tests), 100% green in ~8s`.

### Step 4: Start the Local Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Seeded Demo Accounts (1-Click Logins)

The homepage includes an **Evaluator Showcase Toolbar** across the top. Click any demo pill to switch accounts instantly without typing credentials:

| Role | Demo Email | Password | What You Can Test & Evaluate |
| :--- | :--- | :--- | :--- |
| **Guest (Priya Sharma)** | `guest@estate.com` *(or `priya@estate.com`)* | `demo1234` | Browse rooms, promo code `COFFEE10`, test-payment checkout, view bookings at `/my-bookings`, Card-on-File stay extension, 48h free cancellation. |
| **Reservations Staff (Karthik Babu)** | `staff@estate.com` *(or `karthik.babu@estate.com`)* | `demo1234` | Access `/staff/inbox`, view SLA countdown timers, inspect Gemini AI lead classification, edit quotation drafts, approve & send quotes, mark guest check-in at `/staff/bookings`, export 21-column PMS statutory CSV. |
| **General Manager (Vikram Hegde)** | `gm@estate.com` *(or `vikram.hegde@estate.com`)* | `demo1234` | Access `/admin/rates`, edit 45-day dynamic room rates and website allotments, test **Physical Key Ceiling Guardrail** (rejects allotments > total keys), schedule full-estate wedding blackouts, manage promo codes, view GM Unsorted AI lane and complaint alerts. |

---

## 🏛️ Core System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Experience (Next.js 14 App Router)"]
        GuestView["Guest Portal\n(/rooms, /book, /my-bookings)"]
        StaffView["Staff AI Operations\n(/staff/inbox, /staff/bookings)"]
        AdminView["GM Control Center\n(/admin/rates, /admin/promos)"]
        EvalBar["Evaluator Launchpad\n(1-Click Logins & Live Diagnostics)"]
    end

    subgraph SecurityLayer["Edge Security & Middleware"]
        EdgeAuth["Jose Edge JWT Session Guard\n(estate_session HttpOnly Cookie)"]
        RateLimiter["Sliding-Window Rate Limiter\n(Anti-Brute Force Protection)"]
        Sanitizer["XSS Sanitization & Data Scrubber\n(DPDP Act 2023 Compliant)"]
    end

    subgraph BusinessLogic["Hard Business Logic (src/lib/)"]
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

---

## 🖥️ Screen-by-Screen Walkthrough

### 1. Luxury Homepage & Evaluator Launchpad (`/`)
* **Dual-Purpose Design:** Built to provide an authentic, warm luxury resort ambiance for guests while equipping evaluators with 1-click account switchers and real-time AI diagnostic pills (`/api/health`, `/api/ai/test`).
* **Live Booking Bar:** Instant date selection with real-time promo banner (`COFFEE10` for 10% direct saving).
* **Accommodations Showcase:** 3 room tiers displaying physical key counts (32 Heritage, 32 Suite, 12 Villa).

### 2. Live Inventory & Room Catalog (`/rooms`)
* **Real-Time Key Availability:** Shows exact keys remaining in website allotment (e.g., `5 Keys Available Direct`).
* **Photo Carousels & Lightbox:** Interactive high-resolution photography with guest amenities and room dimensions.
* **Blackout Status:** Blocked dates (such as full property buyouts) automatically render as `Unavailable (Blackout)`.

### 3. 3-Step Frictionless Checkout Wizard (`/book`)
* **Step 1 — Room & Stay:** Live re-validation of dates and availability to avoid stale session bookings.
* **Step 2 — Guest Details:** Auto-filled for logged-in guests; collects only necessary contact details (passport Form C handled at front desk per Indian hotel regulation).
* **Step 3 — Payment & GST Tax Invoice:** Transparent tax calculation (CGST + SGST under SAC 996311) and mock Razorpay payment simulation (`PAY-RZP-2026-XXXX`).

### 4. Guest Self-Service & Stay Extensions (`/my-bookings`)
* **In-House Stay Extension:** Guests currently checked in can extend their stay (+1 night) using their **Card on File**. The system re-checks allotment and charges the pro-rated difference atomically.
* **Overbooking & Blackout Guard:** If an extension touches a date reserved for an exclusive wedding buyout, the extension is cleanly blocked with an explanatory error.
* **48-Hour Free Cancellation:** Self-service cancellation with 1-click refund and atomic allotment release if check-in is $\ge 48$ hours away.

### 5. Unified Staff AI Enquiry Inbox (`/staff/inbox`)
* **Multi-Channel Ingestion:** Aggregates leads from Website forms, Forwarded Emails, and WhatsApp.
* **Live 30-Minute SLA Timers:** Visual countdown timers ensure no high-ticket wedding inquiry slips past the 30-minute target.
* **Human-in-the-Loop Review Modal:** Staff inspect AI-extracted entities (dates, guest count, budget) and review the auto-drafted quotation. Staff can edit any line item and click **"Approve & Dispatch"**.
* **GM Unsorted Lane:** Inquiries with confidence scores $< 0.70$ or guest complaints automatically escalate to the GM's queue.

### 6. Front Desk Operations & PMS CSV Export (`/staff/bookings`)
* **Operational Roster:** Search by guest name, phone, email, or booking reference (`EST-2026-XXXX`).
* **Check-In Guest:** 1-click button updates room status to `CHECKED_IN`.
* **Statutory PMS Export:** Exports an RFC 4180 compliant CSV formatted for Property Management Systems (Opera PMS / IDS Next) with 21 columns including SAC code `996311`, split CGST/SGST, and guest contact information.

### 7. GM 45-Day Dynamic Rate & Allotment Matrix (`/admin/rates`)
* **45-Day Grid:** Full control over nightly base rates, website allotments, and physical key limits.
* **Physical Key Ceiling Guardrail:** Prevents the GM from accidentally setting an allotment higher than the physical keys in the hotel (e.g., trying to set 45 keys on the 32-key Luxury Suite is immediately blocked with HTTP 400).
* **Promo Code Budget Engine:** Set percentage discounts, validity windows, and maximum rupee discount caps (e.g., ₹3,000 max discount cap).

---

## 🔒 The "Hard Part": How We Prevent Overbooking

The primary technical challenge in the brief is **Allotment Control**: ensuring the website sells only from an admin-allocated pool without ever touching travel agency contracted keys.

We guarantee zero overbookings using a **Two-Tier Invariant Architecture**:

```
                       ALLOTMENT SAFETY ARCHITECTURE
                       
       +-------------------------------------------------------------+
       |             76 TOTAL PHYSICAL KEYS IN RESORT                |
       |  (32 Planter's Heritage + 32 Luxury Suites + 12 Pool Villas)  |
       +-------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         |
+------------------------------------+                             v
| Travel Agency & Offline Stock      |             +----------------------------------+
| (Contracted keys: MMT, Agoda)      |             | Website Allotment (e.g. 17 keys) |
| System mathematically cannot touch |             +----------------------------------+
+------------------------------------+                             |
                                                                   v
                                                  +----------------------------------+
                                                  | prisma.$transaction (ACID Lock)  |
                                                  | 1. Lock daily allotment row      |
                                                  | 2. Check: bookedCount < allotment|
                                                  | 3. Increment bookedCount by 1    |
                                                  | 4. Create Booking record         |
                                                  +----------------------------------+
                                                                   |
                                                  +----------------------------------+
                                                  | If keys reach 0 on ANY night:    |
                                                  | Entire transaction ROLLS BACK.   |
                                                  | ZERO OVERBOOKINGS GUARANTEED.    |
                                                  +----------------------------------+
```

---

## 🤖 The AI Router & Human-in-the-Loop Safety

The AI system is powered by **Google Gemini 3.5 Flash** with four non-negotiable safety guardrails:

1. **Strictly Grounded Prices:** The AI model is **never allowed to invent or hallucinate room rates**. All quotation drafts fetch active prices directly from the SQL database rate table.
2. **Human-in-the-Loop Guarantee:** Quotations are **never dispatched to customers automatically**. They land in the Staff Inbox as editable drafts. Staff review, polish, and approve with 1 click.
3. **Deterministic Fallback Engine:** If the Gemini API is offline, experiencing network latency, or has reached free-tier rate limits, the system instantly switches to a **deterministic heuristic parsing engine** without dropping a single lead.
4. **GM Complaint Escalation:** Any inquiry containing customer dissatisfaction or maintenance issues (e.g., water leak, AC breakdown) is automatically flagged with high urgency and routed to the General Manager's attention.

---

## ⚖️ Statutory Indian Compliance (GST & DPDP Act 2023)

### 1. Dual-Tier Indian Hotel GST (SAC Code 996311)
Indian taxation law mandates different GST rates based on room tariffs:
* **Tariff $\le$ ₹7,500 / night:** **12% GST** (6% Central GST + 6% Karnataka State GST)
* **Tariff $>$ ₹7,500 / night:** **18% GST** (9% Central GST + 9% Karnataka State GST)

The platform calculates taxes per night dynamically. If a promo code lowers the room tariff below the threshold, the tax bracket adjusts accordingly.

### 2. Digital Personal Data Protection (DPDP) Act 2023
* **Data Minimization:** Online booking collects only basic guest details (name, email, phone).
* **Foreign Guest Form C Exemption:** Per Indian hospitality regulations, passport copies and visa details are taken physically at front desk check-in, never transmitted over public web forms.
* **Edge Session Security:** Passwords hashed with `bcryptjs` (salt 10). Authentication uses tamper-proof signed JSON Web Tokens (`jose`) stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.

---

## 🧪 Automated Verification & Test Matrix (160 Tests)

The entire backend and business logic is backed by **15 Vitest test suites containing 160 automated tests**:

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

To run all tests:
```bash
npm test
```

---

## 📋 Submission Checklist & Assumptions

| Requirement from Brief | Implementation Status | Notes |
| :--- | :--- | :--- |
| **Direct Booking Website** | ✅ Complete | Rooms with photos, live availability, rate plans, taxes, Razorpay checkout |
| **Allotment Control** | ✅ Complete | Atomic `prisma.$transaction` ensures website never oversells agency keys |
| **Admin Rates & Allotments** | ✅ Complete | GM 45-day matrix with physical capacity ceiling guardrail |
| **Unified Enquiry Inbox** | ✅ Complete | Web form, forwarded email, and simulated WhatsApp channels |
| **AI Router & Lead Drafter** | ✅ Complete | Gemini 3.5 Flash + fallback engine; extracts guests/dates; drafts rate quotes |
| **Structured Event Form** | ✅ Complete | 1-click benchmarks on `/events` (Sister's Wedding 250 pax, Offsite 45 pax) |
| **Daily PMS CSV Export** | ✅ Complete | 21-column RFC 4180 CSV export with SAC Code `996311` |
| **Statutory Indian GST** | ✅ Complete | 12% ($\le$ ₹7,500) and 18% ($>$ ₹7,500) split into CGST + SGST |
| **Foreign Guest Form C** | ✅ Complete | Safely deferred to physical check-in per hotel practice and DPDP Act |
| **TDD Document** | ✅ Complete | Included as `TDD.md` (and exportable to PDF/Word) |
| **Deployment Guide** | ✅ Complete | Included as `deployment.md` |

### Key Assumptions Labeled:
1. **Physical Keys (76 Keys):** 32 Planter's Heritage Rooms, 32 Coffee Estate Luxury Suites, and 12 Misty Valley Pool Villas.
2. **Default Website Allotment (17 Keys):** 8 Heritage, 6 Suites, 3 Villas dedicated to direct bookings; 59 keys reserved for travel agency and offline contracted stock.
3. **Payment Gateway:** Simulated Razorpay test mode (`PAY-RZP-2026-XXXX`) allowing instant local evaluation without live bank credentials.
4. **WhatsApp Channel:** Simulated via `/events` channel switcher and API payload to allow frictionless reviewer testing.

---
*Developed for IsoCode Labs Technical Assessment — Problem #5 (The Estate Resort, Chikkamagaluru).*
