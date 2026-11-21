# MedRaksha

**Emergency Medical ID – Mobile-first web app built with Next.js 15, Tailwind CSS & TypeScript.**

---

## Quick Start

```bash
# 1 · Install dependencies (requires Node 18+)
npm install

# 2 · Run the dev server
npm run dev

# 3 · Open in browser
open http://localhost:3000
```

---

## Routes

| URL | Description |
|-----|-------------|
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Profile dashboard with Edit form (Supabase) |
| `/card` | Emergency card with QR code + Download button (Supabase) |
| `/sos/raksha-001` | Public emergency page (sample profile – no login) |
| `/sos/[any-other-id]` | Public emergency page for any user's `public_id` or 404 |

---

## Project Structure

```
app/
  layout.tsx           Root layout
  page.tsx             → redirect /dashboard
  dashboard/page.tsx   Profile Dashboard (client, localStorage)
  card/page.tsx        Emergency Card + QR code
  sos/[id]/
    page.tsx           Server: ID check → 404 or profile
    SOSPageClient.tsx  Client: emergency UI

components/
  BloodGroupBadge.tsx  Large coloured blood group pill
  AllergyChip.tsx      High-vis red allergy chip
  EmergencyCallButtons.tsx  Call buttons (contacts + 108 / 112)
  ShareLocationButton.tsx   GPS → WhatsApp location share
  ProfileForm.tsx      Edit form (all fields, tag inputs)
  QRCard.tsx           Printable card + QR + html-to-image download

lib/
  types.ts             Profile TypeScript interface
  sampleProfile.ts     Fake patient data (Arjun Mehra, B+)
  supabase/
    client.ts          Browser Supabase client
    server.ts          Server Supabase client
  utils.ts             cn() helper + blood group → colour
```

---

## Notes

- `/sos/[id]` calls the Postgres `get_public_profile(p_public_id)` function.
- The **Dashboard** and **Card** pages read from and write to Supabase (scoped to the authenticated user).
- No direct table access: the public emergency page uses a `SECURITY DEFINER` function with safe survival fields only.
