"use client";

import { Copy, ExternalLink, Plus, QrCode, Send, Trash2 } from "lucide-react";
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
import { useTemplates } from "@/hooks/use-admin";
import {
  useCreateInvitation,
  useDeleteInvitation,
  useInvitations,
  usePublishInvitation,
} from "@/hooks/use-invitations";
import { apiErrorMessage } from "@/lib/api";
import { invitationService } from "@/services/invitation-service";

interface InvitationForm {
  title: string;
  invitation_template_id: string;
}

export function InvitationsTab({ weddingId }: { weddingId: number }) {
  const { data: invitations, isLoading } = useInvitations(weddingId);
  const { data: templates } = useTemplates();
  const createInvitation = useCreateInvitation(weddingId);
  const publishInvitation = usePublishInvitation(weddingId);
  const deleteInvitation = useDeleteInvitation(weddingId);

  const [createOpen, setCreateOpen] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const form = useForm<InvitationForm>({
    defaultValues: { title: "", invitation_template_id: "" },
  });

  const onCreate = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await createInvitation.mutateAsync({
        title: values.title || null,
        invitation_template_id: values.invitation_template_id
          ? Number(values.invitation_template_id)
          : null,
      });
      form.reset();
      setCreateOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const showQr = async (invitationId: number) => {
    const svg = await invitationService.qrSvg(weddingId, invitationId);
    setQrSvg(svg);
  };

  const copyUrl = async (invitationId: number, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(invitationId);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create Invitation
        </Button>
      </div>

      {isLoading ? (
        <PageLoader label="Loading invitations..." />
      ) : !invitations || invitations.length === 0 ? (
        <EmptyState
          title="No invitations yet"
          description="Create a digital invitation, publish it, then share the link or QR code with guests."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create Invitation
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {invitation.title ?? "Untitled invitation"}
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      {invitation.invitation_code}
                    </p>
                  </div>
                  <Badge variant={statusVariant(invitation.status)}>
                    <span className="capitalize">{invitation.status}</span>
                  </Badge>
                </div>

                <div className="text-sm text-zinc-600">
                  <p>Template: {invitation.template?.name ?? "None"}</p>
                  <p>
                    Guests: {invitation.guests_count ?? 0} · Responses:{" "}
                    {invitation.rsvp_responses_count ?? 0}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2">
                  <p className="flex-1 truncate font-mono text-xs text-zinc-600">
                    {invitation.public_url}
                  </p>
                  <button
                    type="button"
                    className="text-zinc-400 hover:text-zinc-700"
                    onClick={() => copyUrl(invitation.id, invitation.public_url)}
                    aria-label="Copy public URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {copied === invitation.id ? (
                    <span className="text-xs text-emerald-600">Copied!</span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {invitation.status !== "published" ? (
                    <Button
                      size="sm"
                      onClick={() => publishInvitation.mutate(invitation.id)}
                      disabled={publishInvitation.isPending}
                    >
                      <Send className="h-4 w-4" /> Publish
                    </Button>
                  ) : (
                    <a href={invitation.public_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="secondary">
                        <ExternalLink className="h-4 w-4" /> Open
                      </Button>
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => showQr(invitation.id)}>
                    <QrCode className="h-4 w-4" /> QR Code
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Delete this invitation?")) {
                        deleteInvitation.mutate(invitation.id);
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
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Invitation"
        description="A unique public URL and QR code are generated automatically."
      >
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <Label htmlFor="invitation-title">Title</Label>
            <Input
              id="invitation-title"
              placeholder="You are invited to our wedding"
              {...form.register("title")}
            />
          </div>
          <div>
            <Label htmlFor="invitation-template">Template</Label>
            <Select id="invitation-template" {...form.register("invitation_template_id")}>
              <option value="">No template</option>
              {(templates ?? []).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={qrSvg !== null}
        onClose={() => setQrSvg(null)}
        title="Invitation QR Code"
        description="Guests can scan this code to open the invitation."
        className="max-w-sm"
      >
        {qrSvg ? (
          <div
            className="flex justify-center [&_svg]:h-64 [&_svg]:w-64"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
