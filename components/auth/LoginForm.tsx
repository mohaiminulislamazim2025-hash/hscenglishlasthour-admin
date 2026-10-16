"use client";

import { useActionState } from "react";
import { signInAction, type ActionState } from "@/lib/auth/actions";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/feedback";

export function LoginForm() {
  const [state, action] = useActionState<ActionState | undefined, FormData>(signInAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error ? <Alert tone="danger">{state.error}</Alert> : null}
      <Field label="Admin email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          autoFocus
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </Field>
      <SubmitButton pendingLabel="Signing in…" size="lg" className="mt-1 w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
