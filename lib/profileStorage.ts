// lib/profileStorage.ts
// Reads / writes the user's own profile from localStorage.
// Falls back to the sample profile as the initial default.

import type { Profile } from "./types";
import { sampleProfile } from "./sampleProfile";

const STORAGE_KEY = "medraksha_profile";

export function loadProfile(): Profile {
  if (typeof window === "undefined") return sampleProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleProfile;
    return JSON.parse(raw) as Profile;
  } catch {
    return sampleProfile;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
