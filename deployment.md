# The Estate Resort — Deployment & Reviewer Guide

**Assessment:** IsoCode Labs Take-Home Assessment — Problem #5: Hill Resort Direct-Booking Website & AI Lead Routing  
**Client:** Company A — Luxury Coffee-Estate Hill Resort, Mullayanagiri, Chikkamagaluru, Karnataka  
**Scale:** 76 Keys total (64 Luxury Heritage Rooms + 12 Private Plunge Pool Villas)  
**Direct Allotment:** 17 Keys online (protecting 59 keys for travel partners & offline corporate buyouts)

---

## 1. Quick Start (Zero-Setup Local Review)

The project uses **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM with SQLite** (`prisma/dev.db`). No external database servers or Docker containers are required to run or review the application.

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Full Automated Test Suite
Run the 100% coverage unit and integration test suite across all 11 backend business modules:
```bash
npm test
```
> **Result:** 11 test suites, **123 automated Vitest tests pass** in $\sim 5$ seconds.

### Step 3: Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 2. Pre-Seeded Demo Accounts

The database comes pre-seeded with 10 accounts covering all 3 authorization tiers:

| Role | Email Address | Password | Permissions & Scope |
|:-----|:--------------|:---------|:---------------------|
| **Guest (Leisure Traveler)** | `guest@estate.com` | `guest123` | Browses room catalog, applies promo `COFFEE10`, books rooms, manages active stays, 48-hour free cancellation, views GST receipts. |
| **Reservations Staff** | `staff@estate.com` | `staff123` | Front desk bookings roster, marks guest check-ins, 1-click PMS CSV export, reviews AI enquiry inbox, edits rate-grounded replies, approves & sends quotes. |
| **General Manager (Admin)** | `gm@estate.com` | `admin123` | Full access: 45-day rate & allotment calendar, bulk seasonal surcharges, blackout scheduling, promo code management, user administration (peer-protected GM accounts). |

---

## 3. Screen-by-Screen Reviewer Tour Guide

### Screen 1: Rooms & Luxury Villas Catalog (`/rooms`)
- **Direct Inventory Allotment:** Live badge showing website keys available (e.g. `7 Keys Available Direct`). Prevents overselling agency inventory.
- **Interactive Photo Gallery:** 9 high-resolution resort photos across 3 luxury room tiers. Includes carousel navigation and full-screen lightbox modal on image click.
- **Statutory Indian GST Slabs:** Dynamic display of 12% GST ($\le$ ₹7,500/night) or 18% GST ($>$ ₹7,500/night) under SAC Code `996311`.

### Screen 2: 3-Step Direct Checkout Wizard (`/book`)
- **Step 1 (Stay & Room):** Live interactive date picker with real-time allotment and blackout re-checks.
- **Step 2 (Guest Details):** Auto-filled from authenticated guest profile (collects only minimal necessary booking data online; foreign guest passport Form C collected at check-in per hotel practice).
- **Step 3 (Payment & Promo):** Promo code `COFFEE10` validator with instant 10% discount calculation, split CGST + SGST tax invoice preview, and mock Razorpay payment gateway simulation (Card & UPI).

### Screen 3: Guest Reservation History & Stay Management (`/my-bookings`)
- **Active vs. Completed Stay Separation:** Past stays are marked `COMPLETED STAY` with extension disabled; current stays show `Extend Stay`.
- **48-Hour Free Cancellation Rule:** Guests can self-cancel with 1 click if check-in is $\ge 48$ hours away. The system atomically releases the reserved key back to resort inventory and refunds the payment. Within 48 hours, the system protects resort revenue by routing to Front Desk phone support.
- **Duplicate Stay Handling:** If a guest attempts to re-book an already confirmed room, an active reservation alert opens with 3 real-world options:
  1. *Extend Stay:* Select new checkout date, live allotment verification, and pay pro-rated difference + GST.
  2. *Book Additional Room:* Book a 2nd room for accompanying family/friends.
  3. *View Receipt:* 1-click access to official printable GST tax invoice (`/confirmation/[bookingNumber]`).

