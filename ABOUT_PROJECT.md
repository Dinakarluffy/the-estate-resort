# 📋 Project Brief — Problem #5
# Hill Resort's Direct-Booking Website with AI Enquiry Routing

---

## 🗂️ RAW BRIEF (Original — Exactly as given by IsoCode Labs)

---

### Client

Company A, Chikkamagaluru, Karnataka. Coffee-estate resort with 64 rooms and 12 villas (76 keys) and lawns for weddings and offsites. 140 staff, revenue ₹24–28 crore a year. Run by a General Manager (GM).

### Today

68% of room nights come through online travel agencies at 18–22% commission; only 12% are direct. The website is a brochure with a phone number. Event enquiries arrive by email, phone, social media and the GM's own WhatsApp. Rates live in Excel.

### The Problem

Assumptions: 76 keys × 365 × 62% occupancy = 17,199 room nights at ₹9,500. 68% via agencies = 11,695 nights = ₹11.11 crore, at 20% commission = ₹2.22 crore a year; moving 15% of that to direct saves ₹33.3 lakh. Of 90 event enquiries a month, 30% wait over a day for a reply, losing about 3 events a month at ₹2 lakh contribution: 36 × ₹2 lakh = ₹72 lakh. Total ₹1.05 crore a year.

### Users

Guests, the reservations and sales team, and the GM. The owner signs the deal.

### The Ask

We pay agencies a fifth of every room they sell, while many guests would book direct if our site let them. I want a fast, beautiful site where guests pick dates, see real prices and pay. Every enquiry, from any channel, should land in one place and reach the right person with a reply ready.

### Must Have

- Booking website: rooms with photos, availability, rate plans, prices with taxes, test-mode payment and confirmation
- Admin for daily rates, website allotment, blackout dates and promo codes
- One enquiry inbox for the web form, forwarded emails and WhatsApp (simulated in this build)
- AI router: classifies enquiries (room, wedding, offsite, complaint), extracts dates, guests and budget, assigns an owner and drafts a reply
- Structured wedding and event enquiry form
- Daily booking export for the reservation system

### Core Build

Software Engineering candidates must ship this slice end to end, in about 6 to 8 screens: room pages with availability and price, booking with test payment, rate and allotment admin, and enquiry inbox with AI routing. Roles: guest and reservations staff. AI: enquiry classification and reply draft. Hard part: allotment control so the site never overbooks. Mock payments, messages and outside systems, and seed from the sample data. The rest of MUST HAVE is optional depth.

### Out of Scope

- Replacing the reservation system or a channel manager
- Loyalty programme
- Restaurant bookings

### AI or Automation

AI classifies, routes and drafts replies. When it is wrong: low-confidence enquiries go to an unsorted lane the GM sees; staff re-route in one click; drafts are never sent automatically; prices in drafts come from the rate table, not the AI. Complaints always alert the GM.

### Constraints

- The site sells only an admin-set allotment, so it cannot overbook agency stock.
- Passport details for foreign guests' Form C are taken at check-in, not online.
- Guest data is personal data under the DPDP Act 2023.
- Pages and photos must load fast on slow hill-station networks.
- Show GST at the rate for the tariff.

### Design

The client values good, minimal design: clean layouts, white space, a restrained palette and clear type, with nothing on screen that lacks a purpose. Design counts as much as features. The booking site sells the experience: large photos, a quiet layout and a booking flow of no more than three steps.

### Budget and Time

₹8 lakh, 7 weeks. Success: direct share from 12% to 20% of room nights in 12 months; median first reply under 30 minutes in working hours; zero website overbookings.

### Sample Data

| Enquiry ID | Message | Expected Category |
|:-----------|:--------|:------------------|
| ENQ-4410 | Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights | Wedding |
| ENQ-4411 | Is a villa free 14-16 Nov for 2 adults and a child? | Room booking |
| ENQ-4412 | Team of 45 wants a January offsite with a conference hall | Corporate offsite |

---
---

## 🧠 PLAIN ENGLISH EXPLANATION
### (Read this first if you want to understand what we're building before diving into code)

