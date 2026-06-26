"use client";

import { Copy, Eye, Plus, QrCode, Send, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  TemplatePicker,
  TemplatePreviewGallery,
} from "@/components/wedding/TemplatePicker";
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

export function InvitationsTab({
  weddingId,
  designLimit,
  isPaid = true,
}: {
  weddingId: number;
  // Plan cap on distinct invitation designs (null/undefined = unlimited).
  // The API enforces the real limit; this drives the on-screen counter.
  designLimit?: number | null;
  // Whether the wedding's plan is PAID (admin-confirmed). Until then the tab
  // is a read-only template preview (no create, no counter).
  isPaid?: boolean;
}) {
  const router = useRouter();
  const { data: invitations, isLoading } = useInvitations(weddingId);
  const { data: templates } = useTemplates();
  const createInvitation = useCreateInvitation(weddingId);
  const publishInvitation = usePublishInvitation(weddingId);
  const deleteInvitation = useDeleteInvitation(weddingId);

  const [createOpen, setCreateOpen] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const createForm = useForm<InvitationForm>({
    defaultValues: { title: "", invitation_template_id: "" },
  });

  const onCreate = createForm.handleSubmit(async (values) => {
    setError(null);
    try {
      const created = await createInvitation.mutateAsync({
        title: values.title || null,
        invitation_template_id: values.invitation_template_id
          ? Number(values.invitation_template_id)
          : null,
      });
      createForm.reset();
      setCreateOpen(false);
      // Navigate to the editor right away
      router.push(`/invitations/${created.id}`);
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

  // Distinct templates already in use — what counts against the plan's
  // design cap. Reusing one of these never consumes a new slot.
  const usedDesigns = new Set(
    (invitations ?? [])
      .map((invitation) => invitation.invitation_template_id)
      .filter((id): id is number => id != null),
  ).size;
  const atDesignLimit = designLimit != null && usedDesigns >= designLimit;

  // Plan not paid yet → read-only preview of the available designs. No
  // create button, no usage counter — just a look at the templates.
  if (!isPaid) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-500">
          Click any design to preview the full invitation.
        </p>
        {!templates ? (
          <PageLoader label="Loading designs..." />
        ) : (
          <TemplatePreviewGallery templates={templates} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {designLimit != null ? (
          <p className="text-sm text-zinc-500">
            {usedDesigns} / {designLimit} invitation designs used on your plan.
          </p>
        ) : (
          <span />
        )}
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Create Invitation
        </Button>
      </div>

      {isLoading ? (
        <PageLoader label="Loading invitations..." />
      ) : !invitations || invitations.length === 0 ? (
        <EmptyState
          title="No invitations yet"
          description="Create a digital invitation, choose a template, then publish and share the link or QR code."
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
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {invitation.title ?? "Untitled invitation"}
                    </p>
                    <p className="font-mono text-xs text-zinc-500">
                      {invitation.invitation_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Edit → full-page editor */}
                    <button
                      type="button"
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      onClick={() => router.push(`/invitations/${invitation.id}`)}
                      aria-label="Edit invitation"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {/* View → open live URL */}
                    <a
                      href={invitation.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      aria-label="View invitation"
                      title="View live"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <Badge variant={statusVariant(invitation.status)}>
                      <span className="capitalize">{invitation.status}</span>
                    </Badge>
                  </div>
                </div>

                {/* Meta */}
                <div className="text-sm text-zinc-600">
                  <p>Template: {invitation.template?.name ?? "None"}</p>
                  <p>
                    Guests: {invitation.guests_count ?? 0} · Responses:{" "}
                    {invitation.rsvp_responses_count ?? 0}
                  </p>
                </div>

                {/* URL row */}
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

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {invitation.status !== "published" ? (
                    <Button
                      size="sm"
                      onClick={() => publishInvitation.mutate(invitation.id)}
                      disabled={publishInvitation.isPending}
                    >
                      <Send className="h-4 w-4" /> Publish
                    </Button>
                  ) : null}
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
        description="Pick a template now or change it later in the editor."
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
            {atDesignLimit ? (
              <p className="mt-2 text-sm text-amber-600">
                You&apos;ve reached your plan&apos;s {designLimit} design limit. Pick a
                template you already use, or{" "}
                <Link href="/plan" className="font-medium underline">
                  upgrade your plan
                </Link>{" "}
                for more.
              </p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending ? "Creating…" : "Create & Edit"}
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
