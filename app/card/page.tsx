// app/card/page.tsx
// Emergency Card – shows a printable card with QR code and a Download button.
// Reads the user's localStorage profile (falls back to sample).

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { loadProfile } from "@/lib/profileStorage";
import QRCard from "@/components/QRCard";
import { ArrowLeft } from "lucide-react";

export default function CardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-black text-gray-900 text-lg leading-none">Emergency Card</h1>
          <p className="text-gray-400 text-xs mt-0.5">Share or print this card</p>
        </div>
      </div>

      {/* Instructions banner */}
      <div className="mx-4 mt-4 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        <p className="text-blue-800 text-sm font-semibold">
          💡 Show this card to first responders or print it and keep it in your wallet.
          Anyone who scans the QR code will instantly see your critical medical info.
        </p>
      </div>

      {/* Card */}
      <div className="mt-6 flex justify-center px-4">
        {profile ? (
          <QRCard profile={profile} />
        ) : (
          <div className="animate-pulse text-gray-400 text-sm">Loading card…</div>
        )}
      </div>
    </main>
  );
}
