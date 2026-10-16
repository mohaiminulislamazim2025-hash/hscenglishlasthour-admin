import { AppShell } from "@/components/layout/AppShell";
import { requireAdmin } from "@/lib/auth/dal";
import { signOutAction } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Secure, server-side admin check (redirects otherwise). Applied to every
  // route in this group; individual Server Actions re-check independently.
  const session = await requireAdmin();

  return (
    <AppShell email={session.email} signOut={signOutAction}>
      {children}
    </AppShell>
  );
}
