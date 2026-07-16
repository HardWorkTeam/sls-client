"use client";

import {
  CheckCircle2,
  Circle,
  Download,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Send,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FormDialog,
  FormError,
  FormField,
  QueryState,
  SearchInput,
  Toolbar,
} from "@/components/kit";
import {
  useBulkInvite,
  useCheckInStats,
  useCreateGuest,
  useCreateGuestGroup,
  useDeleteAllGuests,
  useDeleteGuest,
  useDeleteGuestGroup,
  useGuestGroups,
  useGuests,
  useImportGuests,
  useSetCheckIn,
  useUpdateGuest,
  useUpdateGuestGroup,
} from "@/hooks/use-guests";
import { useInvitations } from "@/hooks/use-invitations";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { guestService } from "@/services/guest-service";
import type { Guest, GuestGroup } from "@/types/api";
import { CheckInScanner } from "./check-in-scanner";
import { GuestQrDialog } from "./guest-qr-dialog";

const GROUP_TYPES = ["family", "friends", "vip", "company", "custom"] as const;

// Public RSVP site base used to build personalized invitation links.
const RSVP_URL = process.env.NEXT_PUBLIC_RSVP_URL ?? "http://localhost:3002";

const guestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  note: z.string().optional(),
  is_vip: z.boolean().optional(),
  guest_group_id: z.string().optional(),
});

type GuestForm = z.infer<typeof guestSchema>;

