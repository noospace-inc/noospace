import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useAuth, useUser } from "@clerk/tanstack-react-start";
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
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
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
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const app = clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>
  ) : (
    children
  );

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {app}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname.startsWith("/auth") || pathname === "/login" || pathname === "/sso-callback";

  return (
    <QueryClientProvider client={queryClient}>
      {bare ? <Outlet /> : clerkPublishableKey ? <AuthenticatedApp><Outlet /></AuthenticatedApp> : (
        <StoreProvider><AppShell><Outlet /></AppShell></StoreProvider>
      )}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function AuthenticatedApp({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) void navigate({ to: "/login", replace: true });
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded || !isSignedIn) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking your session…</div>;
  }

  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email || !user) {
    return <div className="grid min-h-screen place-items-center px-6 text-center text-sm text-muted-foreground">Your account needs a verified email address to access Noospace.</div>;
  }

  const identity = {
    id: user.id,
    email,
    name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || email,
  };

  return <StoreProvider identity={identity}><AppShell>{children}</AppShell></StoreProvider>;
}
