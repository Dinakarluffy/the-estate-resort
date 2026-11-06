import { cookies } from "next/headers";
import Link from "next/link";
import { verifySessionToken } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { Coffee, Mail, CheckCircle2, ArrowRight } from "lucide-react";

const prisma = new PrismaClient();

export default async function StaffDashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  const enquiryCount = await prisma.enquiry.count();
  const roomCount = await prisma.roomType.count();

  return (
    <div className="min-h-screen bg-[#fbf8f5] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white border border-[#ebded2] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-stone-900">
                Staff Operations Portal
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
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Phase 1 Verification Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Phase 1 Protected Route Verification: SUCCESS</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            You are securely authenticated. The Next.js Edge Middleware successfully validated your JWT session cookie and verified that your role ({user?.role}) has permission to access <code>/staff/*</code>.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#ebded2] p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Seeded Enquiries in Inbox
              </span>
              <Mail className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-serif font-bold text-stone-900 mt-2">
              {enquiryCount}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Includes ENQ-4410, ENQ-4411, ENQ-4412 + complaint + unsorted
            </p>
          </div>

          <div className="bg-white border border-[#ebded2] p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Resort Room Types
              </span>
              <Coffee className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-serif font-bold text-stone-900 mt-2">
              {roomCount} Types (76 Keys)
            </div>
            <p className="text-xs text-stone-500 mt-1">
              64 Rooms + 12 Villas (Mullayanagiri, Chikkamagaluru)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