export function GuestsTab({
  weddingId,
  guestLimit,
  canShareInvite = true,
  canCheckIn = true,
}: {
  weddingId: number;
  // Plan guest cap (null/undefined = unlimited); used to show a banner and
  // disable adding once reached. The API enforces the real limit.
  guestLimit?: number | null;
  // Whether the plan includes personalized invitation links (the RSVP module).
  // FREE packages have no RSVP site, so the copy-link action is hidden for them.
  canShareInvite?: boolean;
  // Whether the plan includes wedding-day QR check-in. When false the scanner,
  // per-guest QR, arrival column and the digital check-in pass are all hidden.
  // The API also 403s the check-in routes for these plans.
  canCheckIn?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false);
  const [bulkInvitationId, setBulkInvitationId] = useState("");
  // Which invitation the "copy link" action uses for guests that have no
  // invitation of their own assigned. Defaults to the first invitation.
  const [linkInvitationId, setLinkInvitationId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Wedding-day check-in UI state.
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);

  // Group management state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<string>("custom");
  const [groupError, setGroupError] = useState<string | null>(null);

  // `search` holds the settled (already debounced) term — SearchInput owns
  // the keystroke state, so only the settled value hits the API.
  const guestsQuery = useGuests(weddingId, {
    search: search || undefined,
    guest_group_id: groupId ? Number(groupId) : undefined,
    page,
  });
  const data = guestsQuery.data;
  const { data: groups } = useGuestGroups(weddingId);
  const { data: invitations } = useInvitations(weddingId);

  const createGuest = useCreateGuest(weddingId);
  const updateGuest = useUpdateGuest(weddingId);
  const deleteGuest = useDeleteGuest(weddingId);
  const deleteAllGuests = useDeleteAllGuests(weddingId);
  const importGuests = useImportGuests(weddingId);
  const bulkInvite = useBulkInvite(weddingId);
  const createGroup = useCreateGuestGroup(weddingId);
  const updateGroup = useUpdateGuestGroup(weddingId);
  const deleteGroup = useDeleteGuestGroup(weddingId);
  const setCheckIn = useSetCheckIn(weddingId);
  const { data: checkInStats } = useCheckInStats(weddingId, canCheckIn);
  const confirm = useConfirm();

  const onDeleteSelected = async () => {
    setFeedback(null);
    setError(null);
    const count = isAllMatchingSelected ? guestTotal : selected.length;
    if (count === 0) return;

    if (
      await confirm({
        title: isAllMatchingSelected
          ? `Erase all ${guestTotal} guests?`
          : `Delete ${count} selected guest${count > 1 ? "s" : ""}?`,
        description:
          "The selected guests and their RSVP/seating assignments will be permanently removed. This action cannot be undone.",
      })
    ) {
      try {
        const res = await deleteAllGuests.mutateAsync(
          isAllMatchingSelected ? undefined : selected,
        );
        setFeedback(res.message);
        setSelected([]);
        setIsAllMatchingSelected(false);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
  };

  const toggleCheckIn = (guest: Guest) => {
    setError(null);
    setCheckIn
      .mutateAsync({ guestId: guest.id, arrived: !guest.checked_in_at })
      .catch((err) => setError(apiErrorMessage(err)));
  };

  const guestTotal = data?.meta?.total ?? 0;
  const atGuestLimit = guestLimit != null && guestTotal >= guestLimit;

  const form = useForm<GuestForm>({ resolver: zodResolver(guestSchema) });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", phone: "", email: "", address: "", note: "", is_vip: false, guest_group_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (guest: Guest) => {
    setEditing(guest);
    form.reset({
      name: guest.name,
      phone: guest.phone ?? "",
      email: guest.email ?? "",
      address: guest.address ?? "",
      note: guest.note ?? "",
      is_vip: guest.is_vip,
      guest_group_id: guest.group ? String(guest.group.id) : "",
    });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const payload = {
      ...values,
      email: values.email || null,
      guest_group_id: values.guest_group_id ? Number(values.guest_group_id) : null,
    };
    try {
      if (editing) {
        await updateGuest.mutateAsync({ guestId: editing.id, payload });
      } else {
        await createGuest.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const onImport = async (file: File) => {
    setFeedback(null);
    setError(null);
    try {
      const result = await importGuests.mutateAsync(file);
      setFeedback(result.message);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const onExport = async () => {
    const blob = await guestService.exportExcel(weddingId);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "guests.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onBulkInvite = async () => {
    if (!bulkInvitationId || (selected.length === 0 && !isAllMatchingSelected)) return;
    setError(null);
    try {
      const targetIds = isAllMatchingSelected
        ? (data?.data ?? []).map((g) => g.id)
        : selected;
      const result = await bulkInvite.mutateAsync({
        guestIds: targetIds,
        invitationId: Number(bulkInvitationId),
      });
      setFeedback(result.message);
      setSelected([]);
      setIsAllMatchingSelected(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const toggleSelected = (id: number) => {
    setIsAllMatchingSelected(false);
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  };

  // The invitation used as the fallback when a guest has none of their own
  // assigned. Honours the user's selection, otherwise the first invitation.
  const fallbackInvitation =
    (invitations ?? []).find((inv) => String(inv.id) === linkInvitationId) ??
    invitations?.[0];

  // Copy a personalized invitation link for a guest. Uses the guest's assigned
  // invitation; when none is set it falls back to the invitation chosen in the
  // link-source selector (or the first invitation if there's only one).
  const copyInviteLink = async (guest: Guest) => {
    setFeedback(null);
    setError(null);
    const invitation = guest.invitation ?? fallbackInvitation;
    const code = invitation?.invitation_code;
    if (!code) {
      setError("Create an invitation first, then you can send a personalized link.");
      return;
    }
    // Include the guest's short check-in code so their invite shows a personal
    // "my check-in QR" pass they can present at the door on the wedding day —
    // only when the plan includes the check-in feature. The code drives both
    // the QR and the readable text on the pass.
    const tokenParam =
      canCheckIn && guest.check_in_code ? `&t=${guest.check_in_code}` : "";
    const link = `${RSVP_URL}/invite/${code}?to=${encodeURIComponent(guest.name)}${tokenParam}`;
    const invitationLabel = invitation?.title ?? code;
    try {
      await navigator.clipboard.writeText(link);
      setFeedback(
        `Invitation link for ${guest.name} (${invitationLabel}) copied to clipboard.`,
      );
    } catch {
      // Clipboard API may be unavailable (e.g. non-secure context) — surface the
      // link so the user can copy it manually.
      setError(`Couldn't copy automatically. Link: ${link}`);
    }
  };

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setGroupType("custom");
    setGroupError(null);
  };

  const openEditGroup = (group: GuestGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupType(group.type);
    setGroupError(null);
  };

  const onSubmitGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setGroupError("Name is required.");
      return;
    }
    // Group names must be unique within the wedding (the API enforces this too).
    const isDuplicate = (groups ?? []).some(
      (group) =>
        group.id !== editingGroup?.id &&
        group.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      setGroupError("A group with this name already exists.");
      return;
    }
    setGroupError(null);
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({ groupId: editingGroup.id, payload: { name: trimmedName, type: groupType } });
      } else {
        await createGroup.mutateAsync({ name: trimmedName, type: groupType });
      }
      openCreateGroup();
    } catch (err) {
      setGroupError(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <Toolbar
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
                event.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Download className="h-4 w-4" /> Import XLSX
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Upload className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => { openCreateGroup(); setGroupDialogOpen(true); }}>
              <Users className="h-4 w-4" /> Groups
            </Button>
            {canCheckIn ? (
              <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
                <ScanLine className="h-4 w-4" /> Check-in Scanner
              </Button>
            ) : null}
            <Button size="sm" onClick={openCreate} disabled={atGuestLimit}>
              <Plus className="h-4 w-4" /> Add Guest
            </Button>
          </>
        }
      >
        <SearchInput
          placeholder="Search guests..."
          onSearch={(query) => {
            setSearch(query);
            setPage(1);
          }}
        />
        <Select
          className="w-44"
          aria-label="Filter by group"
          value={groupId}
          onChange={(event) => {
            setGroupId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All groups</option>
          {(groups ?? []).map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
        {canShareInvite && (invitations?.length ?? 0) > 1 ? (
          <Select
            className="w-48"
            title="Invitation used when copying a guest's personalized link"
            value={fallbackInvitation ? String(fallbackInvitation.id) : ""}
            onChange={(event) => setLinkInvitationId(event.target.value)}
          >
            {(invitations ?? []).map((invitation) => (
              <option key={invitation.id} value={invitation.id}>
                Link: {invitation.title ?? invitation.invitation_code}
              </option>
            ))}
          </Select>
        ) : null}
      </Toolbar>

      {guestLimit != null ? (
        <p
          className={cn(
            "text-sm",
            atGuestLimit ? "text-red-600" : "text-zinc-500",
          )}
        >
          {guestTotal} / {guestLimit} guests used on your plan.
          {atGuestLimit ? (
            <>
              {" "}
              <Link href="/plan" className="font-medium text-emerald-700 underline">
                Upgrade your plan
              </Link>{" "}
              to add more.
            </>
          ) : null}
        </p>
      ) : null}

      {canCheckIn && checkInStats && checkInStats.total > 0 ? (
        <p className="text-sm text-zinc-500">
          <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-600" />
          <span className="font-medium text-emerald-700">{checkInStats.arrived}</span>{" "}
          of {checkInStats.total} guests checked in ({checkInStats.pending} not yet
          arrived).
        </p>
      ) : null}

      {selected.length > 0 || isAllMatchingSelected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-emerald-900">
            <span className="font-semibold">
              {isAllMatchingSelected
                ? `All ${guestTotal} guests selected`
                : `${selected.length} selected`}
            </span>
            {!isAllMatchingSelected && guestTotal > selected.length ? (
              <button
                type="button"
                onClick={() => setIsAllMatchingSelected(true)}
                className="ml-2 text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
              >
                Select all {guestTotal} guests in wedding
              </button>
            ) : null}
            {isAllMatchingSelected ? (
              <button
                type="button"
                onClick={() => {
                  setSelected([]);
                  setIsAllMatchingSelected(false);
                }}
                className="ml-2 text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
              >
                Clear selection
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {(invitations ?? []).length > 0 ? (
              <>
                <Select
                  className="h-8 w-52 text-xs"
                  value={bulkInvitationId}
                  onChange={(event) => setBulkInvitationId(event.target.value)}
                >
                  <option value="">Choose invitation...</option>
                  {(invitations ?? []).map((invitation) => (
                    <option key={invitation.id} value={invitation.id}>
                      {invitation.title ?? invitation.invitation_code}
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  onClick={onBulkInvite}
                  disabled={!bulkInvitationId || bulkInvite.isPending}
                >
                  Bulk Invite
                </Button>
              </>
            ) : null}

            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDeleteSelected}
              disabled={deleteAllGuests.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {isAllMatchingSelected
                ? "Delete All Guests"
                : `Delete Selected (${selected.length})`}
            </Button>
          </div>
        </div>
      ) : null}

      {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
      <FormError error={error} />

      <QueryState
        query={guestsQuery}
        loadingLabel="Loading guests..."
        empty={{
          title: "No guests yet",
          description:
            "Add guests manually or import an XLSX / CSV file. Supports simple name-only lists, numbered lines (e.g. 1. Guest Name), and standard guest tables.",
          action: (
            <Button onClick={openCreate} disabled={atGuestLimit}>
              <Plus className="h-4 w-4" /> Add Guest
            </Button>
          ),
        }}
      >
        {(guestsPage) => {
          const currentPageIds = guestsPage.data.map((g) => g.id);
          const isPageSelected =
            currentPageIds.length > 0 &&
            currentPageIds.every((id) => selected.includes(id));
          const isHeaderChecked = isAllMatchingSelected || isPageSelected;

          return (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={isHeaderChecked}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelected(currentPageIds);
                            setIsAllMatchingSelected(false);
                          } else {
                            setSelected([]);
                            setIsAllMatchingSelected(false);
                          }
                        }}
                      />
                    </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Table / Seat</TableHead>
                <TableHead>Invitation</TableHead>
                {canCheckIn ? <TableHead>Arrived</TableHead> : null}
                <TableHead className={canCheckIn ? "w-32" : "w-24"}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guestsPage.data.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Select ${guest.name}`}
                      checked={selected.includes(guest.id)}
                      onChange={() => toggleSelected(guest.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-zinc-800">
                      {guest.name}{" "}
                      {guest.is_vip ? <Badge variant="warning">VIP</Badge> : null}
                    </p>
                    {guest.note ? (
                      <p className="text-xs italic text-zinc-400">{guest.note}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="text-zinc-700">{guest.phone ?? "—"}</p>
                    {guest.email ? (
                      <p className="text-xs text-zinc-500">{guest.email}</p>
                    ) : null}
                    {guest.address ? (
                      <p className="text-xs text-zinc-400">{guest.address}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>{guest.group?.name ?? "—"}</TableCell>
                  <TableCell>
                    {guest.seating?.table
                      ? `${guest.seating.table.table_name}${guest.seating.seat_number ? ` · #${guest.seating.seat_number}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {guest.invitation ? (
                      <span className="font-mono text-xs text-zinc-500">
                        {guest.invitation.invitation_code}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {canCheckIn ? (
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleCheckIn(guest)}
                        disabled={setCheckIn.isPending}
                        title={
                          guest.checked_in_at
                            ? `Arrived ${new Date(guest.checked_in_at).toLocaleString()} — click to undo`
                            : "Mark as arrived"
                        }
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                          guest.checked_in_at
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200",
                        )}
                      >
                        {guest.checked_in_at ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                        {guest.checked_in_at ? "Arrived" : "Mark"}
                      </button>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <div className="flex gap-1">
                      {canCheckIn ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Show check-in QR for ${guest.name}`}
                          title="Check-in QR code"
                          onClick={() => setQrGuest(guest)}
                        >
                          <QrCode className="h-4 w-4 text-zinc-600" />
                        </Button>
                      ) : null}
                      {canShareInvite ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Copy invitation link for ${guest.name}`}
                          title="Copy personalized invitation link"
                          onClick={() => copyInviteLink(guest)}
                        >
                          <Send className="h-4 w-4 text-emerald-600" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${guest.name}`}
                        onClick={() => openEdit(guest)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${guest.name}`}
                        onClick={async () => {
                          if (
                            await confirm({
                              title: `Delete guest "${guest.name}"?`,
                              description:
                                "The guest and their RSVP/seating assignments will be removed.",
                            })
                          ) {
                            deleteGuest.mutate(guest.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={guestsPage.meta} onPageChange={setPage} />
          </>
          );
        }}
      </QueryState>

      {/* Add / Edit Guest dialog */}
      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add Guest"}
        onSubmit={onSubmit}
        error={error}
        pending={createGuest.isPending || updateGuest.isPending}
        submitLabel={editing ? "Save Changes" : "Add Guest"}
      >
        <FormField label="Name" required error={form.formState.errors.name?.message}>
          {(field) => <Input {...field} {...form.register("name")} />}
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phone">
            {(field) => <Input {...field} {...form.register("phone")} />}
          </FormField>
          <FormField label="Email" error={form.formState.errors.email?.message}>
            {(field) => <Input type="email" {...field} {...form.register("email")} />}
          </FormField>
        </div>
        <FormField label="Address">
          {(field) => <Input {...field} {...form.register("address")} />}
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Group">
            {(field) => (
              <Select {...field} {...form.register("guest_group_id")}>
                <option value="">No group</option>
                {(groups ?? []).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <div className="flex items-end gap-2 pb-1.5">
            <input id="guest-vip" type="checkbox" {...form.register("is_vip")} />
            <Label htmlFor="guest-vip">VIP guest</Label>
          </div>
        </div>
        <FormField label="Note">
          {(field) => <Input {...field} {...form.register("note")} />}
        </FormField>
      </FormDialog>

      {/* Manage Groups dialog */}
      <Dialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        title="Manage Groups"
      >
        <div className="space-y-4">
          {/* Existing groups list */}
          {(groups ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">No groups yet. Create one below.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
              {(groups ?? []).map((group) => (
                <li key={group.id} className="flex items-center justify-between px-3 py-2">
                  {editingGroup?.id === group.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="h-7 text-xs"
                        autoFocus
                      />
                      <Select
                        value={groupType}
                        onChange={(e) => setGroupType(e.target.value)}
                        className="h-7 w-28 text-xs"
                      >
                        {GROUP_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </Select>
                      <Button size="sm" onClick={onSubmitGroup} disabled={updateGroup.isPending}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={openCreateGroup}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm font-medium text-zinc-800">{group.name}</span>
                        <span className="ml-2 text-xs capitalize text-zinc-400">{group.type}</span>
                        {group.guests_count !== undefined ? (
                          <span className="ml-1 text-xs text-zinc-400">· {group.guests_count} guests</span>
                        ) : null}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditGroup(group)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (
                              await confirm({
                                title: `Delete group "${group.name}"?`,
                                description:
                                  "Guests in this group will be ungrouped, not deleted.",
                              })
                            ) {
                              deleteGroup.mutate(group.id);
                            }
                          }}
                          disabled={deleteGroup.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Create new group form */}
          {!editingGroup ? (
            <div className="space-y-2 rounded-lg border border-dashed border-zinc-300 p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                New Group
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="h-8 text-sm"
                />
                <Select
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="h-8 w-32 text-sm"
                >
                  {GROUP_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <Button size="sm" onClick={onSubmitGroup} disabled={createGroup.isPending}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              {groupError ? <p className="text-xs text-red-600">{groupError}</p> : null}
            </div>
          ) : null}
        </div>
      </Dialog>

      {/* Wedding-day check-in scanner */}
      <Dialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Check-in Scanner"
        description="Scan each guest's invitation QR code as they arrive."
        className="max-w-md"
      >
        {scannerOpen ? <CheckInScanner weddingId={weddingId} /> : null}
      </Dialog>

      {/* Per-guest QR code */}
      <GuestQrDialog
        weddingId={weddingId}
        guest={qrGuest}
        onClose={() => setQrGuest(null)}
      />
    </div>
  );
}
