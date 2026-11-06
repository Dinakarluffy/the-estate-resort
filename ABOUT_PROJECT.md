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
