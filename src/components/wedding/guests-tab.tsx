"use client";

import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBulkInvite,
  useCreateGuest,
  useDeleteGuest,
  useGuestGroups,
  useGuests,
  useImportGuests,
  useUpdateGuest,
} from "@/hooks/use-guests";
import { useInvitations } from "@/hooks/use-invitations";
import { apiErrorMessage } from "@/lib/api";
import { guestService } from "@/services/guest-service";
import type { Guest } from "@/types/api";

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

export function GuestsTab({ weddingId }: { weddingId: number }) {
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkInvitationId, setBulkInvitationId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useGuests(weddingId, {
    search: search || undefined,
    guest_group_id: groupId ? Number(groupId) : undefined,
    page,
  });
  const { data: groups } = useGuestGroups(weddingId);
  const { data: invitations } = useInvitations(weddingId);

  const createGuest = useCreateGuest(weddingId);
  const updateGuest = useUpdateGuest(weddingId);
  const deleteGuest = useDeleteGuest(weddingId);
  const importGuests = useImportGuests(weddingId);
  const bulkInvite = useBulkInvite(weddingId);

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
    const blob = await guestService.exportCsv(weddingId);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "guests.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onBulkInvite = async () => {
    if (!bulkInvitationId || selected.length === 0) return;
    setError(null);
    try {
      const result = await bulkInvite.mutateAsync({
        guestIds: selected,
        invitationId: Number(bulkInvitationId),
      });
      setFeedback(result.message);
      setSelected([]);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const toggleSelected = (id: number) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search guests..."
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          className="w-44"
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
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Guest
          </Button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <p className="text-sm text-emerald-800">{selected.length} selected</p>
          <Select
            className="w-56"
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
        </div>
      ) : null}

      {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isLoading ? (
        <PageLoader label="Loading guests..." />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests manually or import a CSV file (columns: name, phone, email, address, group, is_vip, note)."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Guest
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={selected.length === data.data.length && data.data.length > 0}
                    onChange={(event) =>
                      setSelected(event.target.checked ? data.data.map((g) => g.id) : [])
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Table / Seat</TableHead>
                <TableHead>Invitation</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((guest) => (
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
                  </TableCell>
                  <TableCell>
                    <p className="text-zinc-700">{guest.phone ?? "—"}</p>
                    <p className="text-xs text-zinc-500">{guest.email ?? ""}</p>
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
                  <TableCell>
                    <div className="flex gap-1">
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
                        onClick={() => {
                          if (confirm(`Delete guest "${guest.name}"?`)) {
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
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add Guest"}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="guest-name">Name</Label>
            <Input id="guest-name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guest-phone">Phone</Label>
              <Input id="guest-phone" {...form.register("phone")} />
            </div>
            <div>
              <Label htmlFor="guest-email">Email</Label>
              <Input id="guest-email" type="email" {...form.register("email")} />
            </div>
          </div>
          <div>
            <Label htmlFor="guest-address">Address</Label>
            <Input id="guest-address" {...form.register("address")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guest-group">Group</Label>
              <Select id="guest-group" {...form.register("guest_group_id")}>
                <option value="">No group</option>
                {(groups ?? []).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1.5">
              <input id="guest-vip" type="checkbox" {...form.register("is_vip")} />
              <Label htmlFor="guest-vip">VIP guest</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="guest-note">Note</Label>
            <Input id="guest-note" {...form.register("note")} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGuest.isPending || updateGuest.isPending}
            >
              {editing ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
