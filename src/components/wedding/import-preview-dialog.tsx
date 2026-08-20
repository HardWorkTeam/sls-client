"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useConfirmImport } from "@/hooks/use-guests";
import { apiErrorMessage } from "@/lib/api";

export function ImportPreviewDialog({
  weddingId,
  open,
  onClose,
  initialData,
  guestTotal,
  guestLimit,
  onSuccess,
}: {
  weddingId: number;
  open: boolean;
  onClose: () => void;
  initialData: any[];
  guestTotal: number;
  guestLimit?: number | null;
  onSuccess: (message: string) => void;
}) {
  const [guests, setGuests] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const confirmImport = useConfirmImport(weddingId);

  useEffect(() => {
    if (open) {
      setGuests(initialData);
      setError(null);
    }
  }, [open, initialData]);

  const removeRow = (index: number) => {
    setGuests((current) => current.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: string) => {
    setGuests((current) => {
      const copy = [...current];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const remainingSlots = guestLimit != null ? guestLimit - guestTotal : Infinity;
  const isExceeded = guests.length > remainingSlots;

  const handleConfirm = async () => {
    setError(null);
    try {
      const res = await confirmImport.mutateAsync(guests);
      onSuccess(res.message);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Preview Guests"
      className="max-w-4xl max-h-[85vh] flex flex-col"
    >
      <div className="flex-1 overflow-auto -mx-6 px-6 pb-2">
        {isExceeded && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">លើសចំនួន / Limit Exceeded</p>
              <p>
                You are trying to import {guests.length} guests, but your plan only
                allows {Math.max(0, remainingSlots)} more. Please remove some rows
                or upgrade your plan.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 font-medium text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Phone</th>
                <th className="px-3 py-2 font-medium">Group</th>
                <th className="px-3 py-2 font-medium w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-zinc-500">
                    No valid guests found in file.
                  </td>
                </tr>
              ) : null}
              {guests.map((g, idx) => (
                <tr key={g.id}>
                  <td className="p-1.5">
                    <Input
                      className="h-8 text-sm"
                      value={g.name}
                      onChange={(e) => updateRow(idx, "name", e.target.value)}
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      className="h-8 text-sm"
                      value={g.phone ?? ""}
                      onChange={(e) => updateRow(idx, "phone", e.target.value)}
                    />
                  </td>
                  <td className="p-1.5">
                    <Input
                      className="h-8 text-sm"
                      value={g.group_name ?? ""}
                      onChange={(e) => updateRow(idx, "group_name", e.target.value)}
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-red-600"
                      onClick={() => removeRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={guests.length === 0 || isExceeded || confirmImport.isPending}
        >
          Confirm Import
        </Button>
      </div>
    </Dialog>
  );
}
