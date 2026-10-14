import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

type AuthenticatedIdentity = { id: string; email: string; name: string; picture?: string };

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Noospace — Project Management Platform" },
      {
        name: "description",
        content: "Plan projects, track schedules, approve tasks and follow punctuality scores in one workspace.",
      },
      { property: "og:title", content: "Noospace — Project Management Platform" },
      {
        property: "og:description",
        content: "Plan projects, track schedules, approve tasks and follow punctuality scores in one workspace.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://noospace.noospace-info.workers.dev/favicon.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://noospace.noospace-info.workers.dev/favicon.svg" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      {bare ? <Outlet /> : <AuthenticatedApp><Outlet /></AuthenticatedApp>}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function AuthenticatedApp({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<AuthenticatedIdentity | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to check your Google session.");
        return response.json() as Promise<{ identity: AuthenticatedIdentity | null }>;
      })
      .then((session) => { if (active) setIdentity(session.identity); })
      .catch((error: unknown) => {
        console.error("Google session check failed", error);
        if (active) setIdentity(null);
      })
      .finally(() => { if (active) setSessionLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (sessionLoaded && !identity) void navigate({ to: "/login", replace: true });
  }, [identity, navigate, sessionLoaded]);

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "Unable to sign out. Please try again.");
      }
      setIdentity(null);
      await navigate({ to: "/login", replace: true });
    } catch (error) {
      console.error("Google sign-out failed", error);
      toast.error(error instanceof Error ? error.message : "Unable to sign out. Please try again.");
    }
  };

  if (!sessionLoaded || !identity) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking your Google session…</div>;
  }

  return <StoreProvider identity={identity}><AppShell onSignOut={signOut}>{children}</AppShell></StoreProvider>;
}
