# MedRaksha: Emergency Medical Response & Health Identity

**Live app:** https://med-raksha.vercel.app

In an accident, victims often can't say their blood group, allergies or who to call. MedRaksha puts that information one QR scan away.

## What it does
- **Public emergency page (no login):** scanning a person's QR code shows blood group, allergies, conditions, current medications, organ donor status, one-tap calls to emergency contacts and 108/112, and a button to share GPS location via WhatsApp or SMS.
- **Secure accounts:** email sign-up and login. Each user has their own profile, and row-level security in the database means users can only access their own data. The public page shows survival-critical fields only.
- **Emergency card:** a downloadable card with the user's QR code.
- **AI document scanner:** take a photo or upload a prescription or report. Gemini explains in plain language what the document is, lists the conditions and medicines written in it, and adds a short "what is this?" for each. The user reviews and picks what to add; nothing saves automatically.
- **Document vault:** a private place to store and organise reports by type and date, using a private storage bucket and short-lived links.
- **Feedback button** on every screen.

## Tech stack
Next.js, Tailwind CSS, Supabase (auth, Postgres, storage, row-level security), Gemini API, Vercel, GitHub. Built with AI coding tools (Antigravity) following the YIIC build guide.

## Important notes
- This is a **prototype** built for the Youth Innovators Internship Challenge. It uses test data only. A real health product would need a security and privacy review, encryption and consent flows.
- AI explanations are general information, not medical advice, and can contain mistakes. The app tells users to check with a doctor or pharmacist.
- The AI service can be busy at times, in which case the app shows a friendly message and the user can retry.
- Camera capture works best on phones with free memory; if it fails, take the photo with the phone camera and use "Upload File".

## Run locally
1. `npm install`
2. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `GEMINI_API_KEY`.
3. `npm run dev`
