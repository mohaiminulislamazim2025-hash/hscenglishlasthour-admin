import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card glass w-full max-w-md p-8 text-center">
        <p className="brand-text text-4xl font-extrabold">404</p>
        <h1 className="mt-3 text-base font-semibold text-[var(--color-ink)]">Page not found</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white [background-image:var(--grad-primary)]"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
