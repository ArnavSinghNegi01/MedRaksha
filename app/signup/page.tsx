// app/signup/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  async function handleSignup(email: string, password: string): Promise<string | null> {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // After clicking the confirmation email, Supabase redirects here
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return error.message;
    // null = success; AuthForm will show the "check your email" screen
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
          <h1 className="text-2xl font-black text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your emergency medical ID, always ready
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <AuthForm mode="signup" onSubmit={handleSignup} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 max-w-xs mx-auto">
          Your data stays private. The public emergency page shows only
          survival-critical fields — no contact details, no documents.
        </p>
      </div>
    </main>
  );
}
