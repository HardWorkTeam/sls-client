"use client";

import { CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCheckInStats, useScanCheckIn } from "@/hooks/use-guests";

type Outcome = {
  kind: "success" | "already" | "error";
  message: string;
};

const READER_ID = "check-in-qr-reader";

/**
 * Wedding-day check-in scanner. Opens the device camera (html5-qrcode), decodes
 * each guest's QR token and marks them arrived. Falls back to a manual code
 * entry box when the camera is unavailable (e.g. desktop or denied permission).
 */
export function CheckInScanner({ weddingId }: { weddingId: number }) {
  const scan = useScanCheckIn(weddingId);
  const { data: stats } = useCheckInStats(weddingId);

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");

  // Guard against the camera firing the same token many times per second.
  const lastScan = useRef<{ token: string; at: number }>({ token: "", at: 0 });
  const busy = useRef(false);

  const submitToken = async (token: string) => {
    const trimmed = token.trim();
    if (!trimmed || busy.current) return;

    const now = Date.now();
    if (lastScan.current.token === trimmed && now - lastScan.current.at < 3000) {
      return; // same code re-read within the cooldown window
    }
    lastScan.current = { token: trimmed, at: now };

    busy.current = true;
    try {
      const { guest, alreadyCheckedIn } = await scan.mutateAsync(trimmed);
      setOutcome(
        alreadyCheckedIn
          ? { kind: "already", message: `${guest.name} was already checked in.` }
          : { kind: "success", message: `${guest.name} checked in. Welcome!` },
      );
    } catch (err) {
      setOutcome({ kind: "error", message: apiErrorMessage(err) });
    } finally {
      busy.current = false;
    }
  };

  // Keep the latest handler reachable from the camera callback without
  // re-initialising the scanner on every render.
  const submitRef = useRef(submitToken);
  submitRef.current = submitToken;

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(READER_ID);
        scanner = instance as unknown as typeof scanner;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => {
            void submitRef.current(decoded);
          },
          () => {
            // per-frame decode miss — ignored
          },
        );
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err instanceof Error
              ? err.message
              : "Camera unavailable. Use manual entry below.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Live tally */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Arrived" value={stats?.arrived} className="text-emerald-700" />
        <Stat label="Pending" value={stats?.pending} className="text-zinc-700" />
        <Stat label="Total" value={stats?.total} className="text-zinc-700" />
      </div>

      {/* Camera viewport */}
      <div
        id={READER_ID}
        className="mx-auto w-full max-w-xs overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900"
      />

      {cameraError ? (
        <p className="flex items-start gap-2 text-xs text-amber-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {cameraError}
        </p>
      ) : (
        <p className="text-center text-xs text-zinc-500">
          Point the camera at a guest&apos;s invitation QR code.
        </p>
      )}

      {/* Result banner */}
      {outcome ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            outcome.kind === "success" && "bg-emerald-50 text-emerald-800",
            outcome.kind === "already" && "bg-amber-50 text-amber-800",
            outcome.kind === "error" && "bg-red-50 text-red-700",
          )}
        >
          {outcome.kind === "error" ? (
            <XCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {outcome.message}
        </div>
      ) : null}

      {/* Manual fallback */}
      <form
        className="flex gap-2 border-t border-zinc-100 pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitToken(manualToken);
          setManualToken("");
        }}
      >
        <Input
          placeholder="Enter check-in code manually"
          value={manualToken}
          onChange={(event) => setManualToken(event.target.value)}
        />
        <Button type="submit" disabled={!manualToken.trim() || scan.isPending}>
          {scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check in"}
        </Button>
      </form>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value?: number;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white py-2">
      <p className={cn("text-xl font-semibold", className)}>{value ?? "—"}</p>
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
    </div>
  );
}
