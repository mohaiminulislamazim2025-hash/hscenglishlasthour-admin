import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white [background-image:var(--grad-primary)] [box-shadow:var(--shadow-primary)] hover:brightness-110",
  secondary: "glass text-[var(--color-ink)] hover:border-[var(--color-brand-soft)]",
  ghost: "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-white/5",
  subtle: "bg-white/6 text-[var(--color-ink)] hover:bg-white/10 border border-white/8",
  danger: "bg-rose-500/90 text-white hover:bg-rose-500",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
