"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { useGuests } from "@/hooks/use-guests";
import {
  useAssignSeat,
  useAutoSeat,
  useCreateTable,
  useDeleteTable,
  useSeatingReport,
  useTables,
  useUnassignSeat,
} from "@/hooks/use-seating";
import { apiErrorMessage } from "@/lib/api";
import { seatingService } from "@/services/seating-service";
import { Plus, Trash2, Upload, Wand2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface TableForm {
  table_name: string;
  table_number: string;
  capacity: string;
}

export function SeatingTab({ weddingId }: { weddingId: number }) {
  const { data: tables, isLoading } = useTables(weddingId);
  const { data: report } = useSeatingReport(weddingId);
  // Pull a large page of guests for the assignment dropdown.
  const { data: guestsPage } = useGuests(weddingId, { per_page: 200 });

  const createTable = useCreateTable(weddingId);
  const deleteTable = useDeleteTable(weddingId);
  const assignSeat = useAssignSeat(weddingId);
  const unassignSeat = useUnassignSeat(weddingId);
  const autoSeat = useAutoSeat(weddingId);
  const confirm = useConfirm();

  const [tableDialog, setTableDialog] = useState(false);
  const [assignTableId, setAssignTableId] = useState<number | null>(null);
  const [assignGuestId, setAssignGuestId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const form = useForm<TableForm>({
    defaultValues: { table_name: "", table_number: "", capacity: "10" },
  });

  const unseatedGuests = (guestsPage?.data ?? []).filter(
    (guest) => !guest.seating,
  );

  const onCreateTable = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await createTable.mutateAsync({
        table_name: values.table_name,
        table_number: values.table_number ? Number(values.table_number) : null,
        capacity: Number(values.capacity) || 0,
      });
      form.reset({ table_name: "", table_number: "", capacity: "10" });
      setTableDialog(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const onAssign = async () => {
    if (!assignTableId || !assignGuestId) return;
    setError(null);
    try {
      await assignSeat.mutateAsync({
        guest_id: Number(assignGuestId),
        wedding_table_id: assignTableId,
      });
      setAssignGuestId("");
      setAssignTableId(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const onAutoSeat = async () => {
    setError(null);
    setFeedback(null);
    try {
      const result = await autoSeat.mutateAsync();
      setFeedback(result.message);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const onExport = async () => {
    const blob = await seatingService.exportExcel(weddingId);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "seating.xlsx";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {report ? (
          <p className="text-sm text-zinc-600">
            <span className="font-medium text-zinc-900">
              {report.total_seated}
            </span>{" "}
            of{" "}
            <span className="font-medium text-zinc-900">
              {report.total_capacity}
            </span>{" "}
            seats filled · {report.unseated_guests} guests unseated
          </p>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Upload className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAutoSeat}
            disabled={autoSeat.isPending}
          >
            <Wand2 className="h-4 w-4" /> Auto Seating
          </Button>
          <Button size="sm" onClick={() => setTableDialog(true)}>
            <Plus className="h-4 w-4" /> Add Table
          </Button>
        </div>
      </div>

      {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isLoading ? (
        <PageLoader label="Loading seating plan..." />
      ) : !tables || tables.length === 0 ? (
        <EmptyState
          title="No tables yet"
          description="Create tables, then assign guests manually or use auto seating."
          action={
            <Button onClick={() => setTableDialog(true)}>
              <Plus className="h-4 w-4" /> Add Table
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => {
            const seated = table.seatings?.length ?? 0;
            const isFull = table.capacity > 0 && seated >= table.capacity;
            return (
              <Card key={table.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>
                      {table.table_number ? `#${table.table_number} · ` : ""}
                      {table.table_name}
                    </CardTitle>
                    <p
                      className={`text-xs ${isFull ? "text-red-600" : "text-zinc-500"}`}
                    >
                      {seated}/{table.capacity || "∞"} seats
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${table.table_name}`}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `Delete "${table.table_name}"?`,
                          description: "Seated guests will be unassigned.",
                        })
                      ) {
                        deleteTable.mutate(table.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(table.seatings ?? []).map((seating) => (
                    <div
                      key={seating.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-1.5 text-sm"
                    >
                      <span className="truncate text-zinc-700">
                        {seating.guest?.name ?? `Guest #${seating.guest_id}`}
                        {seating.seat_number ? (
                          <span className="ml-1 text-xs text-zinc-400">
                            seat {seating.seat_number}
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        className="text-zinc-400 hover:text-red-600"
                        aria-label="Unassign guest"
                        onClick={() => unassignSeat.mutate(seating.guest_id)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {assignTableId === table.id ? (
                    <div className="flex gap-2 pt-1">
                      <Select
                        className="h-8 flex-1 text-xs"
                        value={assignGuestId}
                        onChange={(event) =>
                          setAssignGuestId(event.target.value)
                        }
                      >
                        <option value="">Choose guest...</option>
                        {unseatedGuests.map((guest) => (
                          <option key={guest.id} value={guest.id}>
                            {guest.name}
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        onClick={onAssign}
                        disabled={!assignGuestId}
                      >
                        Seat
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isFull}
                      onClick={() => {
                        setAssignTableId(table.id);
                        setAssignGuestId("");
                      }}
                    >
                      <Plus className="h-4 w-4" /> Assign guest
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={tableDialog}
        onClose={() => setTableDialog(false)}
        title="Add Table"
      >
        <form onSubmit={onCreateTable} className="space-y-3">
          <div>
            <Label htmlFor="table-name">Table name</Label>
            <Input
              id="table-name"
              {...form.register("table_name", { required: true })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="table-number">Table number</Label>
              <Input
                id="table-number"
                type="number"
                min={1}
                {...form.register("table_number")}
              />
            </div>
            <div>
              <Label htmlFor="table-capacity">Capacity</Label>
              <Input
                id="table-capacity"
                type="number"
                min={0}
                {...form.register("capacity")}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTableDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTable.isPending}>
              Add Table
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
