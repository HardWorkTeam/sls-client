"use client";

import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
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
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!guest) {
      setSvg(null);
      return;
    }
    let active = true;
    setLoading(true);
    guestService
      .qrSvg(weddingId, guest.id)
      .then((markup) => {
        if (active) setSvg(markup);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [weddingId, guest]);

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
    win.document.write(
      `<html><head><title>${guest.name} — Check-in QR</title></head>
       <body style="font-family:sans-serif;text-align:center;padding:24px">
       <h2 style="margin:0 0 4px">${guest.name}</h2>
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
              // The SVG is server-generated from a trusted endpoint.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
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
