// components/FeedbackButton.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, X, Send, Loader2, Check } from "lucide-react";

interface Props {
  variant?: "floating" | "inline";
}

export default function FeedbackButton({ variant = "floating" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pathname = usePathname();
  const isSOS = pathname?.startsWith("/sos");

  // On routes starting with /sos/, do not render the floating button
  if (variant === "floating" && isSOS) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("feedback").insert({
        message: trimmed,
        page: pathname || "/",
      });

      if (error) {
        console.error("Feedback error:", error);
        setStatus("error");
        setErrorMessage("Could not send feedback. Please try again.");
      } else {
        setStatus("success");
        setMessage("");
        // Automatically close after 2.5 seconds
        setTimeout(() => {
          setIsOpen(false);
          setStatus("idle");
        }, 2500);
      }
    } catch (err: any) {
      console.error("Unexpected feedback error:", err);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Trigger: floating pill on standard routes, text button on SOS footer */}
      {variant === "floating" ? (
        <button
          onClick={() => {
            setIsOpen(true);
            setStatus("idle");
            setErrorMessage(null);
          }}
          aria-label="Give feedback"
          className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-gray-900 border border-gray-200 shadow-md rounded-full text-xs font-semibold backdrop-blur transition-all active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden />
          <span>Feedback</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setStatus("idle");
            setErrorMessage(null);
          }}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 font-medium underline underline-offset-2 transition-colors"
        >
          Feedback
        </button>
      )}

      {/* Modal / Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3 backdrop-blur-xs"
        >
          {/* Card */}
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" aria-hidden />
                <h3 id="feedback-title" className="text-sm font-black text-gray-900">
                  Feedback
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
                aria-label="Close feedback"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Confirmation State */}
            {status === "success" ? (
              <div className="py-6 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="font-bold text-gray-900 text-base">Thanks!</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  Your feedback helps us make MedRaksha faster and clearer in emergencies.
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label htmlFor="feedback-text" className="text-xs font-bold text-gray-800 leading-snug">
                  What&apos;s one thing that confused you or that you&apos;d change?
                </label>
                <textarea
                  id="feedback-text"
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts…"
                  className="w-full border border-gray-200 rounded-2xl p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50/50"
                  autoFocus
                />

                {status === "error" && (
                  <div
                    role="alert"
                    className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl font-medium"
                  >
                    {errorMessage || "Could not send feedback. Please try again."}
                  </div>
                )}

                <div className="flex justify-end items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={submitting}
                    className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                        <span>Sending…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" aria-hidden />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
