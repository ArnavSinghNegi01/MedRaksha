// components/ShareLocationButton.tsx
"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import type { EmergencyContact } from "@/lib/types";

interface Props {
  primaryContact: EmergencyContact;
  patientName: string;
}

export default function ShareLocationButton({ primaryContact, patientName }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function handleShare() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const msg = encodeURIComponent(
          `🆘 EMERGENCY: ${patientName} needs help!\n📍 Location: ${mapsUrl}\nPlease respond immediately.`
        );
        // Prefer WhatsApp deep-link; falls back to SMS
        const phone = primaryContact.phone.replace(/\D/g, "");
        const waUrl = `https://wa.me/${phone}?text=${msg}`;
        window.open(waUrl, "_blank");
        setStatus("done");
      },
      () => {
        setStatus("error");
        alert("Could not get location. Please allow location access and try again.");
      },
      { timeout: 10000 }
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={status === "loading"}
      className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-lg font-bold shadow-md bg-green-600 text-white active:scale-95 transition-transform disabled:opacity-70"
    >
      {status === "loading" ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      ) : (
        <MapPin className="w-5 h-5 shrink-0" aria-hidden />
      )}
      {status === "loading"
        ? "Getting Location…"
        : status === "done"
        ? "✓ Location Shared!"
        : "Share My Location"}
    </button>
  );
}
