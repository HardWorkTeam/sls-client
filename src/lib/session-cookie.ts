/**
 * Cross-origin "signed-in" marker for the marketing site (sls-web).
 *
 * The auth token lives in origin-scoped localStorage, so the landing page —
 * which runs on a different origin (e.g. srolanh.com vs app.srolanh.com) —
 * cannot see it. Instead, on sign-in we drop a small, NON-SENSITIVE cookie on
 * the shared parent domain holding only the couple's display name. Cookies
 * ignore the port, so this is shared across localhost:3001 ↔ localhost:3103 in
 * dev, and across subdomains in prod when scoped to the parent domain.
 * Separate *.vercel.app URLs cannot share a parent cookie — the marketing site
 * falls back to GET /api/session-marker on the portal instead (see sls-web).
 *
 * Never put the token or anything sensitive here — this cookie is readable by
 * client-side JS on every page of the shared domain by design.
 */
export const SESSION_COOKIE_NAME = "sls_session";

// In prod set this to the shared parent domain (e.g. ".srolanh.com") in both
// apps' env. Leave empty in dev so the cookie stays a host cookie on
// "localhost", which is shared across ports.
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();

// UI hint only; refreshed on every auth update. If it outlives the real
// session, the worst case is the landing page shows "Dashboard" and the portal
// bounces the user to log in — harmless.
const MAX_AGE_SECONDS = 60 * 60 * 24;

/** Shared attributes so the browser matches on write AND delete. */
function attributes(): string {
  let attrs = "Path=/";
  if (COOKIE_DOMAIN) attrs += `; Domain=${COOKIE_DOMAIN}`;
  if (typeof location !== "undefined" && location.protocol === "https:") {
    // None+Secure lets sls-web on a sibling *.vercel.app host read session via
    // credentialed fetch to /api/session-marker. Lax would not send the cookie
    // on that cross-site request.
    attrs += "; Secure; SameSite=None";
  } else {
    attrs += "; SameSite=Lax";
  }
  return attrs;
}

export function writeSessionCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(name)}; Max-Age=${MAX_AGE_SECONDS}; ${attributes()}`;
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; Max-Age=0; ${attributes()}`;
}
