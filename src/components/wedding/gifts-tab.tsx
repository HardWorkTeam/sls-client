"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateGift,
  useDeleteGift,
  useGifts,
  useGiftSummary,
} from "@/hooks/use-gifts";
import { useCreateGuest, useGuests } from "@/hooks/use-guests";
import { apiErrorMessage } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { Gift as GiftIcon, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

const GIFT_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  item: "Gift Item",
};

interface GiftForm {
  guest_id: string;
  gift_type: string;
  amount: string;
  item_name: string;
  note: string;
  new_guest_name: string;
}

export function GiftsTab({ weddingId }: { weddingId: number }) {
  const [giftType, setGiftType] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useGifts(weddingId, {
    gift_type: giftType || undefined,
    page,
  });
  const { data: summary } = useGiftSummary(weddingId);
  const { data: guestsPage } = useGuests(weddingId, { per_page: 200 });
  const createGift = useCreateGift(weddingId);
  const createGuest = useCreateGuest(weddingId);
  const deleteGift = useDeleteGift(weddingId);

  const form = useForm<GiftForm>({
    defaultValues: {
      guest_id: "",
      gift_type: "cash",
      amount: "",
      item_name: "",
      note: "",
      new_guest_name: "",
    },
  });
  const watchType = form.watch("gift_type");
  const watchGuestId = form.watch("guest_id");

  const openDialog = () => {
    form.reset({
      guest_id: "",
      gift_type: "cash",
      amount: "",
      item_name: "",
      note: "",
      new_guest_name: "",
    });
    setError(null);
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      let resolvedGuestId: number | null = null;

      if (values.guest_id === "new") {
        if (!values.new_guest_name.trim()) {
          form.setError("new_guest_name", { message: "Name is required" });
          return;
        }
        const newGuest = await createGuest.mutateAsync({
          name: values.new_guest_name.trim(),
        });
        resolvedGuestId = newGuest.id;
      } else if (values.guest_id) {
        resolvedGuestId = Number(values.guest_id);
      }

      await createGift.mutateAsync({
        guest_id: resolvedGuestId,
        gift_type: values.gift_type,
        amount: values.amount ? Number(values.amount) : null,
        item_name: values.item_name || null,
        note: values.note || null,
      });
      setDialogOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Total Gifts"
            value={summary.total_gifts}
            icon={GiftIcon}
          />
          <StatCard
            label="Total Cash"
            value={formatMoney(summary.total_cash_amount)}
            accent="sky"
          />
          <StatCard
            label="Cash / Transfers"
            value={`${summary.by_type.cash.count} / ${summary.by_type.bank_transfer.count}`}
            accent="amber"
          />
          <StatCard
            label="Gift Items"
            value={summary.by_type.item.count}
            accent="rose"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          className="w-44"
          value={giftType}
          onChange={(event) => {
            setGiftType(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All types</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="item">Gift Item</option>
        </Select>
        <Button size="sm" onClick={openDialog}>
          <Plus className="h-4 w-4" /> Record Gift
        </Button>
      </div>

      {isLoading ? (
        <PageLoader label="Loading gifts..." />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No gifts recorded"
          description="Track cash gifts, bank transfers and gift items received."
          action={
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4" /> Record Gift
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount / Item</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((gift) => (
                <TableRow key={gift.id}>
                  <TableCell className="font-medium text-zinc-800">
                    {gift.guest?.name ?? "Anonymous"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {GIFT_TYPE_LABELS[gift.gift_type] ?? gift.gift_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {gift.gift_type === "item"
                      ? (gift.item_name ?? "—")
                      : formatMoney(gift.amount)}
                  </TableCell>
                  <TableCell className="max-w-48">
                    <p className="truncate text-zinc-600">{gift.note ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {formatDateTime(gift.received_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete gift"
                      onClick={() => {
                        if (confirm("Delete this gift record?")) {
                          deleteGift.mutate(gift.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Record Gift"
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="gift-guest">Guest</Label>
            <Select id="gift-guest" {...form.register("guest_id")}>
              <option value="">Anonymous / not in list</option>
              {(guestsPage?.data ?? []).map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.name}
                </option>
              ))}
              <option value="new">+ Create new guest</option>
            </Select>
          </div>

          {watchGuestId === "new" ? (
            <div>
              <Label
                htmlFor="new-guest-name"
                className="flex items-center gap-1"
              >
                <UserPlus className="h-3.5 mb-1 w-3.5" /> New guest name
              </Label>
              <Input
                id="new-guest-name"
                placeholder="Full name"
                autoFocus
                {...form.register("new_guest_name")}
              />
              {form.formState.errors.new_guest_name ? (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.new_guest_name.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gift-type">Type</Label>
              <Select id="gift-type" {...form.register("gift_type")}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="item">Gift Item</option>
              </Select>
            </div>
            {watchType === "item" ? (
              <div>
                <Label htmlFor="gift-item">Item name</Label>
                <Input id="gift-item" {...form.register("item_name")} />
              </div>
            ) : (
              <div>
                <Label htmlFor="gift-amount">Amount</Label>
                <Input
                  id="gift-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("amount")}
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="gift-note">Note</Label>
            <Input id="gift-note" {...form.register("note")} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGift.isPending || createGuest.isPending}
            >
              Save Gift
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
