# The Estate Resort — Phase 4: Comprehensive Implementation & Real-World Edge Cases Report

**Client:** Company A — Luxury Coffee-Estate Hill Resort, Mullayanagiri, Chikkamagaluru, Karnataka  
**Scale:** 76 Keys total (64 Luxury Rooms + 12 Private Plunge Pool Villas)  
**Direct Website Allotment:** 17 Keys (protecting 59 keys for travel partners, offline corporate contracts & wedding buyouts)  
**Phase 4 Objective:** Operational Revenue & Inventory Management — 45-Day Dynamic Rate & Allotment Grid (`/admin/rates`) and Front Desk PMS Arrival Roster & CSV Export (`/staff/bookings`).

---

## 1. Architectural & Domain Overview

Phase 4 bridges the gap between **commercial revenue strategy (General Manager)** and **daily operational execution (Front Desk Receptionist)**:
* **Rate & Allotment Engine (`src/lib/rates.ts`):** High-performance 45-day rolling matrix that merges baseline room tariffs, dynamic weekend surcharges (+20%), custom seasonal rates, daily website allotments, real-time booking counters, and blackout date windows into an atomic, coherent calendar view.
* **PMS Integration & Export Engine (`src/lib/export.ts`):** Generates RFC 4180 compliant CSV exports with Indian statutory SAC Code `996311`, split CGST/SGST tax values, and UTF-8 Byte Order Marks (BOM) for compatibility with enterprise hotel PMS platforms (Opera, IDS Next, Protel) and Microsoft Excel on Windows.
* **Front Desk Operational Roster (`src/components/staff/StaffBookingsManager.tsx`):** Live reception portal providing real-time guest arrivals, early check-in warning guards, guest check-out turnover, payment verification tags, and printable morning manifest sheets.

---

## 2. Phase 4 Features Implemented

### Screen 1: Rate & Allotment Manager (`/admin/rates`)

