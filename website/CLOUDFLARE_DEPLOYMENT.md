# Cloudflare Workers deployment

The app and its npm lockfile are in this directory. Configure the Cloudflare
Workers Build for the `noospace` Worker with these settings:

| Setting | Value |
| --- | --- |
| Root directory | `/website` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

The build command runs Vite/Nitro and creates the Cloudflare Worker output and
assets; the deploy command publishes that generated Worker. Do not use
`npx wrangler versions upload` as the production deploy command. The website
directory's `packageManager` field selects npm 10.9.2, matching its
`package-lock.json`. For a manual deploy from `website/`, `npm run deploy`
runs both steps in sequence.

After changing these settings, retry the failed build. This repository cannot
change the root directory or commands saved in the Cloudflare dashboard.

## Runtime configuration

- Set `VITE_CLERK_PUBLISHABLE_KEY` as a Workers Build variable so it is present
  when Vite builds the browser bundle.
- Add `CLERK_SECRET_KEY` as a Worker secret in Cloudflare. Do not put it in a
  build variable or commit it to Git.
- Bind the production D1 database named `noospace-workspace` to the Worker using
  the binding name `DATABASE`. Create the database and apply
  `migrations/0001_workspace_state.sql` once with Wrangler before relying on
  persistence. See [DATABASE.md](./DATABASE.md) and [AUTH_SETUP.md](./AUTH_SETUP.md).

The production D1 database ID is account-specific and is intentionally not
stored in this repository. The local-only D1 placeholder in
`wrangler.local.toml` must not be used for production.
