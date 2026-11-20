// components/QRCard.tsx
"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import type { Profile } from "@/lib/types";
import { SAMPLE_ID } from "@/lib/sampleProfile";

// Full literal class strings — same rule as BloodGroupBadge: no dynamic assembly,
// no imports from lib/, so Tailwind's scanner always sees every class name.
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

interface Props {
  profile: Profile;
}

export default function QRCard({ profile }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Build QR URL using the fixed sample ID so the public page always resolves
  const qrUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sos/${SAMPLE_ID}`
      : `/sos/${SAMPLE_ID}`;

  async function handleDownload() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `MedRaksha-${profile.name.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Could not generate image. Please try again.");
    }
  }

  const bgClass = BG_COLOURS[profile.bloodGroup] ?? FALLBACK;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The printable card */}
      <div
        ref={cardRef}
        className="w-80 rounded-3xl border-2 border-gray-200 bg-white shadow-xl overflow-hidden"
        style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
      >
        {/* Header strip */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white text-xs font-bold tracking-widest uppercase">
              MedRaksha
            </p>
            <p className="text-red-100 text-xs">Emergency Medical ID</p>
          </div>
          <span
            className={`text-2xl font-black px-4 py-2 rounded-xl shadow ${bgClass}`}
          >
            {profile.bloodGroup}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex items-center gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-xl font-black leading-tight truncate">
              {profile.name}
            </p>
            <p className="text-gray-500 text-sm mt-0.5">
              {profile.age} yrs · {profile.gender}
            </p>
            {profile.organDonor && (
              <p className="text-green-700 text-xs font-semibold mt-1">🫀 Organ Donor</p>
            )}
            {profile.allergies.length > 0 && (
              <p className="text-red-600 text-xs font-bold mt-2 leading-snug">
                ⚠ Allergic to:{" "}
                {profile.allergies.join(", ")}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <QRCodeSVG value={qrUrl} size={96} level="H" />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
          <p className="text-gray-400 text-xs text-center">
            Scan QR for full emergency info
          </p>
        </div>
      </div>

      {/* Download button (outside the captured area) */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
      >
        <Download className="w-5 h-5" />
        Download Card
      </button>

      <p className="text-gray-400 text-xs text-center max-w-xs">
        Print or screenshot this card and keep it in your wallet. First responders
        can scan the QR code to view your full emergency profile.
      </p>
    </div>
  );
}
