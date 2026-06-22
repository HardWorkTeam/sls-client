"use client";

import { ArrowLeft, Eye, RefreshCw, Save, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/spinner";
import { TemplatePicker } from "@/components/wedding/TemplatePicker";
import { useTemplates } from "@/hooks/use-admin";
import {
  useInvitations,
  usePublishInvitation,
  useUpdateInvitation,
} from "@/hooks/use-invitations";
import { useMyWedding } from "@/hooks/use-my-wedding";

// ── Section keys matching InvitationData.sectionsVisibility ──────────────────
const SECTION_KEYS = [
  "Cover",
  "CoupleInfo",
  "LoveStory",
  "Schedule",
  "Gallery",
  "Location",
  "GiftRegistry",
  "RSVP",
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const DEFAULT_SECTIONS: Record<SectionKey, boolean> = {
  Cover: true,
  CoupleInfo: true,
  LoveStory: true,
  Schedule: true,
  Gallery: true,
  Location: true,
  GiftRegistry: true,
  RSVP: true,
};

// ── Accordion ────────────────────────────────────────────────────────────────
function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-stone-50 p-4 transition-colors hover:bg-stone-100"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-stone-600">
          {title}
        </span>
        <span className="text-xs text-stone-400">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-stone-200 p-4">{children}</div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function InvitationEditPage() {
  const params = useParams();
  const invitationId = Number(params.id);

  const { wedding, isLoading: weddingLoading } = useMyWedding();
  const { data: invitations, isLoading: invLoading } = useInvitations(
    wedding?.id ?? 0,
  );
  const { data: templates } = useTemplates();
  const updateInvitation = useUpdateInvitation(wedding?.id ?? 0);
  const publishInvitation = usePublishInvitation(wedding?.id ?? 0);

  const invitation = invitations?.find((i) => i.id === invitationId);

  // ── Local edit state ───────────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [coverImagePath, setCoverImagePath] = useState("");
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(DEFAULT_SECTIONS);
  const [textKh, setTextKh] = useState(
    "មានកិត្តិយសសូមគោរពអញ្ជើញ ចូលរួមជាភ្ញៀវកិត្តិយស",
  );
  const [textEn, setTextEn] = useState(
    "CORDIALLY REQUEST THE HONOR OF YOUR PRESENCE",
  );
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  // Initialise form from API data
  useEffect(() => {
    if (!invitation) return;
    setTemplateId(
      invitation.invitation_template_id
        ? String(invitation.invitation_template_id)
        : "",
    );
    setTitle(invitation.title ?? "");
    setCoverImagePath(invitation.cover_image_path ?? "");
    const s = invitation.settings as Record<string, unknown> | null;
    if (s?.sections) setSections((prev) => ({ ...prev, ...(s.sections as Record<SectionKey, boolean>) }));
    if (typeof s?.invitation_text_kh === "string") setTextKh(s.invitation_text_kh);
    if (typeof s?.invitation_text_en === "string") setTextEn(s.invitation_text_en);
  }, [invitation]);

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!invitation) return;
    setSaving(true);
    setSaveState("idle");
    try {
      await updateInvitation.mutateAsync({
        invitationId: invitation.id,
        payload: {
          invitation_template_id: templateId ? Number(templateId) : null,
          title: title || null,
          cover_image_path: coverImagePath || null,
          settings: {
            ...((invitation.settings as Record<string, unknown>) ?? {}),
            sections,
            invitation_text_kh: textKh,
            invitation_text_en: textEn,
          },
        },
      });
      setSaveState("saved");
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / not-found states ─────────────────────────────────────────────
  if (weddingLoading || invLoading) {
    return <PageLoader label="Loading invitation..." />;
  }
  if (!wedding || !invitation) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Invitation not found.{" "}
        <Link href="/invitations" className="text-emerald-600 underline">
          Back to invitations
        </Link>
      </div>
    );
  }

  const isPublished = invitation.status === "published";

  return (
    // Escape the portal layout padding with negative margins, fill viewport
    <div className="-m-4 md:-m-6 lg:-m-8 flex overflow-hidden h-[calc(100dvh-4rem)] md:h-dvh">

      {/* ── LEFT: scrollable form sidebar ── */}
      <div className="flex h-full w-full flex-col overflow-hidden border-r border-stone-200 bg-white shadow-xl md:w-[440px] md:flex-shrink-0">

        {/* Sticky header */}
        <div className="sticky top-0 z-20 border-b border-stone-100 bg-stone-50 px-5 py-4">
          <Link
            href="/invitations"
            className="mb-1 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
          >
            <ArrowLeft className="h-3 w-3" /> Back to invitations
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-bold tracking-wide text-rose-800">
                Invitation Editor
              </h1>
              <p className="font-mono text-xs text-stone-500">
                {invitation.invitation_code}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {isPublished ? (
                <a href={invitation.public_url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3.5 w-3.5" /> View Live
                  </Button>
                </a>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={publishInvitation.isPending}
                  onClick={() => publishInvitation.mutate(invitation.id)}
                >
                  <Send className="h-3.5 w-3.5" />
                  {publishInvitation.isPending ? "Publishing…" : "Publish"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">

          {/* 1. Template & Title */}
          <Accordion title="1. Template & Title" defaultOpen>
            <div>
              <Label className="mb-2 block">Template</Label>
              <TemplatePicker
                templates={templates ?? []}
                value={templateId}
                onChange={setTemplateId}
              />
            </div>
            <div>
              <Label htmlFor="inv-title">Invitation Title</Label>
              <Input
                id="inv-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="You are invited to our wedding"
              />
            </div>
            <div>
              <Label htmlFor="inv-cover">Cover Image URL</Label>
              <Input
                id="inv-cover"
                value={coverImagePath}
                onChange={(e) => setCoverImagePath(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </Accordion>

          {/* 2. Section Visibility */}
          <Accordion title="2. Section Visibility">
            <div className="grid grid-cols-2 gap-3">
              {SECTION_KEYS.map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sections[key]}
                    onChange={() =>
                      setSections((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className="h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-semibold text-stone-600">{key}</span>
                </label>
              ))}
            </div>
          </Accordion>

          {/* 3. Invitation Text */}
          <Accordion title="3. Invitation Text">
            <div>
              <Label htmlFor="text-kh">Khmer Text</Label>
              <textarea
                id="text-kh"
                value={textKh}
                onChange={(e) => setTextKh(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 p-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <Label htmlFor="text-en">English Text</Label>
              <textarea
                id="text-en"
                value={textEn}
                onChange={(e) => setTextEn(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 p-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </Accordion>

        </div>

        {/* Sticky save button */}
        <div className="sticky bottom-0 border-t border-stone-200 bg-white p-4">
          {saveState === "error" && (
            <p className="mb-2 text-xs text-red-600">Failed to save — please try again.</p>
          )}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : saveState === "saved" ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── RIGHT: live preview panel ── */}
      <div className="relative hidden flex-1 items-center justify-center bg-stone-200/50 md:flex">

        {/* Status badge */}
        <div className="absolute right-6 top-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-stone-400">
          {isPublished ? (
            <>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live Preview
              <button
                type="button"
                className="ml-2 text-stone-400 hover:text-stone-700"
                onClick={() => setPreviewKey((k) => k + 1)}
                title="Refresh preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              Draft — publish to preview
            </>
          )}
        </div>

        {/* Phone frame mockup */}
        <div
          className="relative w-full max-w-[390px] overflow-hidden rounded-[2.5rem] bg-black p-3 shadow-2xl ring-1 ring-stone-900/5"
          style={{
            height: "min(850px, 90vh)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.08)",
          }}
        >
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-50 h-7 w-28 -translate-x-1/2 rounded-b-3xl bg-black" />

          {/* Screen */}
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white">
            {isPublished ? (
              <iframe
                key={previewKey}
                src={invitation.public_url}
                title="Invitation preview"
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-2xl">
                  📬
                </div>
                <div>
                  <p className="font-semibold text-stone-700">Preview not available</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Save your changes, then publish the invitation to see the live preview here.
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={publishInvitation.isPending}
                  onClick={async () => {
                    await handleSave();
                    publishInvitation.mutate(invitation.id);
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  Save & Publish
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
