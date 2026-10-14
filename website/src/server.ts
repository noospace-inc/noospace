import "./lib/error-capture";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { auditLog, calendarNotes, cashbookEntries, projects, punctualityTrend, users } from "./lib/mock-data";

type WorkspaceSnapshot = {
  users: typeof users;
  projects: typeof projects;
  notes: typeof calendarNotes;
  audit: typeof auditLog;
  cash: typeof cashbookEntries;
  cashbookClearedAt?: string;
  trend: typeof punctualityTrend;
  revokedIdentities: { id: string; email: string }[];
};

type DatabaseEnv = {
  DATABASE?: { prepare: (query: string) => any };
  GOOGLE_CLIENT_ID?: string;
};

function resolveDatabaseEnv(request: Request, runtimeEnv?: DatabaseEnv): DatabaseEnv {
  const requestEnv = (request as Request & { runtime?: { cloudflare?: { env?: DatabaseEnv } } }).runtime?.cloudflare?.env;
  const isolateEnv = (globalThis as typeof globalThis & { __env__?: DatabaseEnv }).__env__;
  return {
    GOOGLE_CLIENT_ID: runtimeEnv?.GOOGLE_CLIENT_ID ?? requestEnv?.GOOGLE_CLIENT_ID ?? isolateEnv?.GOOGLE_CLIENT_ID,
    DATABASE: runtimeEnv?.DATABASE ?? requestEnv?.DATABASE ?? isolateEnv?.DATABASE,
  };
}

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const sessionCookieName = "noospace_google_session";

type GoogleIdentity = { id: string; email: string; name: string };

function clientId(env: DatabaseEnv) {
  return env.GOOGLE_CLIENT_ID ?? import.meta.env["VITE_GOOGLE_CLIENT_ID"] ?? process.env["VITE_GOOGLE_CLIENT_ID"];
}

function cookieValue(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function verifyGoogleToken(token: string, audience: string): Promise<{ identity: GoogleIdentity; payload: JWTPayload }> {
  const { payload } = await jwtVerify(token, googleKeys, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience,
    algorithms: ["RS256"],
  });
  if (typeof payload.sub !== "string" || typeof payload["email"] !== "string" || payload["email_verified"] !== true) {
    throw new Error("Google account must have a verified email address.");
  }
  return {
    identity: {
      id: payload.sub,
      email: payload["email"],
      name: typeof payload["name"] === "string" && payload["name"] ? payload["name"] : payload["email"],
    },
    payload,
  };
}

async function isRevokedIdentity(env: DatabaseEnv, identity: GoogleIdentity) {
  if (!env.DATABASE) return false;
  const row = await env.DATABASE.prepare("SELECT data FROM workspace_state WHERE id = ?").bind("default").first() as { data: string } | null;
  if (!row) return false;
  const snapshot = JSON.parse(row.data) as { revokedIdentities?: { id?: unknown; email?: unknown }[] };
  return Array.isArray(snapshot.revokedIdentities) && snapshot.revokedIdentities.some((entry) =>
    entry.id === `google_${identity.id}` || (typeof entry.email === "string" && entry.email.toLowerCase() === identity.email.toLowerCase()),
  );
}

async function ensureWorkspaceUser(env: DatabaseEnv, identity: GoogleIdentity) {
  if (!env.DATABASE) throw new Error("Workspace database is not configured.");

  const initial: WorkspaceSnapshot = {
    users,
    projects,
    notes: calendarNotes,
    audit: auditLog,
    cash: cashbookEntries,
    trend: punctualityTrend,
    revokedIdentities: [],
  };
  await env.DATABASE.prepare(
    "INSERT INTO workspace_state (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING",
  ).bind("default", JSON.stringify(initial)).run();

  const user = {
    id: `google_${identity.id}`,
    name: identity.name || identity.email,
    email: identity.email,
    role: "staff",
    title: "Team member",
    github: "",
    bio: "",
    accent: "blue",
    punctuality: 100,
    links: [],
    profileVisibility: "public",
  };
  // Use a compare-and-swap update so login never overwrites workspace changes
  // made by another request while we are adding the account.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const row = await env.DATABASE.prepare("SELECT data FROM workspace_state WHERE id = ?")
      .bind("default").first() as { data: string } | null;
    if (!row) throw new Error("Workspace state could not be initialized.");

    const snapshot = JSON.parse(row.data) as WorkspaceSnapshot;
    const savedUsers = Array.isArray(snapshot.users) ? snapshot.users : [];
    if (savedUsers.some((savedUser) => savedUser && typeof savedUser === "object" && (savedUser.id === user.id || (typeof savedUser.email === "string" && savedUser.email.toLowerCase() === identity.email.toLowerCase())))) return;

    const next = { ...snapshot, users: [...savedUsers, user] };
    const result = await env.DATABASE.prepare(
      "UPDATE workspace_state SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND data = ?",
    ).bind(JSON.stringify(next), "default", row.data).run();
    if (result.meta?.changes === 1) return;
  }
  throw new Error("Workspace changed repeatedly while saving the new account.");
}

