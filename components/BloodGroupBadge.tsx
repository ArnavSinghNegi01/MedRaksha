// components/BloodGroupBadge.tsx
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Every colour string in BG_COLOURS must be a FULL, UNSPLIT Tailwind
// class name written as a literal here in this file.  Tailwind's static scanner
// only reads files listed in tailwind.config → content.  Because lib/utils.ts
// is NOT in that list, any class string returned by a function there would be
// purged (never generated) even in dev mode.  Keeping the lookup table here
// guarantees all classes are seen by the scanner.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

interface Props {
  bloodGroup: string;
  size?: "lg" | "xl";
}

// Every value is a complete, unsplit Tailwind class string — no string building.
const BG_COLOURS: Record<string, string> = {
  "A+":  "bg-blue-600 text-white",
  "A-":  "bg-blue-600 text-white",
  "B+":  "bg-purple-700 text-white",
  "B-":  "bg-purple-700 text-white",
  "AB+": "bg-orange-500 text-white",
  "AB-": "bg-orange-500 text-white",
  "O+":  "bg-red-600 text-white",
  "O-":  "bg-red-600 text-white",
};
const FALLBACK = "bg-gray-800 text-white";

export default function BloodGroupBadge({ bloodGroup, size = "xl" }: Props) {
  const colourClass = BG_COLOURS[bloodGroup] ?? FALLBACK;
  const sizeClass =
    size === "xl"
      ? "text-5xl px-8 py-4 rounded-2xl"
      : "text-2xl px-5 py-2 rounded-xl";

  return (
    <div
      className={`inline-flex items-center justify-center font-black tracking-wider shadow-lg ${colourClass} ${sizeClass}`}
      aria-label={`Blood group ${bloodGroup || "unknown"}`}
    >
      {bloodGroup || "—"}
    </div>
  );
}
