"use client";

import { CheckCircle2, Clock, CreditCard } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/spinner";
import { usePackages } from "@/hooks/use-admin";
import {
  useSelectPackage,
  useSubmitPayment,
  useSubscription,
} from "@/hooks/use-subscription";
import { formatMoney } from "@/lib/utils";

export function PlanTab({ weddingId }: { weddingId: number }) {
  const { data, isLoading } = useSubscription(weddingId);
  const { data: packages } = usePackages();
  const selectPackage = useSelectPackage(weddingId);
  const submitPayment = useSubmitPayment(weddingId);

  const [method, setMethod] = useState<"khqr" | "aba" | "bank">("khqr");
  const [reference, setReference] = useState("");

  if (isLoading) return <PageLoader label="Loading your plan..." />;

  const subscription = data?.subscription ?? null;
  const payment = data?.payment_details;
  const status = subscription?.status;
  const activePackages = (packages ?? []).filter((pkg) => pkg.is_active);

  const choosePackage = (packageId: number) => selectPackage.mutate(packageId);

  const packageGrid = (
    <div className="space-y-4 pt-2">
      {status === "rejected" ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Your previous payment was rejected. Please re-select a plan and submit again.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {activePackages.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{pkg.name}</span>
                <Badge variant="secondary">
                  {(pkg.price ?? 0) <= 0
                    ? "Free"
                    : formatMoney(pkg.price ?? 0, pkg.currency ?? "USD")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              {pkg.description ? (
                <p className="text-sm text-zinc-500">{pkg.description}</p>
              ) : null}
              <ul className="flex-1 space-y-1 text-sm text-zinc-600">
                {(pkg.features ?? []).map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                disabled={selectPackage.isPending || subscription?.package?.id === pkg.id}
                onClick={() => choosePackage(pkg.id)}
              >
                <CreditCard className="h-4 w-4" />
                {subscription?.package?.id === pkg.id ? "Current Plan" : `Choose ${pkg.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // 1) Active — plan is locked in. Free plans activate on selection (no payment); 
  //    paid plans reach here once an admin confirms the payment.
  if (status === "paid") {
    const isFree = (subscription?.amount ?? 0) <= 0;
    return (
      <div className="space-y-5">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">
                  {subscription?.package?.name} plan — {isFree ? "active" : "paid"}
                </p>
                <p className="text-sm text-zinc-500">
                  {isFree
                    ? "Your free plan is active. Upgrade any time to unlock more features."
                    : `${formatMoney(subscription?.amount ?? 0, subscription?.currency ?? "USD")} confirmed. Thank you! Your wedding has full access.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {packageGrid}
      </div>
    );
  }

  // 2) Submitted — awaiting admin confirmation.
  if (status === "submitted") {
    return (
      <div className="space-y-5">
        <Card>
          <CardContent className="flex items-start gap-4 p-6">
            <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Payment submitted</p>
              <p className="text-sm text-zinc-500">
                We received your payment for the {subscription?.package?.name} plan
                ({formatMoney(subscription?.amount ?? 0, subscription?.currency ?? "USD")}).
                Reference <span className="font-mono">{subscription?.payment_reference}</span>.
                An administrator will confirm it shortly.
              </p>
            </div>
          </CardContent>
        </Card>
        {packageGrid}
      </div>
    );
  }

  // 3) Package picker — when nothing selected, previous payment rejected
  if (!subscription || status === "rejected") {
    return packageGrid;
  }

  // 4) Pending (package selected) — show payment instructions + form.
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Your selected plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="font-semibold text-zinc-900">{subscription?.package?.name}</p>
            <p className="text-sm text-zinc-500">
              {formatMoney(subscription?.amount ?? 0, subscription?.currency ?? "USD")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to pay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="text-zinc-500">Bank</p>
              <p className="font-medium text-zinc-800">{payment?.bank_name ?? "—"}</p>
              <p className="text-zinc-500">Account name</p>
              <p className="font-medium text-zinc-800">{payment?.account_name ?? "—"}</p>
              <p className="text-zinc-500">Account number</p>
              <p className="font-mono font-medium text-zinc-800">
                {payment?.account_number ?? "—"}
              </p>
            </div>
            {payment?.khqr_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={payment.khqr_image_url}
                alt="KHQR code"
                className="h-40 w-40 rounded-lg border border-zinc-200 object-contain"
              />
            ) : null}
          </div>
          {payment?.instructions ? (
            <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
              {payment.instructions}
            </p>
          ) : null}

          <form
            className="space-y-3 border-t border-zinc-100 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitPayment.mutate({ payment_method: method, payment_reference: reference });
            }}
          >
            <p className="text-sm font-medium text-zinc-700">After paying, confirm it here:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="method">Payment method</Label>
                <Select
                  id="method"
                  value={method}
                  onChange={(event) =>
                    setMethod(event.target.value as "khqr" | "aba" | "bank")
                  }
                >
                  <option value="khqr">KHQR</option>
                  <option value="aba">ABA</option>
                  <option value="bank">Bank transfer</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="reference">Transaction reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="e.g. ABA123456"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={submitPayment.isPending || !reference.trim()}>
              {submitPayment.isPending ? "Submitting..." : "I've paid"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {packageGrid}
    </div>
  );
}
