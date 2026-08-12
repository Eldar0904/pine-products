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
