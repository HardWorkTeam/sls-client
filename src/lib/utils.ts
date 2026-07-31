import { clsx, type ClassValue } from "clsx";
import DOMPurify from "dompurify";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize server-rendered QR SVG markup before it is injected via
 * dangerouslySetInnerHTML or written into a print window. The QR endpoint is
 * trusted today, but this removes the standing assumption: scripts and event
 * handlers are stripped so the sink can never become XSS if the source changes.
 * Browser-only (needs a DOM) — call from client components.
 */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}

/** Escape text for safe interpolation into an HTML string (e.g. a print window). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pull the server-chosen download name out of a Content-Disposition header.
 * Prefers the RFC 5987 `filename*=` form — that is the only one non-ASCII
 * (e.g. Khmer) wedding names survive — and falls back to the quoted plain
 * form, then to `fallback` when the header is missing or unreadable.
 */
export function filenameFromContentDisposition(
  header: string | null | undefined,
  fallback: string,
): string {
  if (!header) return fallback;

  const encoded = /filename\*=\s*UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // Malformed percent-encoding — fall through to the plain form below.
    }
  }

  const plain = /filename=\s*"?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(
  amount: number | null | undefined,
  currency = "USD",
): string {
  if (amount === null || amount === undefined) return "—";
  const fractionDigits = currency === "KHR" ? 0 : 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}
