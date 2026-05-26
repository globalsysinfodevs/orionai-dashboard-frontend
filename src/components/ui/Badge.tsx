import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}

const toneClass: Record<Tone, string> = {
  neutral:
    "bg-ink-100 text-ink-700 ring-ink-200/70 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-700/70",
  brand:
    "bg-brand-50 text-brand-700 ring-brand-200/60 dark:bg-brand-900/30 dark:text-brand-200 dark:ring-brand-800/60",
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/70",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/70",
  danger:
    "bg-red-50 text-red-700 ring-red-200/70 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-800/70",
  info: "bg-sky-50 text-sky-700 ring-sky-200/70 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/70",
};

const dotClass: Record<Tone, string> = {
  neutral: "bg-ink-400",
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
};

export function Badge({ tone = "neutral", dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotClass[tone])} />}
      {children}
    </span>
  );
}
