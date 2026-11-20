// app/dashboard/page.tsx
// Profile Dashboard – shows saved profile; Edit button opens the form.
// Reads from / writes to localStorage.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { loadProfile } from "@/lib/profileStorage";
import ProfileForm from "@/components/ProfileForm";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import { Edit2, QrCode, Heart, Pill, Activity, User, Phone, Gift } from "lucide-react";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right max-w-[55%]">{value}</span>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  color = "text-gray-500",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 ${color} bg-gray-50`}>
        {icon}
        <h2 className="text-xs font-black uppercase tracking-widest">{title}</h2>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading profile…</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-red-600 font-black text-lg">❤</span>
          <span className="font-black text-gray-900 text-lg tracking-tight">MedRaksha</span>
        </div>
        <button
          onClick={() => router.push("/card")}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow"
        >
          <QrCode className="w-4 h-4" />
          My Emergency Card
        </button>
      </div>

      {editing ? (
        <div className="px-4 pt-5">
          <h1 className="text-xl font-black text-gray-900 mb-5">Edit Profile</h1>
          <ProfileForm
            initial={profile}
            onSave={(p) => { setProfile(p); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="px-4 pt-5 flex flex-col gap-4">
          {/* Identity card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{profile.name}</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  {profile.age} yrs · {profile.gender}
                </p>
                {profile.organDonor && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-green-700 text-xs font-bold">
                    <Gift className="w-3.5 h-3.5" /> Organ Donor
                  </span>
                )}
              </div>
            </div>
            <BloodGroupBadge bloodGroup={profile.bloodGroup} size="lg" />
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditing(true)}
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 font-bold border-2 border-blue-200 text-blue-700 bg-blue-50"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>

          {/* Allergies */}
          {profile.allergies.length > 0 && (
            <Section
              icon={<Activity className="w-4 h-4" />}
              title="Allergies"
              color="text-red-600"
            >
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((a) => (
                  <span
                    key={a}
                    className="bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Conditions */}
          {profile.conditions.length > 0 && (
            <Section
              icon={<Heart className="w-4 h-4" />}
              title="Pre-existing Conditions"
              color="text-orange-500"
            >
              <ul className="space-y-1">
                {profile.conditions.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
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
              icon={<Pill className="w-4 h-4" />}
              title="Critical Medications"
              color="text-blue-500"
            >
              <ul className="space-y-1">
                {profile.medications.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Emergency Contacts */}
          <Section
            icon={<Phone className="w-4 h-4" />}
            title="Emergency Contacts"
            color="text-gray-500"
          >
            <InfoRow
              label={`${profile.primaryContact.relation} (Primary)`}
              value={`${profile.primaryContact.name} · ${profile.primaryContact.phone}`}
            />
            <InfoRow
              label={`${profile.secondaryContact.relation} (Secondary)`}
              value={`${profile.secondaryContact.name} · ${profile.secondaryContact.phone}`}
            />
          </Section>
        </div>
      )}
    </main>
  );
}
