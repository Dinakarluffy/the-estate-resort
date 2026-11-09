import { cookies } from "next/headers";
import Link from "next/link";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, AlertTriangle, CheckCircle2, Sliders, Users } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { UserManager } from "@/components/admin/UserManager";

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  const gmReviewCount = await prisma.enquiry.count({
    where: { requiresGmReview: true },
  });

  const totalUsers = await prisma.user.count();

  return (
    <div className="min-h-screen bg-[#fbf8f5] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white border border-[#ebded2] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-stone-900">
                General Manager (GM) Control Panel
              </h1>
              <p className="text-xs text-stone-600">
                Logged in as: <span className="font-semibold">{user?.name}</span> ({user?.role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-amber-900 font-bold mb-2">
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
            <span>GM Access Verification: SUCCESS</span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed">
            Role check passed: Only accounts with the GM role can access <code>/admin/*</code> routes. Reservations Staff and Guests are blocked by Edge Middleware.
          </p>
        </div>

        {/* GM Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#ebded2] p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Unsorted / Complaints Requiring GM
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-serif font-bold text-amber-900 mt-2">
              {gmReviewCount} Enquiries
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Low confidence (&lt; 0.70) enquiries + escalated service complaints
            </p>
          </div>

          <div className="bg-white border border-[#ebded2] p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Rate & Allotment Engine
              </span>
              <Sliders className="w-4 h-4 text-[#7e5241]" />
            </div>
            <div className="text-3xl font-serif font-bold text-stone-900 mt-2">
              45 Days Active
            </div>
            <p className="text-xs text-stone-500 mt-1 mb-3">
              Allotment controls prevent overbooking agency inventory
            </p>
            <Link
              href="/admin/rates"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition"
            >
              <span>Manage Calendar & Allotments →</span>
            </Link>
          </div>

          <div className="bg-white border border-[#ebded2] p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Total Registered Accounts
              </span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-serif font-bold text-stone-900 mt-2">
              {totalUsers} Users
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Live database records (Guests, Staff, GM)
            </p>
          </div>
        </div>

        {/* Live Staff & User Role Management Table */}
        <UserManager currentAdminId={user?.userId || ""} />
      </div>
    </div>
  );
}
