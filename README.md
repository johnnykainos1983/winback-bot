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
2. **Message generator** - three "we miss you / time for a service" templates with `{name}`, `{job}`, `{business}`, `{booking_link}` (case-insensitive; unknown `{tokens}` are flagged; each template has job-free wording for contacts with no job), editable, with a live WhatsApp-style preview.
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

### Supabase: server-side free limit and founder slots (optional)

`/api/usage` counts a free send per signed-in account when the `wa.me` link is opened. It calls the function below with the user's own JWT, so users can read but never write their counter. Without Supabase (or when signed out) the app falls back to the localStorage counter.

```sql
create table winback_usage (
  user_id uuid primary key references auth.users on delete cascade,
  sent_count int not null default 0,
  updated_at timestamptz default now()
);
alter table winback_usage enable row level security;
create policy "read own usage" on winback_usage for select using (user_id = auth.uid());

-- p_peek = true only reads the count. Otherwise increments atomically unless p_limit is already reached.
create or replace function winback_use_message(p_limit int, p_peek boolean default false)
returns table (allowed boolean, sent_count int)
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '28000'; end if;
  insert into winback_usage (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select u.sent_count into n from winback_usage u where u.user_id = auth.uid() for update;
  if p_peek or n >= p_limit then return query select n < p_limit, n; return; end if;
  update winback_usage u set sent_count = n + 1, updated_at = now() where u.user_id = auth.uid();
  return query select true, n + 1;
end $$;
revoke execute on function winback_use_message(int, boolean) from public, anon;
grant execute on function winback_use_message(int, boolean) to authenticated;
```

`/api/paystack` decides founder vs standard price server-side from a slot counter and ignores any `founder` flag sent by the browser. `GET /api/paystack` returns `founderRemaining`. With `NEXT_PUBLIC_SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` set it uses the table below; otherwise it uses an in-memory stub that resets on restart.

```sql
create table winback_founders (
  email text primary key,
  claimed_at timestamptz default now()
);
alter table winback_founders enable row level security; -- no policies: only the service role can touch it

create or replace function winback_claim_founder(p_email text, p_total int default 50)
returns table (out_founder boolean, out_taken int)
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform pg_advisory_xact_lock(7770001);
  select count(*) into n from winback_founders;
  if exists (select 1 from winback_founders f where f.email = lower(p_email)) then
    return query select true, n; return;
  end if;
  if n >= p_total then return query select false, n; return; end if;
  insert into winback_founders (email) values (lower(p_email));
  return query select true, n + 1;
end $$;
revoke execute on function winback_claim_founder(text, int) from public, anon, authenticated;
```

## Notes and limits

- Without Supabase the free-message counter lives in the browser (localStorage), so a determined user can clear it. With Supabase configured and a signed-in user it is enforced server-side per account (`/api/usage`). A send is counted when the `wa.me` link is opened. The `paid` plan flag is still client-side until real Paystack confirmation is wired in.
- Opt-outs are added manually (WhatsApp click-through has no inbound webhook). Inbound STOP handling needs the Cloud API add-on.
- `xlsx@0.18.5` from npm has known advisories (prototype pollution / ReDoS on untrusted files); here it only parses files the user picks in their own browser. Consider SheetJS's CDN build before opening this to untrusted uploads at scale.
- Nothing is deployed, no accounts are created, and no payments or messages are sent by this code.
