# PINE Product Hub

Internal portfolio and operating hub for PINE’s automation products.

## Local development

```powershell
npm.cmd install --cache .npm-cache
.\node_modules\.bin\vite.cmd
```

The current interface stores Solution edits in the browser until Supabase is connected.

## Connect Supabase

1. Wait until the Supabase project status is **Active**.
2. In **SQL Editor**, create a new query and run [`supabase/migrations/20260730_initial_product_hub.sql`](supabase/migrations/20260730_initial_product_hub.sql).
3. In **Connect > App Frameworks**, copy the project URL and publishable key into a local `.env` file based on `.env.example`.
4. Enable your preferred sign-in method under **Authentication > Providers**.
5. Create the first user, then add their Auth user UUID to `public.user_roles` as `admin` using the commented command at the bottom of the migration.

Never put a service-role key in the browser app or commit real `.env` values.

## Goszakup output tracking

Product Hub reads successful commercial-proposal, technical-specification, and
Goszakup parser output counts through a server-to-server integration. Configure:

- `PINEGROUP_GZ_API_URL` — the public PineGroup GZ service URL
- `PRODUCT_HUB_USAGE_TOKEN` — a long random secret shared with PineGroup GZ

The token stays server-side; the browser receives only aggregate lifetime and
current-month output counts. Product Hub shows no demo fallback when the feed is
unavailable.

## Instrument usage events

Instrument pages can report a successful generated document (or another tracked
function) to `POST /api/usage/events` using the server-only shared token:

```json
{
  "solutionId": "offer-generator",
  "event": "document.generated",
  "quantity": 1,
  "source": "commercial-offer-generator",
  "idempotencyKey": "offer-123"
}
```

Send `Authorization: Bearer $PRODUCT_HUB_USAGE_TOKEN`. Events are stored in
Supabase using `PINE_USAGE_SUPABASE_SERVICE_ROLE_KEY`; the browser only reads
aggregated lifetime and current-month totals from `GET /api/usage`. Run
`supabase/migrations/20260827_usage_events.sql` before enabling persistence.

## Deploy to Vercel

Import `Eldar0904/pine-products` into Vercel, choose the `main` branch and
repository root. The checked-in `vercel.json` selects Vite, `npm run build`,
and the `dist` output folder. API files deploy as Node functions.

Configure these environment variables in Vercel before deploying:

- `VITE_APP_MODE=production` to enable the existing sign-in requirement.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for browser authentication.
- `PINE_USAGE_SUPABASE_SERVICE_ROLE_KEY` and `PRODUCT_HUB_USAGE_TOKEN` for usage events (server only).
- Optional: `PINEGROUP_GZ_API_URL` for the legacy external usage feed when the usage database is not configured.

Apply the Supabase migrations and assign an admin user before enabling production
sign-in. Never put server secrets in variables prefixed with `VITE_`.
After deployment, verify `/api/usage` returns JSON and unauthenticated POSTs to
`/api/usage/events` return 401. Pushes to the linked branch will deploy automatically.
