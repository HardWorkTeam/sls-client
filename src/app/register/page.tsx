"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiErrorMessage } from "@/lib/api";
import { useRegister } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";

const heroImageUrl = "/login-hero.jpg";
const fieldClass =
  "h-11 rounded-[22px] border border-[#a6f4c5] bg-white px-4 text-sm text-[#05603a] outline-none placeholder:text-black/35";
const labelClass = "text-sm font-bold text-[#05603a]";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const register = useRegister();

  useEffect(() => {
    if (token) router.replace("/my-wedding");
  }, [token, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace("/my-wedding");
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
          className="hidden h-full overflow-hidden rounded-3xl lg:block"
          aria-hidden="true"
        >
          <img
            src={heroImageUrl}
            alt="login-hero-image"
            className="h-full w-full object-cover object-center"
          />
        </section>

        <section className="flex h-full items-center justify-center overflow-y-auto">
          <div className="w-full max-w-[460px] rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur-sm md:p-5 lg:border-transparent lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <h1 className="m-0 text-center text-[clamp(20px,2.3vw,32px)] font-bold uppercase leading-tight tracking-[0.02em] text-[#027a48]">
              Welcome to Srolanh
            </h1>
            <p className="mt-1 text-center text-sm text-[#05603a]">
              Couple Portal — create your account
            </p>

            <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2.5 md:mt-4">
              <h2 className="m-0 text-center text-[clamp(20px,2.2vw,30px)] font-bold uppercase text-[#027a48]">
                Register
              </h2>

              <label htmlFor="name" className={labelClass}>
                Full name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Bride & Groom names"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className={fieldClass}
              />

              <label htmlFor="email" className={labelClass}>
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

              <label htmlFor="password" className={labelClass}>
                Password
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
                Confirm password
              </label>
              <input
                id="password_confirmation"
                type="password"
                placeholder="Re-enter your password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                autoComplete="new-password"
                required
                className={fieldClass}
              />

              <button
                type="submit"
                className="mt-1 h-11 rounded-[22px] border-none bg-gradient-to-b from-[#16b364] to-[#027a48] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-75"
                disabled={register.isPending}
              >
                {register.isPending ? "Creating account..." : "Create account"}
              </button>

              {error ? <p className="mt-1 text-sm text-[#b42318]">{error}</p> : null}

              <p className="mt-1 text-center text-sm text-[#05603a]">
                Already have an account?{" "}
                <Link href="/" className="font-bold underline">
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
