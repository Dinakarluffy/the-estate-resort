import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { Coffee, ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { StaffBookingsManager } from "@/components/staff/StaffBookingsManager";

export const metadata = {
  title: "Front Desk & Reservations Bookings | Operations Portal",
  description: "Live resort direct reservations, guest arrivals, check-in status, and 1-click PMS CSV export.",
};

export default async function StaffBookingsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user || (user.role !== "STAFF" && user.role !== "GM")) {
    redirect("/login?redirect=/staff/bookings");
  }

  return (
    <div className="min-h-screen bg-[#fbf8f5] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#ebded2] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-stone-900">
                Front Desk & Direct Bookings Roster
              </h1>
              <p className="text-xs text-stone-600">
                Logged in as: <strong className="text-stone-900">{user.name}</strong> ({user.role}) • Live inventory synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/staff/dashboard"
              className="text-xs font-semibold px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Staff Dashboard</span>
            </Link>
            <SignOutButton variant="button" />
          </div>
        </div>

        {/* Operational Roster & PMS Export Component */}
        <StaffBookingsManager />
      </div>
    </div>
  );
}
