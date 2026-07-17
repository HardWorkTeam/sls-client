"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiErrorMessage } from "@/lib/api";
import { useForgotPassword } from "@/hooks/use-auth";

const heroImageUrl = "/login-hero.jpg";
const fieldClass =
  "h-11 rounded-[22px] border border-[#a6f4c5] bg-white px-4 text-sm text-[#05603a] outline-none placeholder:text-black/35";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPassword();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await forgotPassword.mutateAsync(email);
      setSent(true);
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
    }
  };

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
          className="relative hidden h-full overflow-hidden rounded-3xl lg:block"
          aria-hidden="true"
        >
          <Image
            src={heroImageUrl}
            alt=""
            fill
            sizes="50vw"
            className="h-full w-full object-cover object-center"
            priority
          />
        </section>

        <section className="flex h-full items-center justify-center">
          <div className="w-full max-w-[460px] rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur-sm md:p-5 lg:border-transparent lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <h1 className="m-0 text-center text-[clamp(20px,2.3vw,32px)] font-bold uppercase leading-tight tracking-[0.02em] text-[#027a48]">
              Reset password
            </h1>
            <p className="mt-1 text-center text-sm text-[#05603a]">
              We&apos;ll send a reset link to your email
            </p>

            {sent ? (
              <div className="mt-4 space-y-3 text-center">
                <p className="text-sm text-[#05603a]">
                  A password reset link has been sent to{" "}
                  <strong>{email}</strong>. Please check your inbox.
                </p>
                <Link
                  href="/"
                  className="inline-block font-bold text-[#027a48] underline"
                >
                  Back to log in
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2.5 md:mt-4">
                <label htmlFor="email" className="text-sm font-bold text-[#05603a]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className={fieldClass}
                />

                <button
                  type="submit"
                  className="mt-1 h-11 rounded-[22px] border-none bg-gradient-to-b from-[#16b364] to-[#027a48] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-75"
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending ? "Sending..." : "Send reset link"}
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
        </section>
      </div>
    </main>
  );
}
