// app/auth/callback/route.ts
// Supabase Auth email-confirmation callback.
// Supabase sends the user here after they click the confirmation link in their email.
// We exchange the one-time `code` for a session, then redirect to /dashboard.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // ?next= lets us send the user to a specific page after login
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong – send to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
