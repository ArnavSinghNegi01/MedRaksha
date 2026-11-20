// lib/types.ts
// Core data model for a MedRaksha patient profile.

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string; // e10-digit Indian mobile, stored with country code
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string; // e.g. "B+"
  allergies: string[]; // free-text list
  conditions: string[]; // pre-existing conditions
  medications: string[]; // current critical medications
  organDonor: boolean;
  primaryContact: EmergencyContact;
  secondaryContact: EmergencyContact;
}