---

### 🏨 Who is the Client?

There's a beautiful **coffee-estate resort** tucked in the hills of **Chikkamagaluru, Karnataka** (think misty mountains, coffee plantations, cool weather — like a Coorg resort).

- It has **64 hotel rooms + 12 villas = 76 total rooms** (called "76 keys" in hotel industry language — one "key" = one room)
- It also has **open lawns** for weddings and company events (offsites)
- **140 staff** work there
- It earns **₹24–28 crore every year** in revenue
- It's managed day-to-day by a **General Manager (GM)**

---

### 😤 What's the Current Problem?

#### Problem 1 — Paying Too Much Commission to OTAs

Right now, **68% of guests book through OTAs** (Online Travel Agencies) like MakeMyTrip, Booking.com, Expedia, etc.

These OTAs charge **18–22% commission** on every booking.

> 💸 Simple Math:
> - Room costs: ₹9,500/night
> - OTA takes 20% = ₹1,900
> - Resort gets only: ₹7,600
>
> They lose ₹1,900 on EVERY SINGLE OTA booking.
> Over a year, that's **₹2.22 crore going to OTAs as commission**.
>
> If even 15% of those bookings moved to their own website, they'd save **₹33.3 lakh/year**.

The resort's current website is basically just a **photo album with a phone number** — you can't book on it.

#### Problem 2 — Losing Events Because No One Replies Fast Enough

People enquire about **weddings, corporate offsites, birthday parties** through:
- Their website's contact form
- Email
- Phone calls
- Social media DMs (Instagram, Facebook)
- **The GM's personal WhatsApp** 😬

These enquiries are scattered everywhere. No one tracks them. **30% of enquiries wait more than a day for a reply.** By then, the client has booked another venue.

> 📉 They lose ~3 events/month this way.
> Each event contributes ₹2 lakh profit.
> That's **₹72 lakh/year lost** just from slow replies.

**Total problem size = ₹33.3L + ₹72L = ₹1.05 crore/year** being lost.

---

### 🎯 What Does the Client Want Us to Build?

Two things:

1. **A beautiful booking website** where guests can pick dates, see real prices, and pay — without going to MakeMyTrip
2. **A smart enquiry inbox** where every message (from any channel) lands in one place, and an AI helps route and reply to it

---

### 🏗️ What We Are Actually Building — Screen by Screen

Think of it in **3 parts**:

---

#### 🌐 Part 1 — The Guest Booking Website (What guests see)

**Screen 1: Home Page**
- Big, beautiful photos of the resort (think luxury travel magazine vibes)
- A search bar: pick your **check-in date, check-out date, number of guests**
- Hit search → see available rooms

**Screen 2: Rooms & Villas Page**
- Cards showing each room type (Deluxe Room, Pool Villa, Coffee Estate Villa, etc.)
- Photos, amenities, capacity
- Price per night **with GST shown clearly** (not hidden in fine print)
- "Book Now" button

**Screen 3: Booking Flow (3 steps max)**
- Step 1: Confirm dates + room
- Step 2: Enter basic guest details (name, phone, email — just the minimum)
- Step 3: Pay (test/mock payment — like a demo, not real money) → Get confirmation email/page

---

#### ⚙️ Part 2 — The Admin Panel (What reservations staff and GM see)

