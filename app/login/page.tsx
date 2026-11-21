// app/login/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthForm from "@/components/AuthForm";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  // If the callback route hit an error it adds ?error=confirmation_failed
  const urlError = searchParams.get("error");

  async function handleLogin(email: string, password: string): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    // Success – hard-navigate so middleware picks up the new session cookie
    router.push(next);
    router.refresh();
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <span className="text-3xl">❤️</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your MedRaksha account</p>
        </div>

        {/* URL-level error (from auth/callback) */}
        {urlError && (
          <div
            role="alert"
            className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl"
          >
            Email confirmation failed. The link may have expired — try signing up again.
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <AuthForm mode="login" onSubmit={handleLogin} />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
