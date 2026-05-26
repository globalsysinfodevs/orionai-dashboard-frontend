import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shimmer-bg rounded-md bg-ink-100/80 dark:bg-ink-800/60",
        className,
      )}
      {...rest}
    />
  );
}
