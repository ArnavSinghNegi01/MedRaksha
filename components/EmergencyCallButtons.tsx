// components/EmergencyCallButtons.tsx
"use client";

import { Phone, Ambulance } from "lucide-react";
import type { EmergencyContact } from "@/lib/types";

interface Props {
  primaryContact: EmergencyContact;
  secondaryContact: EmergencyContact;
}

function CallBtn({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: "primary" | "secondary" | "ambulance" | "emergency";
}) {
  const base =
    "flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-lg font-bold shadow-md active:scale-95 transition-transform";

  const styles: Record<string, string> = {
    primary:   `${base} bg-blue-600 text-white`,
    secondary: `${base} bg-blue-100 text-blue-800 border-2 border-blue-300`,
    ambulance: `${base} bg-red-600 text-white`,
    emergency: `${base} bg-red-700 text-white`,
  };

  const Icon = variant === "ambulance" || variant === "emergency" ? Ambulance : Phone;

  return (
    <a href={href} className={styles[variant]}>
      <Icon className="w-5 h-5 shrink-0" aria-hidden />
      {label}
    </a>
  );
}

export default function EmergencyCallButtons({ primaryContact, secondaryContact }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <CallBtn
        href={`tel:${primaryContact.phone}`}
        label={`Call ${primaryContact.name} (${primaryContact.relation})`}
        variant="primary"
      />
      <CallBtn
        href={`tel:${secondaryContact.phone}`}
        label={`Call ${secondaryContact.name} (${secondaryContact.relation})`}
        variant="secondary"
      />
      <div className="grid grid-cols-2 gap-3">
        <CallBtn href="tel:108" label="🚑 Ambulance 108" variant="ambulance" />
        <CallBtn href="tel:112" label="🆘 Emergency 112" variant="emergency" />
      </div>
    </div>
  );
}
