"use client";

import { Check, Copy, Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { escapeHtml, sanitizeSvg } from "@/lib/utils";
import { guestService } from "@/services/guest-service";
import type { Guest } from "@/types/api";

/**
 * Shows a single guest's wedding-day check-in QR code with download and print
 * actions. The QR encodes the guest's opaque token; scanning it at the door
 * marks them as arrived.
 */
export function GuestQrDialog({
  weddingId,
  guest,
  onClose,
}: {
  weddingId: number;
  guest: Guest | null;
  onClose: () => void;
}) {
  const [qr, setQr] = useState<{ guestId: number; svg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!guest) return;
    let active = true;
    guestService
      .qrSvg(weddingId, guest.id)
      .then((markup) => {
        // Sanitize once at the boundary so state never holds untrusted markup;
        // render, print and download all consume the cleaned SVG.
        if (active) {
          setQr({ guestId: guest.id, svg: sanitizeSvg(markup) });
        }
      });
    return () => {
      active = false;
    };
  }, [weddingId, guest]);

  const svg = guest && qr?.guestId === guest.id ? qr.svg : null;
  const loading = guest !== null && svg === null;

  const copyCode = async () => {
    if (!guest?.check_in_code) return;
    try {
      await navigator.clipboard.writeText(guest.check_in_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable (non-secure context) — no-op; the
      // code is still visible for the user to select and copy manually.
    }
  };

  const download = () => {
    if (!svg || !guest) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qr-${guest.name.replace(/\s+/g, "-").toLowerCase()}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    if (!svg || !guest) return;
    const win = window.open("", "_blank", "width=420,height=520");
    if (!win) return;
    const safeName = escapeHtml(guest.name);
    win.document.write(
      `<html><head><title>${safeName} — Check-in QR</title></head>
       <body style="font-family:sans-serif;text-align:center;padding:24px">
       <h2 style="margin:0 0 4px">${safeName}</h2>
       <p style="color:#777;margin:0 0 16px">Scan at the entrance on the wedding day</p>
       ${svg}
       </body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Dialog
      open={guest !== null}
      onClose={onClose}
      title={guest ? `${guest.name} — Check-in QR` : "Check-in QR"}
      description="Print this onto the invitation. Scan it at the door to check the guest in."
      className="max-w-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-64 w-64 items-center justify-center rounded-xl border border-zinc-200 bg-white p-3">
          {loading || !svg ? (
            <Spinner />
          ) : (
            <div
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              // SVG is server-generated and DOMPurify-sanitized on fetch.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
        {guest?.check_in_code ? (
          <div className="w-full">
            <p className="mb-1 text-center text-xs text-zinc-500">
              No camera? Type this code into the Check-in Scanner.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
              <code className="flex-1 text-center font-mono text-lg font-semibold tracking-widest text-zinc-800">
                {guest.check_in_code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                aria-label="Copy check-in code"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={download} disabled={!svg}>
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button size="sm" onClick={print} disabled={!svg}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
