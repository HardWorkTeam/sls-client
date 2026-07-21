"use client";

import { CalendarClock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, FormField, QueryState, Toolbar } from "@/components/kit";
import { useInvitations } from "@/hooks/use-invitations";
import {
  useCreateTimelineEvent,
  useDeleteTimelineEvent,
  useTimeline,
  useUpdateTimelineEvent,
} from "@/hooks/use-timeline";
import { apiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { TimelineEvent } from "@/types/api";

type WeddingDay = { date: string; time: string; venue: string };

function formatDayOption(date: string): string {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function getDayAndTime(startsAt: string | null, days: WeddingDay[]) {
  if (!startsAt) return { dayIdx: "0", time: "" };
  const d = new Date(startsAt);
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const localTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const idx = days.findIndex((w) => w.date === localDate);
  return { dayIdx: String(idx >= 0 ? idx : 0), time: localTime };
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
  dayIdx: string;
  time: string;
  location: string;
  is_public: boolean;
}

export function TimelineTab({ weddingId }: { weddingId: number }) {
  const { data: invitations } = useInvitations(weddingId);

  const timeline = useTimeline(weddingId);
  const createEvent = useCreateTimelineEvent(weddingId);
  const updateEvent = useUpdateTimelineEvent(weddingId);
  const { mutate: removeEvent } = useDeleteTimelineEvent(weddingId);
  const confirm = useConfirm();

  // Wedding days are configured (and the main wedding date is chosen) in the
  // invitation editor — a wedding can have several invitations, one per day.
  // Here they are READ-ONLY: they populate the "Wedding Day" picker so each
  // timeline event can be pinned to a day. This tab never edits them.
  const [weddingDays, setWeddingDays] = useState<WeddingDay[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TimelineForm>();

  const invitation = invitations?.[0];

  useEffect(() => {
    if (!invitation) return;
    const s = (invitation?.settings ?? {}) as Record<string, unknown>;
    const saved = Array.isArray(s.wedding_days)
      ? (s.wedding_days as Partial<WeddingDay>[]).map((d) => ({
          date: d.date ?? "",
          time: (d.time ?? "").slice(0, 5),
          venue: d.venue ?? "",
        }))
      : [];
    // The editor intentionally hydrates local draft state from the fetched invitation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeddingDays(saved);
  }, [invitation]);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    form.reset({
      category: "ceremony",
      title: "",
      description: "",
      dayIdx: "0",
      time: "",
      location: "",
      is_public: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (event: TimelineEvent) => {
    setEditing(event);
    setError(null);
    const { dayIdx, time } = getDayAndTime(event.starts_at, weddingDays);
    form.reset({
      category: event.category,
      title: event.title,
      description: event.description ?? "",
      dayIdx,
      time,
      location: event.location ?? "",
      is_public: event.is_public,
    });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const day = weddingDays[Number(values.dayIdx)];
    const startsAt = day?.date
      ? new Date(`${day.date}T${values.time || "00:00"}`).toISOString()
      : null;

    const payload = {
      category: values.category,
      title: values.title,
      is_public: values.is_public,
      starts_at: startsAt,
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
    <div className="space-y-6">
      {weddingDays.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Set your wedding day(s) and main wedding date in the invitation editor
          (Event Schedule). Once saved, they appear here so you can pin events to a day.
        </p>
      ) : null}

      {/* Timeline Events Section */}
      <div className="space-y-4">
        <Toolbar
          actions={
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Event
            </Button>
          }
        />

        {error ? <p className="text-xs text-red-600 font-medium">{error}</p> : null}

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
              {events.map((event) => {
                const dayMatch = (() => {
                  if (!event.starts_at) return null;
                  const d = new Date(event.starts_at);
                  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  const idx = weddingDays.findIndex((w) => w.date === local);
                  return idx >= 0 ? { idx, day: weddingDays[idx] } : null;
                })();

                return (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                    <div className="rounded-xl border border-zinc-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-zinc-900">{event.title}</h3>
                            <Badge variant="secondary">
                              {CATEGORY_LABELS[event.category] ?? event.category}
                            </Badge>
                            {dayMatch ? (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
                                Day {dayMatch.idx + 1}
                              </Badge>
                            ) : null}
                            {!event.is_public ? <Badge variant="outline">Private</Badge> : null}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {formatDateTime(event.starts_at)}
                              {dayMatch?.day.venue ? ` · ${dayMatch.day.venue}` : ""}
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
                );
              })}
            </ol>
          )}
        </QueryState>
      </div>

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit Event" : "Add Timeline Event"}
        onSubmit={onSubmit}
        error={error}
        pending={createEvent.isPending || updateEvent.isPending}
        submitLabel={editing ? "Save Changes" : "Add Event"}
      >
        <div className="grid grid-cols-3 gap-3">
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
          <FormField label="Wedding Day">
            {(field) => (
              <Select {...field} {...form.register("dayIdx")}>
                {weddingDays.length === 0 ? (
                  <option value="0">No days configured</option>
                ) : (
                  weddingDays.map((day, i) => (
                    <option key={i} value={i}>
                      Day {i + 1}{day.date ? ` — ${formatDayOption(day.date)}` : " (no date)"}
                    </option>
                  ))
                )}
              </Select>
            )}
          </FormField>
          <FormField label="Time">
            {(field) => (
              <Input type="time" {...field} {...form.register("time")} />
            )}
          </FormField>
        </div>
        <FormField label="Title" required error={form.formState.errors.title?.message}>
          {(field) => (
            <Input {...field} {...form.register("title", { required: "Title is required" })} />
          )}
        </FormField>
        <FormField label="Location">
          {(field) => <Input {...field} {...form.register("location")} placeholder="Venue / hall name" />}
        </FormField>
        <FormField label="Description">
          {(field) => <Textarea {...field} {...form.register("description")} placeholder="Details about this program segment" />}
        </FormField>
        <div className="flex items-center gap-2 pt-1">
          <input id="event-public" type="checkbox" {...form.register("is_public")} />
          <Label htmlFor="event-public">Show on public invitation</Label>
        </div>
      </FormDialog>
    </div>
  );
}
