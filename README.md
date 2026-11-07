# FF ARENA — Free Fire tournament website starter

A fire-themed Next.js + Supabase starter with player accounts, published tournament listings, registration, and database policies designed to keep room credentials hidden until a registration is approved.

## What works in this starter
- Responsive orange/black esports interface.
- Email/password sign-up and login via Supabase Auth.
- Published tournament list from Supabase.
- Player registration and a basic personal registration list.
- Host dashboard at `/admin` for publishing tournaments, approving/rejecting registrations, and saving room credentials.
- Supabase Row Level Security (RLS) policies for player/admin separation.
- Separate `tournament_rooms` table: room details are readable only by approved players or admins.

## Setup
1. Install Node.js 20+.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon/public key.
5. Run `npm install` then `npm run dev`.
6. Open http://localhost:3000.
7. Create your host account, then find its UUID in Supabase Authentication > Users. Run the admin promotion SQL at the bottom of `supabase/schema.sql` with that UUID.
8. Create tournaments in Supabase Table Editor (`tournaments`) and set `is_published` to true. Add room credentials to `tournament_rooms` only when ready.

## Before public launch — required work
This is a working starter, not a fully audited production payment platform. The registration form currently records registrations. The admin dashboard can publish tournaments, approve/reject entries, and save room credentials. It does not yet charge money, display a payment QR, collect payment references, or show room credentials on the player page. Those are the next build stages.

- Build a server-side admin dashboard and payment-review workflow.
- Add server-validated payment gateway webhooks if using online payment collection. Never treat a screenshot as proof of payment.
- Do not expose Supabase service-role keys in browser code.
- Add rate limiting, email verification, password reset, audit logs, backups, and deployment security checks.
- Test RLS with separate player and admin accounts before publishing.
- Have an adult/guardian handle any paid-entry/prize arrangements and check local law, payment-provider terms, and Garena tournament rules before enabling real-money transactions.

## Security note
Room IDs and passwords must live only in `tournament_rooms`, never in the public `tournaments` table or page source. The included RLS policy checks for an approved registration before allowing a player to read a room record. The admin role must only be assigned by the project owner in Supabase, never from a public sign-up form.
