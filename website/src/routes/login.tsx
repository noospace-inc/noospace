import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

const googleClientId = import.meta.env["VITE_GOOGLE_CLIENT_ID"];

type GoogleCredentialResponse = { credential?: string };
type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (element: HTMLElement, options: {
        theme?: "outline" | "filled_blue" | "filled_black";
        size?: "large" | "medium" | "small";
        text?: "signin_with" | "signup_with" | "continue_with" | "signin";
        shape?: "rectangular" | "pill" | "circle" | "square";
        width?: number;
        logo_alignment?: "left" | "center";
      }) => void;
    };
  };
};

declare global {
  interface Window { google?: GoogleIdentityServices }
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Noospace" },
      { name: "description", content: "Sign in to Noospace with your Google account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleCredential = useCallback(async (credential: string) => {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const result = await response.json().catch(() => null) as { error?: string; diagnostic?: string } | null;
      if (!response.ok) {
        if (result?.diagnostic) console.error("Google sign-in server diagnostic", result.diagnostic);
        if (result?.diagnostic) setError(`${result.error ?? "Google sign-in failed."} Server detail: ${result.diagnostic}`);
        throw new Error(result?.error ?? "Google sign-in failed. Please try again.");
      }
      await navigate({ to: "/", replace: true });
    } catch (cause) {
      console.error("Google sign-in failed", cause);
      setError(cause instanceof Error ? cause.message : "Google sign-in failed. Please try again.");
      setPending(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!googleClientId) return;
    let active = true;
    const renderGoogleButton = () => {
      if (!active || !window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          if (credential) void handleCredential(credential);
          else setError("Google did not return a sign-in credential. Please try again.");
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      buttonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: Math.min(window.innerWidth - 72, 320),
        logo_alignment: "left",
      });
    };

    const scriptUrl = "https://accounts.google.com/gsi/client";
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    if (window.google) {
      renderGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton);
      existingScript.addEventListener("error", onScriptError);
    } else {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderGoogleButton);
      script.addEventListener("error", onScriptError);
      document.head.appendChild(script);
    }

    function onScriptError() {
      setError("Google sign-in could not load. Check your connection and try again.");
    }

    return () => {
      active = false;
      existingScript?.removeEventListener("load", renderGoogleButton);
      existingScript?.removeEventListener("error", onScriptError);
    };
  }, [handleCredential]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then((response) => response.json() as Promise<{ identity: unknown | null }>)
      .then(({ identity }) => {
        if (active && identity) void navigate({ to: "/", replace: true });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-violet-50 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
        <div className="mx-auto size-14 overflow-hidden rounded-2xl bg-primary">
          <img src="/favicon.png" alt="Noospace logo" className="size-full object-cover" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Welcome to Noospace</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in securely with your Google account.</p>

        {!googleClientId ? (
          <p className="mt-8 rounded-2xl bg-amber-50 p-4 text-left text-sm text-amber-900">
            Google sign-in is not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in your local environment and Cloudflare build variables.
          </p>
        ) : (
          <div className="mt-8 flex min-h-11 justify-center" aria-busy={pending}>
            <div ref={buttonRef} className={pending ? "pointer-events-none opacity-60" : ""} />
          </div>
        )}

        {pending && <p className="mt-4 text-sm text-slate-500">Signing in…</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <p className="mt-8 text-xs leading-relaxed text-slate-400">Your Google sign-in is verified securely by Noospace. Your password is never shared with this app.</p>
      </section>
    </main>
  );
}