1. **45-Day Rolling Rate & Allotment Matrix:**
   - Renders a continuous 45-day calendar grid for each room category (*Planter's Heritage Room*, *Coffee Estate Luxury Suite*, *Misty Valley Pool Villa*).
   - Visual indicators highlight:
     - 🟡 **Weekend Surcharges Active** (Fridays & Saturdays automatically loaded with +20% peak tariffs).
     - 🔴 **Blackout Dates** (direct booking closed due to full resort buyouts or room maintenance).
   - Columns: `Stay Date`, `Day of Week`, `Nightly Rate (INR)`, `Website Allotment`, `Booked Keys`, `Available Direct`, and `Blackout Status`.

2. **Inline Rate & Allotment Controls:**
   - GM can click on any cell to inline-edit nightly rates or website allotment numbers.
   - **Hospitality Inventory Invariant:** Prevents the GM from decreasing the website allotment below the number of rooms already booked for that date (e.g. if 2 rooms are booked, allotment cannot be reduced to 1).

3. **Bulk Seasonal Rate Surcharge:**
   - 1-click bulk rate updater across multi-date ranges (e.g. Christmas/New Year peak from 24-Dec to 02-Jan, or Diwali long weekends).
   - Allows GM to set a new nightly price across all consecutive dates simultaneously without manual per-day editing.

4. **Blackout Dates Management (Tab 2):**
   - Enables scheduling full resort closures (`roomTypeId: null` for 76-key estate buyouts/weddings) or category-specific closures (`roomTypeId: ID` for routine villa pool maintenance or deep cleaning).
   - Displays all active blackouts with date, scope badge, reason, and a custom luxury removal modal.

5. **Promotional Voucher Management (Tab 3):**
   - Create and manage promotional discount codes (e.g. `COFFEE10`).
   - Fields: Discount percentage (1–100%), Minimum Booking Tariff, Maximum Discount Cap (INR), Validity Window (From/To), and Maximum Uses.
   - GM can **Activate/Deactivate** vouchers with 1 click to suspend them without breaking past booking audit histories.
   - **Permanent Deletion:** Built-in deletion action with audit confirmation dialog advising on financial audit integrity if the voucher was already redeemed by past guests.

---

### Screen 2: Front Desk Guest List & Excel Export (`/staff/bookings`)

1. **Live Guest Arrival Roster:**
   - Real-time guest table displaying `Booking Reference`, `Primary Guest Name & Contact` (phone, email), `Room Category`, `Stay Schedule` (check-in/check-out dates & duration), `Total Tariff & Payment Status`, `Status Badge`, and `Front Desk Actions`.

2. **5-Pillar Operational KPI Summary:**
   - **Total Bookings:** All online direct sales in system.
   - **Confirmed Active:** Guaranteed keys with confirmed arrivals.
   - **In-House (Staying):** Currently checked-in guests occupying keys.
   - **Departed:** Guests whose check-out has been completed.
   - **Cancelled:** Released bookings whose inventory returned to the pool.

3. **Complete Guest Operational Lifecycle:**
   - **Check-In (`CONFIRMED` $\rightarrow$ `CHECKED_IN`):** When a guest arrives at the lobby counter, receptionist clicks "Check In". Status transitions to `CHECKED_IN` (blue badge), and in-house keys occupied increments.
   - **Check-Out (`CHECKED_IN` $\rightarrow$ `CHECKED_OUT`):** When guest departs, receptionist clicks "Check Out". Status transitions to `CHECKED_OUT` (purple badge), in-house occupancy decrements, and room is flagged as vacated for housekeeping turnover.

4. **Early Check-In Accident Prevention:**
   - If receptionist clicks "Check In" on a reservation scheduled in the future (e.g. booked for 20-Nov when today is 08-Nov), system displays an **Amber Early Arrival Warning Modal**:
     - Highlights the scheduled arrival date and advance days count.
     - Requires receptionist to confirm physical guest arrival and room inspection before issuing keys.

5. **Quick Date Horizon Filter Ribbon:**
   - 1-click quick filter buttons:
     - **All Dates:** Full reservation archive.
     - **Today's Arrivals:** Displays only guests checking in today, with live counter badge.
     - **Today's Departures:** Displays only guests checking out today, with live counter badge.
   - Integrates smoothly with status filter pills (`ALL`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`).

6. **1-Click RFC 4180 PMS CSV Export with UTF-8 BOM:**
   - Downloads a spreadsheet (`Estate-PMS-Arrivals-[date].csv`) containing 21 standard hospitality columns:
     `Booking Reference, Guest Full Name, Guest Email, Guest Phone, Room Category, Check-In Date, Check-Out Date, Duration (Nights), Reservation Status, Payment Status, Payment Reference, Base Tariff (INR), Discount Applied (INR), Net Taxable Value (INR), GST Slab Rate (%), CGST (INR), SGST (INR), Total Paid (INR), Statutory SAC Code, Promo Code Used, Booking Timestamp`.
   - Prepend `\uFEFF` Byte Order Mark ensures Microsoft Excel on Windows opens names, symbols, and dates into proper columns without corrupted characters.

7. **Payment Status Clarity:**
   - Under the Total Tariff column, displays clear visual badges:
     - **`✓ Paid Online (Razorpay)`** in green for confirmed pre-paid bookings.
     - **`Refunded`** in red for cancelled reservations.
   - Eliminates reception confusion over whether payment was already collected.

8. **Printable Morning Arrival Manifest:**
   - Includes a **"Print Manifest"** button (`window.print()`).
   - Automatically hides UI buttons, search bars, and navigation headers (`print:hidden`), rendering an official physical roster header for morning housekeeping briefings.

---

## 3. Real-World Edge Cases & Domain Invariants Solved

| Edge Case / Scenario | Real-World Risk | How It Was Solved |
| :--- | :--- | :--- |
| **1. Allotment Reduction Under Booked Keys** | GM accidentally reduces website allotment to 1 when 3 rooms are already booked, causing negative availability. | `updateWebsiteAllotment` enforces $A_{\text{new}} \ge B_{\text{current}}$, throwing an explanatory error if violated. |
| **2. Blackout Hierarchy & Collision** | Staff schedules a room-specific blackout on a date already blocked resort-wide for a wedding buyout. | Conflict engine detects active resort-wide buyout and blocks redundant room entries. Upgrading a room blackout to a resort-wide buyout automatically consolidates records. |
| **3. Available Keys on Blocked Dates** | Table displaying "8 Keys Free" even though a blackout was active. | Inventory invariant enforced: When `isBlackout = true`, available keys is strictly overridden to `0` and displays **`0 Keys (Blocked)`**. |
| **4. The Forgotten Check-Out** | Guests checked in remain in-house forever; hotel occupancy statistics remain permanently inflated. | Added full `CHECKED_OUT` state and purple "Check Out" button to complete the guest stay cycle. |
| **5. Accidental Early Check-In** | Receptionist clicks "Check In" on a guest arriving in 2 weeks, corrupting current-day occupancy. | System calculates `checkIn > today` and opens an **Amber Early Arrival Warning Modal** requiring explicit confirmation. |
| **6. Excel Windows CSV Encoding** | Opening CSV in Microsoft Excel on Windows shows garbled characters or merged text. | Prepend `\uFEFF` (UTF-8 BOM) at the start of the CSV string, forcing Excel to parse UTF-8 cleanly. |
| **7. Reception Double-Billing Fear** | Tired guests arrive; receptionist asks them to pay again because payment state is unclear. | Prominent **`✓ Paid Online (Razorpay)`** tag displayed directly under the tariff amount. |
| **8. Runaway Promo Discounts on Luxury Stays** | 10% coupon applied to a ₹1,00,000 multi-night villa booking causes an excessive ₹10,000 discount. | Added **Max Discount Cap** (e.g. ₹2,000 cap). The discount is calculated as $\min(10\% \times \text{Tariff}, \text{Cap})$, protecting revenue. |
| **9. HTML5 Step Validation Quirk** | Browser blocked typing ₹2,000 with message *"Nearest valid values are 1951 and 2001"*. | Replaced `min="1" step="50"` with `min="100" step="1"`, allowing any standard round Rupee integer. |
| **10. Mobile Viewport & Touch Ergonomics** | Large 7-column tables squished text on phones; modals cut off buttons when on-screen keyboard opened. | Added `min-w-[700px]`/`min-w-[800px]` with horizontal touch scrolling and `max-h-[90vh] overflow-y-auto` across all modals. |

---

## 4. Test Coverage & Verification

* **Unit & Integration Tests:** 126 passing tests across 11 test suites in Vitest:
  - `src/lib/rates.test.ts` (19 tests): Matrix retrieval, inline rate updates, allotment floor validation, blackout conflict resolution, promo CRUD.
  - `src/lib/export.test.ts` (12 tests): RFC 4180 CSV escaping, SAC 996311 CGST/SGST splitting, UTF-8 BOM verification, operational status transitions (`CHECKED_IN`, `CHECKED_OUT`).
  - `src/lib/booking.test.ts` (12 tests)
  - `src/lib/allotment.test.ts` (13 tests)
  - `src/lib/auth.test.ts` (22 tests)
  - `src/lib/gst.test.ts` (10 tests)
  - `src/lib/promo.test.ts` (8 tests)
  - `src/lib/payment.test.ts` (8 tests)
  - `src/lib/gemini.test.ts` & `gemini-live.test.ts` (12 tests)
  - `src/lib/enquiry.test.ts` (10 tests)
* **Production Build:** `npx next build` passes with 0 warnings across all 33 routes.
* **Local Git Version Control:** Clean local commit history with structured feature and fix messages.
