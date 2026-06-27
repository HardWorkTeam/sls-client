"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Visual style of the confirm button. Defaults to "destructive". */
  variant?: "destructive" | "default";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Provides an imperative, promise-based confirmation dialog.
 * Drop-in replacement for `window.confirm` that renders a styled modal:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Delete "X"?' })) doDelete();
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setOpen(false);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options ? (
        <Dialog
          open={open}
          onClose={() => close(false)}
          title={options.title}
          description={options.description}
          className="max-w-md"
        >
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => close(false)}>
              {options.cancelText ?? "Cancel"}
            </Button>
            <Button
              variant={options.variant ?? "destructive"}
              onClick={() => close(true)}
              autoFocus
            >
              {options.confirmText ?? "Delete"}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