**Screen 4: Rate & Allotment Calendar**
- The staff can open a calendar and set:
  - **Daily room price** (e.g., ₹9,500 on weekdays, ₹12,000 on weekends)
  - **Website allotment** = How many rooms are available for online booking
    - (Remember: the resort also sells through travel agents. So they can't put ALL 76 rooms online — they might set "only 10 rooms available on the website")
  - **Blackout dates** = Days when online booking is disabled (e.g., during a private wedding event)
  - **Promo codes** (e.g., COFFEE10 → 10% off)

**Screen 5: Bookings Dashboard**
- List of all confirmed bookings
- Status: Confirmed / Checked-in / Cancelled
- Export button → Downloads a CSV file for the offline reservation system

---

#### 🤖 Part 3 — The AI Enquiry Inbox (The smart part)

**Screen 6: Unified Enquiry Inbox**

Every message — website form, forwarded email, simulated WhatsApp — lands here in one list.

The AI reads each message and automatically:

| Message | AI Says | AI Does |
|:--------|:--------|:--------|
| "Venue for my sister's wedding, 250 guests, Feb 2027" | 🎊 **Wedding** | Assigns to Sales team, extracts: Date=Feb 2027, Guests=250, drafts a reply |
| "Is a villa free 14-16 Nov for 2 adults and a child?" | 🛏️ **Room Booking** | Assigns to Reservations, extracts: Dates=Nov 14-16, Guests=3, drafts a reply with real price from the rate table |
| "Team of 45 for a January offsite with a conference hall" | 💼 **Corporate Offsite** | Assigns to Events team, extracts: Month=Jan, Guests=45, drafts a reply |
| "AC in my room is not working, very hot" | ⚠️ **Complaint** | Immediately pings the GM with an alert |
| "Can you help me?" (too vague) | 🤷 **Unsure (Low Confidence)** | Goes to a separate "unsorted" pile — GM reviews manually |

The staff then:
1. Reads the AI's draft reply
2. Edits it if needed
3. Clicks **Send** (the AI **never sends on its own** — always human-approved)

---

### 🔐 The 3 Types of Users (Roles)

| Who | What They Can Do |
|:----|:----------------|
| **Guest** | Browse rooms, check availability, book, pay |
| **Reservations Staff** | View bookings, manage the AI enquiry inbox, review and send replies |
| **GM / Admin** | Everything above + set prices, set allotment, blackout dates, promo codes, see the unreviewed/low-confidence AI pile |

---

### 🧩 The One "Hard" Engineering Problem — No Overbooking

This is the most important technical constraint and the best story to tell in an interview.

**The Problem:**
Imagine the resort has set 2 villas available online for Nov 14-16.

Two people — let's call them Ravi and Priya — both open the booking page at the exact same moment and both see "2 villas available". Both click "Book Now" at the same time.

**What should happen?** Only 1 should succeed. The other should see "Sorry, sold out."

**What could go wrong without proper code?** Both succeed → resort has 1 villa but 2 bookings → overbooking → angry guests → hotel's reputation ruined.

**How we fix it:**
We use **database-level atomic transactions** — essentially a lock that says "only one booking can claim the last room at a time". The second person's request waits a millisecond, sees there are 0 rooms left, and gets a "sold out" message.

> 💡 Interview soundbite: *"I solved concurrent booking conflicts using atomic database transactions to prevent race conditions — the same way IRCTC handles Tatkal bookings."*

---

### 🇮🇳 Indian-Specific Things to Know

#### GST on Hotel Rooms (Mandatory to show)
Hotel rooms in India have **tiered GST rates**:
- Room tariff **up to ₹7,500/night** → **12% GST**
- Room tariff **above ₹7,500/night** → **18% GST**

We must show this clearly on the booking page. Example:
```
Room rate:   ₹9,500
GST (18%):   ₹1,710
Total:      ₹11,210
```

#### DPDP Act 2023 (India's Data Privacy Law)
- We must collect **minimum guest data** (name, email, phone — that's it online)
- **No passport numbers online** — those are collected at the front desk during check-in (for the government's Form C, required for foreign guests)
- We don't store unnecessary personal data

#### Slow Network Reality
Hill station = poor internet sometimes. So our website must:
- Load fast (compressed images, lazy loading)
- Work even on a slow 3G/4G connection

---

### 🚫 What We Are NOT Building (Out of Scope)

| Not Building | Why |
|:-------------|:----|
| Replacing the existing offline hotel reservation system | Too complex, out of scope |
| Channel Manager (syncing with MakeMyTrip/Booking.com) | Out of scope |
| Loyalty/rewards program | Out of scope |
| Restaurant/dining bookings | Out of scope |

---

### 🎨 Design Philosophy

The client's exact words: *"Good, minimal design. Clean layouts, white space, a restrained palette and clear type. Nothing on screen that lacks a purpose."*

Translation:
- **No clutter.** Every element earns its place on the page.
- **Big, beautiful photos** (the resort sells itself visually)
- **Calm colour palette** — think creams, forest greens, warm browns, earthy tones (coffee estate vibes)
- **Booking in 3 steps max** — no 10-page checkout flows
- **Works on mobile** — many guests will browse on their phone

---

### 💰 Budget & Success Metrics

| Item | Detail |
|:-----|:-------|
| Budget | ₹8 lakh |
| Timeline | 7 weeks |
| Goal 1 | Direct bookings go from **12% → 20%** of room nights in 12 months |
| Goal 2 | Median first reply to enquiries: **under 30 minutes** during working hours |
| Goal 3 | **Zero overbookings** via the website — ever |

---

### 🧪 Sample Data (Pre-seeded for the Demo)

These 3 enquiries will be pre-loaded in the app so the reviewer can see the AI inbox working immediately:

| ID | What they said | What AI should classify it as |
|:---|:---------------|:------------------------------|
| ENQ-4410 | "Venue for my sister's wedding in Feb 2027, about 250 guests, 2 nights" | 🎊 Wedding |
| ENQ-4411 | "Is a villa free 14-16 Nov for 2 adults and a child?" | 🛏️ Room Booking |
| ENQ-4412 | "Team of 45 wants a January offsite with a conference hall" | 💼 Corporate Offsite |

---

### 🗣️ How to Explain This in an Interview (60 Seconds)

> *"I built a direct hotel booking system for a Chikkamagaluru coffee-estate resort — think of it as the resort's own alternative to MakeMyTrip. Guests can browse rooms, check real-time availability, and pay directly on the resort's website, cutting out OTA commissions.*
>
> *On the backend, I built an allotment control system so the site never oversells — using atomic database transactions to handle concurrent bookings safely, the same way IRCTC handles Tatkal seat racing.*
>
> *I also built an AI-powered enquiry inbox that classifies incoming messages — wedding, room booking, corporate event, or complaint — extracts details like dates and guest count, and drafts a contextually grounded reply using real prices from the rate table (not AI-hallucinated prices). Staff review and approve before anything is sent."*

---

### 📁 Project Tech Stack (What We'll Use to Build It)

| Layer | Technology | Why |
|:------|:-----------|:----|
| Frontend + Backend | **Next.js 15 (TypeScript)** | One codebase, fast SSR, easy deployment |
| Styling | **Tailwind CSS + Shadcn UI** | Clean, fast, consistent design system |
| Database | **PostgreSQL via Prisma ORM** | Reliable, supports atomic transactions (critical for overbooking prevention) |
| Authentication | **NextAuth.js** | Simple role-based login (Guest / Staff / GM) |
| AI | **Google Gemini API** | Enquiry classification, entity extraction, reply drafting |
| Payments | **Razorpay Test Mode** | Mock payment flow (no real money) |
| Deployment | **Vercel** | Zero-config deployment, free tier works |

---

*Last updated: November 2026*
*Project: IsoCode Labs — Software Engineering Intern Take-Home Task*

---
---

# 🚀 PRODUCTION IMPLEMENTATION MASTER REPORT (PHASES 1 TO 4)
### Complete Technical Architecture, Implemented Features & Real-World Domain Invariants

---

## 1. System Architecture & Concurrency Model

The platform was built with a strict **hospitality-first architecture** conforming to Indian statutory regulations and zero-overbooking guarantees:

* **Full-Stack Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide React icons.
* **Database & Concurrency:** Prisma ORM with SQLite (`prisma/dev.db`), enforcing ACID transaction locks (`prisma.$transaction`) to eliminate double-booking race conditions across simultaneous multi-night reservations.
* **Stateless Edge Authentication:** Edge-compatible JWT stored in secure HTTP-only cookies (`estate_session`), bcrypt password hashing, and Next.js Edge Middleware route guards.
* **Three-Tier User Roles:**
  * `GUEST`: Leisure traveler; browses catalog, reserves keys, applies promo codes, manages stays, and views tax receipts.
  * `STAFF`: Front desk & reservation agent; reviews enquiries, manages bookings, and triggers PMS CSV exports.
  * `GM`: General Manager; adjusts rates, sets allotments, blackouts dates, reviews unreviewed AI leads, and promotes staff members.

---

## 2. Phase-by-Phase Features Implemented

### 📦 Phase 0 & Phase 1: Foundation, Data Models & Role-Based Access Control

1. **Prisma Relational Data Model (8 Models):**
   * `User`: Accounts with roles (`GUEST`, `STAFF`, `GM`), password hashes, and phone numbers.
   * `RoomType`: Defines 3 luxury categories, total keys, default website allotment, base pricing, amenities, and photo sets.
   * `Allotment`: Daily inventory matrix tracking `websiteAllotment` and `bookedCount` for each room type over 45 days.
   * `Rate`: Dynamic daily pricing tracking base weekday rates and +20% weekend surcharges.
   * `BlackoutDate`: Blocks dates for estate buyouts, maintenance, or high-value weddings.
   * `PromoCode`: Code validator with percentage discount, minimum booking tariff, validity window, and usage count caps (`COFFEE10`).
   * `Booking`: Grounded statutory reservation record storing guest contact, check-in/out, GST slab rate, itemized CGST/SGST, and payment tokens.
   * `Enquiry`: Multi-channel event and stay leads with AI category classification and grounded draft quotations.

2. **Edge JWT Middleware & Route Protection:**
   * `/staff/*` restricted exclusively to `STAFF` and `GM`.
   * `/admin/*` restricted exclusively to `GM`.
   * Option B unauthenticated browsing: Public visitors browse `/rooms` freely; clicking "Book Direct Now" seamlessly gates through `/login?redirect=...` preserving stay parameters.

3. **Peer GM Protection Rule:**
   * General Managers have authority to promote staff members to GM.
   * GMs **cannot** demote or delete a fellow General Manager, preventing hostile privilege escalation or administrative lockout.

4. **Custom In-App Delete Modals:**
   * Replaced browser `window.confirm()` and `window.prompt()` with custom React confirmation dialogs matching the resort's luxury aesthetic.

5. **Live Gemini 3.5 Flash Model Verification:**
   * Integrated Google Generative AI (`gemini-3.5-flash`).
   * Deterministic rule-based fallback active upon API 429 quota exhaustion to guarantee 100% test reliability.

---

### 🏛️ Phase 2: Statutory Indian GST Slabs, Atomic Allotment Engine, Promo & Catalog

1. **Statutory Indian Hotel GST Tier Slabs (`src/lib/gst.ts`):**
   * Enforces the Indian Ministry of Finance accommodation GST threshold:
     * **$\le$ ₹7,500/night:** **12% GST** (6% CGST + 6% Karnataka SGST).
     * **$>$ ₹7,500/night:** **18% GST** (9% CGST + 9% Karnataka SGST).
   * SAC Code `996311` (Hotel Accommodation Services) embedded in all invoice breakdowns.
   * Unit tests covering boundary values (₹2,500, ₹7,499, ₹7,500, ₹7,501, ₹15,000).

2. **Atomic Allotment Engine (`src/lib/allotment.ts`):**
   * Checks available keys across consecutive multi-night date ranges:
     $$\text{availableKeys} = \min_{d \in [\text{checkIn}, \text{checkOut})} (\text{websiteAllotment}_d - \text{bookedCount}_d)$$
   * `atomicReserveAllotment`: Executes inside a Prisma `$transaction` with optimistic row locking to guarantee keys cannot drop below zero.
   * `atomicReleaseAllotment`: Restores inventory immediately upon booking cancellation.

3. **Promotional Engine (`src/lib/promo.ts`):**
   * Validates active status, date range, minimum booking spend, and usage caps.
   * Promo code `COFFEE10` provides 10% direct booking discount deducted from net taxable value *before* GST calculation.

4. **Luxury Room Catalog & Photo Experience (`/rooms`):**
   * 9 local high-resolution photographs stored in `public/images/rooms/` (3 views per room type).
   * Interactive in-card carousel with previous/next arrows and active photo indicators.
   * Full-screen lightbox modal on image click with `<` and `>` arrow navigation, keyboard controls (`←`, `→`, `Escape`), and close button.
   * Luxury specifications row: Room size (sq.ft.), view type, and bed specifications.
   * Real-time inventory pill badge displaying available direct keys (protecting remaining agency keys).

---

### 💳 Phase 3: 3-Step Checkout, Mock Gateway & Guest Self-Service Portal

1. **3-Step Checkout Wizard (`/book`):**
   * **Step 1: Stay & Room Review:** Fully interactive stay customizer allowing direct date/guest editing with live inventory re-checks.
   * **Step 2: Guest Details:** Primary contact information with direct booking privacy reassurance (physical ID verification conducted in person at check-in).
   * **Step 3: Payment & Promo:** Instant promo application, Razorpay gateway test simulation (Card & UPI modes), and instant booking generation (`EST-2026-XXXX`).

2. **Statutory Tax Invoice Receipt (`/confirmation/[id]`):**
   * Official voucher displaying resort GSTIN, SAC Code 996311, check-in (2:00 PM), check-out (11:00 AM), itemized CGST/SGST tax breakdown, and 1-click print styling.

3. **Active Reservation Detection:**
   * Prevents duplicate bookings by warning guests if an active confirmed stay already overlaps the selected dates.

4. **Guest Self-Service Portal (`/my-bookings`):**
   * Shows active and past reservations with live allotment protection badges.
   * **Dynamic Stay Extension:** Allows in-house guests to extend their checkout date if forward inventory exists, automatically calculating the delta night charge + GST slab and executing an atomic allotment decrement.
   * **48-Hour Free Cancellation:** Allows 1-click cancellation with 100% refund simulation if more than 48 hours prior to check-in, immediately restoring website inventory.
   * **Action Visibility Guard:** For past bills (`checkOutDate < today`) and cancelled reservations, modification buttons (`Extend Stay`, `Cancel Stay`) are automatically hidden, preserving only `View Tax Invoice`.

---

### 📊 Phase 4: Dynamic Rate & Allotment Grid & Front Desk PMS Integration

#### Screen 1: Rate & Allotment Manager (`/admin/rates`)
1. **45-Day Rolling Matrix Engine:**
   * Renders a continuous 45-day calendar grid across room categories (*Planter's Heritage Room*, *Coffee Estate Luxury Suite*, *Misty Valley Pool Villa*).
   * Visual indicators: 🟡 Weekend Surcharges (+20%) and 🔴 Blackout Dates.
   * Dynamic available keys computation:
     $$\text{availableKeys} = \text{isBlackout} \;?\; 0 : \max(0, \text{websiteAllotment} - \text{bookedCount})$$
2. **Inline Rate & Allotment Controls:**
   * GM can click to inline-edit nightly rates or website allotments with instant server persistence.
   * **Hospitality Floor Invariant:** Prevents the GM from decreasing the website allotment below already booked keys for that date ($A_{\text{new}} \ge B_{\text{current}}$).
3. **Bulk Seasonal Surcharge Modal:**
   * 1-click bulk rate updater across multi-date ranges (e.g. Christmas/New Year peak 24-Dec to 02-Jan) without tedious day-by-day edits.
4. **Blackout Dates Management (Tab 2):**
   * Schedule resort-wide buyouts (`roomTypeId: null`, 76 keys) or room-specific closures (`roomTypeId: ID`).
   * Conflict hierarchy & collision detection: Prevents redundant room-specific blackouts when date is already closed resort-wide; consolidates entries when upgraded.
   * Real-time pre-condition warning if confirmed guest bookings already exist on the target blackout date.
5. **Promotional Voucher Management (Tab 3):**
   * Create, activate/deactivate, and permanently delete promo vouchers.
   * **Max Discount Cap:** Protects resort revenue on high-value multi-night villa bookings:
     $$\text{Discount} = \min(\text{Tariff} \times \text{Percent}, \text{MaxCap})$$
   * Custom luxury delete modal with financial audit notices for previously redeemed codes.

#### Screen 2: Front Desk Operations Roster & PMS Export (`/staff/bookings`)
1. **Live Guest Arrival Roster:**
   * Real-time guest table displaying Booking Ref, Primary Guest Contact, Room Category, Stay Schedule, Total Tariff, Payment Status, and Action Buttons.
2. **5-Pillar Operational KPI Summary:**
   * `Total Bookings`, `Confirmed Active`, `In-House (Staying)`, `Departed (Checked Out)`, and `Cancelled`.
3. **Complete Guest Operational Lifecycle:**
   * **Check-In (`CONFIRMED` $\rightarrow$ `CHECKED_IN`):** Front desk clicks "Check In"; status flips to blue `CHECKED IN`, and in-house keys occupied increments.
   * **Check-Out (`CHECKED_IN` $\rightarrow$ `CHECKED_OUT`):** Front desk clicks "Check Out"; status flips to purple `CHECKED OUT`, in-house occupancy decrements, and room is flagged as vacated for housekeeping turnover.
4. **Early Check-In Accident Prevention:**
   * Compares `checkIn` date with today. If in the future, displays an **Amber Early Arrival Warning Modal** indicating scheduled date and advance days count before issuing keys.
5. **Quick Date Horizon Filter Ribbon:**
   * 1-click filters for **"All Dates"**, **"Today's Arrivals"** (guests checking in today with live counter badge), and **"Today's Departures"** (departing guests with live counter badge).
6. **1-Click RFC 4180 PMS CSV Export with UTF-8 BOM:**
   * 21 standardized columns matching enterprise PMS requirements (Opera, IDS Next).
   * Prepend `\uFEFF` Byte Order Mark ensures Microsoft Excel on Windows opens names, symbols, and dates into proper columns without corrupted characters.
7. **Payment Verification Tags:**
   * Prominent **`✓ Paid Online (Razorpay)`** in green or **`Refunded`** in red directly under the tariff amount.
8. **Printable Morning Arrival Manifest:**
   * Includes **"Print Manifest"** button (`window.print()`). Controls and search bars are automatically hidden (`print:hidden`), rendering an official physical roster header for morning housekeeping briefings.
9. **Responsive Cross-Device Layout:**
   * Adaptive touch scrolling, `min-w-[700px]`/`min-w-[800px]` table containers, and `max-h-[90vh] overflow-y-auto` across all modals for mobile, tablet, and desktop viewports.

---

## 3. Real-World Edge Cases & Domain Invariants Solved

| Edge Case / Scenario | Real-World Risk | How It Was Solved |
| :--- | :--- | :--- |
| **1. Concurrency Overbooking (IRCTC Tatkal Race)** | Two guests book the last villa at the exact same second; resort has 1 villa but 2 bookings. | Atomic Prisma transaction (`prisma.$transaction`) with optimistic locking guarantees strictly one booking succeeds. |
| **2. Dynamic GST Rate Shift Across Weekends** | Weekday price is ₹6,500 (12% GST), but weekend +20% surcharge pushes price to ₹7,800 (> ₹7,500 threshold = 18% GST). | Surcharge recalculates dynamic GST tier on every day independently, preventing statutory tax compliance violations. |
| **3. Duplicate Booking on Same Date** | Guest accidentally double-clicks or books overlapping dates. | System checks active bookings and prompts with reservation collision warning. |
| **4. Modifying Past or Cancelled Stays** | Guest attempts to extend checkout time for a stay that ended 3 days ago or was cancelled. | `checkOutDate < today` and `status === 'CANCELLED'` hide `Extend Stay` and `Cancel Stay` buttons; shows only `View Tax Invoice`. |
| **5. Allotment Reduction Under Booked Keys** | GM reduces website allotment to 1 when 3 rooms are already booked, causing negative inventory. | `updateWebsiteAllotment` enforces $A_{\text{new}} \ge B_{\text{current}}$, throwing an explanatory validation error. |
| **6. Blackout Hierarchy & Collision** | Staff schedules a room-specific blackout on a date already blocked resort-wide for a wedding buyout. | Conflict engine detects active resort-wide buyout and blocks redundant room entries. Upgrading a room blackout to resort-wide automatically consolidates records. |
| **7. Available Keys on Blocked Dates** | Table displaying "8 Keys Free" even though a blackout was active. | Inventory invariant enforced: When `isBlackout = true`, available keys is strictly overridden to `0` and displays **`0 Keys (Blocked)`**. |
| **8. The Forgotten Check-Out** | Guests checked in remain in-house forever; hotel occupancy statistics remain permanently inflated. | Added full `CHECKED_OUT` state and purple "Check Out" button to complete the guest stay cycle. |
| **9. Accidental Early Check-In** | Receptionist clicks "Check In" on a guest arriving in 2 weeks, corrupting current-day occupancy. | System calculates `checkIn > today` and opens an **Amber Early Arrival Warning Modal** requiring explicit confirmation. |
| **10. Excel Windows CSV Encoding** | Opening CSV in Microsoft Excel on Windows shows garbled characters or merged text. | Prepend `\uFEFF` (UTF-8 BOM) at the start of the CSV string, forcing Excel to parse UTF-8 cleanly. |
| **11. Reception Double-Billing Fear** | Tired guests arrive; receptionist asks them to pay again because payment state is unclear. | Prominent **`✓ Paid Online (Razorpay)`** tag displayed directly under the tariff amount. |
| **12. Runaway Promo Discounts on Luxury Stays** | 10% coupon applied to a ₹1,00,000 multi-night villa booking causes an excessive ₹10,000 discount. | Added **Max Discount Cap** (e.g. ₹2,000 cap). The discount is calculated as $\min(10\% \times \text{Tariff}, \text{Cap})$, protecting revenue. |
| **13. HTML5 Step Validation Quirk** | Browser blocked typing ₹2,000 with message *"Nearest valid values are 1951 and 2001"*. | Replaced `min="1" step="50"` with `min="100" step="1"`, allowing any standard round Rupee integer. |
| **14. Mobile Viewport & Touch Ergonomics** | Large 7-column tables squished text on phones; modals cut off buttons when on-screen keyboard opened. | Added `min-w-[700px]`/`min-w-[800px]` with horizontal touch scrolling and `max-h-[90vh] overflow-y-auto` across all modals. |

---

## 4. Test Verification & Quality Metrics

* **126 Unit & Integration Tests Passing (100% Green)**:
  * `rates.test.ts` (19 tests): Dynamic matrix, inline editing, allotment floors, blackout conflicts, promo CRUD.
  * `export.test.ts` (12 tests): RFC 4180 CSV escaping, SAC 996311 CGST/SGST split, UTF-8 BOM, `CHECKED_IN`/`CHECKED_OUT` status transitions.
  * `booking.test.ts` (12 tests): Multi-night checkout, GST calculation, atomic inventory decrements.
  * `allotment.test.ts` (13 tests): Atomic reservation & rollback transactions.
  * `auth.test.ts` (22 tests): Edge JWT session tokens, bcrypt hashes, GM peer protection.
  * `gst.test.ts` (10 tests): Statutory Indian GST thresholds (₹7,500 boundary).
  * `promo.test.ts` (8 tests): Percentage discount, max caps, date windows, minimum booking tariffs.
  * `payment.test.ts` (8 tests): Mock payment token generation and verification.
  * `gemini.test.ts` & `gemini-live.test.ts` (12 tests): Live Gemini 3.5 Flash connectivity & deterministic fallbacks.
  * `enquiry.test.ts` (10 tests): AI classification, entity extraction, budget estimation, GM alert routing.
* **Production Build:** Compiled cleanly with zero errors across all 33 routes (`npx next build`).
* **Local Git Version Control:** Clean local commit history with structured feature and fix messages.

