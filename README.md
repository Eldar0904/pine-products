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
