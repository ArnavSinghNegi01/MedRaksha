// app/dashboard/page.tsx
// Profile Dashboard – loads signed-in user's profile and contacts from Supabase.
// If the user has no profile, shows an empty profile with an "Edit Profile" prompt.
// Auth-protected by middleware.ts – unauthenticated users are redirected to /login.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import ProfileForm from "@/components/ProfileForm";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import { Edit2, QrCode, Heart, Pill, Activity, User, Phone, Gift, LogOut, AlertCircle, FolderLock } from "lucide-react";

const EMPTY_PROFILE: Profile = {
  name: "",
  age: 0,
  gender: "Male",
  bloodGroup: "",
  allergies: [],
  conditions: [],
  medications: [],
  organDonor: false,
  primaryContact: { name: "", relation: "", phone: "" },
  secondaryContact: { name: "", relation: "", phone: "" },
};

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/dashboard");
        return;
      }
      setUserEmail(user.email ?? null);

      // Fetch user's profile from Supabase
      const { data: profileRow, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pError) {
        console.error("Error loading profile:", pError);
        setLoadError("Could not load your medical profile. Please refresh.");
        setProfile(EMPTY_PROFILE);
        setLoading(false);
        return;
      }

      if (profileRow) {
        // Fetch emergency contacts for this profile
        const { data: contacts, error: cError } = await supabase
          .from("emergency_contacts")
          .select("*")
          .eq("profile_id", profileRow.id)
          .order("is_primary", { ascending: false });

        if (cError) {
          console.error("Error loading contacts:", cError);
        }

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
      } else {
        // No profile in database yet -> show empty profile with edit prompt
        setProfile(EMPTY_PROFILE);
      }
    } catch (err: any) {
      console.error("Dashboard init error:", err);
      setLoadError("Failed to initialize dashboard. Please try again.");
      setProfile(EMPTY_PROFILE);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleSave(updated: Profile) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("You must be logged in to save your profile.");
    }

    let savedProfileId = profile?.id;
    let savedPublicId = profile?.publicId;

    if (savedProfileId) {
      // Update existing profile
      const { data, error } = await supabase
        .from("profiles")
        .update({
          name: updated.name,
          age: updated.age,
          gender: updated.gender,
          blood_group: updated.bloodGroup,
          allergies: updated.allergies,
          conditions: updated.conditions,
          medications: updated.medications,
          organ_donor: updated.organDonor,
        })
        .eq("id", savedProfileId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || "Failed to update profile. Please try again.");
      }
      savedPublicId = data.public_id;
    } else {
      // Create new profile with user_id = signed-in user
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          name: updated.name,
          age: updated.age,
          gender: updated.gender,
          blood_group: updated.bloodGroup,
          allergies: updated.allergies,
          conditions: updated.conditions,
          medications: updated.medications,
          organ_donor: updated.organDonor,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || "Failed to create profile. Please try again.");
      }
      savedProfileId = data.id;
      savedPublicId = data.public_id;
    }

    // Replace that profile's two contacts: delete old, insert new
    const { error: deleteContactsError } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("profile_id", savedProfileId);

    if (deleteContactsError) {
      throw new Error(deleteContactsError.message || "Failed to update contacts.");
    }

    const contactsToInsert = [
      {
        profile_id: savedProfileId,
        name: updated.primaryContact.name.trim(),
        relation: updated.primaryContact.relation.trim() || "Emergency Contact",
        phone: updated.primaryContact.phone.trim(),
        is_primary: true,
      },
      {
        profile_id: savedProfileId,
        name: updated.secondaryContact.name.trim(),
        relation: updated.secondaryContact.relation.trim() || "Emergency Contact",
        phone: updated.secondaryContact.phone.trim(),
        is_primary: false,
      },
    ];

    const { error: insertContactsError } = await supabase
      .from("emergency_contacts")
      .insert(contactsToInsert);

    if (insertContactsError) {
      throw new Error(insertContactsError.message || "Failed to save emergency contacts.");
    }

    // Reflect saved data in local state
    setProfile({
      ...updated,
      id: savedProfileId,
      publicId: savedPublicId,
    });
    setEditing(false);
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading profile…</div>
      </div>
    );
  }

  const isProfileEmpty = !profile.name;

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-black text-lg">❤</span>
            <span className="font-black text-gray-900 text-lg tracking-tight">MedRaksha</span>
          </div>
          {userEmail && (
            <span className="text-xs text-gray-400 ml-6 -mt-0.5 truncate max-w-[180px]">
              {userEmail}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/card")}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow active:scale-95 transition-transform"
          >
            <QrCode className="w-4 h-4" />
            My Card
          </button>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            className="flex items-center justify-center w-9 h-9 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mx-4 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {editing ? (
        <div className="px-4 pt-5">
          <h1 className="text-xl font-black text-gray-900 mb-5">
            {isProfileEmpty ? "Create Emergency Profile" : "Edit Profile"}
          </h1>
          <ProfileForm
            initial={profile}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="px-4 pt-5 flex flex-col gap-4">
          {/* Prompt banner for users who have no profile yet */}
          {isProfileEmpty && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-5 text-center flex flex-col items-center gap-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-blue-900">No Emergency Profile Set Up</h2>
                <p className="text-sm text-blue-700 mt-1 max-w-xs">
                  Create your profile with vital medical details and emergency contacts so responders can save valuable minutes.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-1">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl bg-blue-600 text-white shadow active:scale-95 transition-transform text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={() => router.push("/vault")}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl border-2 border-gray-200 text-gray-800 bg-white hover:bg-gray-50 active:scale-95 transition-transform shadow-xs text-sm"
                >
                  <FolderLock className="w-4 h-4 text-blue-600" />
                  My Documents
                </button>
              </div>
            </div>
          )}

          {/* Identity card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">
                  {profile.name || "No Name Set"}
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  {profile.age > 0 ? `${profile.age} yrs · ${profile.gender}` : "Age & gender not set"}
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

          {/* Actions */}
          {!isProfileEmpty && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-bold border-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100/60 active:scale-95 transition-transform text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
              <button
                onClick={() => router.push("/vault")}
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-bold border-2 border-gray-200 text-gray-800 bg-white hover:bg-gray-50 active:scale-95 transition-transform text-sm shadow-xs"
              >
                <FolderLock className="w-4 h-4 text-blue-600" />
                My Documents
              </button>
            </div>
          )}

          {/* Allergies */}
          <Section
            icon={<Activity className="w-4 h-4" />}
            title="Allergies"
            color="text-red-600"
          >
            {profile.allergies.length > 0 ? (
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
            ) : (
              <p className="text-sm text-gray-400 italic">No known allergies recorded</p>
            )}
          </Section>

          {/* Conditions */}
          <Section
            icon={<Heart className="w-4 h-4" />}
            title="Pre-existing Conditions"
            color="text-orange-500"
          >
            {profile.conditions.length > 0 ? (
              <ul className="space-y-1">
                {profile.conditions.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">No conditions recorded</p>
            )}
          </Section>

          {/* Medications */}
          <Section
            icon={<Pill className="w-4 h-4" />}
            title="Critical Medications"
            color="text-blue-500"
          >
            {profile.medications.length > 0 ? (
              <ul className="space-y-1">
                {profile.medications.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">No critical medications recorded</p>
            )}
          </Section>

          {/* Emergency Contacts */}
          <Section
            icon={<Phone className="w-4 h-4" />}
            title="Emergency Contacts"
            color="text-gray-500"
          >
            {profile.primaryContact.name || profile.secondaryContact.name ? (
              <>
                <InfoRow
                  label={`${profile.primaryContact.relation || "Primary"} (Primary)`}
                  value={
                    profile.primaryContact.name
                      ? `${profile.primaryContact.name} · ${profile.primaryContact.phone}`
                      : "Not set"
                  }
                />
                <InfoRow
                  label={`${profile.secondaryContact.relation || "Secondary"} (Secondary)`}
                  value={
                    profile.secondaryContact.name
                      ? `${profile.secondaryContact.name} · ${profile.secondaryContact.phone}`
                      : "Not set"
                  }
                />
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">No emergency contacts set</p>
            )}
          </Section>
        </div>
      )}
    </main>
  );
}
