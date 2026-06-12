"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
  useDeleteRsvp,
  useRsvps,
  useRsvpStats,
  useUpdateRsvp,
} from "@/hooks/use-rsvp";
import { formatDateTime } from "@/lib/utils";

export function RsvpTab({ weddingId }: { weddingId: number }) {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: stats } = useRsvpStats(weddingId);
  const { data, isLoading } = useRsvps(weddingId, {
    status: status || undefined,
    search: search || undefined,
    page,
  });
  const updateRsvp = useUpdateRsvp(weddingId);
  const deleteRsvp = useDeleteRsvp(weddingId);

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

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or phone..."
          className="max-w-xs"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          className="w-40"
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
      </div>

      {isLoading ? (
        <PageLoader label="Loading RSVP responses..." />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No RSVP responses"
          description="Responses submitted through the public invitation will appear here."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Guests #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Responded</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((rsvp) => (
                <TableRow key={rsvp.id}>
                  <TableCell className="font-medium text-zinc-800">
                    {rsvp.guest_name}
                    {rsvp.guest?.group ? (
                      <p className="text-xs text-zinc-500">{rsvp.guest.group.name}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>{rsvp.phone ?? "—"}</TableCell>
                  <TableCell>{rsvp.number_of_guests}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(rsvp.status)}>
                      <span className="capitalize">{rsvp.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-56">
                    <p className="truncate text-zinc-600" title={rsvp.message ?? ""}>
                      {rsvp.message ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {formatDateTime(rsvp.responded_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Select
                        className="h-8 w-28 text-xs"
                        value={rsvp.status}
                        onChange={(event) =>
                          updateRsvp.mutate({
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
                        onClick={() => {
                          if (confirm(`Delete RSVP from "${rsvp.guest_name}"?`)) {
                            deleteRsvp.mutate(rsvp.id);
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
    </div>
  );
}
