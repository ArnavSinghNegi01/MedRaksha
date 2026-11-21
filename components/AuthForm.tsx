// components/AuthForm.tsx
// Shared mobile-first form shell used by /login and /signup.
// Handles display of user-friendly error messages.
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

// ── Friendly error message map ────────────────────────────────────────────────
// Supabase returns short error codes / messages; we surface plain English.
function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Wrong email or password. Please try again.";
  if (m.includes("email already") || m.includes("user already registered"))
    return "An account with this email already exists. Try logging in instead.";
  if (m.includes("password should be at least"))
    return "Password must be at least 6 characters.";
  if (m.includes("unable to validate email"))
    return "Please enter a valid email address.";
  if (m.includes("email not confirmed"))
    return "Please check your email and click the confirmation link first.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("confirmation_failed"))
    return "Email confirmation failed. The link may have expired — try signing up again.";
  return msg; // fall back to raw message for unexpected errors
}

interface Props {
  mode: "login" | "signup";
  onSubmit: (email: string, password: string) => Promise<string | null>; // returns error string or null
}

const inputCls =
  "w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-base focus:outline-none focus:border-blue-500 transition-colors bg-white";

export default function AuthForm({ mode, onSubmit }: Props) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await onSubmit(email, password);
    setLoading(false);
    if (err) {
      setError(friendlyError(err));
    } else if (mode === "signup") {
      // For signup, Supabase sends a confirmation email; stay on page and show message
      setSuccess(true);
    }
    // For login, the parent's onSubmit does router.push() on success
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="text-5xl">📬</div>
        <h2 className="text-xl font-black text-gray-900">Check your email</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-gray-800">{email}</span>.
          Click it to activate your account, then{" "}
          <Link href="/login" className="text-blue-600 font-semibold underline">
            log in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
        <input
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-black text-lg rounded-2xl py-4 shadow-md active:scale-95 transition-transform disabled:opacity-60"
      >
        {loading
          ? mode === "login" ? "Signing in…" : "Creating account…"
          : mode === "login" ? "Sign In"     : "Create Account"}
      </button>

      <p className="text-center text-sm text-gray-500">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="text-blue-600 font-semibold">
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 font-semibold">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
