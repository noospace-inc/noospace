# Workspace database setup

The website stores its shared workspace snapshot in Cloudflare D1. The first
successful read copies the current `mock-data.ts` records into the database;
after that, reads use the stored snapshot and all store updates are written back.

1. From `website/`, create the production database with
   `npx wrangler d1 create noospace-workspace`.
2. Add the returned database ID to `wrangler.toml` as a `[[d1_databases]]`
   binding named `DATABASE`.
3. Apply the schema with
   `npx wrangler d1 migrations apply noospace-workspace --remote`.
4. Deploy the site. Local development uses the separate
   `wrangler.local.toml` database; `npm run dev` applies its migration, builds,
   and starts Wrangler with persistent local D1 storage.

Without the binding, the API returns a clear configuration error and the website
shows that error instead of silently pretending changes were saved.
