"use client";

import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FieldControlProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

/**
 * Label + control + hint + error, with the id/aria wiring generated so it
 * can't be forgotten. The control receives its props through the render
 * function:
 *
 *   <FormField label="Amount" error={errors.amount?.message}>
 *     {(field) => <Input type="number" {...field} {...register("amount")} />}
 *   </FormField>
 *
 * Plain children are also accepted for controls that manage their own ids
 * (the label then targets `htmlFor` if given).
 */
export function FormField({
  label,
  error,
  hint,
  required = false,
  htmlFor,
  className,
  children,
}: {
  label: ReactNode;
  /** Field error message, e.g. `form.formState.errors.name?.message`. */
  error?: string;
  /** Muted helper text under the control. */
  hint?: string;
  /** Adds a visual asterisk; still set `required` on the control itself. */
  required?: boolean;
  /** Only needed with plain (non-function) children. */
  htmlFor?: string;
  className?: string;
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
}) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const control: FieldControlProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [errorId, hintId].filter(Boolean).join(" ") || undefined,
  };

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        ) : null}
      </Label>
      {typeof children === "function" ? children(control) : children}
      {error ? (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Form-level (non-field) error, e.g. `apiErrorMessage(err)` after a failed
 * mutation. `role="alert"` announces it to screen readers when it appears.
 * Renders nothing while there is no error, so it can stay mounted.
 */
export function FormError({ error }: { error?: string | null }) {
  if (!error) return null;

  return (
    <p role="alert" className="text-sm text-red-600">
      {error}
    </p>
  );
}
