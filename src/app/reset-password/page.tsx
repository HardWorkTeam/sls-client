"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiErrorMessage } from "@/lib/api";
import { useResetPassword } from "@/hooks/use-auth";

const heroImageUrl = "/login-hero.jpg";
const fieldClass =
  "h-11 rounded-[22px] border border-[#a6f4c5] bg-white px-4 text-sm text-[#05603a] outline-none placeholder:text-black/35";
const labelClass = "text-sm font-bold text-[#05603a]";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const emailFromLink = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const resetPassword = useResetPassword();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await resetPassword.mutateAsync({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
      setTimeout(() => router.replace("/"), 1500);
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
    }
  };

  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur-sm md:p-5 lg:border-transparent lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <h1 className="m-0 text-center text-[clamp(20px,2.3vw,32px)] font-bold uppercase leading-tight tracking-[0.02em] text-[#027a48]">
        Set a new password
      </h1>

      {done ? (
        <p className="mt-4 text-center text-sm text-[#05603a]">
          Your password has been reset. Redirecting to log in…
        </p>
      ) : !token ? (
        <div className="mt-4 space-y-3 text-center">
          <p className="text-sm text-[#b42318]">
            This reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="font-bold text-[#027a48] underline">
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2.5 md:mt-4">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={fieldClass}
          />

          <label htmlFor="password" className={labelClass}>
            New password
          </label>
          <input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            className={fieldClass}
          />

          <label htmlFor="password_confirmation" className={labelClass}>
            Confirm new password
          </label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            required
            className={fieldClass}
          />

          <button
            type="submit"
            className="mt-1 h-11 rounded-[22px] border-none bg-gradient-to-b from-[#16b364] to-[#027a48] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-75"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? "Resetting..." : "Reset password"}
          </button>

          {error ? <p className="mt-1 text-sm text-[#b42318]">{error}</p> : null}

          <p className="mt-1 text-center text-sm text-[#05603a]">
            <Link href="/" className="font-bold underline">
              Back to log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative h-dvh min-h-dvh overflow-hidden bg-[#e8e8e8] p-3 md:p-4 lg:p-5">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat lg:hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(232,232,232,0.62), rgba(232,232,232,0.62)), url("${heroImageUrl}")`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 grid h-full grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
        <section
          className="hidden h-full overflow-hidden rounded-3xl lg:block"
          aria-hidden="true"
        >
          <img
            src={heroImageUrl}
            alt="login-hero-image"
            className="h-full w-full object-cover object-center"
          />
        </section>

        <section className="flex h-full items-center justify-center">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
