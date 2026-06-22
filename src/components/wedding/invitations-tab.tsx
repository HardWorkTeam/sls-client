"use client";

import { Copy, ExternalLink, Pencil, Plus, QrCode, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/spinner";
import { TemplatePicker } from "@/components/wedding/TemplatePicker";
import { useTemplates } from "@/hooks/use-admin";
import {
  useCreateInvitation,
  useDeleteInvitation,
  useInvitations,
  usePublishInvitation,
  useUpdateInvitation,
} from "@/hooks/use-invitations";
import { apiErrorMessage } from "@/lib/api";
import type { Invitation } from "@/types/api";
import { invitationService } from "@/services/invitation-service";

interface InvitationForm {
  title: string;
  invitation_template_id: string;
}

export function InvitationsTab({ weddingId }: { weddingId: number }) {
  const { data: invitations, isLoading } = useInvitations(weddingId);
  const { data: templates } = useTemplates();
  const createInvitation = useCreateInvitation(weddingId);
  const updateInvitation = useUpdateInvitation(weddingId);
  const publishInvitation = usePublishInvitation(weddingId);
  const deleteInvitation = useDeleteInvitation(weddingId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Invitation | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const createForm = useForm<InvitationForm>({
    defaultValues: { title: "", invitation_template_id: "" },
  });

  const editForm = useForm<InvitationForm>({
    defaultValues: { title: "", invitation_template_id: "" },
  });

  const onCreate = createForm.handleSubmit(async (values) => {
    setError(null);
    try {
      await createInvitation.mutateAsync({
        title: values.title || null,
        invitation_template_id: values.invitation_template_id
          ? Number(values.invitation_template_id)
          : null,
      });
      createForm.reset();
      setCreateOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  });

  const openEdit = (invitation: Invitation) => {
    setEditTarget(invitation);
    setEditError(null);
    editForm.reset({
      title: invitation.title ?? "",
      invitation_template_id: invitation.invitation_template_id
        ? String(invitation.invitation_template_id)
        : "",
    });
  };

  const onEdit = editForm.handleSubmit(async (values) => {
    if (!editTarget) return;
    setEditError(null);
    try {
      await updateInvitation.mutateAsync({
        invitationId: editTarget.id,
        payload: {
          title: values.title || null,
          invitation_template_id: values.invitation_template_id
            ? Number(values.invitation_template_id)
            : null,
        },
      });
      setEditTarget(null);
    } catch (err) {
      setEditError(apiErrorMessage(err));
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-zinc-400 hover:text-zinc-700"
                      onClick={() => openEdit(invitation)}
                      aria-label="Edit invitation"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <Badge variant={statusVariant(invitation.status)}>
                      <span className="capitalize">{invitation.status}</span>
                    </Badge>
                  </div>
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

      {/* ── Create dialog ── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Invitation"
        description="A unique public URL and QR code are generated automatically."
        className="max-w-2xl"
      >
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <Label htmlFor="invitation-title">Title</Label>
            <Input
              id="invitation-title"
              placeholder="You are invited to our wedding"
              {...createForm.register("title")}
            />
          </div>
          <div>
            <Label className="mb-2 block">Template</Label>
            <TemplatePicker
              templates={templates ?? []}
              value={createForm.watch("invitation_template_id")}
              onChange={(id) => createForm.setValue("invitation_template_id", id)}
            />
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

      {/* ── Edit dialog ── */}
      <Dialog
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit Invitation"
        description="Update the title or switch to a different template."
        className="max-w-2xl"
      >
        <form onSubmit={onEdit} className="space-y-4">
          <div>
            <Label htmlFor="edit-invitation-title">Title</Label>
            <Input
              id="edit-invitation-title"
              placeholder="You are invited to our wedding"
              {...editForm.register("title")}
            />
          </div>
          <div>
            <Label className="mb-2 block">Template</Label>
            <TemplatePicker
              templates={templates ?? []}
              value={editForm.watch("invitation_template_id")}
              onChange={(id) => editForm.setValue("invitation_template_id", id)}
            />
          </div>
          {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateInvitation.isPending}>
              {updateInvitation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── QR Code dialog ── */}
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
