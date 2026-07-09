"use client";

import { CalendarClock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, FormField, QueryState, Toolbar } from "@/components/kit";
import {
  useCreateTimelineEvent,
  useDeleteTimelineEvent,
  useTimeline,
  useUpdateTimelineEvent,
} from "@/hooks/use-timeline";
import { apiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { TimelineEvent } from "@/types/api";

function toLocalInput(utcIso: string): string {
  const d = new Date(utcIso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

const CATEGORY_LABELS: Record<string, string> = {
  engagement: "Engagement",
  ceremony: "Ceremony",
  reception: "Reception",
  after_party: "After Party",
  custom: "Custom",
};

interface TimelineForm {
  category: string;
  title: string;
  description: string;
  starts_at: string;
  location: string;
  is_public: boolean;
}

export function TimelineTab({ weddingId }: { weddingId: number }) {
  const timeline = useTimeline(weddingId);
  const createEvent = useCreateTimelineEvent(weddingId);
  const updateEvent = useUpdateTimelineEvent(weddingId);
  const { mutate: removeEvent } = useDeleteTimelineEvent(weddingId);
  const confirm = useConfirm();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TimelineForm>();

  const openCreate = () => {
    setEditing(null);
    setError(null);
    form.reset({
      category: "ceremony",
      title: "",
      description: "",
      starts_at: "",
      location: "",
      is_public: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (event: TimelineEvent) => {
    setEditing(event);
    setError(null);
    form.reset({
      category: event.category,
      title: event.title,
      description: event.description ?? "",
      starts_at: event.starts_at ? toLocalInput(event.starts_at) : "",
      location: event.location ?? "",
      is_public: event.is_public,
    });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const payload = {
      ...values,
      starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
      description: values.description || null,
      location: values.location || null,
    };
    try {
      if (editing) {
        await updateEvent.mutateAsync({ eventId: editing.id, payload });
      } else {
        await createEvent.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  return (
    <div className="space-y-4">
      <Toolbar
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        }
      />

      <QueryState
        query={timeline}
        loadingLabel="Loading timeline..."
        empty={{
          title: "No timeline events",
          description: "Plan the engagement, ceremony, reception and after party.",
          action: (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          ),
        }}
      >
        {(events) => (
          <ol className="relative space-y-4 border-l-2 border-emerald-100 pl-6">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900">{event.title}</h3>
                        <Badge variant="secondary">
                          {CATEGORY_LABELS[event.category] ?? event.category}
                        </Badge>
                        {!event.is_public ? <Badge variant="outline">Private</Badge> : null}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatDateTime(event.starts_at)}
                        </span>
                        {event.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${event.title}`}
                        onClick={() => openEdit(event)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${event.title}`}
                        onClick={async () => {
                          if (
                            await confirm({
                              title: `Delete "${event.title}"?`,
                              description:
                                "This timeline event will be permanently removed.",
                            })
                          ) {
                            removeEvent(event.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {event.description ? (
                    <p className="mt-2 text-sm text-zinc-600">{event.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </QueryState>

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Event" : "Add Timeline Event"}
        onSubmit={onSubmit}
        error={error}
        pending={createEvent.isPending || updateEvent.isPending}
        submitLabel={editing ? "Save Changes" : "Add Event"}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category">
            {(field) => (
              <Select {...field} {...form.register("category")}>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
          <FormField label="Date & time">
            {(field) => (
              <Input type="datetime-local" {...field} {...form.register("starts_at")} />
            )}
          </FormField>
        </div>
        <FormField label="Title" required error={form.formState.errors.title?.message}>
          {(field) => (
            <Input {...field} {...form.register("title", { required: "Title is required" })} />
          )}
        </FormField>
        <FormField label="Location">
          {(field) => <Input {...field} {...form.register("location")} />}
        </FormField>
        <FormField label="Description">
          {(field) => <Textarea {...field} {...form.register("description")} />}
        </FormField>
        <div className="flex items-center gap-2">
          <input id="event-public" type="checkbox" {...form.register("is_public")} />
          <Label htmlFor="event-public">Show on public invitation</Label>
        </div>
      </FormDialog>
    </div>
  );
}
