// components/AllergyChip.tsx
"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  label: string;
}

export default function AllergyChip({ label }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-red-600 text-white font-semibold text-base px-4 py-2 rounded-full shadow">
      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
