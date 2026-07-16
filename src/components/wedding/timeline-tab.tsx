"use client";

import { CalendarClock, MapPin, Pencil, Plus, Save, Trash2 } from "lucide-react";
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
import { useInvitations, useUpdateInvitation } from "@/hooks/use-invitations";
import {
  useCreateTimelineEvent,
  useDeleteTimelineEvent,
  useTimeline,
  useUpdateTimelineEvent,
} from "@/hooks/use-timeline";
import { useUpdateWedding, useWedding } from "@/hooks/use-weddings";
import { apiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { TimelineEvent } from "@/types/api";

type WeddingDay = { date: string; time: string; venue: string };
const EMPTY_DAY: WeddingDay = { date: "", time: "", venue: "" };

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
  const { data: wedding } = useWedding(weddingId);
  const { data: invitations } = useInvitations(weddingId);
  const updateInvitation = useUpdateInvitation(weddingId);
  const updateWedding = useUpdateWedding(weddingId);

  const timeline = useTimeline(weddingId);
  const createEvent = useCreateTimelineEvent(weddingId);
  const updateEvent = useUpdateTimelineEvent(weddingId);
  const { mutate: removeEvent } = useDeleteTimelineEvent(weddingId);
  const confirm = useConfirm();

  const [weddingDays, setWeddingDays] = useState<WeddingDay[]>([EMPTY_DAY]);
  const [mainDayIndex, setMainDayIndex] = useState<number>(0);
  const [daysSavedMsg, setDaysSavedMsg] = useState(false);

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
    if (saved.length > 0) {
      setWeddingDays(saved);
    }
    if (typeof s.main_wedding_day_index === "number") {
      setMainDayIndex(s.main_wedding_day_index);
    }
  }, [invitation]);

  const updateWeddingDay = (i: number, patch: Partial<WeddingDay>) =>
    setWeddingDays((days) => days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const handleSaveDays = async () => {
    if (!invitation) return;
    setError(null);
    const cleanDays = weddingDays.filter((d) => d.date);
    const currentSettings = (invitation?.settings as Record<string, unknown>) ?? {};

    try {
      await updateInvitation.mutateAsync({
        invitationId: invitation.id,
        payload: {
          settings: {
            ...currentSettings,
            wedding_days: cleanDays,
            main_wedding_day_index: mainDayIndex,
          },
        },
      });
      setDaysSavedMsg(true);
      setTimeout(() => setDaysSavedMsg(false), 2500);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

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
      {/* Wedding Program Days Section */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-stone-800">Wedding Program Days</h2>
            <p className="text-xs text-stone-500">Configure multi-day wedding program dates and venues</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setWeddingDays((days) => [...days, EMPTY_DAY])}
            >
              <Plus className="h-3.5 w-3.5" /> Add Day
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveDays}
              disabled={updateInvitation.isPending || updateWedding.isPending}
            >
              <Save className="h-3.5 w-3.5" />
              {updateInvitation.isPending || updateWedding.isPending ? "Saving..." : "Save Days"}
            </Button>
          </div>
        </div>

        {daysSavedMsg && (
          <p className="text-xs font-semibold text-emerald-600">✓ Wedding days updated successfully!</p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {weddingDays.map((day, i) => (
            <div
              key={i}
              className={`relative space-y-2 rounded-lg border p-3 transition-colors ${
                mainDayIndex === i
                  ? "border-amber-300 bg-amber-50/50 ring-1 ring-amber-200"
                  : "border-stone-200 bg-stone-50/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700">
                    ថ្ងៃទី{i + 1} · Day {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMainDayIndex(i)}
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      mainDayIndex === i
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-stone-200/80 text-stone-600 hover:bg-stone-300"
                    }`}
                  >
                    {mainDayIndex === i ? "★ Main Wedding Date" : "Set as Main Date"}
                  </button>
                </div>
                {weddingDays.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setWeddingDays((days) => days.filter((_, idx) => idx !== i));
                      if (mainDayIndex === i) setMainDayIndex(0);
                    }}
                    className="text-stone-400 hover:text-red-500 transition"
                    aria-label={`Remove day ${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] uppercase text-stone-500">Date</Label>
                  <Input
                    type="date"
                    value={day.date}
                    onChange={(e) => updateWeddingDay(i, { date: e.target.value })}
                    className="h-8 bg-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-stone-500">Time</Label>
                  <Input
                    type="time"
                    value={day.time}
                    onChange={(e) => updateWeddingDay(i, { time: e.target.value })}
                    className="h-8 bg-white text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-stone-500">Venue (optional)</Label>
                <Input
                  value={day.venue}
                  onChange={(e) => updateWeddingDay(i, { venue: e.target.value })}
                  placeholder={i === 0 ? "Ceremony venue" : "Reception venue"}
                  className="h-8 bg-white text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

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
                {weddingDays.map((day, i) => (
                  <option key={i} value={i}>
                    Day {i + 1}{day.date ? ` — ${formatDayOption(day.date)}` : " (no date)"}
                  </option>
                ))}
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

