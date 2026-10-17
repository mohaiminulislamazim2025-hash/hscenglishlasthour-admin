"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  IconDashboard,
  IconLogout,
  IconMenu,
  IconOrders,
  IconPlus,
  IconSettings,
  IconShirt,
  IconUser,
  IconUsers,
  IconX,
} from "@/components/ui/icons";

const NAV = [
  { href: "/", label: "Overview", icon: IconDashboard, exact: true },
  { href: "/products", label: "Products", icon: IconShirt },
  { href: "/products/new", label: "Add Product", icon: IconPlus },
  { href: "/orders", label: "Orders", icon: IconOrders },
  { href: "/customers", label: "Customers", icon: IconUsers },
  { href: "/settings", label: "Settings", icon: IconSettings },
  { href: "/account", label: "Admin Account", icon: IconUser },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  if (href === "/products") return pathname === "/products" || /^\/products\/(?!new)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  email,
  signOut,
  children,
}: {
  email: string | null;
  signOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white/8 text-[var(--color-ink)] shadow-[inset_0_0_0_1px_rgba(150,170,255,0.18)]"
                : "text-[var(--color-ink-soft)] hover:bg-white/5 hover:text-[var(--color-ink)]",
            )}
          >
            <Icon width={18} height={18} className={active ? "text-[var(--color-brand-soft)]" : ""} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-dvh w-64 shrink-0 flex-col justify-between border-r p-4 lg:flex">
        <div>
          <Link href="/" className="mb-6 flex items-center gap-2.5 px-1">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/8"
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logonuri.jpg" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="brand-text block truncate text-sm font-bold">Nuri</span>
              <span className="block text-[11px] text-[var(--color-ink-muted)]">Shirt Store · Admin</span>
            </span>
          </Link>
          {nav}
        </div>
        <UserCard email={email} signOut={signOut} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="glass absolute left-0 top-0 flex h-full w-72 flex-col justify-between border-r p-4">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <span className="brand-text text-sm font-bold">Admin</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-white/8"
                >
                  <IconX width={18} height={18} />
                </button>
              </div>
              {nav}
            </div>
            <UserCard email={email} signOut={signOut} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-[var(--color-ink-soft)] hover:bg-white/8 lg:hidden"
          >
            <IconMenu width={20} height={20} />
          </button>
          <div className="hidden min-w-0 lg:block">
            <p className="text-xs text-[var(--color-ink-muted)]">Signed in as</p>
            <p className="truncate text-sm font-medium text-[var(--color-ink)]">{email ?? "admin"}</p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="brand-text text-sm font-bold">Nuri Shirt Store</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-white/8 px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] transition hover:bg-white/8"
              >
                <IconLogout width={15} height={15} />
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function UserCard({ email, signOut }: { email: string | null; signOut: () => void | Promise<void> }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-[var(--color-ink-soft)]">
          <IconUser width={16} height={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[var(--color-ink)]">{email ?? "admin"}</p>
          <p className="text-[11px] text-[var(--color-ink-muted)]">Administrator</p>
        </div>
      </div>
      <form action={signOut} className="mt-2">
        <button
          type="submit"
          className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
