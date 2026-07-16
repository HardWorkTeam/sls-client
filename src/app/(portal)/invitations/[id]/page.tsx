"use client";

import { ArrowLeft, Eye, Pencil, Plus, RefreshCw, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/spinner";
import { TemplatePicker } from "@/components/wedding/TemplatePicker";
import { useTemplates } from "@/hooks/use-admin";
import {
  useInvitations,
  usePublishInvitation,
  useUnpublishInvitation,
  useUpdateInvitation,
} from "@/hooks/use-invitations";
import { useMyWedding } from "@/hooks/use-my-wedding";
import {
  useCreateTimelineEvent,
  useDeleteTimelineEvent,
  useTimeline,
  useUpdateTimelineEvent,
} from "@/hooks/use-timeline";
import { useUpdateWedding } from "@/hooks/use-weddings";
import { apiErrorMessage } from "@/lib/api";

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

// ── Wedding days (multi-day weddings) ─────────────────────────────────────────
// Khmer weddings commonly run 2 days (traditional ceremony day + reception
// day). Each day carries its own date/time and an optional venue; schedule
// events are assigned to a day via a select in the event form.
type WeddingDay = { date: string; time: string; venue: string };

const EMPTY_DAY: WeddingDay = { date: "", time: "", venue: "" };

// "Aug 10, 2026" — used in the wedding-day select of the schedule event form.
function formatDayOption(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

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

// ── Schedule event inline form ────────────────────────────────────────────────
// Extracted as a component so it can be rendered both above the list (create
// mode) and inline inside the list (edit mode, replacing the row being edited).
interface ScheduleEventFormProps {
  isEdit: boolean;
  category: string; onCategoryChange: (v: string) => void;
  time: string; onTimeChange: (v: string) => void;
  dayIdx: string; onDayIdxChange: (v: string) => void;
  weddingDays: WeddingDay[];
  title: string; onTitleChange: (v: string) => void;
  location: string; onLocationChange: (v: string) => void;
  mapsLink: string; onMapsLinkChange: (v: string) => void;
  isPublic: boolean; onIsPublicChange: (v: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  isPending: boolean;
}

function ScheduleEventForm({
  isEdit,
  category, onCategoryChange,
  time, onTimeChange,
  dayIdx, onDayIdxChange,
  weddingDays,
  title, onTitleChange,
  location, onLocationChange,
  mapsLink, onMapsLinkChange,
  isPublic, onIsPublicChange,
  onCancel,
  onSave,
  isPending,
}: ScheduleEventFormProps) {
  const inputCls = "mt-0.5 w-full rounded-md border border-stone-200 bg-white p-1.5 text-xs outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30";
  const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-stone-500";

  return (
    <div
      className={`space-y-2.5 rounded-lg border-2 p-3 shadow-sm transition-all ${
        isEdit
          ? "border-emerald-300 bg-emerald-50/30"
          : "border-sky-200 bg-sky-50/20"
      }`}
    >
      {/* Form header — clear label for create vs edit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEdit ? (
            <Pencil className="h-3 w-3 text-emerald-600" />
          ) : (
            <Plus className="h-3 w-3 text-sky-600" />
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-widest ${
              isEdit ? "text-emerald-700" : "text-sky-700"
            }`}
          >
            {isEdit ? "Editing Event" : "New Schedule Event"}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600"
          aria-label="Close form"
        >
          <span className="text-xs font-bold">✕</span>
        </button>
      </div>

      {/* Title — most important, comes first */}
      <div>
        <label className={labelCls}>Title</label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Wedding Ceremony"
          autoFocus
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Category</label>
          <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={inputCls}>
            <option value="ceremony">Ceremony</option>
            <option value="reception">Reception</option>
            <option value="engagement">Engagement</option>
            <option value="after_party">After Party</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Wedding Day</label>
        <select value={dayIdx} onChange={(e) => onDayIdxChange(e.target.value)} className={inputCls}>
          {weddingDays.map((day, i) => (
            <option key={i} value={i}>
              ថ្ងៃទី{i + 1} · Day {i + 1}{day.date ? ` — ${formatDayOption(day.date)}` : " (no date set)"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Location</label>
        <input
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Venue or address"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Google Maps Link</label>
        <input
          value={mapsLink}
          onChange={(e) => onMapsLinkChange(e.target.value)}
          placeholder="https://maps.google.com/…"
          className={inputCls}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id={isEdit ? "evt-public-edit" : "evt-public-new"}
          type="checkbox"
          checked={isPublic}
          onChange={(e) => onIsPublicChange(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-stone-300 text-emerald-600"
        />
        <label
          htmlFor={isEdit ? "evt-public-edit" : "evt-public-new"}
          className={labelCls}
        >
          Visible on invitation
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-stone-200/60 pt-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending || !title.trim()}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
            isEdit
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {isPending ? "Saving…" : isEdit ? "Update Event" : "Add Event"}
        </button>
      </div>
    </div>
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
  const unpublishInvitation = useUnpublishInvitation(wedding?.id ?? 0);
  const { data: timelineEvents } = useTimeline(wedding?.id ?? 0);
  const createTimelineEvent = useCreateTimelineEvent(wedding?.id ?? 0);
  const updateTimelineEvent = useUpdateTimelineEvent(wedding?.id ?? 0);
  const deleteTimelineEvent = useDeleteTimelineEvent(wedding?.id ?? 0);
  const confirm = useConfirm();

  const invitation = invitations?.find((i) => i.id === invitationId);

  // ── Invitation-level state ────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [coverImagePath, setCoverImagePath] = useState("");
  const [sections, setSections] = useState<Record<SectionKey, boolean>>(DEFAULT_SECTIONS);
  const [textKh, setTextKh] = useState("មានកិត្តិយសសូមគោរពអញ្ជើញ ចូលរួមជាភ្ញៀវកិត្តិយស");
  const [textEn, setTextEn] = useState("");

  // Gift registry (stored in invitation settings)
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankQrUrl, setBankQrUrl] = useState("");

  // Gallery URLs (stored in invitation settings)
  const [gallery, setGallery] = useState<string[]>([]);

  // ── Couple info (stored in invitation settings) ───────────────────────────
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

  // ── Wedding-level state ───────────────────────────────────────────────────
  // Cambodian weddings usually span multiple days (e.g. traditional ceremony +
  // reception). The full list lives in invitation settings (wedding_days); the
  // first day is mirrored to the wedding's own date/time fields so countdowns
  // and dashboards keep a single anchor date.
  const [weddingDays, setWeddingDays] = useState<WeddingDay[]>([EMPTY_DAY]);
  const [mainDayIndex, setMainDayIndex] = useState<number>(0);
  const [ceremonyVenue, setCeremonyVenue] = useState("");
  const [receptionVenue, setReceptionVenue] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [storyDescription, setStoryDescription] = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");

  // Inline schedule event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [evtId, setEvtId] = useState<number | null>(null);
  const [evtCategory, setEvtCategory] = useState("ceremony");
  const [evtTitle, setEvtTitle] = useState("");
  const [evtDayIdx, setEvtDayIdx] = useState("0");
  const [evtTime, setEvtTime] = useState("");
  const [evtLocation, setEvtLocation] = useState("");
  const [evtMapsLink, setEvtMapsLink] = useState("");
  const [evtIsPublic, setEvtIsPublic] = useState(true);

  // ── Initialise from API data ──────────────────────────────────────────────
  const initInvitationRef = useRef<number | null>(null);
  const initWeddingRef = useRef<number | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!invitation) return;
    if (initInvitationRef.current === invitation.id) return;
    initInvitationRef.current = invitation.id;

    setTemplateId(invitation.invitation_template_id ? String(invitation.invitation_template_id) : "");
    setTitle(invitation.title ?? "");
    setCoverImagePath(invitation.cover_image_path ?? "");

    const s = (invitation.settings ?? {}) as Record<string, unknown>;
    if (s.sections) setSections((p) => ({ ...p, ...(s.sections as Record<SectionKey, boolean>) }));
    if (typeof s.invitation_text_kh === "string") setTextKh(s.invitation_text_kh);
    if (typeof s.invitation_text_en === "string") setTextEn(s.invitation_text_en);
    if (typeof s.main_wedding_day_index === "number") setMainDayIndex(s.main_wedding_day_index);
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
    if (initWeddingRef.current === wedding.id) return;
    initWeddingRef.current = wedding.id;

    setCeremonyVenue(wedding.ceremony_venue ?? "");
    setReceptionVenue(wedding.reception_venue ?? "");
    setMapsLink(wedding.google_map_link ?? "");
    setStoryDescription(wedding.story_description ?? "");
  }, [wedding]);

  const initWeddingDaysRef = useRef<number | null>(null);
  useEffect(() => {
    if (!invitation || !wedding) return;
    if (initWeddingDaysRef.current === invitation.id) return;
    initWeddingDaysRef.current = invitation.id;

    const s = (invitation.settings ?? {}) as Record<string, unknown>;
    const saved = Array.isArray(s.wedding_days)
      ? (s.wedding_days as Partial<WeddingDay>[]).map((d) => ({
          date: d.date ?? "",
          time: (d.time ?? "").slice(0, 5),
          venue: d.venue ?? "",
        }))
      : [];
    if (saved.length > 0) {
      setWeddingDays(saved);
    } else {
      setWeddingDays([EMPTY_DAY]);
    }
  }, [invitation]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Save all ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!invitation || !wedding) return;
    setSaving(true);
    setSaveState("idle");
    setSaveError("");
    const cleanDays = weddingDays.filter((d) => d.date);
    try {
      const currentSettings = (invitation.settings as Record<string, unknown>) ?? {};
      await Promise.all([
        updateWedding.mutateAsync({
          ceremony_venue: ceremonyVenue || null,
          reception_venue: receptionVenue || null,
          google_map_link: mapsLink || null,
          story_description: storyDescription || null,
        }),
        updateInvitation.mutateAsync({
          invitationId: invitation.id,
          payload: {
            invitation_template_id: templateId ? Number(templateId) : null,
            title: title || null,
            cover_image_path: coverImagePath || null,
            settings: {
              ...currentSettings,
              sections,
              invitation_text_kh: textKh,
              invitation_text_en: textEn,
              wedding_days: cleanDays,
              main_wedding_day_index: mainDayIndex,
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
    } catch (err) {
      const msg = apiErrorMessage(err);
      setSaveError(msg);
      setSaveState("error");
      // Log so the developer can see the full error in the browser console.
      console.error("[InvitationEditor] Save failed:", err);
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

  // Timeline event helpers
  const handleSaveEvent = async () => {
    if (!evtTitle.trim()) return;
    // The event is pinned to a wedding day; its date comes from that day and
    // only the time is entered here (local wall-clock → UTC, same as before).
    const day = weddingDays[Number(evtDayIdx)];
    const startsAt = day?.date
      ? new Date(`${day.date}T${evtTime || "00:00"}`).toISOString()
      : null;
    const payload = {
      category: evtCategory,
      title: evtTitle.trim(),
      starts_at: startsAt,
      location: evtLocation || null,
      google_map_link: evtMapsLink || null,
      is_public: evtIsPublic,
    };
    if (evtId) {
      await updateTimelineEvent.mutateAsync({ eventId: evtId, payload });
    } else {
      await createTimelineEvent.mutateAsync(payload);
    }
    
    setEvtId(null);
    setEvtTitle("");
    setEvtTime("");
    setEvtLocation("");
    setEvtMapsLink("");
    setEvtIsPublic(true);
    setShowEventForm(false);
  };

  const openEventForm = (evt?: any) => {
    if (evt) {
      setEvtId(evt.id);
      setEvtCategory(evt.category);
      setEvtTitle(evt.title);
      setEvtLocation(evt.location || "");
      setEvtMapsLink(evt.google_map_link || "");
      setEvtIsPublic(evt.is_public);
      if (evt.starts_at) {
        const d = new Date(evt.starts_at);
        const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const localTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        const idx = weddingDays.findIndex((w) => w.date === local);
        setEvtDayIdx(String(idx >= 0 ? idx : 0));
        setEvtTime(localTime);
      } else {
        setEvtDayIdx("0");
        setEvtTime("");
      }
    } else {
      setEvtId(null);
      setEvtCategory("ceremony");
      setEvtTitle("");
      setEvtDayIdx("0");
      setEvtTime("");
      setEvtLocation("");
      setEvtMapsLink("");
      setEvtIsPublic(true);
    }
    setShowEventForm(true);
  };

  // Wedding day helpers
  const updateWeddingDay = (i: number, patch: Partial<WeddingDay>) =>
    setWeddingDays((days) => days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  // Which wedding day an event falls on, matched by local calendar date
  // (starts_at is stored UTC; the editor entered it as local wall-clock time).
  const dayNumberFor = (startsAt: string | null): number | null => {
    if (!startsAt) return null;
    const d = new Date(startsAt);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const idx = weddingDays.findIndex((w) => w.date === local);
    return idx >= 0 ? idx + 1 : null;
  };

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
                <>
                  <a href={invitation.public_url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3.5 w-3.5" /> View Live
                    </Button>
                  </a>
                  <Button size="sm" variant="secondary"
                    disabled={unpublishInvitation.isPending}
                    onClick={() => unpublishInvitation.mutate(invitation.id)}>
                    {unpublishInvitation.isPending ? "Unpublishing…" : "Unpublish"}
                  </Button>
                </>
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
            {/* Wedding days — Khmer weddings often span 2 days */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                  Wedding Days
                </span>
                <button
                  type="button"
                  onClick={() => setWeddingDays((days) => [...days, EMPTY_DAY])}
                  className="flex items-center gap-1 rounded-md bg-stone-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-200"
                >
                  <Plus className="h-3 w-3" /> Add Day
                </button>
              </div>

              {weddingDays.map((day, i) => (
                <div
                  key={i}
                  className={`space-y-2 rounded-md border p-2.5 transition-colors ${
                    mainDayIndex === i
                      ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200"
                      : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                        ថ្ងៃទី{i + 1} · Day {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMainDayIndex(i)}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                          mainDayIndex === i
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-stone-200/80 text-stone-600 hover:bg-stone-300"
                        }`}
                      >
                        {mainDayIndex === i ? "★ Main Wedding Date" : "Set as Main Date"}
                      </button>
                    </div>
                    {weddingDays.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setWeddingDays((days) => days.filter((_, idx) => idx !== i));
                          if (mainDayIndex === i) setMainDayIndex(0);
                        }}
                        className="text-stone-300 hover:text-red-500"
                        aria-label={`Remove day ${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FieldRow label="Date">
                      <input type="date" value={day.date}
                        onChange={(e) => updateWeddingDay(i, { date: e.target.value })}
                        className="w-full rounded-md border border-stone-200 bg-white p-2 text-xs outline-none focus:border-emerald-400" />
                    </FieldRow>
                    <FieldRow label="Time">
                      <input type="time" value={day.time}
                        onChange={(e) => updateWeddingDay(i, { time: e.target.value })}
                        className="w-full rounded-md border border-stone-200 bg-white p-2 text-xs outline-none focus:border-emerald-400" />
                    </FieldRow>
                  </div>
                  <FieldRow label="Venue (optional)">
                    <TextInput
                      value={day.venue}
                      onChange={(v) => updateWeddingDay(i, { venue: v })}
                      placeholder={i === 0 ? "Defaults to ceremony venue" : "Defaults to reception venue"}
                    />
                  </FieldRow>
                </div>
              ))}
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

            {/* Timeline events */}
            <div className="mt-3 border-t border-stone-200 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                  Schedule Events
                </span>
                {/* Show Add only when NOT already in "new" mode */}
                {!(showEventForm && evtId === null) ? (
                  <button
                    type="button"
                    onClick={() => openEventForm()}
                    className="flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
                  >
                    <Plus className="h-3 w-3" /> Add Event
                  </button>
                ) : null}
              </div>

              {(timelineEvents ?? []).length === 0 && !showEventForm ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-stone-200 py-6">
                  <p className="text-xs text-stone-400">No schedule events yet.</p>
                  <button
                    type="button"
                    onClick={() => openEventForm()}
                    className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-700"
                  >
                    <Plus className="h-3 w-3" /> Add your first event
                  </button>
                </div>
              ) : null}

              {/* New event form — appears above the list */}
              {showEventForm && evtId === null ? (
                <ScheduleEventForm
                  isEdit={false}
                  category={evtCategory} onCategoryChange={setEvtCategory}
                  time={evtTime} onTimeChange={setEvtTime}
                  dayIdx={evtDayIdx} onDayIdxChange={setEvtDayIdx}
                  weddingDays={weddingDays}
                  title={evtTitle} onTitleChange={setEvtTitle}
                  location={evtLocation} onLocationChange={setEvtLocation}
                  mapsLink={evtMapsLink} onMapsLinkChange={setEvtMapsLink}
                  isPublic={evtIsPublic} onIsPublicChange={setEvtIsPublic}
                  onCancel={() => setShowEventForm(false)}
                  onSave={handleSaveEvent}
                  isPending={createTimelineEvent.isPending}
                />
              ) : null}

              <div className="space-y-1.5">
                {(timelineEvents ?? []).map((evt) => {
                  const isEditing = showEventForm && evtId === evt.id;

                  /* When this row is being edited, replace it with the inline form */
                  if (isEditing) {
                    return (
                      <ScheduleEventForm
                        key={evt.id}
                        isEdit
                        category={evtCategory} onCategoryChange={setEvtCategory}
                        time={evtTime} onTimeChange={setEvtTime}
                        dayIdx={evtDayIdx} onDayIdxChange={setEvtDayIdx}
                        weddingDays={weddingDays}
                        title={evtTitle} onTitleChange={setEvtTitle}
                        location={evtLocation} onLocationChange={setEvtLocation}
                        mapsLink={evtMapsLink} onMapsLinkChange={setEvtMapsLink}
                        isPublic={evtIsPublic} onIsPublicChange={setEvtIsPublic}
                        onCancel={() => setShowEventForm(false)}
                        onSave={handleSaveEvent}
                        isPending={updateTimelineEvent.isPending}
                      />
                    );
                  }

                  /* Normal read-only row */
                  return (
                    <div key={evt.id}
                      className={`group flex items-start justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                        showEventForm
                          ? "border-stone-100 bg-stone-50/50 opacity-60"
                          : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-white"
                      }`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block rounded bg-stone-200/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-500">
                            {evt.category.replace("_", " ")}
                          </span>
                          {!evt.is_public ? (
                            <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                              Hidden
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-stone-800">{evt.title}</p>
                        <p className="mt-0.5 text-[10px] text-stone-400">
                          {dayNumberFor(evt.starts_at) ? `Day ${dayNumberFor(evt.starts_at)}` : ""}
                          {evt.starts_at ? `${dayNumberFor(evt.starts_at) ? " · " : ""}${new Date(evt.starts_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}
                          {evt.location ? ` · ${evt.location}` : ""}
                        </p>
                        {evt.google_map_link ? (
                          <a href={evt.google_map_link} target="_blank" rel="noreferrer"
                            className="mt-0.5 inline-block text-[10px] text-emerald-600 hover:underline">
                            🗺️ Map link
                          </a>
                        ) : null}
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEventForm(evt)}
                          className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
                          aria-label="Edit event"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              await confirm({
                                title: `Delete "${evt.title}"?`,
                                description:
                                  "This timeline event will be permanently removed.",
                              })
                            ) {
                              deleteTimelineEvent.mutate(evt.id);
                            }
                          }}
                          className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label="Delete event"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
              <ImageUpload weddingId={wedding.id} value={bankQrUrl} onChange={setBankQrUrl} isPublic={false} placeholder="https://… or upload QR image" />
            </FieldRow>
          </Accordion>

          {/* 8. Gallery */}
          <Accordion title="8. Gallery (Photos)">
            <div className="space-y-4">
              {gallery.map((url, i) => (
                <div key={i} className="relative rounded-lg border border-stone-200 bg-stone-50/50 p-3">
                  <button type="button" onClick={() => removeGalleryItem(i)}
                    className="absolute right-2 top-2 text-stone-300 hover:text-red-500"
                    aria-label="Remove photo">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ImageUpload
                    weddingId={wedding.id}
                    value={url}
                    onChange={(v) => updateGalleryItem(i, v)}
                    isPublic={true}
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
            <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs font-semibold text-red-700">Save failed</p>
              {saveError && (
                <p className="mt-0.5 text-xs text-red-600">{saveError}</p>
              )}
            </div>
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
