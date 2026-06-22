"use client";

import { ArrowLeft, Eye, RefreshCw, Save, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
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
import { useUpdateWedding } from "@/hooks/use-weddings";

// ── Section keys ─────────────────────────────────────────────────────────────
const SECTION_KEYS = [
  "Cover", "CoupleInfo", "LoveStory", "Schedule",
  "Gallery", "Location", "GiftRegistry", "RSVP",
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const DEFAULT_SECTIONS: Record<SectionKey, boolean> = {
  Cover: true, CoupleInfo: true, LoveStory: true, Schedule: true,
  Gallery: true, Location: true, GiftRegistry: true, RSVP: true,
};

// ── Accordion ─────────────────────────────────────────────────────────────────
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

// ── Field helpers ─────────────────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
        {label}
      </Label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-white text-xs"
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InvitationEditPage() {
  const params = useParams();
  const invitationId = Number(params.id);

  const { wedding, isLoading: weddingLoading } = useMyWedding();
  const { data: invitations, isLoading: invLoading } = useInvitations(wedding?.id ?? 0);
  const { data: templates } = useTemplates();
  const updateInvitation = useUpdateInvitation(wedding?.id ?? 0);
  const updateWedding = useUpdateWedding(wedding?.id ?? 0);
  const publishInvitation = usePublishInvitation(wedding?.id ?? 0);

  const invitation = invitations?.find((i) => i.id === invitationId);

  // ── Invitation-level state ────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [coverImagePath, setCoverImagePath] = useState("");
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(DEFAULT_SECTIONS);
  const [textKh, setTextKh] = useState("មានកិត្តិយសសូមគោរពអញ្ជើញ ចូលរួមជាភ្ញៀវកិត្តិយស");
  const [textEn, setTextEn] = useState("CORDIALLY REQUEST THE HONOR OF YOUR PRESENCE");

  // Gift registry (stored in invitation settings)
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankQrUrl, setBankQrUrl] = useState("");

  // Gallery URLs (stored in invitation settings)
  const [gallery, setGallery] = useState<string[]>([]);

  // ── Wedding-level state ───────────────────────────────────────────────────
  const [groomNameKh, setGroomNameKh] = useState("");
  const [groomNameEn, setGroomNameEn] = useState("");
  const [groomFather, setGroomFather] = useState("");
  const [groomFatherEn, setGroomFatherEn] = useState("");
  const [groomMother, setGroomMother] = useState("");
  const [groomMotherEn, setGroomMotherEn] = useState("");
  const [groomPhoto, setGroomPhoto] = useState("");

  const [brideNameKh, setBrideNameKh] = useState("");
  const [brideNameEn, setBrideNameEn] = useState("");
  const [brideFather, setBrideFather] = useState("");
  const [brideFatherEn, setBrideFatherEn] = useState("");
  const [brideMother, setBrideMother] = useState("");
  const [brideMotherEn, setBrideMotherEn] = useState("");
  const [bridePhoto, setBridePhoto] = useState("");

  const [weddingDate, setWeddingDate] = useState("");
  const [weddingTime, setWeddingTime] = useState("");
  const [ceremonyVenue, setCeremonyVenue] = useState("");
  const [receptionVenue, setReceptionVenue] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [storyDescription, setStoryDescription] = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  // ── Initialise from API data ──────────────────────────────────────────────
  useEffect(() => {
    if (!invitation) return;
    setTemplateId(invitation.invitation_template_id ? String(invitation.invitation_template_id) : "");
    setTitle(invitation.title ?? "");
    setCoverImagePath(invitation.cover_image_path ?? "");

    const s = (invitation.settings ?? {}) as Record<string, unknown>;
    if (s.sections) setSections((p) => ({ ...p, ...(s.sections as Record<SectionKey, boolean>) }));
    if (typeof s.invitation_text_kh === "string") setTextKh(s.invitation_text_kh);
    if (typeof s.invitation_text_en === "string") setTextEn(s.invitation_text_en);
    if (Array.isArray(s.gallery_urls)) setGallery(s.gallery_urls as string[]);

    const bank = s.bank_account as Record<string, string> | undefined;
    if (bank) {
      setBankName(bank.bank ?? "");
      setAccountName(bank.name ?? "");
      setAccountNumber(bank.number ?? "");
      setBankQrUrl(bank.qr_url ?? "");
    }

    const ext = s.couple_extended as Record<string, Record<string, string>> | undefined;
    if (ext?.groom) {
      setGroomNameKh(ext.groom.nameKh ?? "");
      setGroomNameEn(ext.groom.nameEn ?? "");
      setGroomPhoto(ext.groom.photo ?? "");
      setGroomFather(ext.groom.father ?? "");
      setGroomFatherEn(ext.groom.fatherEn ?? "");
      setGroomMother(ext.groom.mother ?? "");
      setGroomMotherEn(ext.groom.motherEn ?? "");
    }
    if (ext?.bride) {
      setBrideNameKh(ext.bride.nameKh ?? "");
      setBrideNameEn(ext.bride.nameEn ?? "");
      setBridePhoto(ext.bride.photo ?? "");
      setBrideFather(ext.bride.father ?? "");
      setBrideFatherEn(ext.bride.fatherEn ?? "");
      setBrideMother(ext.bride.mother ?? "");
      setBrideMotherEn(ext.bride.motherEn ?? "");
    }
  }, [invitation]);

  useEffect(() => {
    if (!wedding) return;
    setWeddingDate(wedding.wedding_date ?? "");
    setWeddingTime(wedding.wedding_time ?? "");
    setCeremonyVenue(wedding.ceremony_venue ?? "");
    setReceptionVenue(wedding.reception_venue ?? "");
    setMapsLink(wedding.google_map_link ?? "");
    setStoryDescription(wedding.story_description ?? "");
  }, [wedding]);

  // ── Save all ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!invitation || !wedding) return;
    setSaving(true);
    setSaveState("idle");
    try {
      await Promise.all([
        // 1. Save wedding-level event fields (names/photos live in invitation settings)
        updateWedding.mutateAsync({
          wedding_date: weddingDate || null,
          wedding_time: weddingTime || null,
          ceremony_venue: ceremonyVenue || null,
          reception_venue: receptionVenue || null,
          google_map_link: mapsLink || null,
          story_description: storyDescription || null,
        }),
        // 2. Save invitation fields + settings
        updateInvitation.mutateAsync({
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
              gallery_urls: gallery.filter(Boolean),
              bank_account: {
                bank: bankName,
                name: accountName,
                number: accountNumber,
                qr_url: bankQrUrl,
              },
              couple_extended: {
                groom: {
                  nameKh: groomNameKh,
                  nameEn: groomNameEn,
                  photo: groomPhoto,
                  father: groomFather,
                  fatherEn: groomFatherEn,
                  mother: groomMother,
                  motherEn: groomMotherEn,
                },
                bride: {
                  nameKh: brideNameKh,
                  nameEn: brideNameEn,
                  photo: bridePhoto,
                  father: brideFather,
                  fatherEn: brideFatherEn,
                  mother: brideMother,
                  motherEn: brideMotherEn,
                },
              },
            },
          },
        }),
      ]);
      setSaveState("saved");
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (weddingLoading || invLoading) return <PageLoader label="Loading invitation…" />;
  if (!wedding || !invitation) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Invitation not found.{" "}
        <Link href="/invitations" className="text-emerald-600 underline">
          Back
        </Link>
      </div>
    );
  }

  const isPublished = invitation.status === "published";

  // Gallery helpers
  const updateGalleryItem = (i: number, v: string) =>
    setGallery((g) => g.map((u, idx) => (idx === i ? v : u)));
  const removeGalleryItem = (i: number) =>
    setGallery((g) => g.filter((_, idx) => idx !== i));
  const addGalleryItem = () => setGallery((g) => [...g, ""]);

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 flex overflow-hidden h-[calc(100dvh-4rem)] md:h-dvh">

      {/* ── LEFT: scrollable form sidebar ──────────────────────────────────── */}
      <div className="flex h-full w-full flex-col overflow-hidden border-r border-stone-200 bg-white shadow-xl md:w-[450px] md:flex-shrink-0">

        {/* Sticky header */}
        <div className="sticky top-0 z-20 border-b border-stone-100 bg-stone-50 px-5 py-4">
          <Link href="/invitations"
            className="mb-1 flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800">
            <ArrowLeft className="h-3 w-3" /> Back to invitations
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-bold tracking-wide text-rose-800">Invitation Editor</h1>
              <p className="font-mono text-xs text-stone-500">{invitation.invitation_code}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {isPublished ? (
                <a href={invitation.public_url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    <Eye className="h-3.5 w-3.5" /> View Live
                  </Button>
                </a>
              ) : (
                <Button size="sm" variant="secondary"
                  disabled={publishInvitation.isPending}
                  onClick={() => publishInvitation.mutate(invitation.id)}>
                  <Send className="h-3.5 w-3.5" />
                  {publishInvitation.isPending ? "Publishing…" : "Publish"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable accordion sections */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">

          {/* 1. Template & Title */}
          <Accordion title="1. Template & Title" defaultOpen>
            <FieldRow label="Template">
              <TemplatePicker templates={templates ?? []} value={templateId} onChange={setTemplateId} />
            </FieldRow>
            <FieldRow label="Invitation Title">
              <TextInput value={title} onChange={setTitle} placeholder="You are invited to our wedding" />
            </FieldRow>
            <FieldRow label="Cover Image">
              <ImageUpload weddingId={wedding.id} value={coverImagePath} onChange={setCoverImagePath} placeholder="https://… or upload a cover photo" />
            </FieldRow>
          </Accordion>

          {/* 2. Section Visibility */}
          <Accordion title="2. Section Visibility">
            <div className="grid grid-cols-2 gap-3">
              {SECTION_KEYS.map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sections[key]}
                    onChange={() => setSections((p) => ({ ...p, [key]: !p[key] }))}
                    className="h-4 w-4 rounded border-stone-300 text-rose-600"
                  />
                  <span className="text-xs font-semibold text-stone-600">{key}</span>
                </label>
              ))}
            </div>
          </Accordion>

          {/* 3. Invitation Text */}
          <Accordion title="3. Invitation Text">
            <FieldRow label="Khmer Text">
              <textarea value={textKh} onChange={(e) => setTextKh(e.target.value)} rows={3}
                className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 p-2 text-xs outline-none focus:border-emerald-400" />
            </FieldRow>
            <FieldRow label="English Text">
              <textarea value={textEn} onChange={(e) => setTextEn(e.target.value)} rows={3}
                className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 p-2 text-xs outline-none focus:border-emerald-400" />
            </FieldRow>
          </Accordion>

          {/* 4. Couple Information */}
          <Accordion title="4. Couple Information">
            {(["groom", "bride"] as const).map((person) => {
              const isGroom = person === "groom";
              const nameKh = isGroom ? groomNameKh : brideNameKh;
              const nameEn = isGroom ? groomNameEn : brideNameEn;
              const father = isGroom ? groomFather : brideFather;
              const fatherEn = isGroom ? groomFatherEn : brideFatherEn;
              const mother = isGroom ? groomMother : brideMother;
              const motherEn = isGroom ? groomMotherEn : brideMotherEn;
              const photo = isGroom ? groomPhoto : bridePhoto;
              const setNameKh = isGroom ? setGroomNameKh : setBrideNameKh;
              const setNameEn = isGroom ? setGroomNameEn : setBrideNameEn;
              const setFather = isGroom ? setGroomFather : setBrideFather;
              const setFatherEn = isGroom ? setGroomFatherEn : setBrideFatherEn;
              const setMother = isGroom ? setGroomMother : setBrideMother;
              const setMotherEn = isGroom ? setGroomMotherEn : setBrideMotherEn;
              const setPhoto = isGroom ? setGroomPhoto : setBridePhoto;

              return (
                <div key={person} className="mb-6 last:mb-0 space-y-3 rounded-lg border border-stone-200 bg-stone-50/50 p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 capitalize">{person}</h3>

                  <FieldRow label="Photo">
                    <ImageUpload weddingId={wedding.id} value={photo} onChange={setPhoto} placeholder="https://… or upload" />
                  </FieldRow>

                  <div className="grid grid-cols-2 gap-2">
                    <FieldRow label="Khmer Name">
                      <TextInput value={nameKh} onChange={setNameKh} />
                    </FieldRow>
                    <FieldRow label="English Name">
                      <TextInput value={nameEn} onChange={setNameEn} />
                    </FieldRow>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FieldRow label="Father (Khmer)">
                      <TextInput value={father} onChange={setFather} />
                    </FieldRow>
                    <FieldRow label="Father (English)">
                      <TextInput value={fatherEn} onChange={setFatherEn} />
                    </FieldRow>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FieldRow label="Mother (Khmer)">
                      <TextInput value={mother} onChange={setMother} />
                    </FieldRow>
                    <FieldRow label="Mother (English)">
                      <TextInput value={motherEn} onChange={setMotherEn} />
                    </FieldRow>
                  </div>
                </div>
              );
            })}
          </Accordion>

          {/* 5. Event Schedule */}
          <Accordion title="5. Event Schedule">
            <div className="grid grid-cols-2 gap-2">
              <FieldRow label="Wedding Date">
                <input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)}
                  className="w-full rounded-md border border-stone-200 bg-white p-2 text-xs outline-none focus:border-emerald-400" />
              </FieldRow>
              <FieldRow label="Time">
                <input type="time" value={weddingTime} onChange={(e) => setWeddingTime(e.target.value)}
                  className="w-full rounded-md border border-stone-200 bg-white p-2 text-xs outline-none focus:border-emerald-400" />
              </FieldRow>
            </div>
            <FieldRow label="Ceremony Venue">
              <TextInput value={ceremonyVenue} onChange={setCeremonyVenue} placeholder="Venue name" />
            </FieldRow>
            <FieldRow label="Reception Venue">
              <TextInput value={receptionVenue} onChange={setReceptionVenue} placeholder="Venue name (if different)" />
            </FieldRow>
            <FieldRow label="Google Maps Link">
              <TextInput value={mapsLink} onChange={setMapsLink} placeholder="https://maps.google.com/…" />
            </FieldRow>
          </Accordion>

          {/* 6. Love Story */}
          <Accordion title="6. Love Story">
            <FieldRow label="Our Story">
              <textarea value={storyDescription} onChange={(e) => setStoryDescription(e.target.value)}
                rows={5} placeholder="Tell your story…"
                className="mt-1 w-full rounded-md border border-stone-200 bg-stone-50 p-2 text-xs outline-none focus:border-emerald-400" />
            </FieldRow>
          </Accordion>

          {/* 7. Gift Registry */}
          <Accordion title="7. Gift Registry">
            <FieldRow label="Bank Name">
              <TextInput value={bankName} onChange={setBankName} placeholder="ABA Bank" />
            </FieldRow>
            <FieldRow label="Account Name">
              <TextInput value={accountName} onChange={setAccountName} />
            </FieldRow>
            <FieldRow label="Account Number">
              <TextInput value={accountNumber} onChange={setAccountNumber} />
            </FieldRow>
            <FieldRow label="QR Code Image">
              <ImageUpload weddingId={wedding.id} value={bankQrUrl} onChange={setBankQrUrl} placeholder="https://… or upload QR image" />
            </FieldRow>
          </Accordion>

          {/* 8. Gallery */}
          <Accordion title="8. Gallery (Photos)">
            <div className="space-y-4">
              {gallery.map((url, i) => (
                <div key={i} className="relative rounded-lg border border-stone-200 bg-stone-50/50 p-3">
                  <button type="button" onClick={() => removeGalleryItem(i)}
                    className="absolute right-2 top-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700">
                    Remove
                  </button>
                  <ImageUpload
                    weddingId={wedding.id}
                    value={url}
                    onChange={(v) => updateGalleryItem(i, v)}
                    placeholder="https://… or upload"
                  />
                </div>
              ))}
              <button type="button" onClick={addGalleryItem}
                className="w-full rounded-md bg-stone-100 py-2 text-xs font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-200">
                + Add Photo
              </button>
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

      {/* ── RIGHT: live preview panel ──────────────────────────────────────── */}
      <div className="relative hidden flex-1 items-center justify-center bg-stone-200/50 md:flex">

        {/* Status badge */}
        <div className="absolute right-6 top-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-stone-400">
          {isPublished ? (
            <>
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live Preview
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              Draft Preview
            </>
          )}
          <button type="button" className="ml-2 text-stone-400 hover:text-stone-700"
            onClick={() => setPreviewKey((k) => k + 1)} title="Refresh preview">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Phone frame mockup */}
        <div className="relative w-full max-w-[390px] overflow-hidden rounded-[2.5rem] bg-black p-3 shadow-2xl ring-1 ring-stone-900/5"
          style={{ height: "min(850px, 90vh)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.08)" }}>

          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-50 h-7 w-28 -translate-x-1/2 rounded-b-3xl bg-black" />

          {/* Screen */}
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white">
            <iframe key={previewKey} src={invitation.public_url}
              title="Invitation preview" className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms" />
          </div>
        </div>
      </div>

    </div>
  );
}
