// app/sos/[id]/page.tsx
// PUBLIC – no login needed. Shows survival-critical medical info.
// Uses the fixed sample profile. Returns a "Profile not found" page for unknown IDs.

import type { Metadata } from "next";
import { sampleProfile, SAMPLE_ID } from "@/lib/sampleProfile";
import SOSPageClient from "./SOSPageClient";

interface Props {
  params: { id: string };
}

export function generateMetadata({ params }: Props): Metadata {
  if (params.id !== SAMPLE_ID) return { title: "Profile Not Found – MedRaksha" };
  return {
    title: `Emergency Info: ${sampleProfile.name} – MedRaksha`,
    description: `Emergency medical ID for ${sampleProfile.name}. Blood group: ${sampleProfile.bloodGroup}.`,
  };
}

export default function SOSPage({ params }: Props) {
  if (params.id !== SAMPLE_ID) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Profile Not Found</h1>
        <p className="text-gray-500 text-base max-w-xs">
          The emergency ID <span className="font-mono text-red-600">{params.id}</span> does not
          match any profile in this system.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Please check that you scanned the correct QR code.
        </p>
      </main>
    );
  }

  return <SOSPageClient profile={sampleProfile} />;
}
