import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: number | null;
  trendLabel?: string;
  loading?: boolean;
  helper?: ReactNode;
  accent?: "brand" | "emerald" | "amber" | "rose" | "violet" | "sky";
}

const accentClass: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "from-brand-500/15 to-brand-500/0 text-brand-600 dark:text-brand-300",
  emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-300",
  amber: "from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-300",
  rose: "from-rose-500/15 to-rose-500/0 text-rose-600 dark:text-rose-300",
  violet: "from-violet-500/15 to-violet-500/0 text-violet-600 dark:text-violet-300",
  sky: "from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-300",
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  loading,
  helper,
  accent = "brand",
}: StatCardProps) {
  const direction =
    trend === undefined || trend === null ? null : trend > 0 ? "up" : trend < 0 ? "down" : "flat";

  return (
    <div className="card relative overflow-hidden p-5">
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-100 blur-2xl",
          accentClass[accent],
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
            {label}
          </p>
          <div className="mt-2 text-2xl font-semibold text-ink-900 dark:text-ink-50">
            {loading ? <Skeleton className="h-7 w-24" /> : value}
          </div>
          {helper && !loading && (
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{helper}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/70 ring-1 ring-ink-100 dark:bg-ink-900/40 dark:ring-ink-800",
              accentClass[accent].split(" ").slice(-2).join(" "),
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {direction !== null && !loading && (
        <div className="relative mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              direction === "up"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : direction === "down"
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                  : "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
            )}
          >
            {direction === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : direction === "down" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {trend !== null && trend !== undefined
              ? `${Math.abs(trend).toFixed(1)}%`
              : "—"}
          </span>
          {trendLabel && (
            <span className="text-xs text-ink-500 dark:text-ink-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
