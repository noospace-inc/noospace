import { AuthenticateWithRedirectCallback } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sso-callback")({
  component: SsoCallbackPage,
});

function SsoCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-sm font-medium text-slate-600">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/"
        signInForceRedirectUrl="/"
        signInUrl="/login"
        signUpFallbackRedirectUrl="/"
        signUpForceRedirectUrl="/"
        signUpUrl="/login"
      />
      Completing sign in...
    </div>
  );
}
