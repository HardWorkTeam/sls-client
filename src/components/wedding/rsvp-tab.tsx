"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import {
  DataTable,
  QueryState,
  SearchInput,
  Toolbar,
  type DataTableColumn,
} from "@/components/kit";
import {
  useDeleteRsvp,
  useRsvps,
  useRsvpStats,
  useUpdateRsvp,
} from "@/hooks/use-rsvp";
import type { RsvpResponse } from "@/types/api";
import { formatDateTime } from "@/lib/utils";

export function RsvpTab({ weddingId }: { weddingId: number }) {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: stats } = useRsvpStats(weddingId);
  const rsvps = useRsvps(weddingId, {
    status: status || undefined,
    search: search || undefined,
    page,
  });
  const { mutate: updateRsvp } = useUpdateRsvp(weddingId);
  const { mutate: removeRsvp } = useDeleteRsvp(weddingId);
  const confirm = useConfirm();

  const columns = useMemo<DataTableColumn<RsvpResponse>[]>(
    () => [
      {
        key: "guest",
        header: "Guest",
        className: "font-medium text-zinc-800",
        cell: (rsvp) => (
          <>
            {rsvp.guest_name}
            {rsvp.guest?.group ? (
              <p className="text-xs font-normal text-zinc-500">{rsvp.guest.group.name}</p>
            ) : null}
          </>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        hideBelow: "md",
        cell: (rsvp) => rsvp.phone ?? "—",
      },
      {
        key: "count",
        header: "Guests #",
        cell: (rsvp) => rsvp.number_of_guests,
      },
      {
        key: "status",
        header: "Status",
        cell: (rsvp) => (
          <Badge variant={statusVariant(rsvp.status)}>
            <span className="capitalize">{rsvp.status}</span>
          </Badge>
        ),
      },
      {
        key: "message",
        header: "Message",
        hideBelow: "lg",
        className: "max-w-56",
        cell: (rsvp) => (
          <p className="truncate text-zinc-600" title={rsvp.message ?? ""}>
            {rsvp.message ?? "—"}
          </p>
        ),
      },
      {
        key: "responded",
        header: "Responded",
        hideBelow: "sm",
        className: "text-xs text-zinc-500",
        cell: (rsvp) => formatDateTime(rsvp.responded_at),
      },
      {
        key: "actions",
        header: "Actions",
        headClassName: "w-28",
        cell: (rsvp) => (
          <div className="flex items-center gap-1">
            <Select
              className="h-8 w-28 text-xs"
              aria-label={`Change status for ${rsvp.guest_name}`}
              value={rsvp.status}
              onChange={(event) =>
                updateRsvp({
                  rsvpId: rsvp.id,
                  payload: { status: event.target.value as typeof rsvp.status },
                })
              }
            >
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="maybe">Maybe</option>
              <option value="pending">Pending</option>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete RSVP"
              onClick={async () => {
                if (
                  await confirm({
                    title: `Delete RSVP from "${rsvp.guest_name}"?`,
                    description: "This RSVP response will be permanently removed.",
                  })
                ) {
                  removeRsvp(rsvp.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [confirm, removeRsvp, updateRsvp],
  );

  return (
    <div className="space-y-4">
      {stats ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label="Total Guests" value={stats.total_guests} accent="emerald" />
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            hint={`${stats.expected_attendees} attendees expected`}
            accent="sky"
          />
          <StatCard label="Declined" value={stats.declined} accent="rose" />
          <StatCard
            label="Pending / Maybe"
            value={stats.pending + stats.maybe}
            accent="amber"
          />
        </div>
      ) : null}

      <Toolbar>
        <SearchInput
          placeholder="Search by name or phone..."
          onSearch={(query) => {
            setSearch(query);
            setPage(1);
          }}
        />
        <Select
          className="w-40"
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="maybe">Maybe</option>
          <option value="pending">Pending</option>
        </Select>
      </Toolbar>

      <QueryState
        query={rsvps}
        loadingLabel="Loading RSVP responses..."
        empty={{
          title: "No RSVP responses",
          description: "Responses submitted through the public invitation will appear here.",
        }}
      >
        {(rsvpsPage) => (
          <DataTable
            caption="RSVP responses"
            columns={columns}
            rows={rsvpsPage.data}
            rowKey={(rsvp) => rsvp.id}
            meta={rsvpsPage.meta}
            onPageChange={setPage}
            isFetching={rsvps.isFetching}
          />
        )}
      </QueryState>
    </div>
  );
}
