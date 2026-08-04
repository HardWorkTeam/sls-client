import { NextResponse } from "next/server";

const WEB_ORIGIN = process.env.NEXT_PUBLIC_WEB_URL?.trim().replace(/\/$/, "");

/** CORS headers for the marketing site's credentialed session check. */
export function sessionMarkerCors(origin: string | null): Headers {
  const headers = new Headers();
  if (WEB_ORIGIN && origin === WEB_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  return headers;
}

export function sessionMarkerJson(
  body: { signedIn: boolean; name: string | null },
  origin: string | null,
) {
  return NextResponse.json(body, { headers: sessionMarkerCors(origin) });
}

export function sessionMarkerPreflight(origin: string | null) {
  const headers = sessionMarkerCors(origin);
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new NextResponse(null, { status: 204, headers });
}
