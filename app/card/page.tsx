// app/card/page.tsx
// Emergency Card – shows a printable card with QR code and a Download button.
// Loads the signed-in user's profile from Supabase and points QR to /sos/[public_id].
// Auth-protected by middleware.ts – unauthenticated users are redirected to /login.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import QRCard from "@/components/QRCard";
import { ArrowLeft, QrCode } from "lucide-react";

export default function CardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCardProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?next=/card");
          return;
        }

        const { data: profileRow, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile for card:", error);
          setLoading(false);
          return;
        }

        if (profileRow) {
          const { data: contacts } = await supabase
            .from("emergency_contacts")
            .select("*")
            .eq("profile_id", profileRow.id)
            .order("is_primary", { ascending: false });

          const primary = contacts?.find((c) => c.is_primary) ?? contacts?.[0];
          const secondary = contacts?.find((c) => !c.is_primary) ?? (contacts && contacts.length > 1 ? contacts[1] : undefined);

          setProfile({
            id: profileRow.id,
            publicId: profileRow.public_id,
            name: profileRow.name,
            age: profileRow.age,
            gender: profileRow.gender,
            bloodGroup: profileRow.blood_group,
            allergies: profileRow.allergies ?? [],
            conditions: profileRow.conditions ?? [],
            medications: profileRow.medications ?? [],
            organDonor: profileRow.organ_donor ?? false,
            primaryContact: {
              name: primary?.name ?? "",
              relation: primary?.relation ?? "",
              phone: primary?.phone ?? "",
            },
            secondaryContact: {
              name: secondary?.name ?? "",
              relation: secondary?.relation ?? "",
              phone: secondary?.phone ?? "",
            },
          });
        }
      } catch (err) {
        console.error("Card page init error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCardProfile();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
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

      {/* Card area */}
      <div className="mt-6 flex justify-center px-4">
        {loading ? (
          <div className="animate-pulse text-gray-400 text-sm py-12">Loading emergency card…</div>
        ) : profile && profile.publicId ? (
          <QRCard profile={profile} />
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center gap-4 max-w-sm mt-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">No Emergency Card Yet</h2>
              <p className="text-sm text-gray-500 mt-1">
                Please complete your medical profile on the dashboard to generate your personalised QR emergency card.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow active:scale-95 transition-transform"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
