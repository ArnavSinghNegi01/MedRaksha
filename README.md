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
| `/dashboard` | Profile dashboard with Edit form (localStorage) |
| `/card` | Emergency card with QR code + Download button |
| `/sos/raksha-001` | Public emergency page (sample profile – no login) |
| `/sos/[any-other-id]` | "Profile Not Found" page |

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
  profileStorage.ts    loadProfile / saveProfile (localStorage)
  utils.ts             cn() helper + blood group → colour
```

---

## Notes

- `/sos/[id]` uses the **fixed sample profile** (`raksha-001`). It does NOT read localStorage so a stranger scanning the QR always sees the correct data.
- The **Dashboard** and **Card** pages read from localStorage; the first visit falls back to the sample profile.
- No login, no backend, no database — all data is local.
