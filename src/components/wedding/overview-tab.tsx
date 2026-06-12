"use client";

import { CheckCircle2, HelpCircle, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { useChangeWeddingStatus, useWeddingDashboard } from "@/hooks/use-weddings";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Wedding, WeddingStatus } from "@/types/api";

export function OverviewTab({ wedding }: { wedding: Wedding }) {
  const { data: dashboard, isLoading } = useWeddingDashboard(wedding.id);
  const changeStatus = useChangeWeddingStatus(wedding.id);
  const hasRole = useAuthStore((state) => state.hasRole);
  const [error, setError] = useState<string | null>(null);

  const canManageStatus = hasRole("super_admin", "organizer");

  const transition = async (status: WeddingStatus) => {
    setError(null);
    try {
      await changeStatus.mutateAsync(status);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      {canManageStatus ? (
        <div className="flex flex-wrap items-center gap-2">
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
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(wedding.members ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">No members added yet.</p>
              ) : (
                (wedding.members ?? []).map((member) => (
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
