import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { IconShield } from "@/components/ui/icons";
import { signOutAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Access denied — Admin" };

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card glass w-full max-w-md p-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
          <IconShield width={22} height={22} />
        </span>
        <h1 className="text-base font-semibold text-[var(--color-ink)]">You are not an administrator</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Your account is signed in but is not a member of the <code>admin_users</code> allow-list.
          Ask the project owner to grant access, then sign in again.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <form action={signOutAction}>
            <button type="submit" className={buttonClass("secondary", "md")}>
              Sign out
            </button>
          </form>
          <Link href="/login" className={buttonClass("ghost", "md")}>
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
