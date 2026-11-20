// app/sos/[id]/page.tsx
// PUBLIC – no login needed.
// Fetches survival-critical data via the get_public_profile() Postgres function.
// The function uses SECURITY DEFINER so anon can call it without direct table access.
// Returns "Profile Not Found" if the RPC returns null (unknown public_id).

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { mapPublicRowToProfile, type PublicProfileRow } from "@/lib/types";
import SOSPageClient from "./SOSPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProfileNotFound({ id }: { id: string }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-black text-gray-800 mb-2">Profile Not Found</h1>
      <p className="text-gray-500 text-base max-w-xs">
        The emergency ID{" "}
        <span className="font-mono text-red-600">{id}</span> does not match any
        profile in this system.
      </p>
      <p className="text-gray-400 text-sm mt-4">
        Please check that you scanned the correct QR code.
      </p>
    </main>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_public_profile", {
    p_public_id: id,
  });

  if (!data) return { title: "Profile Not Found – MedRaksha" };

  const row = data as PublicProfileRow;
  return {
    title: `Emergency Info: ${row.name} – MedRaksha`,
    description: `Emergency medical ID for ${row.name}. Blood group: ${row.blood_group}.`,
  };
}

export default async function SOSPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_profile", {
    p_public_id: id,
  });

  // Log server-side errors (not visible to end users)
  if (error) {
    console.error("[SOS] get_public_profile error:", error.message);
  }

  if (!data) {
    return <ProfileNotFound id={id} />;
  }

  const profile = mapPublicRowToProfile(data as PublicProfileRow);
  return <SOSPageClient profile={profile} />;
}
