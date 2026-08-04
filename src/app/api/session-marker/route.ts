import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";
import {
  sessionMarkerJson,
  sessionMarkerPreflight,
} from "@/lib/session-marker-cors";
import { cookies } from "next/headers";

/**
 * Lets the marketing site (sls-web) detect a signed-in couple when the apps
 * live on sibling *.vercel.app hosts that cannot share a parent-domain cookie.
 * The portal's sls_session marker is host-only; this route reads it server-side
 * and returns it over CORS with credentials.
 */
export async function OPTIONS(request: Request) {
  return sessionMarkerPreflight(request.headers.get("origin"));
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const entry = (await cookies()).get(SESSION_COOKIE_NAME);

  if (!entry?.value) {
    return sessionMarkerJson({ signedIn: false, name: null }, origin);
  }

  const name = decodeURIComponent(entry.value);
  return sessionMarkerJson({ signedIn: true, name: name || null }, origin);
}
