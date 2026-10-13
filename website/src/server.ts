import "./lib/error-capture";
import { verifyToken } from "@clerk/backend";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { auditLog, calendarNotes, cashbookEntries, projects, punctualityTrend, users } from "./lib/mock-data";

type WorkspaceSnapshot = {
  users: typeof users;
  projects: typeof projects;
  notes: typeof calendarNotes;
  audit: typeof auditLog;
  cash: typeof cashbookEntries;
  trend: typeof punctualityTrend;
};

type DatabaseEnv = {
  DATABASE?: { prepare: (query: string) => any };
  CLERK_SECRET_KEY?: string;
};

function sessionToken(request: Request) {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7);
  return request.headers.get("cookie")?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("__session="))
    ?.slice("__session=".length);
}

async function handleWorkspaceApi(request: Request, runtimeEnv?: DatabaseEnv): Promise<Response> {
  // Nitro's SSR service may call this entry with only the Request argument.
  // Its Cloudflare adapter still attaches bindings to the request and isolate.
  const requestEnv = (request as Request & { runtime?: { cloudflare?: { env?: DatabaseEnv } } }).runtime?.cloudflare?.env;
  const isolateEnv = (globalThis as typeof globalThis & { __env__?: DatabaseEnv }).__env__;
  const env = runtimeEnv ?? requestEnv ?? isolateEnv ?? {};
  const origin = request.headers.get("origin");
  if (request.method === "PUT" && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Cross-origin workspace updates are not allowed." }, { status: 403 });
  }
  const secretKey = env.CLERK_SECRET_KEY ?? process.env.CLERK_SECRET_KEY;
  if (!secretKey) return Response.json({ error: "Authentication is not configured on the server." }, { status: 503 });
  const token = sessionToken(request);
  if (!token) return Response.json({ error: "Sign in is required to access workspace data." }, { status: 401 });
  try {
    await verifyToken(token, { secretKey, authorizedParties: [new URL(request.url).origin] });
  } catch {
    return Response.json({ error: "Your session is invalid or expired. Please sign in again." }, { status: 401 });
  }
  if (!env.DATABASE) return Response.json({ error: "Database is not configured. Bind a Cloudflare D1 database named DATABASE." }, { status: 503 });
  if (request.method === "GET") {
    const row = await env.DATABASE.prepare("SELECT data FROM workspace_state WHERE id = ?").bind("default").first() as { data: string } | null;
    const initial: WorkspaceSnapshot = { users, projects, notes: calendarNotes, audit: auditLog, cash: cashbookEntries, trend: punctualityTrend };
    if (row) {
      const saved = JSON.parse(row.data) as Partial<WorkspaceSnapshot>;
      const snapshot: WorkspaceSnapshot = {
        users: Array.isArray(saved.users) ? saved.users : initial.users,
        projects: Array.isArray(saved.projects) ? saved.projects : initial.projects,
        notes: Array.isArray(saved.notes) ? saved.notes : initial.notes,
        audit: Array.isArray(saved.audit) ? saved.audit : initial.audit,
        cash: Array.isArray(saved.cash) ? saved.cash : initial.cash,
        trend: Array.isArray(saved.trend) ? saved.trend : initial.trend,
      };
      if (Object.keys(initial).some((key) => !Array.isArray(saved[key as keyof WorkspaceSnapshot]))) {
        await env.DATABASE.prepare("UPDATE workspace_state SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(JSON.stringify(snapshot), "default").run();
      }
      return Response.json(snapshot);
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
    await env.DATABASE.prepare("INSERT INTO workspace_state (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP")
      .bind("default", JSON.stringify(snapshot)).run();
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
