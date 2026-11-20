// app/sos/[id]/SOSPageClient.tsx
// Client component: renders the actual emergency page UI.
// No login. No menus. Readable at a glance.

"use client";

import type { Profile } from "@/lib/types";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import AllergyChip from "@/components/AllergyChip";
import EmergencyCallButtons from "@/components/EmergencyCallButtons";
import ShareLocationButton from "@/components/ShareLocationButton";
import { Heart, Pill, Activity, Gift } from "lucide-react";

interface Props {
  profile: Profile;
}

function Section({
  icon,
  title,
  children,
  borderColor = "border-gray-100",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <section className={`rounded-2xl border-2 ${borderColor} bg-white p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function SOSPageClient({ profile }: Props) {
  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ── TOP ALERT BANNER ─────────────────────────────────── */}
      <div className="bg-red-600 text-white px-4 py-3 text-center">
        <p className="text-sm font-black tracking-widest uppercase">
          🆘 Medical Emergency – Read Immediately
        </p>
      </div>

      {/* ── IDENTITY BLOCK ───────────────────────────────────── */}
      <div className="bg-white px-6 pt-6 pb-5 border-b-2 border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight">
              {profile.name}
            </h1>
            <p className="text-xl text-gray-500 font-semibold mt-1">
              {profile.age} yrs · {profile.gender}
            </p>
            {profile.organDonor && (
              <span className="inline-flex items-center gap-1.5 mt-2 bg-green-100 text-green-800 text-sm font-bold px-3 py-1.5 rounded-full">
                <Gift className="w-4 h-4" aria-hidden />
                Organ Donor
              </span>
            )}
          </div>
          <BloodGroupBadge bloodGroup={profile.bloodGroup} size="xl" />
        </div>
      </div>

      {/* ── MEDICAL SECTIONS ─────────────────────────────────── */}
      <div className="px-4 pt-5 flex flex-col gap-4">

        {/* Allergies */}
        {profile.allergies.length > 0 && (
          <Section
            icon={<Activity className="w-5 h-5 text-red-600" aria-hidden />}
            title="⚠ Allergies – Do NOT administer"
            borderColor="border-red-200"
          >
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((a) => (
                <AllergyChip key={a} label={a} />
              ))}
            </div>
          </Section>
        )}

        {/* Conditions */}
        {profile.conditions.length > 0 && (
          <Section
            icon={<Heart className="w-5 h-5 text-orange-500" aria-hidden />}
            title="Pre-existing Conditions"
            borderColor="border-orange-100"
          >
            <ul className="space-y-1.5">
              {profile.conditions.map((c) => (
                <li key={c} className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Medications */}
        {profile.medications.length > 0 && (
          <Section
            icon={<Pill className="w-5 h-5 text-blue-500" aria-hidden />}
            title="Current Critical Medications"
            borderColor="border-blue-100"
          >
            <ul className="space-y-1.5">
              {profile.medications.map((m) => (
                <li key={m} className="flex items-center gap-2 text-base font-medium text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Call Buttons */}
        <Section
          icon={<span className="text-lg" aria-hidden>📞</span>}
          title="Emergency Contacts"
          borderColor="border-gray-100"
        >
          <EmergencyCallButtons
            primaryContact={profile.primaryContact}
            secondaryContact={profile.secondaryContact}
          />
        </Section>

        {/* Share Location */}
        <ShareLocationButton
          primaryContact={profile.primaryContact}
          patientName={profile.name}
        />
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <div className="mt-8 px-4 text-center">
        <p className="text-xs text-gray-400">
          MedRaksha Emergency Medical ID · Powered by QR scan
        </p>
      </div>
    </main>
  );
}
