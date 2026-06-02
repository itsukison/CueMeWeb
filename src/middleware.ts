import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CueMe is retained only as a download funnel for its successor app, Flownote.
 * All sign-up, login, account, and payment flows now live inside Flownote, so
 * the legacy routes on this site must be unreachable — users were accidentally
 * creating accounts and paying here instead of in the app.
 *
 * This middleware blocks those routes at the edge so they cannot be reached
 * even by direct URL, regardless of what links exist in the UI.
 */

// Page routes that are redirected to the landing page.
const BLOCKED_PAGE_PREFIXES = [
  "/login",
  "/signup",
  "/dashboard",
  "/subscription",
  "/auth",
];

// Payment-related API routes (Stripe checkout, billing portal, plan changes).
// These are hard-blocked (410 Gone) rather than redirected so programmatic
// callers get a clear signal. Note: /api/webhooks/stripe is intentionally left
// alone so existing subscriptions can still be reconciled, and /api/usage is
// left alone in case the legacy desktop app still reports usage.
const BLOCKED_API_PREFIXES = ["/api/subscriptions"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, BLOCKED_API_PREFIXES)) {
    return NextResponse.json(
      {
        error:
          "This feature has moved. Sign-up and payments are now handled inside the Flownote app.",
      },
      { status: 410 }
    );
  }

  if (matchesPrefix(pathname, BLOCKED_PAGE_PREFIXES)) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login/:path*",
    "/signup/:path*",
    "/dashboard/:path*",
    "/subscription/:path*",
    "/auth/:path*",
    "/api/subscriptions/:path*",
  ],
};