### Screen 4: Rate & Allotment Calendar (`/admin/rates` — GM Only)
- **45-Day Dynamic Matrix:** Live grid of rates, website allotments, booked keys, and direct key availability for all room types.
- **1-Click Inline Editing:** Adjust any nightly rate or website allotment with inline input (hospitality guardrail prevents setting allotment lower than already-booked keys).
- **Bulk Seasonal Surcharges:** Set holiday / peak weekend rates across date ranges in 1 click.
- **Blackout Management:** Block specific room types or schedule resort-wide blackouts (e.g. full-estate wedding buyouts).
- **Promotional Vouchers:** Create, cap, and toggle voucher codes (`COFFEE10`).

### Screen 5: Front Desk Roster & PMS CSV Export (`/staff/bookings` — Staff & GM)
- **Operational Roster:** Search by guest name, phone, email, or booking reference (`EST-2026-XXXX`). Filter by `CONFIRMED`, `CHECKED_IN`, `CANCELLED`.
- **Guest Check-In:** 1-click "Check In" button for arriving guests.
- **1-Click PMS Export:** Downloads an RFC 4180 compliant CSV formatted for hotel Property Management Systems (Opera PMS / IDS Next) with booking references, split CGST/SGST, SAC codes, and stay schedules.

### Screen 6: Unified AI Enquiry Inbox (`/staff/dashboard` — Staff & GM)
- **Multi-Channel Classification:** Reads inquiries from Website forms, forwarded Emails, and WhatsApp messages.
- **Gemini 3.5 Flash Router:** Classifies leads into `WEDDING`, `OFFSITE`, `ROOM`, `COMPLAINT`, and `UNSORTED`.
- **Entity Extraction:** Extracts event dates, guest counts (e.g., 250 wedding guests, 45 offsite pax), and budget indicators.
- **Rate-Grounded Draft Quotations:** Prices in AI drafts are strictly grounded in active database rates.
- **Human-in-the-Loop Guarantee:** AI drafts are never sent automatically. Staff review, edit if needed, and click "Approve & Send" (or 1-click "Re-Route").
- **Complaint & GM Unsorted Lane:** Complaints trigger immediate GM alerts; confidence scores $< 0.70$ route to the GM Unsorted queue.

### Interactive Lead Simulator (`/events`)
- Reviewers can test the AI router in 1 click using pre-configured IsoCode assessment benchmarks:
  - 🎊 *Sister's Wedding (250 Pax)* $\rightarrow$ Classified as `WEDDING`, extracts 250 guests.
  - 💼 *Corporate Offsite (45 Pax)* $\rightarrow$ Classified as `OFFSITE`, extracts 45 attendees.
  - 🛏️ *Pool Villa Query (2A+1C)* $\rightarrow$ Classified as `ROOM`, quotes live rate table.
  - ⚠️ *AC Broken Water Leak* $\rightarrow$ Classified as `COMPLAINT`, alerts GM Vikram Hegde.
  - 🤷 *Ambiguous Query* $\rightarrow$ Confidence $< 0.70$, routed to GM Unsorted lane.

---

## 4. Key Architectural Strengths

1. **Tatkal-Style Concurrency Control:**
   Multi-night bookings use database row locks (`prisma.$transaction`) with strict allotment count verification:
   $$\text{Available Keys}_d = \text{websiteAllotment}_d - \text{bookedCount}_d$$
   If available keys reach 0 on any night in a date range, the transaction rolls back cleanly, guaranteeing **0 overbookings**.

2. **Statutory Indian GST Compliance:**
   - Room tariff $\le$ ₹7,500/night $\rightarrow$ **12% GST** (6% CGST + 6% Karnataka SGST).
   - Room tariff $>$ ₹7,500/night $\rightarrow$ **18% GST** (9% CGST + 9% Karnataka SGST).
   - SAC Code `996311` embedded in all invoice breakdowns and PMS CSV exports.

3. **100% Backend Test Coverage:**
   Every single backend business logic module (`file.ts`) has an associated `file.test.ts` suite testing both normal operations and edge cases (boundary values, concurrent exhaustion, negative values, and role escalation).
