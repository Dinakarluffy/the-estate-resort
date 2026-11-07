import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { verifySessionToken } from "@/lib/auth";
import { Coffee, ShieldCheck, User, Loader2 } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata = {
  title: "Direct Booking Checkout | The Estate Chikkamagaluru",
  description: "Complete your direct resort reservation with zero OTA commission markup and statutory GST breakdown.",
};

interface BookPageProps {
  searchParams: {
    roomTypeId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  };
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("estate_session")?.value;
  const user = sessionToken ? await verifySessionToken(sessionToken) : null;

  // Option B: If not logged in, redirect to login with pre-populated redirect URL
  if (!user) {
    const params = new URLSearchParams();
    if (searchParams.roomTypeId) params.set("roomTypeId", searchParams.roomTypeId);
    if (searchParams.checkIn) params.set("checkIn", searchParams.checkIn);
    if (searchParams.checkOut) params.set("checkOut", searchParams.checkOut);
    if (searchParams.guests) params.set("guests", searchParams.guests);

    const redirectTarget = `/book?${params.toString()}`;
    redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      {/* Top Header */}
      <header className="border-b border-[#ebded2] bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#384432] text-white flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-[#2f392b] block leading-tight">
                The Estate
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#7e5241] block">
                Chikkamagaluru
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5efe8] rounded-full border border-[#ebded2] text-xs">
              <User className="w-3.5 h-3.5 text-stone-600" />
              <span className="font-medium text-stone-800">{user.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#384432] text-white">
                {user.role}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-[#7e5241] font-bold">
            Direct Booking Checkout
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            Confirm Your Estate Stay
          </h1>
          <p className="text-xs text-stone-500">
            Direct booking guarantee • Statutory Indian GST slabs • Instant Razorpay test payment
          </p>
        </div>

        {/* 3-Step Wizard inside Suspense boundary */}
        <Suspense
          fallback={
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#384432] mx-auto mb-2" />
              <p className="text-xs text-stone-500">Loading booking checkout...</p>
            </div>
          }
        >
          <BookingWizard user={user} />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ebded2] bg-white py-6 mt-12 text-center text-xs text-stone-500">
        <p>The Estate Resort • Chikkamagaluru, Karnataka • 76 Keys (64 Rooms + 12 Private Villas)</p>
        <p className="text-[11px] text-stone-400 mt-1">DPDP Act 2023 Compliant • Indian Hotel GST Tier Engine</p>
      </footer>
    </div>
  );
}
