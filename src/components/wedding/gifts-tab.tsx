"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import {
  DataTable,
  FormDialog,
  FormField,
  QueryState,
  Toolbar,
  type DataTableColumn,
} from "@/components/kit";
import {
  useCreateGift,
  useDeleteGift,
  useGifts,
  useGiftSummary,
} from "@/hooks/use-gifts";
import { useCreateGuest, useGuests } from "@/hooks/use-guests";
import { apiErrorMessage } from "@/lib/api";
import type { Gift } from "@/types/api";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { Gift as GiftIcon, Plus, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
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

const EMPTY_FORM: GiftForm = {
  guest_id: "",
  gift_type: "cash",
  amount: "",
  item_name: "",
  note: "",
  new_guest_name: "",
};

export function GiftsTab({ weddingId }: { weddingId: number }) {
  const [giftType, setGiftType] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gifts = useGifts(weddingId, {
    gift_type: giftType || undefined,
    page,
  });
  const { data: summary } = useGiftSummary(weddingId);
  const { data: guestsPage } = useGuests(weddingId, { per_page: 200 });
  const createGift = useCreateGift(weddingId);
  const createGuest = useCreateGuest(weddingId);
  const { mutate: removeGift } = useDeleteGift(weddingId);
  const confirm = useConfirm();

  const form = useForm<GiftForm>({ defaultValues: EMPTY_FORM });
  const watchType = form.watch("gift_type");
  const watchGuestId = form.watch("guest_id");

  const openDialog = () => {
    form.reset(EMPTY_FORM);
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

  const columns = useMemo<DataTableColumn<Gift>[]>(
    () => [
      {
        key: "guest",
        header: "Guest",
        className: "font-medium text-zinc-800",
        cell: (gift) => gift.guest?.name ?? "Anonymous",
      },
      {
        key: "type",
        header: "Type",
        cell: (gift) => (
          <Badge variant="secondary">
            {GIFT_TYPE_LABELS[gift.gift_type] ?? gift.gift_type}
          </Badge>
        ),
      },
      {
        key: "amount",
        header: "Amount / Item",
        cell: (gift) =>
          gift.gift_type === "item"
            ? (gift.item_name ?? "—")
            : formatMoney(gift.amount),
      },
      {
        key: "note",
        header: "Note",
        hideBelow: "md",
        className: "max-w-48",
        cell: (gift) => <p className="truncate text-zinc-600">{gift.note ?? "—"}</p>,
      },
      {
        key: "received",
        header: "Received",
        hideBelow: "sm",
        className: "text-xs text-zinc-500",
        cell: (gift) => formatDateTime(gift.received_at),
      },
      {
        key: "actions",
        header: "",
        headClassName: "w-16",
        cell: (gift) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete gift"
            onClick={async () => {
              if (
                await confirm({
                  title: "Delete this gift record?",
                  description: "This gift entry will be permanently removed.",
                })
              ) {
                removeGift(gift.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        ),
      },
    ],
    [confirm, removeGift],
  );

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

      <Toolbar
        actions={
          <Button size="sm" onClick={openDialog}>
            <Plus className="h-4 w-4" /> Record Gift
          </Button>
        }
      >
        <Select
          className="w-44"
          aria-label="Filter by gift type"
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
      </Toolbar>

      <QueryState
        query={gifts}
        loadingLabel="Loading gifts..."
        empty={{
          title: "No gifts recorded",
          description: "Track cash gifts, bank transfers and gift items received.",
          action: (
            <Button onClick={openDialog}>
              <Plus className="h-4 w-4" /> Record Gift
            </Button>
          ),
        }}
      >
        {(giftsPage) => (
          <DataTable
            caption="Gifts received"
            columns={columns}
            rows={giftsPage.data}
            rowKey={(gift) => gift.id}
            meta={giftsPage.meta}
            onPageChange={setPage}
            isFetching={gifts.isFetching}
          />
        )}
      </QueryState>

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Record Gift"
        onSubmit={onSubmit}
        error={error}
        pending={createGift.isPending || createGuest.isPending}
        submitLabel="Save Gift"
      >
        <FormField label="Guest">
          {(field) => (
            <Select {...field} {...form.register("guest_id")}>
              <option value="">Anonymous / not in list</option>
              {(guestsPage?.data ?? []).map((guest) => (
                <option key={guest.id} value={guest.id}>
                  {guest.name}
                </option>
              ))}
              <option value="new">+ Create new guest</option>
            </Select>
          )}
        </FormField>

        {watchGuestId === "new" ? (
          <FormField
            label={
              <span className="flex items-center gap-1">
                <UserPlus className="h-3.5 w-3.5" /> New guest name
              </span>
            }
            error={form.formState.errors.new_guest_name?.message}
          >
            {(field) => (
              <Input
                placeholder="Full name"
                autoFocus
                {...field}
                {...form.register("new_guest_name")}
              />
            )}
          </FormField>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Type">
            {(field) => (
              <Select {...field} {...form.register("gift_type")}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="item">Gift Item</option>
              </Select>
            )}
          </FormField>
          {watchType === "item" ? (
            <FormField label="Item name">
              {(field) => <Input {...field} {...form.register("item_name")} />}
            </FormField>
          ) : (
            <FormField label="Amount">
              {(field) => (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
                  {...form.register("amount")}
                />
              )}
            </FormField>
          )}
        </div>
        <FormField label="Note">
          {(field) => <Input {...field} {...form.register("note")} />}
        </FormField>
      </FormDialog>
    </div>
  );
}
