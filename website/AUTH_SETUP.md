# Sign in and Google OAuth setup

The login page uses Clerk for email/password accounts, email verification, MFA
challenges, Google OAuth, session management, and protected application access.
Google sign-in uses Clerk's OAuth callback at `/sso-callback`.

## Application keys

Copy `.env.example` to `.env` for local development and set both Clerk keys. Vite
does not read `.env.example` directly:

- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key, used by the browser.
- `CLERK_SECRET_KEY` — Clerk secret key, used only by the server for session
  verification and Clerk middleware.

For Cloudflare deployments, add `CLERK_SECRET_KEY` with
`npx wrangler secret put CLERK_SECRET_KEY` and configure
`VITE_CLERK_PUBLISHABLE_KEY` as a build environment variable. Never commit `.env`
or put the Clerk secret key in a `VITE_` variable.

## Local database and sign-in

Run `npm run dev` to apply the workspace migration, build the Cloudflare Worker,
and start it with Wrangler's persistent local D1 database. The local database is
stored under `.wrangler/state` and survives restarts. Use `npm run dev:vite` for
UI-only Vite hot reload; that Node-based preview does not provide a D1 binding.

The publishable and secret keys in `.env` must come from the same Clerk
instance and environment (both development or both production). The current
publishable key's Frontend API host matches the domain returned for the current
secret key. If the browser still reports an infinite session refresh redirect,
clear site data for `localhost` to remove sessions from the earlier Vite server,
then reopen the Wrangler URL. If it continues, copy both keys together from
**Clerk Dashboard → API keys**. Google OAuth client credentials remain in the
Clerk Google connection settings.

## Google OAuth credentials

The Google OAuth Client ID and Client Secret belong in the Clerk Dashboard, not
in this repository:

1. Open **Configure → SSO connections** in the Clerk Dashboard.
2. Add **Google** for all users, enable sign-up and sign-in, and select **Use
   custom credentials** for a production Clerk instance.
3. Paste the Google Client ID and Client Secret into Clerk's Google connection.
   Copy the redirect URI Clerk provides into the Google OAuth client settings.
4. Enable the connection. The app already requests Clerk's `oauth_google`
   strategy and completes the callback at `/sso-callback`.

Development Clerk instances can use Clerk's shared Google credentials. For
production, both the Google Client ID and Client Secret are needed. They are not
the same as the Clerk publishable and secret keys above.

Users who sign in with an email that already exists in the workspace are mapped
to that workspace profile. New authenticated users are added with the Staff
role. The workspace API requires a valid Clerk session before returning or
writing data.
