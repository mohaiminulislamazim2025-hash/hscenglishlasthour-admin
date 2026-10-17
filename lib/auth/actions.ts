"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabasePublicConfigured } from "@/lib/supabase/config";
import { hasAdminRole } from "./session";

export interface ActionState {
  error?: string;
  message?: string;
}

const credentialsSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

/**
 * Sign in with Supabase Auth, then verify admin membership server-side. A
 * successful password login is NOT sufficient: non-admin accounts are signed
 * back out immediately. Visitors cannot self-provision admin access.
 */
export async function signInAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabasePublicConfigured()) {
    return { error: "Supabase is not configured for this dashboard. See .env.example." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Authentication is unavailable." };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  if (!hasAdminRole(data.user)) {
    await supabase.auth.signOut();
    return {
      error: "This account is not an authorized administrator.",
    };
  }

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
