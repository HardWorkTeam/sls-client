"use client";

import {
  CheckCircle2,
  HelpCircle,
  Pencil,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import {
  useChangeWeddingStatus,
  useInviteMember,
  useUpdateWedding,
  useWeddingDashboard,
  useWeddingMembers,
} from "@/hooks/use-weddings";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Wedding, WeddingStatus } from "@/types/api";

interface EditForm {
  wedding_name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  wedding_time: string;
  phone: string;
  email: string;
  ceremony_venue: string;
  reception_venue: string;
  google_map_link: string;
  story_description: string;
}

interface InviteForm {
  name: string;
  email: string;
  member_role: string;
}

export function OverviewTab({ wedding }: { wedding: Wedding }) {
  const { data: dashboard, isLoading } = useWeddingDashboard(wedding.id);
  const { data: members } = useWeddingMembers(wedding.id);
  const changeStatus = useChangeWeddingStatus(wedding.id);
  const updateWedding = useUpdateWedding(wedding.id);
  const inviteMember = useInviteMember(wedding.id);
  const hasRole = useAuthStore((state) => state.hasRole);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editForm = useForm<EditForm>();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitedCredentials, setInvitedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const inviteForm = useForm<InviteForm>({
    defaultValues: { name: "", email: "", member_role: "groom" },
  });

  const canManageStatus = hasRole("super_admin", "organizer", "couple");

  const transition = async (status: WeddingStatus) => {
    setError(null);
    try {
      await changeStatus.mutateAsync(status);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const openEdit = () => {
    setEditError(null);
    editForm.reset({
      wedding_name: wedding.wedding_name,
      bride_name: wedding.bride_name,
      groom_name: wedding.groom_name,
      wedding_date: wedding.wedding_date ?? "",
      wedding_time: (wedding.wedding_time ?? "").slice(0, 5),
      phone: wedding.phone ?? "",
      email: wedding.email ?? "",
      ceremony_venue: wedding.ceremony_venue ?? "",
      reception_venue: wedding.reception_venue ?? "",
      google_map_link: wedding.google_map_link ?? "",
      story_description: wedding.story_description ?? "",
    });
    setEditOpen(true);
  };

  const onEdit = editForm.handleSubmit(async (values) => {
    setEditError(null);
    try {
      await updateWedding.mutateAsync({
        wedding_name: values.wedding_name,
        bride_name: values.bride_name,
        groom_name: values.groom_name,
        wedding_date: values.wedding_date || null,
        wedding_time: values.wedding_time ? values.wedding_time.slice(0, 5) : null,
        phone: values.phone || null,
        email: values.email || null,
        ceremony_venue: values.ceremony_venue || null,
        reception_venue: values.reception_venue || null,
        google_map_link: values.google_map_link || null,
        story_description: values.story_description || null,
      });
      setEditOpen(false);
    } catch (err) {
      setEditError(apiErrorMessage(err));
    }
  });

  const onInvite = inviteForm.handleSubmit(async (values) => {
    setInviteError(null);
    setInvitedCredentials(null);
    try {
      const result = await inviteMember.mutateAsync(values);
      if (result.temp_password) {
        setInvitedCredentials({
          email: values.email,
          password: result.temp_password,
        });
      }
      inviteForm.reset({ name: "", email: "", member_role: "groom" });
      if (!result.temp_password) setInviteOpen(false);
    } catch (err) {
      setInviteError(apiErrorMessage(err));
    }
  });

  return (
    <div className="space-y-5">
      {canManageStatus ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={openEdit}>
            <Pencil className="h-4 w-4" /> Edit details
          </Button>
          {wedding.status !== "published" ? (
            <Button size="sm" onClick={() => transition("published")}>
              Publish
            </Button>
          ) : null}
          {wedding.status === "published" ? (
            <Button size="sm" variant="secondary" onClick={() => transition("completed")}>
              Mark Completed
            </Button>
          ) : null}
          {wedding.status !== "cancelled" && wedding.status !== "completed" ? (
            <Button size="sm" variant="destructive" onClick={() => transition("cancelled")}>
              Cancel Wedding
            </Button>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}

      {isLoading || !dashboard ? (
        <PageLoader label="Loading statistics..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Guests"
            value={dashboard.rsvp.total_guests}
            icon={Users}
            accent="emerald"
          />
          <StatCard
            label="Confirmed"
            value={dashboard.rsvp.confirmed}
            hint={`${dashboard.rsvp.expected_attendees} expected attendees`}
            icon={CheckCircle2}
            accent="sky"
          />
          <StatCard
            label="Declined"
            value={dashboard.rsvp.declined}
            icon={XCircle}
            accent="rose"
          />
          <StatCard
            label="Pending / Maybe"
            value={dashboard.rsvp.pending + dashboard.rsvp.maybe}
            icon={HelpCircle}
            accent="amber"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Wedding Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <InfoRow label="Bride" value={wedding.bride_name} />
              <InfoRow label="Groom" value={wedding.groom_name} />
              <InfoRow label="Date" value={formatDate(wedding.wedding_date)} />
              <InfoRow label="Time" value={wedding.wedding_time ?? "—"} />
              <InfoRow label="Phone" value={wedding.phone ?? "—"} />
              <InfoRow label="Email" value={wedding.email ?? "—"} />
              <InfoRow label="Ceremony" value={wedding.ceremony_venue ?? "—"} />
              <InfoRow label="Reception" value={wedding.reception_venue ?? "—"} />
              <InfoRow
                label="Package"
                value={
                  wedding.package
                    ? `${wedding.package.name} (${formatMoney(wedding.package.price, wedding.package.currency ?? "USD")})`
                    : "—"
                }
              />
              <InfoRow
                label="Map"
                value={
                  wedding.google_map_link ? (
                    <a
                      href={wedding.google_map_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      Open in Google Maps
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
            {wedding.story_description ? (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="mb-1 text-xs font-semibold uppercase text-zinc-400">
                  Love Story
                </p>
                <p className="text-sm leading-relaxed text-zinc-600">
                  {wedding.story_description}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Members</CardTitle>
              {canManageStatus ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInviteError(null);
                    setInvitedCredentials(null);
                    inviteForm.reset({ name: "", email: "", member_role: "groom" });
                    setInviteOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4" /> Add member
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-2">
              {(members ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">No members added yet.</p>
              ) : (
                (members ?? []).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-800">
                        {member.user?.name}
                      </p>
                      <p className="text-xs text-zinc-500">{member.user?.email}</p>
                    </div>
                    <Badge variant={statusVariant(member.member_role)}>
                      <span className="capitalize">{member.member_role}</span>
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {dashboard ? (
            <Card>
              <CardHeader>
                <CardTitle>Guests by Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.guests_by_group.length === 0 ? (
                  <p className="text-sm text-zinc-500">No guest groups yet.</p>
                ) : (
                  dashboard.guests_by_group.map((group) => (
                    <div
                      key={group.group}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-600">{group.group}</span>
                      <span className="font-medium text-zinc-900">{group.total}</span>
                    </div>
                  ))
                )}
                <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 text-sm">
                  <span className="text-zinc-600">Tables / Capacity</span>
                  <span className="font-medium text-zinc-900">
                    {dashboard.tables.total} / {dashboard.tables.capacity} seats
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit wedding details">
        <form onSubmit={onEdit} className="space-y-3">
          <div>
            <Label htmlFor="e-name">Wedding name</Label>
            <Input id="e-name" {...editForm.register("wedding_name", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="e-bride">Bride name</Label>
              <Input id="e-bride" {...editForm.register("bride_name", { required: true })} />
            </div>
            <div>
              <Label htmlFor="e-groom">Groom name</Label>
              <Input id="e-groom" {...editForm.register("groom_name", { required: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="e-date">Date</Label>
              <Input id="e-date" type="date" {...editForm.register("wedding_date")} />
            </div>
            <div>
              <Label htmlFor="e-time">Time</Label>
              <Input id="e-time" type="time" {...editForm.register("wedding_time")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="e-phone">Phone</Label>
              <Input id="e-phone" {...editForm.register("phone")} />
            </div>
            <div>
              <Label htmlFor="e-email">Email</Label>
              <Input id="e-email" type="email" {...editForm.register("email")} />
            </div>
          </div>
          <div>
            <Label htmlFor="e-ceremony">Ceremony venue</Label>
            <Input id="e-ceremony" {...editForm.register("ceremony_venue")} />
          </div>
          <div>
            <Label htmlFor="e-reception">Reception venue</Label>
            <Input id="e-reception" {...editForm.register("reception_venue")} />
          </div>
          <div>
            <Label htmlFor="e-map">Google Maps link</Label>
            <Input id="e-map" {...editForm.register("google_map_link")} />
          </div>
          <div>
            <Label htmlFor="e-story">Your story</Label>
            <Textarea id="e-story" rows={3} {...editForm.register("story_description")} />
          </div>
          {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateWedding.isPending}>
              {updateWedding.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Add member">
        {invitedCredentials ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              Member added. Share these login details with them:
            </p>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm">
              <p>
                <span className="font-medium">Email:</span> {invitedCredentials.email}
              </p>
              <p>
                <span className="font-medium">Temporary password:</span>{" "}
                <span className="font-mono">{invitedCredentials.password}</span>
              </p>
            </div>
            <p className="text-xs text-zinc-500">
              They can change this password after logging in.
            </p>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={() => {
                  setInvitedCredentials(null);
                  setInviteOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onInvite} className="space-y-3">
            <p className="text-sm text-zinc-500">
              Add your partner or organizer. If they don&apos;t have an account
              yet, we&apos;ll create one and give you a temporary password to
              share.
            </p>
            <div>
              <Label htmlFor="i-name">Name</Label>
              <Input id="i-name" {...inviteForm.register("name", { required: true })} />
            </div>
            <div>
              <Label htmlFor="i-email">Email</Label>
              <Input
                id="i-email"
                type="email"
                {...inviteForm.register("email", { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="i-role">Role</Label>
              <Select id="i-role" {...inviteForm.register("member_role")}>
                <option value="bride">Bride</option>
                <option value="groom">Groom</option>
                <option value="organizer">Organizer</option>
              </Select>
            </div>
            {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-800">{value}</dd>
    </div>
  );
}
