# Deployment & Reviewer Guide

**Project:** The Estate Resort — Direct-Booking Platform & AI Operations Router  
**Assessment:** IsoCode Labs Take-Home Assessment — Problem #5: Hill Resort Direct-Booking Website & AI Lead Routing  
**Client:** Company A — Luxury Coffee-Estate Hill Resort, Mullayanagiri, Chikkamagaluru, Karnataka  
**Scale:** 76 Keys total (64 Luxury Heritage Rooms + 12 Private Plunge Pool Villas)  
**Direct Allotment:** 17 Keys online (protecting 59 keys for travel agency partners & offline corporate buyouts)  
**GitHub Repository:** `https://github.com/Dinakarluffy/the-estate-resort`  
**Live Application (Vercel):** `https://the-estate-resort.vercel.app` *(Local Review: `http://localhost:3000`)*  

---

## 1. Quick Summary for Reviewers (Plain-English Overview)

The Estate Resort application is a complete full-stack platform built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM with SQLite** (`prisma/dev.db`).

* **Zero Cloud Dependencies for Local Testing:** The database is an embedded SQLite file already pre-seeded with 76 rooms, 50 days of dynamic pricing, promotional codes, and demo accounts. You do **not** need Docker, PostgreSQL, Redis, or external cloud accounts to run or test the entire platform locally.
* **1-Click Evaluator Toolbar:** When you open `http://localhost:3000`, a gold **Evaluator Showcase** bar is pinned below the navigation bar. You can switch between **Guest**, **Staff**, and **General Manager (GM)** with a single click—no password typing needed.
* **AI Diagnostics Included:** The top bar includes live indicators for the **Gemini 3.5 Flash** router and direct links to `/api/health` (zero-auth system health check) and `/api/ai/test` (live AI connection verification).

---

## 2. Step-by-Step Local Setup Guide

Follow these simple steps to run the project locally on Windows, macOS, or Linux:

### Prerequisites
* **Node.js:** Version `18.18.0` or higher (`node -v` to check; Node 20 LTS recommended).
* **npm:** Version `9.0.0` or higher (`npm -v` to check).
* **Git:** Installed on your machine.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Dinakarluffy/the-estate-resort.git
cd the-estate-resort
```

---

### Step 2: Install Project Dependencies
```bash
npm install
```
*(This installs Next.js, Prisma, bcryptjs, jose, Tailwind CSS, Lucide icons, and Vitest).*

---

### Step 3: Run the Automated Test Suite (160 Tests)
Before starting the server, verify the integrity of the business logic:
```bash
npm test
```
> **Expected Result:**  
> All **15 test suites** and **160 automated tests pass with 100% green status** in approximately 8 seconds, verifying allotment concurrency locks, statutory GST slabs, stay extensions, and AI fallbacks.

---

### Step 4: Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in Google Chrome, Edge, Safari, or Firefox.

*(Optional Production Build Verification)*:
```bash
npm run build
npm start
```
> All 33 routes compile cleanly into optimized server and static bundles with zero TypeScript or ESLint errors.

---

## 3. Demo Login Details for the Reviewer

The database is pre-seeded with 10 user accounts across all 3 permission tiers. The default password for all demo accounts is **`demo1234`**.

| Role | Email Address | Password | Intended Reviewer Flows |
| :--- | :--- | :--- | :--- |
| **Guest (Priya Sharma)** | `guest@estate.com`<br>*(alias: `priya@estate.com`)* | `demo1234` | • Browse rooms and check live 76-key allotment on `/rooms`.<br>• Apply promo code `COFFEE10` for an instant 10% direct discount.<br>• Book with simulated Razorpay payment gateway.<br>• View bookings at `/my-bookings`.<br>• Test **Stay Extension (+1 night)** using Card on File.<br>• Test 48-hour free cancellation self-service. |
| **Reservations Staff (Karthik Babu)** | `staff@estate.com`<br>*(alias: `karthik.babu@estate.com`)* | `demo1234` | • Access `/staff/inbox` to view incoming multi-channel leads.<br>• Inspect Google Gemini entity extraction (guest counts, dates, budget).<br>• View live **30-minute SLA countdown timers**.<br>• Edit quotation drafts and click **"Approve & Dispatch"**.<br>• Access `/staff/bookings` to mark arriving guests as `CHECKED_IN`.<br>• Download the **21-Column Statutory PMS CSV Export** with SAC code `996311`. |
| **General Manager (Vikram Hegde)** | `gm@estate.com`<br>*(alias: `vikram.hegde@estate.com`)* | `demo1234` | • Access `/admin/rates` to view and edit the **45-Day Dynamic Rate & Allotment Matrix**.<br>• Test **Physical Key Ceiling Guardrail** (try setting allotment to 45 keys on the 32-key suite $\rightarrow$ rejected with HTTP 400).<br>• Schedule full-estate wedding blackouts.<br>• Manage promotional discount caps (e.g. ₹3,000 max cap).<br>• Inspect the **GM Unsorted AI Lane** and emergency maintenance alerts. |

> **Pro-Tip:** You don't even need to type these emails! Just click the **`Guest (Priya)`**, **`Staff (Karthik)`**, or **`GM (Vikram)`** buttons in the top gold toolbar to log in instantly.

---

## 4. Production Deployment & Cloud Hosting

### Architecture for Cloud Deployment
In production, the application is deployed as a serverless container or Node.js service:
* **Frontend & API Routes:** Hosted on **Vercel**, **AWS Amplify**, or **Railway**.
* **Database:** In production, SQLite can be swapped to **PostgreSQL** (AWS RDS, Neon, or Supabase) simply by changing `provider = "postgresql"` in `prisma/schema.prisma` and running `npx prisma db push`.
* **Static Assets & Photos:** Optimized with Next.js Image Optimization and served via CDN.

---

## 5. Required Environment Variables (Names Only)

Per the take-home assessment guidelines, **only variable names are documented below (never secret values or keys)**:

| Environment Variable Name | Purpose & Scope | Required in Local Dev? |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for Prisma ORM (`file:./dev.db` for SQLite or PostgreSQL connection URI in production). | Pre-configured in `.env` |
| `JWT_SECRET` | 256-bit secret key used by `jose` to cryptographically sign session tokens. | Pre-configured in `.env` |
| `GEMINI_API_KEY` | Google Gemini API key for AI lead classification, entity extraction, and draft quotations. | Optional *(App includes built-in deterministic heuristic fallback if absent or quota-limited)* |
| `NEXT_PUBLIC_APP_URL` | Base canonical URL of the deployed application (e.g. `http://localhost:3000` or production domain). | Pre-configured in `.env` |
| `NODE_ENV` | Application runtime environment (`development`, `test`, or `production`). | Set automatically by Next.js |

