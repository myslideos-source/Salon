# HalloMia

A focused platform for hairdressing salons: HalloMia's own calendar, an
AI phone assistant that books real appointments against it, and just enough
customer/call management to run the front desk — nothing more. See the
product brief in the repo history for the full spec; this README covers
running and understanding the code.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (Postgres, Auth, RLS) · Zod · OpenAI (Voice Test Mode) · Retell
provider scaffold (live telephony) · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Open http://localhost:3000 — the landing page, `/admin/login` (platform
admin) and `/app/login` (salon staff) are the three entry points.

### Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything | from Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | the voice webhook, seed scripts | server-only, never exposed to the browser |
| `OPENAI_API_KEY` | the in-app **Voice Test Mode** ("Testanruf") | without it the UI explains what's missing instead of faking a result |
| `RETELL_API_KEY` / `RETELL_WEBHOOK_SECRET` | live phone calls via Retell | see `src/lib/voice/providers/retell.ts` — the integration is wired but needs a real Retell account to go live |
| `APP_URL` | building the Retell webhook URL | your deployed origin |

The app runs and is fully usable for calendar/booking/admin work without
`OPENAI_API_KEY` or the Retell keys — those only gate the two ways of
actually *talking* to the assistant.

### Database

Migrations live in `supabase/migrations/` (schema, RLS policies, the
`book_appointment` RPC) and are already applied to the connected Supabase
project. To stand up a new project from scratch:

```bash
supabase db push        # or apply the .sql files in order via the SQL editor
```

`supabase/seed.sql` seeds one fully-populated demo salon ("Hair Lounge
Milano": 3 employees, 6 services, business hours, customers, today's
appointments, calls, callbacks) plus a platform-admin and a salon login.
**Edit the placeholder email/password at the top of the file before
running it**, then change both passwords on first login.

`supabase/tests/rls_and_booking.sql` is a manual, self-cleaning SQL check
for the two guarantees that need a real Postgres instance rather than a
mocked one: the double-booking exclusion constraint and RLS tenant
isolation (own-salon visible, other-salon invisible, anonymous sees
nothing). Run it after seeding.

## Architecture

```
Kunde → Voice AI (Retell/OpenAI) → HalloMia Termin-Engine → Postgres → HalloMia Kalender
```

- **`src/lib/scheduling/availability.ts`** — the pure slot-calculation
  function (business hours ∩ working hours − absences − existing bookings,
  buffers, lead time, max-advance window). No DB calls, fully unit tested
  in `tests/availability.test.ts`.
- **`src/lib/scheduling/engine.ts`** — wraps that function with real data
  (`checkAvailability`) and owns booking/reschedule/cancel. Every booking
  re-validates the slot immediately before writing.
- **`book_appointment` RPC + `appointments_no_overlap` exclusion
  constraint** (`supabase/migrations/0001_schema.sql`,
  `0003_booking_rpc.sql`) — the actual concurrency guarantee. Two
  simultaneous booking attempts for the same employee/time race at the
  database level; the loser gets a clean "slot no longer available" error
  instead of corrupting data. This holds regardless of what the
  application code does.
- **`src/lib/voice/tools.ts`** — the ten structured voice tools
  (`getServices`, `checkAvailability`, `createAppointment`, …). This is the
  *only* surface the AI can use to touch salon data — it can't invent
  prices, employees, or availability. Shared by the Retell webhook
  (`src/app/api/voice/webhook/route.ts`) and the in-app test-call route
  (`src/app/api/voice/test/route.ts`).
- **RLS** (`supabase/migrations/0002_rls.sql`) — every salon-scoped table
  is tenant-isolated at the database level via `is_salon_member()`, not in
  application code. Platform admins bypass via `is_platform_admin()`. The
  service-role key (voice webhook, seed scripts) bypasses RLS entirely and
  is never sent to the browser.

## Roles

- **Platform admin** (`platform_admins` allowlist): manages salons,
  employees, services, hours, and the technical AI configuration.
- **Salon user** (`salon_users`): calendar, appointments, customers, calls,
  absences for their own salon only. Cannot touch employees/services/hours
  or AI settings (managed-service model) — RLS enforces this, not just the
  UI.

## Testing

```bash
npm run test     # vitest — pure scheduling-engine logic
npm run lint
npx tsc --noEmit
```

## Known limitations / next steps

- Retell integration is code-complete (`src/lib/voice/providers/retell.ts`,
  the webhook route) but unverified against a live Retell account — the
  exact webhook payload shape should be checked against Retell's current
  docs once `RETELL_API_KEY`/`RETELL_WEBHOOK_SECRET` are configured.
- `middleware.ts` uses the (currently still supported, but deprecated in
  Next 16) `middleware` convention rather than `proxy.ts`; a future pass
  can run `npx @next/codemod@canary middleware-to-proxy .`.
- Google Calendar sync is intentionally out of scope for this MVP (see
  product brief) — HalloMia stays the single source of truth for
  availability.
