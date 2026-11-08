import React from "react";
import Link from "next/link";
import { Coffee, ShieldCheck, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#ebded2] bg-[#f7f2eb] mt-auto text-xs text-stone-600 print:hidden transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Col 1: Brand & Location */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#384432] text-amber-100 flex items-center justify-center shadow-xs">
                <Coffee className="w-4 h-4 text-amber-100" />
              </div>
              <div>
                <span className="font-serif font-bold text-base text-[#2f392b] block leading-tight">
                  The Estate
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#7e5241] block font-sans">
                  Chikkamagaluru
                </span>
              </div>
            </Link>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Mullayanagiri Hills, Chikkamagaluru, Karnataka 577101. 76 luxury keys (64 heritage rooms &amp; 12 private pool villas).
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 font-sans">
              Explore Sanctuary
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#384432] hover:underline transition">
                  Estate Overview
                </Link>
              </li>
              <li>
                <Link href="/rooms" className="hover:text-[#384432] hover:underline transition">
                  Rooms &amp; Luxury Villas
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#384432] hover:underline transition">
                  Weddings &amp; Executive Offsites
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-[#384432] hover:underline transition">
                  My Reservations &amp; Invoices
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Booking & Guarantees */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 font-sans">
              Direct Sanctuary
            </h4>
            <ul className="space-y-2 text-[11px] text-stone-500">
              <li className="flex items-center gap-1.5 text-stone-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Zero OTA 20% Commission Leakage</span>
              </li>
              <li className="flex items-center gap-1.5 text-stone-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Guaranteed Best Direct Rate</span>
              </li>
              <li className="flex items-center gap-1.5 text-stone-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Statutory Indian GST Slabs (12% / 18%)</span>
              </li>
              <li className="flex items-center gap-1.5 text-stone-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Sub-30 Minute Event Quote SLA</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Operations & System Portals */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900 font-sans">
              Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/staff/dashboard" className="hover:text-[#384432] hover:underline transition">
                  Staff AI Enquiry Inbox
                </Link>
              </li>
              <li>
                <Link href="/staff/bookings" className="hover:text-[#384432] hover:underline transition">
                  Staff Bookings &amp; CSV Export
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-[#384432] hover:underline transition">
                  GM Control Panel
                </Link>
              </li>
              <li>
                <Link href="/admin/rates" className="hover:text-[#384432] hover:underline transition">
                  GM Rates, Allotments &amp; Blackouts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#ebded2]/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} The Estate Resort, Chikkamagaluru, Karnataka. All rights reserved.</p>
          <div className="flex items-center gap-4 text-stone-500">
            <span>DPDP Act 2023 Compliant</span>
            <span>•</span>
            <span>Razorpay Secure Sandbox</span>
            <span>•</span>
            <span>Gemini 3.5 Flash AI Powered</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