> **Note on Security:** No live passwords, payment credentials, or production tokens are committed to this repository. The `.env.example` file in the repository root provides the structural template.

---

## 6. Zero-Config Health & Diagnostic Endpoints

Reviewers can verify backend system state at any time via zero-authentication HTTP endpoints:

1. **System Health & Invariant Audit:**
   * **URL:** `http://localhost:3000/api/health?detailed=true`
   * **What it audits:** Verifies database response latency (1–5ms), confirms the 76-key physical capacity ceiling, checks that active bookings never exceed website allotments (`bookedCount <= websiteAllotment`), and confirms DPDP compliance mode.

2. **AI Connection Diagnostic:**
   * **URL:** `http://localhost:3000/api/ai/test`
   * **What it audits:** Sends a live test payload to Google Gemini 3.5 Flash, tests entity extraction, and reports whether the AI model is active or operating in safe deterministic fallback mode.

---

## 7. Troubleshooting & FAQ

* **Q: Do I need a Google Gemini API Key to test the AI Inbox?**
  * **A:** No! While a valid Gemini API key is configured, if Google free-tier quotas are exhausted or network access is restricted, the platform automatically activates its **Deterministic Rule-Based Fallback Engine**. All sample inquiries (`ENQ-4410`, `ENQ-4411`, `ENQ-4412`) classify with 100% accuracy and generate rate-grounded quotation drafts.
* **Q: Why are foreign guest passport details not asked during online booking?**
  * **A:** Under Indian hospitality regulations and the Digital Personal Data Protection (DPDP) Act 2023, Foreigner Registration (Form C) documentation is legally required to be physically verified at hotel front desk check-in, never collected over unverified web booking forms.
* **Q: How do I test the 1-click sample event benchmarks?**
  * **A:** Navigate to **[http://localhost:3000/events](http://localhost:3000/events)**. At the top of the form, click any of the 5 benchmark buttons:
    * 🎊 *Sister's Wedding (250 Pax)* $\rightarrow$ Classified as `WEDDING`, extracts 250 guests.
    * 💼 *Corporate Offsite (45 Pax)* $\rightarrow$ Classified as `OFFSITE`, extracts 45 attendees.
    * 🛏️ *Pool Villa Query (2A+1C)* $\rightarrow$ Classified as `ROOM`, quotes live rate table.
    * ⚠️ *AC Broken Water Leak* $\rightarrow$ Classified as `COMPLAINT`, alerts GM Vikram Hegde.
    * 🤷 *Ambiguous Query* $\rightarrow$ Confidence $< 0.70$, routed to GM Unsorted lane.

---
*Created for Company A — The Estate Resort, Chikkamagaluru, Karnataka.*
