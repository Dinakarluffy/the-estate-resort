import { cookies } from "next/headers";
import Link from "next/link";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Coffee, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { UnifiedEnquiryInbox } from "@/components/staff/UnifiedEnquiryInbox";

export default async function StaffDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  const enquiryCount = await prisma.enquiry.count();
  const roomCount = await prisma.roomType.count();

  return (
    <div className="min-h-screen bg-[#fbf8f5] p-3.5 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#ebded2] p-4 sm:p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-serif text-stone-900 leading-tight">
                Staff Operations Portal
              </h1>
              <p className="text-xs text-stone-600 mt-0.5">
                Logged in as: <span className="font-semibold">{user?.name}</span> ({user?.role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
            <Link
              href="/"
              className="text-xs font-semibold px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition"
            >
              ← Back to Site
            </Link>
            <SignOutButton variant="button" />
          </div>
        </div>

        {/* Phase 1 Verification Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Phase 1 Protected Route Verification: SUCCESS</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            You are securely authenticated. The Next.js Edge Middleware successfully validated your JWT session cookie and verified that your role ({user?.role}) has permission to access <code>/staff/*</code>.
          </p>
        </div>

        {/* Operational Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#ebded2] p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Direct Bookings & PMS
                </span>
                <Coffee className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                Operational
              </div>
              <p className="text-xs text-stone-500 mt-1">
                View arrivals, mark check-ins, and 1-click export to hotel PMS
              </p>
            </div>
            <Link
              href="/staff/bookings"
              className="mt-4 inline-flex items-center justify-between text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 px-3 py-2 rounded-lg transition"
            >
              <span>View Bookings & Export →</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-[#ebded2] p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Enquiries in Inbox
                </span>
                <Mail className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                {enquiryCount} Leads
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Includes ENQ-4410, ENQ-4411, ENQ-4412 + complaint + unsorted
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-2 rounded-lg">
              AI Routing Active
            </span>
          </div>

          <div className="bg-white border border-[#ebded2] p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Resort Room Types
                </span>
                <Coffee className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                {roomCount} Types (76 Keys)
              </div>
              <p className="text-xs text-stone-500 mt-1">
                64 Rooms + 12 Villas (Mullayanagiri, Chikkamagaluru)
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-2 rounded-lg">
              17 Keys Direct Allotment
            </span>
          </div>
        </div>

        {/* Unified AI Enquiry Inbox Component */}
        <UnifiedEnquiryInbox />
      </div>
    </div>
  );
}
