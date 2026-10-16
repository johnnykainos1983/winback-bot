# WinBack Bot

Mobile-first web app that helps South African tradespeople (plumbers, electricians, etc.) win back past customers with personalised one-tap WhatsApp messages.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · papaparse + xlsx · vitest.

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # works with no env vars
npm test         # vitest run
```

No env vars are needed. Everything works locally using `localStorage`.

## Features

1. **Contact upload** - drag-and-drop or tap-to-choose CSV/XLSX, or paste text (WhatsApp lines, Google Contacts CSV). Columns (name / phone / last job / last job date) are auto-detected by the pure function `lib/columns.ts`; the preview lets the user change the mapping and edit any cell. Phones are normalised to `+27` E.164 by `lib/phone.ts` (`082...`, `27...`, `+27`, spaces/dashes, `0027`; invalid numbers rejected). Contacts are de-duplicated by phone.
2. **Message generator** - three "we miss you / time for a service" templates with `{name}`, `{job}`, `{business}`, `{booking_link}`, editable, with a live WhatsApp-style preview.
3. **Free-tier send queue** - one-tap `wa.me` links: Open WhatsApp → "I sent it" → next. The free tier is capped at **10 messages total**, enforced in the queue (`lib/queue.ts`, `canSend`).
4. **POPIA** - "Reply STOP to opt out" is appended to every message if missing; opt-out list blocks numbers from the queue; per-contact consent flag (only consented contacts are queued; new uploads default to *not* consented until the user confirms).
5. **Paid tier page** (`/upgrade`) - R149/month, founder price R99 for the first 50. `POST /api/paystack` is a stub: returns "not configured" without `PAYSTACK_SECRET_KEY`, rejects any key not starting with `sk_test_`, and never calls Paystack.
6. **Bulk send add-ons** - `lib/providers/` defines a `MessageProvider` interface with stub WhatsApp Cloud API and SMS implementations. They are never active and never make network calls. `GET /api/send` reports status.
7. **Supabase auth + storage** - `lib/storage.ts` (localStorage) is the default; `lib/supabase.ts` adds email/password auth and cloud sync via the Supabase REST API when the env vars are set and the user is signed in, falling back to localStorage otherwise.

## Environment variables (see `.env.example`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional auth + cloud storage |
| `PAYSTACK_SECRET_KEY` | Test mode only (`sk_test_...`) |
| `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Bulk WhatsApp add-on (stub) |
| `SMS_API_KEY` | Bulk SMS add-on (stub) |

### Supabase table (only if you enable cloud sync)

```sql
create table winback_state (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table winback_state enable row level security;
create policy "own row" on winback_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

## Notes and limits

- The free-message counter lives in the browser (localStorage), so a determined user can clear it. A real enforcement would be server-side per account.
- Opt-outs are added manually (WhatsApp click-through has no inbound webhook). Inbound STOP handling needs the Cloud API add-on.
- `xlsx@0.18.5` from npm has known advisories (prototype pollution / ReDoS on untrusted files); here it only parses files the user picks in their own browser. Consider SheetJS's CDN build before opening this to untrusted uploads at scale.
- Nothing is deployed, no accounts are created, and no payments or messages are sent by this code.
