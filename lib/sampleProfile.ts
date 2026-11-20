// lib/sampleProfile.ts
// One realistic fake patient used by /sos/[id] (the public emergency page).
// The ID "raksha-001" is what the QR code encodes.

import type { Profile } from "./types";

export const SAMPLE_ID = "raksha-001";

export const sampleProfile: Profile = {
  id: SAMPLE_ID,
  name: "Arjun Mehra",
  age: 34,
  gender: "Male",
  bloodGroup: "B+",
  allergies: ["Penicillin", "Sulfa Drugs", "Latex"],
  conditions: ["Type 2 Diabetes", "Hypertension"],
  medications: ["Metformin 500 mg (twice daily)", "Amlodipine 5 mg (once daily)"],
  organDonor: true,
  primaryContact: {
    name: "Priya Mehra",
    relation: "Wife",
    phone: "+919876543210",
  },
  secondaryContact: {
    name: "Rajesh Mehra",
    relation: "Brother",
    phone: "+919812345678",
  },
};
