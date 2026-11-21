// lib/types.ts
// Core data model for a MedRaksha patient profile.

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string; // 10-digit Indian mobile, stored with country code
}

export interface Profile {
  id?: string;
  publicId?: string;
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

// ─── Supabase RPC types ───────────────────────────────────────────────────────

/** Shape of one contact row returned by get_public_profile(). */
export interface PublicContactRow {
  name: string;
  relation: string;
  phone: string;
  is_primary: boolean;
}

/**
 * Exact JSON shape returned by the Postgres function get_public_profile().
 * Column names are snake_case to match what Postgres returns.
 * No PII beyond what a first-responder needs: no user_id, no address.
 */
export interface PublicProfileRow {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  blood_group: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  organ_donor: boolean;
  contacts: PublicContactRow[];
}

/**
 * Map a PublicProfileRow (DB snake_case) → Profile (app camelCase).
 * Falls back gracefully when contacts are missing.
 */
export function mapPublicRowToProfile(row: PublicProfileRow): Profile {
  const primary = row.contacts.find((c) => c.is_primary) ?? row.contacts[0];
  const secondary = row.contacts.find((c) => !c.is_primary) ?? row.contacts[1];

  return {
    id: "db",
    name: row.name,
    age: row.age,
    gender: row.gender,
    bloodGroup: row.blood_group,
    allergies: row.allergies ?? [],
    conditions: row.conditions ?? [],
    medications: row.medications ?? [],
    organDonor: row.organ_donor,
    primaryContact: primary
      ? { name: primary.name, relation: primary.relation, phone: primary.phone }
      : { name: "—", relation: "—", phone: "" },
    secondaryContact: secondary
      ? { name: secondary.name, relation: secondary.relation, phone: secondary.phone }
      : { name: "—", relation: "—", phone: "" },
  };
}

// ─── Document Vault types ─────────────────────────────────────────────────────

export type DocumentType =
  | "Prescription"
  | "Lab report"
  | "Discharge summary"
  | "Scan / imaging"
  | "Insurance"
  | "Other";

export interface MedicalDocument {
  id: string;
  user_id?: string;
  title: string;
  doc_type: DocumentType;
  doc_date: string;
  file_path: string;
  file_name: string;
  created_at: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  "Prescription",
  "Lab report",
  "Discharge summary",
  "Scan / imaging",
  "Insurance",
  "Other",
];

// ─── AI Medical Scanner types ─────────────────────────────────────────────────

export interface ConditionItem {
  name: string;
  explanation: string;
}

export interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
  explanation: string;
}

export interface ScanResult {
  documentType: string;
  summary: string;
  conditions: ConditionItem[];
  medications: MedicationItem[];
  allergies: string[];
  alerts: string[];
  unclear: string[];
}