function canIdentityViewNote(
  note: { isPrivate?: boolean; createdBy?: string; projectId?: string },
  identity: GoogleIdentity,
  snapshot: { users?: { id: string; email: string; role: string }[]; projects?: { id: string; leaderId: string; memberIds: string[] }[] },
) {
  if (!note.isPrivate) return true;
  const currentUser = snapshot.users?.find((user) => user.id === `google_${identity.id}` || user.email.toLowerCase() === identity.email.toLowerCase());
  if (!currentUser) return false;
  if (currentUser.role === "admin" || note.createdBy === currentUser.id) return true;
  const project = snapshot.projects?.find((item) => item.id === note.projectId);
  return Boolean(project && (project.leaderId === currentUser.id || project.memberIds.includes(currentUser.id)));
}

function sessionCookie(request: Request, token: string, maxAge: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

async function handleAuthApi(request: Request, env: DatabaseEnv) {
  const pathname = new URL(request.url).pathname;

  // Signing out must remain available even if a build is missing its Google
  // client ID; logout only needs to expire the app's session cookie.
  if (request.method === "POST" && pathname === "/api/auth/logout") {
    if (!sameOrigin(request)) return Response.json({ error: "Cross-origin sign-out is not allowed." }, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": sessionCookie(request, "", 0), "Cache-Control": "no-store" },
    });
  }

  const clientIdValue = clientId(env);
  if (!clientIdValue) return Response.json({ error: "Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID." }, { status: 503 });

  if (request.method === "POST" && pathname === "/api/auth/google") {
    if (!sameOrigin(request)) return Response.json({ error: "Cross-origin sign-in is not allowed." }, { status: 403 });
    const body = await request.json().catch(() => null) as { credential?: unknown } | null;
    if (!body || typeof body.credential !== "string" || body.credential.length > 8192) {
      return Response.json({ error: "Google did not return a valid sign-in credential." }, { status: 400 });
    }
    try {
      const { identity, payload } = await verifyGoogleToken(body.credential, clientIdValue);
      if (await isRevokedIdentity(env, identity)) return Response.json({ error: "This account has been removed from the workspace. Contact an admin." }, { status: 403 });
      try {
        await ensureWorkspaceUser(env, identity);
      } catch (error) {
        console.error("Unable to create workspace user after Google sign-in", error);
        const diagnostic = error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 240) : "Unknown server error";
        return Response.json({ error: "Google sign-in succeeded, but the workspace account could not be saved. Please try again.", diagnostic }, { status: 503 });
      }
      const maxAge = Math.max(0, Math.min((payload.exp ?? 0) - Math.floor(Date.now() / 1000), 3600));
      if (!maxAge) return Response.json({ error: "Google sign-in expired. Please try again." }, { status: 401 });
      return Response.json({ identity }, {
        headers: {
          "Set-Cookie": sessionCookie(request, body.credential, maxAge),
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      console.warn("Google credential verification failed", error instanceof Error ? error.message : error);
      return Response.json({ error: "Google sign-in could not be verified. Please try again." }, { status: 401 });
    }
  }

  if (request.method === "GET" && pathname === "/api/auth/session") {
    const token = cookieValue(request, sessionCookieName);
    if (!token) return Response.json({ identity: null }, { headers: { "Cache-Control": "no-store" } });
    let identity: GoogleIdentity;
    try {
      ({ identity } = await verifyGoogleToken(token, clientIdValue));
      if (await isRevokedIdentity(env, identity)) throw new Error("Account removed");
    } catch {
      return Response.json({ identity: null }, {
        headers: {
          "Set-Cookie": sessionCookie(request, "", 0),
          "Cache-Control": "no-store",
        },
      });
    }
    try {
      await ensureWorkspaceUser(env, identity);
    } catch (error) {
      console.error("Unable to ensure workspace user during session restore", error);
      return Response.json({ error: "The workspace account could not be saved. Please try again." }, { status: 503 });
    }
    return Response.json({ identity }, { headers: { "Cache-Control": "no-store" } });
  }

  return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
}

async function handleWorkspaceApi(request: Request, runtimeEnv?: DatabaseEnv): Promise<Response> {
  const env = resolveDatabaseEnv(request, runtimeEnv);
  const origin = request.headers.get("origin");
  if (request.method === "PUT" && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Cross-origin workspace updates are not allowed." }, { status: 403 });
  }
  const token = cookieValue(request, sessionCookieName);
  const googleClientId = clientId(env);
  if (!googleClientId) return Response.json({ error: "Google sign-in is not configured." }, { status: 503 });
  if (!token) return Response.json({ error: "Sign in is required to access workspace data." }, { status: 401 });
  let identity: GoogleIdentity;
  try {
    ({ identity } = await verifyGoogleToken(token, googleClientId));
    if (await isRevokedIdentity(env, identity)) return Response.json({ error: "This account has been removed from the workspace. Contact an admin." }, { status: 403 });
  } catch {
    return Response.json({ error: "Your session is invalid or expired. Please sign in again." }, { status: 401 });
  }
  if (!env.DATABASE) return Response.json({ error: "Database is not configured. Bind a Cloudflare D1 database named DATABASE." }, { status: 503 });
  if (request.method === "GET") {
    const row = await env.DATABASE.prepare("SELECT data FROM workspace_state WHERE id = ?").bind("default").first() as { data: string } | null;
    const initial: WorkspaceSnapshot = { users, projects, notes: calendarNotes, audit: auditLog, cash: cashbookEntries, trend: punctualityTrend, revokedIdentities: [] };
    if (row) {
      const saved = JSON.parse(row.data) as Partial<WorkspaceSnapshot>;
      const snapshot: WorkspaceSnapshot = {
        users: Array.isArray(saved.users) ? saved.users : initial.users,
        projects: Array.isArray(saved.projects) ? saved.projects : initial.projects,
        notes: Array.isArray(saved.notes) ? saved.notes : initial.notes,
        audit: Array.isArray(saved.audit) ? saved.audit : initial.audit,
        cash: Array.isArray(saved.cash) ? saved.cash : initial.cash,
        trend: Array.isArray(saved.trend) ? saved.trend : initial.trend,
        revokedIdentities: Array.isArray(saved.revokedIdentities) ? saved.revokedIdentities : initial.revokedIdentities,
      };
      if (Object.keys(initial).some((key) => !Array.isArray(saved[key as keyof WorkspaceSnapshot]))) {
        await env.DATABASE.prepare("UPDATE workspace_state SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(JSON.stringify(snapshot), "default").run();
      }
      return Response.json({ ...snapshot, notes: snapshot.notes.filter((note) => canIdentityViewNote(note, identity, snapshot)) });
    }
    await env.DATABASE.prepare("INSERT INTO workspace_state (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO NOTHING")
      .bind("default", JSON.stringify(initial)).run();
    return Response.json(initial);
  }
  if (request.method === "PUT") {
    const snapshot = await request.json() as WorkspaceSnapshot;
    if (!snapshot || !Array.isArray(snapshot.users) || !Array.isArray(snapshot.projects) || !Array.isArray(snapshot.notes) || !Array.isArray(snapshot.audit) || !Array.isArray(snapshot.cash) || !Array.isArray(snapshot.trend)) {
      return Response.json({ error: "Invalid workspace data" }, { status: 400 });
    }
    const existingRow = await env.DATABASE.prepare("SELECT data FROM workspace_state WHERE id = ?").bind("default").first() as { data: string } | null;
    const existing = existingRow ? JSON.parse(existingRow.data) as Partial<WorkspaceSnapshot> : {};
    const cashbookClearedAt = typeof existing.cashbookClearedAt === "string" ? existing.cashbookClearedAt : null;
    const cash = cashbookClearedAt
      ? snapshot.cash.filter((entry) => {
          const createdAt = Date.parse(entry.createdAt);
          return Number.isFinite(createdAt) && createdAt > Date.parse(cashbookClearedAt);
        })
      : snapshot.cash;
    const existingUsers = existing.users ?? [];
    const actor = existingUsers.find((user) => user.id === `google_${identity.id}` || user.email.toLowerCase() === identity.email.toLowerCase())
      ?? { id: `google_${identity.id}`, email: identity.email, role: "staff" as const };
    const trustedAccess = { ...existing, users: existingUsers.length ? existingUsers : snapshot.users, projects: existing.projects ?? snapshot.projects };
    const visibleSubmittedNotes = snapshot.notes.filter((note) => !note.isPrivate || canIdentityViewNote(note, identity, { ...trustedAccess, users: [...trustedAccess.users!.filter((user) => user.id !== actor.id), actor] }));
    const hiddenExistingNotes = (existing.notes ?? []).filter((note) => note.isPrivate && !canIdentityViewNote(note, identity, trustedAccess));
    const submittedIds = new Set(visibleSubmittedNotes.map((note) => note.id));
    const nextSnapshot = {
      ...snapshot,
      cash,
      ...(cashbookClearedAt ? { cashbookClearedAt } : {}),
      notes: [...visibleSubmittedNotes, ...hiddenExistingNotes.filter((note) => !submittedIds.has(note.id))],
      revokedIdentities: Array.isArray(snapshot.revokedIdentities) ? snapshot.revokedIdentities : existing.revokedIdentities ?? [],
    };
    await env.DATABASE.prepare("INSERT INTO workspace_state (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP")
      .bind("default", JSON.stringify(nextSnapshot)).run();
    return new Response(null, { status: 204 });
  }
  return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, PUT" } });
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/auth/")) return await handleAuthApi(request, resolveDatabaseEnv(request, env as DatabaseEnv | undefined));
      if (url.pathname === "/api/workspace") return await handleWorkspaceApi(request, env as DatabaseEnv | undefined);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
