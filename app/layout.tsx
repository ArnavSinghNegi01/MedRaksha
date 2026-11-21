// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";

export const metadata: Metadata = {
  title: "MedRaksha – Emergency Medical ID",
  description:
    "Scan a QR code to instantly view critical medical info in an emergency.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
