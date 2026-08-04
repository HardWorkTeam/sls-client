"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthHero } from "@/components/layout/auth-hero";
import { apiErrorMessage } from "@/lib/api";
import { useResendEmailVerification } from "@/hooks/use-auth";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resend = useResendEmailVerification();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await resend.mutateAsync(email);
      setMessage("If this address needs verification, a new link has been sent.");
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
    }
  };

  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-white/70 bg-white/80 p-5 text-[#05603a] backdrop-blur-sm lg:border-transparent lg:bg-transparent lg:backdrop-blur-none">
      <h1 className="m-0 text-center text-2xl font-bold uppercase text-[#027a48]">Verify your email</h1>
      <p className="mt-3 text-center text-sm">
        {verified
          ? "Your email is verified. You can now log in to your account."
          : "We sent a verification link to your email. Open it before logging in."}
      </p>
      {!verified ? (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-bold">Email address</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="h-11 rounded-[22px] border border-[#a6f4c5] bg-white px-4 text-sm outline-none" />
          <button type="submit" disabled={resend.isPending} className="h-11 rounded-[22px] bg-gradient-to-b from-[#16b364] to-[#027a48] text-sm font-bold text-white disabled:opacity-75">
            {resend.isPending ? "Sending..." : "Resend verification email"}
          </button>
        </form>
      ) : null}
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#b42318]">{error}</p> : null}
      <p className="mt-5 text-center text-sm"><Link href="/" className="font-bold underline">Go to log in</Link></p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="relative h-dvh min-h-dvh overflow-hidden bg-[#e8e8e8] p-3 md:p-4 lg:p-5">
      <AuthHero />
      <div className="relative z-10 grid h-full grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
        <section className="hidden lg:block" aria-hidden="true" />
        <section className="flex h-full items-center justify-center overflow-y-auto">
          <Suspense fallback={null}><VerifyEmailForm /></Suspense>
        </section>
      </div>
    </main>
  );
}
