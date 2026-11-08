"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  ShieldCheck,
  User,
  LogIn,
  UserPlus,
  Menu,
  X,
  Calendar,
  Sparkles,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export interface NavbarUser {
  id?: string;
  name: string;
  email?: string;
  role: string;
}

export interface NavbarProps {
  user?: NavbarUser | null;
  bookingCount?: number;
}

export function Navbar({ user: initialUser, bookingCount }: NavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<NavbarUser | null | undefined>(initialUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Sync state if initialUser prop updates
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      return;
    }

    // Client-side fallback if not provided by server component
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.authenticated && data.user) {
          setUser(data.user);
        } else if (isMounted) {
          setUser(null);
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getLinkClass = (href: string) => {
    const active = isLinkActive(href);
    return `text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
      active
        ? "text-[#384432] font-bold bg-[#f5efe8] border border-[#ebded2] shadow-2xs"
        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
    }`;
  };

  const getMobileLinkClass = (href: string) => {
    const active = isLinkActive(href);
    return `text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center justify-between ${
      active
        ? "text-[#384432] font-bold bg-[#f5efe8] border border-[#ebded2]"
        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
    }`;
  };

  return (
    <header className="border-b border-[#ebded2] bg-white/95 backdrop-blur sticky top-0 z-40 transition-all print:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-[#384432] text-amber-100 flex items-center justify-center shadow-xs transition group-hover:scale-105">
            <Coffee className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-[#2f392b] block leading-tight">
              The Estate
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#7e5241] block font-sans">
              Chikkamagaluru
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2">
          <Link href="/" className={getLinkClass("/")}>
            Home
          </Link>

          <Link href="/rooms" className={getLinkClass("/rooms")}>
            Rooms & Villas
          </Link>

          <Link href="/events" className={getLinkClass("/events")}>
            Weddings & Events
          </Link>

          {user && (
            <Link href="/my-bookings" className={getLinkClass("/my-bookings")}>
              <span>My Bookings</span>
              {bookingCount !== undefined && bookingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#384432] text-white">
                  {bookingCount}
                </span>
              )}
            </Link>
          )}

          {/* Quick Staff / GM shortcuts */}
          {user?.role === "GM" && (
            <Link
              href="/admin/dashboard"
              className="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GM Panel</span>
            </Link>
          )}

          {(user?.role === "STAFF" || user?.role === "GM") && (
            <Link
              href="/staff/dashboard"
              className="px-2.5 py-1 text-xs font-semibold bg-[#384432] hover:bg-[#2f392b] text-white rounded-lg transition flex items-center gap-1 shadow-2xs"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Staff Inbox</span>
            </Link>
          )}
        </nav>

        {/* Right Side: User Profile / Auth Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Standard Luxury User Profile Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5efe8] rounded-full border border-[#ebded2] text-xs shadow-2xs">
                {user.role === "GM" ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                ) : user.role === "STAFF" ? (
                  <Coffee className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <User className="w-3.5 h-3.5 text-stone-600" />
                )}
                <span className="font-medium text-stone-800">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#384432] text-white">
                  {user.role}
                </span>
              </div>

              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-lg border border-[#384432] text-[#384432] hover:bg-stone-100 text-xs font-semibold transition"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#384432] hover:bg-[#2f392b] text-white text-xs font-semibold shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          {user && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#f5efe8] rounded-full border border-[#ebded2] text-xs">
              <span className="font-semibold text-stone-800 text-[11px] truncate max-w-[100px]">
                {user.name}
              </span>
              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-[#384432] text-white">
                {user.role}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#ebded2] bg-[#faf7f2] px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <Link href="/" className={getMobileLinkClass("/")}>
            <span>Home</span>
          </Link>

          <Link href="/rooms" className={getMobileLinkClass("/rooms")}>
            <span>Rooms & Villas</span>
          </Link>

          <Link href="/events" className={getMobileLinkClass("/events")}>
            <span>Weddings & Events</span>
          </Link>

          {user && (
            <Link href="/my-bookings" className={getMobileLinkClass("/my-bookings")}>
              <span>My Bookings</span>
              {bookingCount !== undefined && bookingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#384432] text-white">
                  {bookingCount}
                </span>
              )}
            </Link>
          )}

          {user?.role === "GM" && (
            <Link
              href="/admin/dashboard"
              className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-amber-600 text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>GM Control Panel</span>
              </div>
              <span>→</span>
            </Link>
          )}

          {(user?.role === "STAFF" || user?.role === "GM") && (
            <Link
              href="/staff/dashboard"
              className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#384432] text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                <span>Staff Inbox & Operations</span>
              </div>
              <span>→</span>
            </Link>
          )}

          <div className="pt-3 border-t border-[#ebded2]">
            {user ? (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <User className="w-4 h-4 text-stone-500" />
                  <span>
                    Signed in as <strong>{user.name}</strong>
                  </span>
                </div>
                <SignOutButton />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/register"
                  className="w-full text-center py-2 rounded-xl border border-[#384432] text-[#384432] text-xs font-semibold hover:bg-stone-100 transition"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="w-full text-center py-2 rounded-xl bg-[#384432] text-white text-xs font-semibold hover:bg-[#283224] transition shadow-xs"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
