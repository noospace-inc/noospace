# Google sign-in setup

Noospace uses Google Identity Services directly. The browser sends Google's
signed ID token to the Noospace Worker. The Worker verifies the signature,
issuer, expiration, verified email, and audience against Google's published
signing keys, then sets an HttpOnly, same-site session cookie. No Clerk account,
Clerk API key, Google Client Secret, or separate authentication service is used.

## Google OAuth Client ID

1. In Google Cloud Console, create an OAuth 2.0 client with application type
   **Web application** and configure the OAuth consent screen.
2. Add these **Authorized JavaScript origins** to that client:
   - `http://localhost:8787` for local Wrangler development.
   - `http://127.0.0.1:8787` if you open the local app by IP address.
   - The production site origin, for example `https://noospace.in`.
   - Any other exact hostnames used by the site.
3. Copy the **Client ID** (the value ending in
   `.apps.googleusercontent.com`). This app uses the Google Identity Services
   credential button, so it does not need a Client Secret or redirect URI.
4. For local development, set `VITE_GOOGLE_CLIENT_ID` in `website/.env`.
   `website/.env.example` shows the variable name and format.
5. In Cloudflare Workers Builds, add the same value as the
   `VITE_GOOGLE_CLIENT_ID` build variable for both production and preview
   builds. It is a public client identifier, not a secret.

The app validates every Google ID token on the server using Google's public
JWK signing keys. The Google subject (`sub`) is used as the stable identity.
The browser never receives or stores the session cookie; it is HttpOnly and is
sent automatically for same-origin requests. The cookie expires with the Google
ID token, after which the user signs in again.

The workspace API still requires the existing Cloudflare D1 binding named
`DATABASE`. Google sign-in authenticates users; it does not replace or configure
the database.

## Cloudflare Workers Builds

This app is in the repository's `website/` directory. In **Workers & Pages →
noospace → Settings → Builds**, set the root directory to `/website`, the build
command to `npm run build`, and the production deploy command to
`npx wrangler deploy`. Configure the Google Client ID as a build variable for
both production and preview builds. The D1 binding must point to the existing
production database; do not use the local placeholder ID from
`wrangler.local.toml`.
