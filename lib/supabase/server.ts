// lib/supabase/server.ts
// Server-side Supabase client for Server Components and Route Handlers.
// Uses @supabase/ssr so it can read/write auth cookies when needed later.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // In Next.js 15 cookies() is async
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies – safe to ignore here.
            // Middleware handles the refresh for auth sessions.
          }
        },
      },
    }
  );
}
