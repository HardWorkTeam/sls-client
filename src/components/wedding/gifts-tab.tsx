"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DualCurrencyValue, StatCard } from "@/components/ui/stat-card";
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
  useUpdateGift,
} from "@/hooks/use-gifts";
import { useCreateGuest, useGuests } from "@/hooks/use-guests";
import { apiErrorMessage } from "@/lib/api";
import type { Gift, Guest } from "@/types/api";
import { formatDateTime, formatMoney } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  Gift as GiftIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

const GIFT_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  item: "Gift Item",
};

interface GiftForm {
  guest_id: string;
  gift_type: string;
  amount: string;
  currency: string;
  item_name: string;
  note: string;
  new_guest_name: string;
}

const EMPTY_FORM: GiftForm = {
  guest_id: "",
  gift_type: "cash",
  amount: "",
  currency: "USD",
  item_name: "",
  note: "",
  new_guest_name: "",
};

function GuestPicker({
  id,
  value,
  guests,
  onChange,
}: {
  id: string;
  value: string;
  guests: Guest[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedGuest = guests.find((guest) => String(guest.id) === value);
  const selectedLabel =
    value === "new"
      ? "+ Create new guest"
      : selectedGuest?.name ?? "Anonymous / not in list";
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredGuests = normalizedQuery
    ? guests.filter((guest) =>
        guest.name.toLocaleLowerCase().includes(normalizedQuery),
      )
    : guests;

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const select = (nextValue: string) => {
    onChange(nextValue);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          requestAnimationFrame(() => searchRef.current?.focus());
        }}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-left text-sm text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg">
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder="Search guest by name..."
              aria-label="Search guest by name"
              className="pl-8"
            />
          </div>
          <div role="listbox" className="max-h-52 overflow-y-auto overscroll-contain">
            {!normalizedQuery ? (
              <GuestPickerOption
                label="Anonymous / not in list"
                selected={value === ""}
                onClick={() => select("")}
              />
            ) : null}
            {filteredGuests.map((guest) => (
              <GuestPickerOption
                key={guest.id}
                label={guest.name}
                selected={value === String(guest.id)}
                onClick={() => select(String(guest.id))}
              />
            ))}
            {filteredGuests.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-zinc-500">
                No guests found.
              </p>
            ) : null}
            {!normalizedQuery ? (
              <GuestPickerOption
                label="+ Create new guest"
                selected={value === "new"}
                onClick={() => select("new")}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GuestPickerOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-zinc-800 hover:bg-emerald-50"
    >
      <span className="truncate">{label}</span>
      {selected ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
    </button>
  );
}

export function GiftsTab({ weddingId }: { weddingId: number }) {
  const [giftType, setGiftType] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gifts = useGifts(weddingId, {
    gift_type: giftType || undefined,
    page,
  });
  const { data: summary } = useGiftSummary(weddingId);
  const { data: guestsPage } = useGuests(weddingId, { per_page: 200 });
  const createGift = useCreateGift(weddingId);
  const updateGift = useUpdateGift(weddingId);
  const createGuest = useCreateGuest(weddingId);
  const { mutate: removeGift } = useDeleteGift(weddingId);
  const confirm = useConfirm();

  const form = useForm<GiftForm>({ defaultValues: EMPTY_FORM });
  const watchType = useWatch({ control: form.control, name: "gift_type" });
  const watchGuestId = useWatch({ control: form.control, name: "guest_id" });

  const openDialog = () => {
    setEditingGift(null);
    form.reset(EMPTY_FORM);
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = useCallback((gift: Gift) => {
    setError(null);
    setEditingGift(gift);
    form.reset({
      guest_id: gift.guest_id ? String(gift.guest_id) : "",
      gift_type: gift.gift_type,
      amount: gift.amount != null ? String(gift.amount) : "",
      currency: gift.currency || "USD",
      item_name: gift.item_name ?? "",
      note: gift.note ?? "",
      new_guest_name: "",
    });
    setDialogOpen(true);
  }, [form]);

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

      const payload = {
        guest_id: resolvedGuestId,
        gift_type: values.gift_type,
        amount: values.amount ? Number(values.amount) : null,
        currency: values.currency,
        item_name: values.item_name || null,
        note: values.note || null,
      };

      if (editingGift) {
        await updateGift.mutateAsync({ giftId: editingGift.id, payload });
      } else {
        await createGift.mutateAsync(payload);
      }
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
            : formatMoney(gift.amount, gift.currency),
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
        headClassName: "w-24",
        cell: (gift) => (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit gift"
              onClick={() => openEditDialog(gift)}
            >
              <Pencil className="h-4 w-4 text-zinc-500" />
            </Button>
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
          </div>
        ),
      },
    ],
    [confirm, openEditDialog, removeGift],
  );

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Total Gifts" value={summary.total_gifts} icon={GiftIcon} />
          <StatCard
            label="Total Cash"
            value={
              <DualCurrencyValue usd={summary.total_cash_amount_usd} khr={summary.total_cash_amount_khr} formatMoney={formatMoney} />
            }
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
        title={editingGift ? "Edit Gift" : "Record Gift"}
        onSubmit={onSubmit}
        error={error}
        pending={createGift.isPending || updateGift.isPending || createGuest.isPending}
        submitLabel={editingGift ? "Save Changes" : "Save Gift"}
      >
        <FormField label="Guest">
          {(field) => (
            <GuestPicker
              id={field.id}
              value={watchGuestId}
              guests={guestsPage?.data ?? []}
              onChange={(value) =>
                form.setValue("guest_id", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
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
            <div className="grid grid-cols-[1fr_80px] gap-2">
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
              <FormField label="Cur.">
                {(field) => (
                  <Select {...field} {...form.register("currency")}>
                    <option value="USD">USD</option>
                    <option value="KHR">KHR</option>
                  </Select>
                )}
              </FormField>
            </div>
          )}
        </div>
        <FormField label="Note">
          {(field) => <Input {...field} {...form.register("note")} />}
        </FormField>
      </FormDialog>
    </div>
  );
}
