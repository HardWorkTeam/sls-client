"use client";

import { BadgeCheck, Check, CreditCard, Landmark } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { apiErrorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";

export function PlanTab({ weddingId }: { weddingId: number }) {
  const { data, isLoading } = useSubscription(weddingId);
  const { data: packages } = usePackages();
  const selectPackage = useSelectPackage(weddingId);
  const submitPayment = useSubmitPayment(weddingId);

  const [method, setMethod] = useState("khqr");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !data) {
    return <PageLoader label="Loading your plan..." />;
  }

  const sub = data.data;
  const pay = data.payment_details;
  const activePackages = (packages ?? []).filter((p) => p.is_active);

  const choose = async (packageId: number) => {
    setError(null);
    try {
      await selectPackage.mutateAsync(packageId);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const onPay = async () => {
    setError(null);
    try {
      await submitPayment.mutateAsync({
        payment_method: method,
        payment_reference: reference || null,
      });
      setReference("");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  // Paid → active-plan confirmation.
  if (sub && sub.status === "paid") {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <BadgeCheck className="h-7 w-7 text-emerald-600" />
          </span>
          <h2 className="text-lg font-semibold text-zinc-900">Your plan is active</h2>
          <p className="text-sm text-zinc-600">
            <span className="font-medium">{sub.package_name}</span> —{" "}
            {formatMoney(sub.amount, sub.currency)}
          </p>
          <p className="text-xs text-zinc-500">
            Paid {sub.paid_at ? formatDate(sub.paid_at) : ""} via{" "}
            {sub.payment_method?.toUpperCase()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step 1: choose a plan */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Choose your plan</h2>
        <p className="text-sm text-zinc-500">
          Select a package for your wedding, then pay to activate it.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {activePackages.map((pkg) => {
          const selected = sub?.package_id === pkg.id;
          return (
            <Card key={pkg.id} className={selected ? "ring-2 ring-emerald-500" : ""}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">{pkg.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                    {formatMoney(pkg.price, pkg.currency ?? "USD")}
                  </p>
                </div>
                {selected ? <Badge variant="success">Selected</Badge> : null}
              </CardHeader>
              <CardContent>
                {pkg.description ? (
                  <p className="mb-3 text-sm text-zinc-500">{pkg.description}</p>
                ) : null}
                <ul className="mb-4 space-y-1.5">
                  {(pkg.features ?? []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={selected ? "outline" : "default"}
                  disabled={selectPackage.isPending}
                  onClick={() => choose(pkg.id)}
                >
                  {selected ? "Selected" : "Choose this plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Step 2: pay for the selected plan */}
      {sub ? (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900">
                Payment — {sub.package_name}
              </h3>
              <Badge variant={sub.status === "submitted" ? "warning" : "secondary"}>
                {sub.status === "submitted"
                  ? "Awaiting confirmation"
                  : "Awaiting payment"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
              <span className="text-sm text-zinc-600">Amount due</span>
              <span className="text-xl font-bold text-zinc-900">
                {formatMoney(sub.amount, sub.currency)}
              </span>
            </div>

            <div className="rounded-lg border border-zinc-100 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <Landmark className="h-4 w-4 text-emerald-600" /> Pay to
              </div>
              <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-zinc-400">Bank</dt>
                  <dd className="text-zinc-800">{pay.bank_name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-zinc-400">Account name</dt>
                  <dd className="text-zinc-800">{pay.account_name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-zinc-400">Account number</dt>
                  <dd className="font-mono text-zinc-800">{pay.account_number}</dd>
                </div>
              </dl>
              {pay.khqr_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pay.khqr_image_url}
                  alt="KHQR code"
                  className="mt-3 h-44 w-44 rounded-lg border border-zinc-100 object-contain"
                />
              ) : null}
              <p className="mt-3 text-xs text-zinc-500">{pay.instructions}</p>
            </div>

            {sub.status === "submitted" ? (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Payment submitted{sub.payment_reference ? ` (ref: ${sub.payment_reference})` : ""}.
                We&apos;ll confirm it shortly. You can re-submit if anything changed.
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="pay-method">Method used</Label>
                <Select
                  id="pay-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="khqr">KHQR</option>
                  <option value="aba">ABA</option>
                  <option value="bank">Bank transfer</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="pay-ref">Transaction reference</Label>
                <Input
                  id="pay-ref"
                  placeholder="e.g. ABA txn ID"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button onClick={onPay} disabled={submitPayment.isPending}>
              <CreditCard className="h-4 w-4" />
              {submitPayment.isPending ? "Submitting..." : "I've paid — submit"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
