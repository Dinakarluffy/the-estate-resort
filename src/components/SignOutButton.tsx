"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, Loader2, Coffee } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
  variant?: "link" | "button";
}

export function SignOutButton({ className, variant = "link" }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Brief gentle delay (1.2s) so the user experiences the smooth signing-out screen
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch {
      window.location.href = "/";
    }
  };

  const overlayContent = isSigningOut && mounted ? (
    <div className="fixed inset-0 z-[9999] bg-[#181f16]/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-[#ebded2] animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-[#f5efe8] text-[#384432] flex items-center justify-center mx-auto mb-4 shadow-sm relative">
          <Coffee className="w-8 h-8" />
          <div className="absolute inset-0 rounded-full border-2 border-[#546a4a] border-t-transparent animate-spin" />
        </div>
        <h3 className="text-xl font-serif font-bold text-stone-900">
          Signing Out...
        </h3>
        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
          Securely clearing your resort session.<br />Redirecting you to the home page in a moment.
        </p>
        <div className="mt-6 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-[#546a4a] h-full rounded-full animate-pulse w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={
            className ||
            "text-xs font-semibold px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition inline-flex items-center gap-1.5"
          }
        >
          {isSigningOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={
            className ||
            "text-xs text-stone-500 hover:text-stone-800 underline ml-1 inline-flex items-center gap-1"
          }
        >
          {isSigningOut && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      )}

      {/* Teleport overlay directly to document.body so it centers in the middle of the whole screen */}
      {mounted && overlayContent && createPortal(overlayContent, document.body)}
    </>
  );
}
