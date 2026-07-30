import Image from "next/image";

/**
 * Hero art shared by the four unauthenticated pages (login, register, forgot
 * password, reset password).
 *
 * Renders the image exactly once. The previous markup paired a `lg:hidden` CSS
 * background for mobile with a `hidden lg:block` next/image for desktop, so
 * phones fetched the full-size original *and* the optimized copy — `hidden`
 * doesn't stop next/image, and `priority` preloaded it. Here a single element
 * is full-bleed behind the form on mobile and the left grid column on desktop.
 *
 * The desktop inset mirrors the parent grid: `p-5` gutter, `gap-6` between
 * columns, so the right edge lands at 50% + half the gap.
 */
export function AuthHero() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden lg:inset-auto lg:bottom-5 lg:left-5 lg:right-[calc(50%+12px)] lg:top-5 lg:rounded-3xl"
    >
      <Image
        src="/login-hero.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) calc(50vw - 32px), 100vw"
        className="object-cover object-center"
        // Eager so the art paints without a lazy-load delay, but not preloaded:
        // this is decorative and never the LCP element (Lighthouse reports no
        // image LCP here), so it shouldn't jump the queue ahead of the form.
        // `priority` is also deprecated in Next 16 in favour of `preload`.
        loading="eager"
      />
      {/* Washes the art out behind the mobile form; desktop shows it clean. */}
      <div className="absolute inset-0 bg-[#e8e8e8]/62 lg:hidden" />
    </div>
  );
}
