"use client";

import { Megaphone, Plus, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useSendAnnouncement,
} from "@/hooks/use-announcements";
import { apiErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  in_app: "In-App",
};

interface AnnouncementForm {
  title: string;
  body: string;
  channel: string;
}

export function AnnouncementsTab({ weddingId }: { weddingId: number }) {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useAnnouncements(weddingId, page);
  const createAnnouncement = useCreateAnnouncement(weddingId);
  const sendAnnouncement = useSendAnnouncement(weddingId);
  const deleteAnnouncement = useDeleteAnnouncement(weddingId);

  const form = useForm<AnnouncementForm>({
    defaultValues: { title: "", body: "", channel: "email" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await createAnnouncement.mutateAsync(values);
      form.reset({ title: "", body: "", channel: "email" });
      setDialogOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isLoading ? (
        <PageLoader label="Loading announcements..." />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No announcements"
          description="Send updates to guests by email, SMS (provider-ready) or in-app notification."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.data.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900">{announcement.title}</p>
                      <Badge variant="secondary">
                        {CHANNEL_LABELS[announcement.channel] ?? announcement.channel}
                      </Badge>
                      <Badge variant={statusVariant(announcement.status)}>
                        <span className="capitalize">{announcement.status}</span>
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {announcement.body}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {announcement.sent_at
                        ? `Sent ${formatDateTime(announcement.sent_at)} · ${announcement.notification_logs_count ?? 0} deliveries`
                        : `Created ${formatDateTime(announcement.created_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {announcement.status !== "sent" ? (
                    <Button
                      size="sm"
                      onClick={() => sendAnnouncement.mutate(announcement.id)}
                      disabled={sendAnnouncement.isPending}
                    >
                      <Send className="h-4 w-4" /> Send Now
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete announcement"
                    onClick={() => {
                      if (confirm(`Delete "${announcement.title}"?`)) {
                        deleteAnnouncement.mutate(announcement.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="New Announcement"
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="announcement-title">Title</Label>
            <Input id="announcement-title" {...form.register("title", { required: true })} />
          </div>
          <div>
            <Label htmlFor="announcement-channel">Channel</Label>
            <Select id="announcement-channel" {...form.register("channel")}>
              <option value="email">Email (guests with email)</option>
              <option value="sms">SMS (queued for provider)</option>
              <option value="in_app">In-App (wedding members)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="announcement-body">Message</Label>
            <Textarea
              id="announcement-body"
              rows={5}
              {...form.register("body", { required: true })}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAnnouncement.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
