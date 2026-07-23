"use client";

import { type FormEventHandler, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormError } from "./form-field";

/**
 * The create/edit dialog pattern every tab repeats: Dialog + <form> + error
 * line + Cancel/Submit footer with pending handling. While `pending`, both
 * buttons and closing are disabled so a save can't race a dismissal.
 *
 *   <FormDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="Record Gift"
 *     onSubmit={form.handleSubmit(save)}
 *     pending={createGift.isPending}
 *     error={error}
 *   >
 *     …fields…
 *   </FormDialog>
 */
export function FormDialog({
  open,
  onClose,
  title,
  description,
  onSubmit,
  error,
  pending = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitVariant = "default",
  submitDisabled = false,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Usually `form.handleSubmit(onValid)` from react-hook-form. */
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** Form-level error (e.g. `apiErrorMessage(err)`); announced via role="alert". */
  error?: string | null;
  /** True while the mutation runs: disables the footer and shows a spinner. */
  pending?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  submitVariant?: ButtonProps["variant"];
  /** Extra guard for invalid states beyond `pending` (e.g. nothing selected). */
  submitDisabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const close = () => {
    if (!pending) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={description}
      className={className}
    >
      <form onSubmit={onSubmit} aria-busy={pending || undefined} className="space-y-4">
        {children}
        <FormError error={error} />
        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" disabled={pending} onClick={close}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant={submitVariant}
            disabled={pending || submitDisabled}
          >
            {pending ? <Spinner className="h-4 w-4 text-current" /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
