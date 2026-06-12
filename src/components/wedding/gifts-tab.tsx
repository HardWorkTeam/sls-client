"use client";

import { Gift as GiftIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { useCreateGift, useDeleteGift, useGifts, useGiftSummary } from "@/hooks/use-gifts";
import { useGuests } from "@/hooks/use-guests";
import { apiErrorMessage } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/utils";

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
  const deleteGift = useDeleteGift(weddingId);

  const form = useForm<GiftForm>({
    defaultValues: { guest_id: "", gift_type: "cash", amount: "", item_name: "", note: "" },
  });
  const watchType = form.watch("gift_type");

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await createGift.mutateAsync({
        guest_id: values.guest_id ? Number(values.guest_id) : null,
        gift_type: values.gift_type,
        amount: values.amount ? Number(values.amount) : null,
        item_name: values.item_name || null,
        note: values.note || null,
      });
      form.reset({ guest_id: "", gift_type: "cash", amount: "", item_name: "", note: "" });
      setDialogOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Total Gifts" value={summary.total_gifts} icon={GiftIcon} />
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
          <StatCard label="Gift Items" value={summary.by_type.item.count} accent="rose" />
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
        <Button size="sm" onClick={() => setDialogOpen(true)}>
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
            <Button onClick={() => setDialogOpen(true)}>
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
                      ? gift.item_name ?? "—"
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Record Gift">
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
            </Select>
          </div>
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
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGift.isPending}>
              Save Gift
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
